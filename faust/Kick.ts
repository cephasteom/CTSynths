import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/kick/index';

class Kick extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults, 
            punch: .6
        }
    }
}

export default Kick;
