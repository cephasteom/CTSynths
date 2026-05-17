import FaustDevice from './FaustDevice';
import type { Dictionary } from '../types';

/**
 * Base class for all Faust polyphonic synths. Mirrors the rnbo/BaseSynth API.
 * Do not instantiate directly.
 */
class BaseSynth extends FaustDevice {
    private _releaseTimers = new Map<number, ReturnType<typeof setTimeout>>()
    private _activeNotes = new Set<number>()

    defaults: Dictionary = {
        dur: 1000, n: 60, pan: 0.5, vol: 1, amp: 1,
        a: 10, d: 100, s: 0.8, r: 500,
    }

    constructor() {
        super();
        this.dur = this.dur.bind(this);
        this.n = this.n.bind(this);
        this._n = this._n.bind(this);
        this.pan = this.pan.bind(this);
        this._pan = this._pan.bind(this);
        this.vol = this.vol.bind(this);
        this._vol = this._vol.bind(this);
        this.amp = this.amp.bind(this);
        this._amp = this._amp.bind(this);
        this.a = this.a.bind(this);
        this.d = this.d.bind(this);
        this.s = this.s.bind(this);
        this.r = this.r.bind(this);
    }

    play(params: Dictionary = {}, time: number): void {
        if (!this.ready) return;

        const ps = { ...this.defaults, ...params };
        const { n, amp, nudge, dur } = ps;

        const existing = this._releaseTimers.get(n);
        if (existing !== undefined) {
            clearTimeout(existing);
            this._releaseTimers.delete(n);
        }

        const paramDelay = Math.max(0, (time - this.context.currentTime) * 1000);
        const noteDelay = paramDelay + (nudge || 0) + 10;

        setTimeout(() => {
            Object.entries(ps)
                .sort(([a], [b]) => a.localeCompare(b))
                .filter(([key]) => !!this.paramPath(key))
                .forEach(([key, value]) => this.setParamValue(key, value));
        }, paramDelay);

        setTimeout(() => {
            this._activeNotes.add(n);
            this.node.keyOn(0, n, Math.round(amp * 127));
            const id = setTimeout(() => {
                this.node.keyOff(0, n, 0);
                this._activeNotes.delete(n);
                this._releaseTimers.delete(n);
            }, dur);
            this._releaseTimers.set(n, id);
        }, noteDelay);

    }

    release(n: number, time: number): void {
        if (!this.ready) return;
        const delay = Math.max(0, (time - this.context.currentTime) * 1000) + 10;
        setTimeout(() => this.node.keyOff(0, n, 0), delay);
    }

    cut(time: number, ms: number = 5): void {
        if (!this.ready) return;
        // delay cut timer by 1 ms so that it happens after the param timer
        const delay = Math.max(0, (time - this.context.currentTime) * 1000) + 1;
        
        const notes = [...this._activeNotes];
        this._activeNotes.clear();
        this._releaseTimers.forEach(id => clearTimeout(id));
        this._releaseTimers.clear();
        setTimeout(() => {
            this.setParamValue('r', ms);
            notes.forEach(n => this.node.keyOff(0, n, 0));
        }, delay);
    }

    dur(value: number = 1000, time: number): void { this.messageDevice('dur', value, time); }
    n(value: number = 60, time: number): void { this.messageDevice('n', value, time); }
    _n(value: number = 60, time: number): void { this.messageDevice('_n', value, time); }
    nudge(): void { /* handled in play */ }
    pan(value: number = 0.5, time: number): void { this.messageDevice('pan', value, time); }
    _pan(value: number = 0.5, time: number): void { this.messageDevice('_pan', value, time); }
    amp(value: number = 1, time: number): void { this.messageDevice('amp', value, time); }
    _amp(value: number = 1, time: number): void { this.messageDevice('_amp', value, time); }
    vol(value: number = 1, time: number): void { this.messageDevice('vol', value, time); }
    _vol(value: number = 1, time: number): void { this.messageDevice('_vol', value, time); }
    a(value: number = 10, time: number): void { this.messageDevice('a', value, time); }
    d(value: number = 100, time: number): void { this.messageDevice('d', value, time); }
    s(value: number = 0.5, time: number): void { this.messageDevice('s', value, time); }
    r(value: number = 1000, time: number): void { this.messageDevice('r', value, time); }
}

export default BaseSynth;
