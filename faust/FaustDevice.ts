import { getContext, Gain } from 'tone';
import { FaustPolyDspGenerator, FaustMonoDspGenerator } from '@grame/faustwasm';
import type { FaustPolyAudioWorkletNode } from '@grame/faustwasm';
import type { Dictionary } from '../types';
import { dummy } from './utils';

// Minimal shape we need from compiler-generated meta JSON
interface FaustUINode { address?: string; items?: FaustUINode[] }
interface FaustMeta {
    name: string;
    ui: FaustUINode[];
}

const moduleCache = new Map<string, Promise<WebAssembly.Module>>();
const getModule = (url: URL | string) => {
    const key = url.toString();
    if (!moduleCache.has(key)) moduleCache.set(key, fetch(key).then(r => r.arrayBuffer()).then(WebAssembly.compile));
    return moduleCache.get(key)!;
};

const initQueues = new Map<string, Promise<unknown>>();
const queueInit = <T>(
    processorName: string,
    gWorkletProcessors: Map<AudioContext, Set<string>>,
    context: AudioContext,
    work: () => Promise<T>
): Promise<T> => {
    const tail = (initQueues.get(processorName) ?? Promise.resolve()).then(async () => {
        const result = await work();

        if (!gWorkletProcessors.has(context))
            gWorkletProcessors.set(context, new Set());
        gWorkletProcessors.get(context)!.add(processorName);

        return result;
    });

    initQueues.set(processorName, tail.catch(() => {}));
    return tail as Promise<T>;
};

class FaustDevice {
    defaults: Dictionary = {}
    prefix: string = ''
    input: Gain
    output: Gain
    node!: FaustPolyAudioWorkletNode
    ready = false
    // @ts-ignore
    context: AudioContext = getContext().rawContext._nativeAudioContext || getContext().rawContext._context;
    params: string[] = []
    history: Record<string, any> = {}

    constructor() {
        this.input = new Gain(1);
        this.output = new Gain(1);
        dummy.connect(this.output);
        dummy.connect(this.input);
    }

    async initDevice(dspUrl: URL | string, mixerUrl: URL | string, meta: FaustMeta, voices = 8) {
        if(this.ready) return // already done

        const [dspModule, mixerModule] = await Promise.all([getModule(dspUrl), getModule(mixerUrl)]);

        const generator = new FaustPolyDspGenerator();
        // @ts-ignore — assign pre-compiled factories directly
        generator.voiceFactory = { module: dspModule, json: JSON.stringify(meta) };
        generator.mixerModule = mixerModule;

        const processorName = `${meta.name}_poly`;

        const node = await queueInit(
            processorName,
            // @ts-ignore
            FaustPolyDspGenerator.gWorkletProcessors,
            this.context,
            () => generator.createNode(this.context, voices, meta.name)
        );
        this._finaliseDevice(node, meta);
    }

    async initEffectDevice(dspUrl: URL | string, meta: FaustMeta) {
        if(this.ready) return // already done

        const generator = new FaustMonoDspGenerator();
        generator.factory = {
            module: await getModule(dspUrl),
            json: JSON.stringify(meta),
            soundfiles: {},
            cfactory: 0,
            poly: false,
            // @ts-ignore
            code: '',
            shaKey: ''
        };

        const processorName = meta.name;

        const node = await queueInit(
            processorName,
            // @ts-ignore
            FaustMonoDspGenerator.gWorkletProcessors,
            this.context,
            () => generator.createNode(this.context, meta.name)
        );
        // @ts-ignore
        this._finaliseDevice(node, meta);
    }

    private _finaliseDevice(node: FaustPolyAudioWorkletNode | null | undefined, meta: FaustMeta) {
        if (!node) throw new Error(`Failed to create Faust node for ${meta.name}`);
        // @ts-ignore
        this.node = node;
        this.params = this._buildParamList(meta);
        // @ts-ignore
        node.connect(this.output._gainNode._nativeAudioNode);
        // @ts-ignore
        if (node.numberOfInputs > 0) this.input._gainNode._nativeAudioNode.connect(node);
        this.ready = true;
    }

    private _buildParamList(meta: FaustMeta): string[] {
        const paths: string[] = [];
        const walk = (items: FaustUINode[]) => {
            for (const item of items) {
                if (item.address) paths.push(item.address);
                if (item.items) walk(item.items);
            }
        };
        walk(meta.ui);
        return paths;
    }

    protected paramPath(tag: string): string | undefined {
        return this.params.find(p => p === `/${tag}` || p.endsWith(`/${tag}`));
    }

    setParamValue(tag: string, value: number) {
        const path = this.paramPath(tag);
        // reduce network traffic
        if (path && this.history[tag] !== value) {
            this.node.setParamValue(tag, value);
            this.history[tag] = value
        }
    }

    connect(node: Gain) {
        this.output.connect(node);
    }

    disconnect() {
        this.output.disconnect();
    }

    set(params: Dictionary, time: number) {
        if (!this.ready) return;
        if (this.prefix) {
            this._setPrefixed({...this.defaults, ...params});
        } else {
            this.setParams({...this.defaults, ...params}, time);
        }
    }

    private _setPrefixed(params: Dictionary) {
        const { prefix } = this;
        for (const [key, value] of Object.entries(params)) {
            if (key !== prefix && !key.startsWith(prefix)) continue;
            const tag = key.length === prefix.length ? 'mix' : key.slice(prefix.length);
            if (this.paramPath(tag)) this.setParamValue(tag, value);
        }
    }

    setParams(params: Dictionary, time: number) {
        Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([key]) => !!this.paramPath(key))
            .forEach(([key, value]) => {
                // @ts-ignore
                this[key] && this[key](value, time);
            });
    }

    mutate(params: Dictionary = {}, time: number, lag: number = 100): void {
        if (!this.ready) return;
        const { nudge } = params;
        const delay = Math.max(0, (time - this.context.currentTime) * 1000) + (nudge || 0);

        let entries: [string, number][];
        if (this.prefix) {
            entries = Object.entries(params)
                .filter(([k]) => k === this.prefix || k.startsWith(this.prefix))
                .map(([key, value]): [string, number] => [
                    key.length === this.prefix.length ? 'mix' : key.slice(this.prefix.length),
                    value
                ]);
        } else {
            entries = Object.entries(params)
                .filter(([k]) => k !== 'nudge')
                .map(([key, value]): [string, number] =>
                    key === 'n' ? ['freq', 440 * Math.pow(2, (value - 69) / 12)] : [key, value]
                );
        }

        setTimeout(() => {
            this.setParamValue('lagtime', lag);
            entries.forEach(([key, value]) => this.setParamValue(key, value));
        }, delay);
    }
}

export default FaustDevice;