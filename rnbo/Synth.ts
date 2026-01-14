import BaseSynth from "./BaseSynth";

let patcherPromise: Promise<any> | null = null;

function getPatcher() {
    if (!patcherPromise) {
        patcherPromise = fetch(
            new URL('./json/synth-lite.export.json', import.meta.url)
        ).then(r => r.json());
    }
    return patcherPromise;
}

/**
 * An all purpose synth with filters and FM
 * @example
 * s0.set({inst: 'synth'})
 */ 
class Synth extends BaseSynth {
    /** @hidden */
    constructor() {
        super()
        this.defaults = { ...this.defaults, osc: 0, drift: 0, modi: 0, harm: 1, lforate: 0, lfodepth: 0, lfotype: 0 }
        this.patcher = getPatcher()

        this.initDevice()
        
        this.osc = this.osc.bind(this)
        this._osc = this._osc.bind(this)
        this.drift = this.drift.bind(this)
        this._drift = this._drift.bind(this)
        this.modi = this.modi.bind(this)
        this._modi = this._modi.bind(this)
        this.harm = this.harm.bind(this)
        this._harm = this._harm.bind(this)
        this.lforate = this.lforate.bind(this)
        this._lforate = this._lforate.bind(this)
        this.lfodepth = this.lfodepth.bind(this)
        this._lfodepth = this._lfodepth.bind(this)
        this.lfotype = this.lfotype.bind(this)
            
        this.params = Object.getOwnPropertyNames(this)
    }

    /**
     * The oscillator type. Sine wave is 0, sawtooth is 1, triangle is 2, square is 3.
     * Be careful when using FM with tri or square waves - RNBO bug
     * @param value - Sine wave is 0, sawtooth is 1, triangle is 2, square is 3
     * 
     */ 
    osc(value: number = 0, time: number): void { this.messageDevice('osc', value, time) }

    /**
     * Mutate the oscillator type
     * Be careful when using FM with tri or square waves - RNBO bug
     * @param value - Sine wave is 0, sawtooth is 1, triangle is 2, square is 3
     */ 
    _osc(value: number = 0, time: number): void { this.messageDevice('_osc', value, time) }

    /**
     * The oscillator drift, from 0 to 1.
     * @param value - 0 is no drift, 1 is max drift
     */
    drift(value: number = 0, time: number): void { this.messageDevice('drift', value, time) } 

    /**
     * Mutate the oscillator drift
     * @param value - 0 is no drift, 1 is max drift
     */ 
    _drift(value: number = 0, time: number): void { this.messageDevice('_drift', value, time) }

    /**
     * The modulation index, from 0+.
     * @param value - 0+
     */
    modi(value: number = 0, time: number): void { this.messageDevice('modi', value, time) } 

    /**
     * Mutate the modulation index
     * @param value - 0+
     */ 
    _modi(value: number = 0, time: number): void { this.messageDevice('_modi', value, time) }

    /**
     * The harmonicity ratio, from 0+.
     * @param value - number > 0
     */
    harm(value: number = 1, time: number): void { this.messageDevice('harm', value, time) } 

    /**
     * Mutate the harmonicity ratio
     * @param value - number > 0
     */
    _harm(value: number = 1, time: number): void { this.messageDevice('_harm', value, time) }

    /** 
     * LFO rate, in Hz.
     * @param value - LFO rate in Hz
     */
    lforate(value: number = 1, time: number): void { this.messageDevice('lforate', value, time) }

    /**
     * Mutate the LFO rate
     * @param value - LFO rate in Hz
     */
    _lforate(value: number = 1, time: number): void { this.messageDevice('_lforate', value, time) }
    
    /**
     * LFO depth, from 0 to 1.
     * @param value - LFO depth, 0 to 1
     */
    lfodepth(value: number = 0, time: number): void { this.messageDevice('lfodepth', value, time) }

    /**
     * Mutate the LFO depth
     * @param value - LFO depth, 0 to 1
     */
    _lfodepth(value: number = 0, time: number): void { this.messageDevice('_lfodepth', value, time) }

    /**
     * LFO waveform type. sine, ramp, square, pulse, tri
     * @param value - 0 to 4
     */ 
    lfotype(value: number = 0, time: number): void { this.messageDevice('lfotype', value, time) }
}

export default Synth