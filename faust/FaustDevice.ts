import { context as toneContext, Gain } from 'tone';
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

class FaustDevice {
    defaults: Dictionary = {}
    input: Gain
    output: Gain
    node!: FaustPolyAudioWorkletNode
    ready = false
    // @ts-ignore
    context: AudioContext = toneContext.rawContext._nativeAudioContext || toneContext.rawContext._context;
    params: string[] = []

    constructor() {
        this.input = new Gain(1);
        this.output = new Gain(1);
        dummy.connect(this.output);
        dummy.connect(this.input);
    }

    async initDevice(dspUrl: URL | string, mixerUrl: URL | string, meta: FaustMeta, voices = 8) {
        const { FaustPolyDspGenerator } = await import('@grame/faustwasm');

        const [dspBuffer, mixerBuffer] = await Promise.all([
            fetch(dspUrl.toString()).then(r => r.arrayBuffer()),
            fetch(mixerUrl.toString()).then(r => r.arrayBuffer()),
        ]);

        const voiceFactory = {
            module: await WebAssembly.compile(dspBuffer),
            json: JSON.stringify(meta),
        };
        const mixerModule = await WebAssembly.compile(mixerBuffer);

        const generator = new FaustPolyDspGenerator();
        // @ts-ignore — assign pre-compiled factories directly
        generator.voiceFactory = voiceFactory;
        generator.mixerModule = mixerModule;

        const node = await generator.createNode(this.context, voices, meta.name);
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

    connect(node: typeof Destination | Gain) {
        this.output.connect(node);
    }

    disconnect() {
        this.output.disconnect();
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
        const entries = Object.entries(params)
            .filter(([k]) => k !== 'nudge')
            .map(([key, value]): [string, number] =>
                key === 'n' ? ['freq', 440 * Math.pow(2, (value - 69) / 12)] : [key, value]
            );

        setTimeout(() => {
            this.setParamValue('lagtime', lag);
            entries.forEach(([key, value]) => this.setParamValue(key, value));
        }, delay);
    }
}

export default FaustDevice;
