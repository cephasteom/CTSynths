import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/SimpleSynth/index';

class SimpleSynth extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
    }
}

export default SimpleSynth;
