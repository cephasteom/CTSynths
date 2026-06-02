import ToneInstrument from "./ToneInstrument";
import { MonoSynth as ToneMonoSynth } from "tone";

class MonoSynth extends ToneInstrument {
    constructor() {
        super(ToneMonoSynth)
        this.defaults = {
            ...this.defaults, osc: 2, fila: 10
        }
        this.init()
    }

    /**
     * Attack time of the filter envelope. In milliseconds.
     * @param value Attack time in milliseconds
     */
    // @ts-ignore
    fila(value: number = 1000): void { this.synth._voices.forEach(v => v.filterEnvelope.attack = value / 1000);}

    /**
     * Decay time of the filter envelope. In milliseconds.
     * @param value Decay time in milliseconds
     */
    // @ts-ignore
    fild(value: number = 100): void { this.synth._voices.forEach(v => v.filterEnvelope.decay = value / 1000); }

    /**
     * Release time of the filter envelope. In milliseconds.
     * @param value Release time in milliseconds
     */
    // @ts-ignore
    filr(value: number = 500): void { this.synth._voices.forEach(v => v.filterEnvelope.release = value / 1000); }

    /** Sustain level of the filter envelope. (0 to 1).
     * @param value Sustain level (0 to 1)
     */
    // @ts-ignore
    fils(value: number = 0.5): void { this.synth._voices.forEach(v => v.filterEnvelope.sustain = value); }
}

export default MonoSynth;