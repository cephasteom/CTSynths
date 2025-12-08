import pkg from '@rnbo/js';
const { MIDIEvent } = pkg;
import RNBODevice from './RNBODevice'
import type { Dictionary } from '../types'

const patcher = fetch(new URL('./json/fx-channel2.export.json', import.meta.url))
    .then(rawPatcher => rawPatcher.json())

/**
 * The chain of effect applied to the output of each stream. Each effect remains inactive until the amount is set to a value greater than 0.
 * @example
 * s0.reverb.set(0.5)
 */ 
class FXChannel extends RNBODevice {
    /** @hidden */
    constructor() {
        super()
        this.defaults = {
            dist: 0, drive: 0.25,
            lpf: 0, hpf: 0,
        }
        this.patcher = patcher
        this.initDevice()

        this.dist = this.dist.bind(this)
        this._dist = this._dist.bind(this)
        this.drive = this.drive.bind(this)
        this._drive = this._drive.bind(this)
        this.lpf = this.lpf.bind(this)
        this._lpf = this._lpf.bind(this)
        this.hpf = this.hpf.bind(this)
        this._hpf = this._hpf.bind(this)

        this.params = Object.getOwnPropertyNames(this)
    }

    /** @hidden */
    set(params: Dictionary = {}, time: number) {
        if(!this.ready) return
        const ps = {...this.defaults, ...params }
        this.setParams(ps, time)

        const triggerEvent = new MIDIEvent(time * 1000, 0, [144, 60, 127]);
        this.device.scheduleEvent(triggerEvent);
    }

    /**
     * Wet/dry distortion amount. 0 - 1.
     * @param value - 0 to 1
     */ 
    dist(value: number = 0, time: number): void { this.messageDevice('dist', value, time) }

    /**
     * Mutate the distortion amount
     * @param value - 0 to 1
     */ 
    _dist(value: number = 0, time: number): void { this.messageDevice('_dist', value, time) }

    /**
     * Distortion drive. 0 - 1.
     * @param value - 0 to 1
     */ 
    drive(value: number = 0.5, time: number): void { this.messageDevice('drive', value, time) }

    /**
     * Mutate the distortion drive
     * @param value - 0 to 1
     */ 
    _drive(value: number = 0.5, time: number): void { this.messageDevice('_drive', value, time) }
    
    /**
     * Low Pass Filter. 0 - 1.
     * @param value - 0 to 1
     */
    lpf(value: number = 0, time: number): void { this.messageDevice('hicut', value, time) }

    /**
     * mutate the LPF filter - alias for _hicut
     * @param value - 0 to 1
     */
    _lpf(value: number = 0, time: number): void { this.messageDevice('_lpf', value, time) }

    /**
     * High Pass Filter. 0 - 1.
     * @param value - 0 to 1
     */
    hpf(value: number = 0, time: number): void { this.messageDevice('locut', value, time) }

    /**
     * mutate the HPF filter - alias for _locut
     * @param value - 0 to 1
     */
    _hpf(value: number = 0, time: number): void { this.messageDevice('_hpf', value, time) }
}

export default FXChannel