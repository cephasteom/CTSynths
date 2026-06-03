import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/karplus/index';

class Karplus extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults, 
            att: 0.001, detune: 0, excite: 0.1
        }
    }
}

export default Karplus;
