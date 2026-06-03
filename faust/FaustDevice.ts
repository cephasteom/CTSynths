import { getContext, Gain } from 'tone';
import type { Destination } from 'tone';
import type { FaustPolyAudioWorkletNode } from '@grame/faustwasm';
import type { Dictionary } from '../types';
import { dummy } from './utils';

// Minimal shape we need from compiler-generated meta JSON
interface FaustUINode { address?: string; items?: FaustUINode[] }
interface FaustMeta {
    name: string;
    ui: FaustUINode[];
}

let faustWasm: Promise<typeof import('@grame/faustwasm')> | null = null;
const getFaustWasm = () => (faustWasm ??= import('@grame/faustwasm'));

const moduleCache = new Map<string, Promise<WebAssembly.Module>>();
const getModule = (url: URL | string) => {
    const key = url.toString();
    if (!moduleCache.has(key)) moduleCache.set(key, fetch(key).then(r => r.arrayBuffer()).then(WebAssembly.compile));
    return moduleCache.get(key)!;
};

class FaustDevice {
    defaults: Dictionary = {}
    prefix: string = ''   // e.g. 'fdist'; bare prefix → 'mix', prefix+tag → tag
    input: Gain
    output: Gain
    node!: FaustPolyAudioWorkletNode
    ready = false
    // @ts-ignore
    context: AudioContext = getContext().rawContext._nativeAudioContext || getContext().rawContext._context;
    params: string[] = []

    constructor() {
        this.input = new Gain(1);
        this.output = new Gain(1);
        dummy.connect(this.output);
        dummy.connect(this.input);
    }

    async initDevice(dspUrl: URL | string, mixerUrl: URL | string, meta: FaustMeta, voices = 8) {
        const { FaustPolyDspGenerator } = await getFaustWasm();

        const [dspModule, mixerModule] = await Promise.all([getModule(dspUrl), getModule(mixerUrl)]);

        const voiceFactory = {
            module: dspModule,
            json: JSON.stringify(meta),
        };

        const generator = new FaustPolyDspGenerator();
        // @ts-ignore — assign pre-compiled factories directly
        generator.voiceFactory = voiceFactory;
        generator.mixerModule = mixerModule;

        const processorName = `${meta.name}_poly`;
        const node = await FaustDevice._serialiseInit(processorName, async (alreadyRegistered) => {
            if (alreadyRegistered) {
                // @ts-ignore
                if (!FaustPolyDspGenerator.gWorkletProcessors.has(this.context))
                    // @ts-ignore
                    FaustPolyDspGenerator.gWorkletProcessors.set(this.context, new Set());
                // @ts-ignore
                FaustPolyDspGenerator.gWorkletProcessors.get(this.context)!.add(processorName);
            }
            return generator.createNode(this.context, voices, meta.name);
        });
        if (!node) throw new Error(`Failed to create Faust node for ${meta.name}`);

        this.node = node;
        this.params = this._buildParamList(meta);

        // connect into the Tone.js signal chain
        // @ts-ignore
        node.connect(this.output._gainNode._nativeAudioNode);
        // only connect input for processors (effects); synths have 0 audio inputs
        // @ts-ignore
        if (node.numberOfInputs > 0) this.input._gainNode._nativeAudioNode.connect(node);

        this.ready = true;
    }

    async initEffectDevice(dspUrl: URL | string, meta: FaustMeta) {
        const { FaustMonoDspGenerator } = await getFaustWasm();

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
        const node = await FaustDevice._serialiseInit(processorName, async (alreadyRegistered) => {
            if (alreadyRegistered) {
                // @ts-ignore
                if (!FaustMonoDspGenerator.gWorkletProcessors.has(this.context))
                    // @ts-ignore
                FaustMonoDspGenerator.gWorkletProcessors.set(this.context, new Set());
                // @ts-ignore
                FaustMonoDspGenerator.gWorkletProcessors.get(this.context)!.add(processorName);
            }
            return generator.createNode(this.context, meta.name);
        });
        if (!node) throw new Error(`Failed to create Faust mono node for ${meta.name}`);

        // @ts-ignore
        this.node = node;
        this.params = this._buildParamList(meta);

        // @ts-ignore
        node.connect(this.output._gainNode._nativeAudioNode);
        // @ts-ignore
        if (node.numberOfInputs > 0) this.input._gainNode._nativeAudioNode.connect(node);

        this.ready = true;
    }

    // Serialises AudioWorklet processor registration per processorName.
    // Concurrent calls for the same name are queued; each waits for the previous to
    // finish so that gWorkletProcessors is populated before the next createNode runs.
    // Both maps live on window to survive Vite HMR module re-evaluation.
    private static _serialiseInit<T>(
        processorName: string,
        work: (alreadyRegistered: boolean) => Promise<T>
    ): Promise<T> {
        const gates: Map<string, Promise<unknown>> = ((window as any).__faustGates ??= new Map());
        const registered: Set<string> = ((window as any).__faustRegistered ??= new Set());

        const result = (gates.get(processorName) ?? Promise.resolve()).then(() => {
            const alreadyRegistered = registered.has(processorName);
            return work(alreadyRegistered).then(node => {
                registered.add(processorName);
                return node;
            });
        });

        // Store the tail of the chain so the next caller queues behind this one.
        // Suppress errors on the gate so a failed init doesn't permanently block the queue.
        gates.set(processorName, result.catch(() => {}));

        return result;
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

    // Maps a short tag to its full Faust path (e.g. 'cutoff' → '/MySynth/cutoff').
    protected paramPath(tag: string): string | undefined {
        return this.params.find(p => p === `/${tag}` || p.endsWith(`/${tag}`));
    }

    setParamValue(tag: string, value: number) {
        const path = this.paramPath(tag);
        if (path) this.node.setParamValue(path, value);
    }

    messageDevice(tag: string, value: number, time: number) {
        const delay = Math.max(0, (time - this.context.currentTime) * 1000);
        this.setParamValue('lagtime', 10);
        setTimeout(() => {
            this.setParamValue(tag, value)
        }, delay);
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
