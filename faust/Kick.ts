import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/kick/index';

class Kick extends BaseSynth {
    constructor(voices = 8) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults, 
            punch: .6, click: .2, amp: 1, dur: 100, n: 36
        }
    }
}

export default Kick;
