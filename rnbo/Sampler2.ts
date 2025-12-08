import BaseSamplingDevice from "./BaseSamplingDevice";

let patcherPromise: Promise<any> | null = null;

function getPatcher() {
    if (!patcherPromise) {
        patcherPromise = fetch(
            new URL('./json/sampler2.export.json', import.meta.url)
        ).then(r => r.json());
    }
    return patcherPromise;
}

// the same as Sampler.ts except we supply snap as a target time value, removing the need for bpm calculations

/**
 * Sampler
 * @example
 * s0.set({inst: 'sampler'})
 */ 
class Sampler extends BaseSamplingDevice {

    /** @hidden */
    constructor() {
        super()
        this.defaults = { 
            ...this.defaults, 
            i: 0, snap: 0, rate: 1, a: 5, d: 10, s: 1, r: 100, begin: 0, end: 1, loop: 0, oneshot: 0, loopsize: 1
        }
        this.patcher = getPatcher()
        this.initDevice()

        this.snap = this.snap.bind(this)
        this.rate = this.rate.bind(this)
        this._rate = this._rate.bind(this)
        this.begin = this.begin.bind(this)
        this.end = this.end.bind(this)
        this.loop = this.loop.bind(this)
        this.loopsize = this.loopsize.bind(this)
        this._loopsize = this._loopsize.bind(this)
        this.oneshot = this.oneshot.bind(this)

        this.params = Object.getOwnPropertyNames(this)
    }

    /**
     * Snap sample length to time, in ms. 0 means don't snap.
     * @param value
     */
    snap(value: number = 0, time: number): void { this.messageDevice('snap', value, time) } 

    /**
     * Playback rate. > 0 is forward, < 0 is reverse. 1 is normal speed, 2 is double speed, etc.
     * @param value
     */
    rate(value: number = 1, time: number): void { this.messageDevice('rate', value, time) }
    
    /**
     * Mutate playback rate
     * @param value - playback rate, > 0 is forward, < 0 is reverse. 1 is normal speed, 2 is double speed, etc.
     */
    _rate(value: number = 1, time: number): void { this.messageDevice('_rate', value, time) } 
    
    /**
     * Playback position start. 0 is the beginning of the sample, 1 is the end.
     * @param value
     */
    begin(value: number = 0, time: number): void { this.messageDevice('begin', value, time) }
    
    /**
     * Playback position end. 1 is the end of the sample.
     * @param value
     */
    end(value: number = 1, time: number): void { this.messageDevice('end', value, time) }

    /**
     * Loop. 0 is off, 1 is on.
     * @param value
     */
    loop(value: number = 0, time: number): void { this.messageDevice('loop', value, time) }

    /**
     * The size of the loop, from 0 to 1.
     * @param value
     */ 
    loopsize(value: number = 1, time: number): void { this.messageDevice('loopsize', value, time) }

    /**
     * Mutate loop size, the size of the loop
     * @param value - loop size, 0 - 1
     */
    _loopsize(value: number = 1, time: number): void { this.messageDevice('_loopsize', value, time) }
    
    /**
     * 0 is off, 1 is on.
     * @param value
     */
    oneshot(value: number = 0, time: number): void { this.messageDevice('oneshot', value, time) } 
}

export default Sampler