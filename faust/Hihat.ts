import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/hihat/index';

class Hihat extends BaseSynth {
    constructor(voices = 8) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults,
            dur: 5, r: 10, metal: .5, cutoff: 1,
        }
    }
}

export default Hihat;
