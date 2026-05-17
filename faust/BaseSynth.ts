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
        dur: 1000, n: 60, pan: 0.5, vol: 1, amp: 1, hold: 0,
        a: 10, d: 100, s: 0.8, r: 500,
        moda: 10, modd: 100, mods: 0.8, modr: 500,
        fila: 10, fild: 100, fils: 0.8, filr: 500,
        res: 0, cutoff: 20000, detune: 0,
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
        this.hold = this.hold.bind(this);
        this.a = this.a.bind(this);
        this.acurve = this.acurve.bind(this);
        this.d = this.d.bind(this);
        this.dcurve = this.dcurve.bind(this);
        this.s = this.s.bind(this);
        this.r = this.r.bind(this);
        this.rcurve = this.rcurve.bind(this);
        this.moda = this.moda.bind(this);
        this.modacurve = this.modacurve.bind(this);
        this.modd = this.modd.bind(this);
        this.moddcurve = this.moddcurve.bind(this);
        this.mods = this.mods.bind(this);
        this.modr = this.modr.bind(this);
        this.modrcurve = this.modrcurve.bind(this);
        this.fila = this.fila.bind(this);
        this.filacurve = this.filacurve.bind(this);
        this.fild = this.fild.bind(this);
        this.fildcurve = this.fildcurve.bind(this);
        this.fils = this.fils.bind(this);
        this.filr = this.filr.bind(this);
        this.filrcurve = this.filrcurve.bind(this);
        this.res = this.res.bind(this);
        this._res = this._res.bind(this);
        this.cutoff = this.cutoff.bind(this);
        this._cutoff = this._cutoff.bind(this);
        this.detune = this.detune.bind(this);
        this._detune = this._detune.bind(this);
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
        const delay = Math.max(0, (time - this.context.currentTime) * 1000);
        
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
    hold(value: number, time: number): void { this.messageDevice('hold', value, time); }
    a(value: number = 10, time: number): void { this.messageDevice('a', value, time); }
    d(value: number = 100, time: number): void { this.messageDevice('d', value, time); }
    s(value: number = 0.5, time: number): void { this.messageDevice('s', value, time); }
    r(value: number = 1000, time: number): void { this.messageDevice('r', value, time); }
    acurve(value: number, time: number): void { this.messageDevice('acurve', value, time); }
    dcurve(value: number, time: number): void { this.messageDevice('dcurve', value, time); }
    rcurve(value: number, time: number): void { this.messageDevice('rcurve', value, time); }
    moda(value: number = 10, time: number): void { this.messageDevice('moda', value, time); }
    modd(value: number = 100, time: number): void { this.messageDevice('modd', value, time); }
    mods(value: number = 0.8, time: number): void { this.messageDevice('mods', value, time); }
    modr(value: number = 1000, time: number): void { this.messageDevice('modr', value, time); }
    modacurve(value: number, time: number): void { this.messageDevice('modacurve', value, time); }
    moddcurve(value: number, time: number): void { this.messageDevice('moddcurve', value, time); }
    modrcurve(value: number, time: number): void { this.messageDevice('modrcurve', value, time); }
    fila(value: number = 10, time: number): void { this.messageDevice('fila', value, time); }
    fild(value: number = 100, time: number): void { this.messageDevice('fild', value, time); }
    fils(value: number = 0.8, time: number): void { this.messageDevice('fils', value, time); }
    filr(value: number = 1000, time: number): void { this.messageDevice('filr', value, time); }
    filacurve(value: number, time: number): void { this.messageDevice('filacurve', value, time); }
    fildcurve(value: number, time: number): void { this.messageDevice('fildcurve', value, time); }
    filrcurve(value: number, time: number): void { this.messageDevice('filrcurve', value, time); }
    res(value: number = 0, time: number): void { this.messageDevice('res', value, time); }
    _res(value: number = 0, time: number): void { this.messageDevice('_res', value, time); }
    cutoff(value: number = 20000, time: number): void { this.messageDevice('cutoff', value, time); }
    _cutoff(value: number = 20000, time: number): void { this.messageDevice('_cutoff', value, time); }
    detune(value: number = 0, time: number): void { this.messageDevice('detune', value, time); }
    _detune(value: number = 0, time: number): void { this.messageDevice('_detune', value, time); }
}

export default BaseSynth;
