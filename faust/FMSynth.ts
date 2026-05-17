import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/fm/index';

class FMSynth extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { ...this.defaults, 
            osc: 0, drift: 0, modi: 0, harm: 1, lfodepth: 0, lforate: 1,
            moda: 10, modd: 100, mods: 0.8, modr: 500,
        }
    }
}

export default FMSynth;
