import BaseSamplingDevice from "./BaseSamplingDevice";

// the same as Granular.ts except we supply snap as a target time value, removing the need for bpm calculations

let patcherPromise: Promise<any> | null = null;

function getPatcher() {
    if (!patcherPromise) {
        patcherPromise = fetch(
            new URL('./json/granular2.export.json', import.meta.url)
        ).then(r => r.json());
    }
    return patcherPromise;
}
/**
 * Granular Synth
 * @example
 * s0.set({inst: 'granular'})
 */ 
class Granular extends BaseSamplingDevice {

    /** @hidden */
    constructor() {
        super()
        this.defaults = { 
            ...this.defaults, 
            i: 0, 
            snap: 0, 
            rate: 1, 
            a: 0, 
            d: 10, 
            s: 1, 
            r: 100, 
            grainrate: 16, 
            grainsize: 100, 
            grainslope: 0.01, 
            grainpan: 0.2, 
            direction: 1,
            begin: 0,
            end: 1,
        }
        this.patcher = getPatcher()
        this.initDevice()

        this.snap = this.snap.bind(this)
        this.rate = this.rate.bind(this)
        this._rate = this._rate.bind(this)
        this.grainrate = this.grainrate.bind(this)
        this._grainrate = this._grainrate.bind(this)
        this.grainsize = this.grainsize.bind(this)
        this._grainsize = this._grainsize.bind(this)
        this.grainslope = this.grainslope.bind(this)
        this._grainslope = this._grainslope.bind(this)
        this.grainpan = this.grainpan.bind(this)
        this._grainpan = this._grainpan.bind(this)
        this.direction = this.direction.bind(this)
        this._direction = this._direction.bind(this)
        this.begin = this.begin.bind(this)
        this.end = this.end.bind(this)
        this.loop = this.loop.bind(this)

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
     * Grains per second.
     * @param value
     */
    grainrate(value: number = 16, time: number): void { this.messageDevice('grainrate', value, time) }
    
    /**
     * Mutate grain rate
     * @param value - grain rate, number of grains per cycle or canvas
     */
    _grainrate(value: number = 16, time: number): void { this.messageDevice('_grainrate', value, time) } 

    /**
     * Grain size, in ms.
     * @param value
     */
    grainsize(value: number = 0.125, time: number): void { this.messageDevice('grainsize', value, time) }

    /**
     * Mutate grain size
     * @param value - grain size, length of grain in beats
     */
    _grainsize(value: number = 0.125, time: number): void { this.messageDevice('_grainsize', value, time) }

    /**
     * attack of grain, 0 - 1.
     * @param value
     */
    grainslope(value: number = 0.01, time: number): void { this.messageDevice('grainslope', value, time) }
    
    /**
     * Mutate grain slope
     * @param value - grain slope, attack of grain, 0 - 1
     */
    _grainslope(value: number = 0.01, time: number): void { this.messageDevice('_grainslope', value, time) }
    
    /**
     * Amount of randomness in grain panning, 0 - 1.
     * @param value
     */
    grainpan(value: number = 0.2, time: number): void { this.messageDevice('grainpan', value, time) }
    
    /**
     * Mutate grain pan
     * @param value - grain pan, amount of randomess in grain panning, 0 - 1
     */
    _grainpan(value: number = 0.2, time: number): void { this.messageDevice('_grainpan', value, time) }

    /**
     * Playback direction.
     * @param value - playback direction, 1 = forward, -1 = backward
     */
    direction(value: number = 1, time: number): void { this.messageDevice('direction', value, time) }
    
    /**
     * Mutate playback direction
     * @param value - playback direction, 1 = forward, -1 = backward
     */
    _direction(value: number = 1, time: number): void { this.messageDevice('_direction', value, time) }
    
    /**
     * Playback position start. 0 is the beginning of the sample, 1 is the end.
     * @param value - playback position start, 0 is the beginning of the sample, 1 is the end
     */
    begin(value: number = 0, time: number): void { this.messageDevice('begin', value, time) }
    
    /**
     * Playback position end. 0 is the beginning of the sample, 1 is the end.
     * @param value - playback position end, 0 is the beginning of the sample, 1 is the end
     */
    end(value: number = 1, time: number): void { this.messageDevice('end', value, time) }

    /**
     * Loop, 0 is off, 1 is on.
     * @param value - loop, 0 is off, 1 is on
     */
    loop(value: number = 0, time: number): void { this.messageDevice('loop', value, time) }
    
   

}

export default Granular