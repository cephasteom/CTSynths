import BaseSynth from './BaseSynth';
import { dspUrl, mixerUrl, meta } from './wasm/noiseres/index';

class NoiseRes extends BaseSynth {
    constructor(voices = 32) {
        super();
        this.initDevice(dspUrl, mixerUrl, meta, voices);
        this.defaults = { 
            ...this.defaults, 
            fila: 10, fild: 0, fils: 1, filr: 800,
            tremolo: 0, tremolorate: .25
        }
    }
}

export default NoiseRes;
