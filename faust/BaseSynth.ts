import FaustDevice from './FaustDevice';
import type { Dictionary } from '../types';

interface ScheduledEvent {
    time: number;
    fn: () => void;
}

/**
 * Base class for all Faust polyphonic synths. Mirrors the rnbo/BaseSynth API.
 * Do not instantiate directly.
 */
class BaseSynth extends FaustDevice {
    private _scheduledEvents: ScheduledEvent[] = [];
    private _schedulerHandle: number | null = null;
    private _releaseEvents = new Map<number, ScheduledEvent>();
    private _activeNotes = new Map<number, number>(); // note → scheduled keyOn time

    private readonly LOOKAHEAD = 0.05;  // 50ms lookahead window
    private readonly IMMEDIATE = 0.005; // fire immediately if within 5ms

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

    // -------------------------------------------------------------------------
    // Scheduler
    // -------------------------------------------------------------------------

    private _startScheduler(): void {
        if (this._schedulerHandle !== null) return;
        const tick = () => {
            const now = this.context.currentTime;
            this._scheduledEvents = this._scheduledEvents.filter(ev => {
                if (ev.time <= now + this.LOOKAHEAD) {
                    ev.fn();
                    return false;
                }
                return true;
            });
            if (this._scheduledEvents.length > 0) {
                this._schedulerHandle = requestAnimationFrame(tick);
            } else {
                this._schedulerHandle = null;
            }
        };
        this._schedulerHandle = requestAnimationFrame(tick);
    }

    private _schedule(time: number, fn: () => void): ScheduledEvent {
        if (time <= this.context.currentTime + this.IMMEDIATE) {
            fn();
            return { time, fn };
        }
        const ev: ScheduledEvent = { time, fn };
        this._scheduledEvents.push(ev);
        this._scheduledEvents.sort((a, b) => a.time - b.time);
        this._startScheduler();
        return ev;
    }

    private _cancel(ev: ScheduledEvent): void {
        const idx = this._scheduledEvents.indexOf(ev);
        if (idx !== -1) this._scheduledEvents.splice(idx, 1);
    }

    // -------------------------------------------------------------------------
    // Playback
    // -------------------------------------------------------------------------

    play(params: Dictionary = {}, time: number): void {
        if (!this.ready) return;
        console.log('play method')

        const ps = { ...this.defaults, ...params };
        const { n, amp, nudge, dur } = ps;

        // Cancel any pending release for this note
        const existingRelease = this._releaseEvents.get(n);
        if (existingRelease !== undefined) {
            this._cancel(existingRelease);
            this._releaseEvents.delete(n);
        }

        const paramTime = time;
        const noteTime = time + ((nudge || 0) + 10) / 1000;
        const releaseTime = noteTime + dur / 1000;

        this._schedule(paramTime, () => {
            console.log('param timer')
            Object.entries(ps)
                .sort(([a], [b]) => a.localeCompare(b))
                .filter(([key]) => !!this.paramPath(key))
                .forEach(([key, value]) => this.setParamValue(key, value));
        });

        // Track at schedule time so cut() knows about pending notes
        this._activeNotes.set(n, noteTime);

        this._schedule(noteTime, () => {
            console.log('note on timer')
            this.node.keyOn(0, n, Math.round(amp * 127));
        });
        const releaseEv = this._schedule(releaseTime, () => {
            console.log('note off timer')
            this.node.keyOff(0, n, 0);
            this._activeNotes.delete(n);
            this._releaseEvents.delete(n);
        });
        this._releaseEvents.set(n, releaseEv);

    }

    release(n: number, time: number): void {
        if (!this.ready) return;
        this._schedule(time + 0.01, () => this.node.keyOff(0, n, 0));
    }

    cut(time: number, ms: number = 5): void {
        if (!this.ready) return;

        // Split notes into ones to cut now vs ones scheduled in the future
        const notesToCut = [...this._activeNotes.entries()]
            .filter(([_, keyOnTime]) => keyOnTime <= time);

        notesToCut.forEach(([n, keyOnTime]) => {
            // Only cancel releases for notes we're actually cutting
            const releaseEv = this._releaseEvents.get(n);
            if (releaseEv) {
                this._cancel(releaseEv);
                this._releaseEvents.delete(n);
            }
            this._activeNotes.delete(n);
            
            const cutTime = Math.max(time, keyOnTime) + 0.001;
            this._schedule(cutTime, () => {
                this.setParamValue('r', ms);
                this.node.keyOff(0, n, 0);
            });
        });
    }   

    // -------------------------------------------------------------------------
    // Parameter methods
    // -------------------------------------------------------------------------

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
