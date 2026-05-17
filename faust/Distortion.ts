import FaustDevice from './FaustDevice';
import { dspUrl, meta } from './wasm/distortion/index';
console.log('distortion exports:', { dspUrl, meta });

class FDistortion extends FaustDevice {
    constructor() {
        super();
        this.initEffectDevice(dspUrl, meta);
        this.defaults = { 
            drive: .5,
            tone: .5,
            mix: .5
        }
    }
}

export default FDistortion;
