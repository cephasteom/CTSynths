import pkg from '@rnbo/js';
const { MIDIEvent } = pkg;
import RNBODevice from './RNBODevice'
import type { Dictionary } from '../types'

let patcherPromise: Promise<any> | null = null;

function getPatcher() {
    if (!patcherPromise) {
        patcherPromise = fetch(
            new URL('./json/reverb-gen.export.json', import.meta.url)
        ).then(r => r.json());
    }
    return patcherPromise;
}

/**
 * The Reverb chained to the end of each stream. Is initialised only when reverb parameter is greater than 0.
 * @example
 * s0.reverb.set(0.5)
 */ 
class ReverbGen extends RNBODevice {
    /** @hidden */
    constructor() {
        super()
        this.defaults = { reverb: 0, rsize: 0.25, rdamp: 0.5, rtime: 0.25, rspread: 0.1, rwidth: 0.1, rearly: 0.01, rtail: 0.01 }
        this.patcher = getPatcher()
        this.initDevice()

        this.reverb = this.reverb.bind(this)
        this._reverb = this._reverb.bind(this)
        this.rsize = this.rsize.bind(this)
        this._rsize = this._rsize.bind(this)
        this.rtime = this.rtime.bind(this)
        this._rtime = this._rtime.bind(this)
        this.rdamp = this.rdamp.bind(this)
        this._rdamp = this._rdamp.bind(this)
        this.rspread = this.rspread.bind(this)
        this._rspread = this._rspread.bind(this)
        this.rwidth = this.rwidth.bind(this)
        this._rwidth = this._rwidth.bind(this)
        this.rearly = this.rearly.bind(this)
        this._rearly = this._rearly.bind(this)
        this.rtail = this.rtail.bind(this)
        this._rtail = this._rtail.bind(this)
        

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
     * Wet/dry reverb amount. 0 - 1.
     * @param value - 0 to 1
     */
    reverb(value: number = 0, time: number): void { this.messageDevice('reverb', value, time) }

    /**
     * Mutate the reverb amount
     * @param value - 0 to 1
     */
    _reverb(value: number = 0, time: number): void { this.messageDevice('_reverb', value, time) }    

    /**
     * Reverb size. 0 - 1.
     * @param value - 0 to 1
     */ 
    rsize(value: number = 0.25, time: number): void { 
        this.messageDevice('rsize', value, time) 
    }

    /**
     * Mutate the reverb size
     * @param value - 0 to 1
     */ 
    _rsize(value: number = 0.25, time: number): void { this.messageDevice('_rsize', value, time) }

    /**
     * Reverb time. 0 - 1.
     * @param value - 0 to 1
     */
    rtime(value: number = 0.25, time: number): void { this.messageDevice('rtime', value, time) }

    /**
     * Mutate the reverb time
     * @param value - 0 to 1
     */
    _rtime(value: number = 0.25, time: number): void { this.messageDevice('_rtime', value, time) }

    /**
     * Reverb dampening. 0 - 1.
     * @param value - 0 to 1
     */ 
    rdamp(value: number = 0.25, time: number): void { this.messageDevice('rdamp', value, time) }

    /**
     * Mutate the reverb dampening
     * @param value - 0 to 1
     */ 
    _rdamp(value: number = 0.25, time: number): void { this.messageDevice('_rdamp', value, time) }

    /**
     * Reverb spread. 0 - 1.
     * @param value - 0 to 1
     */
    rspread(value: number = 0.25, time: number): void { this.messageDevice('rspread', value, time) }

    /**
     * Mutate the reverb spread
     * @param value - 0 to 1
     */
    _rspread(value: number = 0.25, time: number): void { this.messageDevice('_rspread', value, time) }

    /**
     * Reverb width. 0 - 1.
     * @param value - 0 to 1
     */
    rwidth(value: number = 0.25, time: number): void { this.messageDevice('rwidth', value, time) }

    /**
     * Mutate the reverb width
     * @param value - 0 to 1
     */
    _rwidth(value: number = 0.25, time: number): void { this.messageDevice('_rwidth', value, time) }

    /**
     * Reverb early. 0 - 1.
     * @param value - 0 to 1
     */
    rearly(value: number = 0.25, time: number): void { this.messageDevice('rearly', value, time) }

    /**
     * Mutate the reverb early
     * @param value - 0 to 1
     */
    _rearly(value: number = 0.25, time: number): void { this.messageDevice('_rearly', value, time) }

    /**
     * Reverb tail. 0 - 1.
     * @param value - 0 to 1
     */
    rtail(value: number = 0.25, time: number): void { this.messageDevice('rtail', value, time) }

    /**
     * Mutate the reverb tail
     * @param value - 0 to 1
     */
    _rtail(value: number = 0.25, time: number): void { this.messageDevice('_rtail', value, time) }
}

export default ReverbGen