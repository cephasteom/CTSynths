import FaustDevice from './FaustDevice';
import type { Dictionary } from '../types';

/**
 * Base class for all Faust polyphonic synths. Mirrors the rnbo/BaseSynth API.
 * Do not instantiate directly.
 */
class BaseSynth extends FaustDevice {
    private _releaseTimers = new Map<Symbol, ReturnType<typeof setTimeout>>()
    private _notes = new Map<Symbol, number>

    defaults: Dictionary = {
        dur: 1000, n: 60, pan: 0.5, vol: 1, amp: 1, hold: 0,
        a: 10, d: 100, s: 0.8, r: 500,
        moda: 10, modd: 100, mods: 0.8, modr: 500,
        res: 0.01, lpf: 0, hpf: 0, bpf: 0,
    }

    constructor() {
        super();
    }

    play(params: Dictionary = {}, time: number): void {
        if (!this.ready) return;

        const ps = { ...this.defaults, ...params };
        const { n, amp, nudge, dur, lag = 10 } = ps;

        const eventId = Symbol();  // unique per note event
        this._notes.set(eventId, n)

        const paramDelay = Math.max(0, (time - this.context.currentTime) * 1000);
        const noteDelay = paramDelay + (nudge || 0) + 10;

        setTimeout(() => {
            Object.entries(ps)
                .sort(([a], [b]) => a.localeCompare(b))
                .filter(([key]) => !!this.paramPath(key) && !['lag'].includes(key))
                .forEach(([key, value]) => {
                    this.setParamValue(
                        'lagtime', 
                        // freq and gain are per voice, everything else is per instrument, so we have to smooth
                        ['n', 'amp'].includes(key) ? 1 : lag
                    );
                    this.setParamValue(key, value)
                });
        }, paramDelay);

        setTimeout(() => {
            this.node.keyOn(0, n, Math.round(amp * 127));
            const id = setTimeout(() => {
                if(this._releaseTimers.has(eventId)) {
                    this.node.keyOff(0, n, 0);
                    this._notes.delete(eventId)
                    this._releaseTimers.delete(eventId);
                }
            }, dur);
            this._releaseTimers.set(eventId, id);
        }, noteDelay);
    }

    cut(time: number, ms: number = 5): void {
        if (!this.ready) return;
        const delay = Math.max(0, (time - this.context.currentTime) * 1000) - 5;

        this._releaseTimers.forEach(id => clearTimeout(id));
        this._releaseTimers.clear();
        setTimeout(() => {
            this.setParamValue('r', ms);
            this._notes.forEach(n => this.node.keyOff(0, n, 0))
            this._notes.clear()
        }, delay);
    }

    release(n: number, time: number): void {
        if (!this.ready) return;
        const delay = Math.max(0, (time - this.context.currentTime) * 1000) + 10;
        setTimeout(() => this.node.keyOff(0, n, 0), delay);
    }
}

export default BaseSynth;
