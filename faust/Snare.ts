import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/snare/index';

class Snare extends BaseSynth {
    constructor(voices = 8) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults, 
            snap: .8, wire: .4, amp: 1, dur: 100,
            a: 0, d: 100, s: .5, r: 1000
        }
    }
}

export default Snare;
