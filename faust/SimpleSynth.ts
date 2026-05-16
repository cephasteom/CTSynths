import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/SimpleSynth/index';

class SimpleSynth extends BaseSynth {
    constructor() {
        super();
        this.initDevice(dspUrl, mixerUrl, meta);
    }
}

export default SimpleSynth;
