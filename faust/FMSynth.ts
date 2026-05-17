import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/fm/index';

class FMSynth extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
    }
}

export default FMSynth;
