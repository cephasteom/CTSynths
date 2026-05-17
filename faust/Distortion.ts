import FaustDevice from './FaustDevice';
import { dspUrl, meta } from './wasm/distortion/index';

class FDistortion extends FaustDevice {
    constructor() {
        super();
        this.prefix = 'fdist';
        this.initEffectDevice(dspUrl, meta);
        this.defaults = {
            fdist: .5,
            fdistdrive: .5,
            fdisttone: .5,
        }
    }
}

export default FDistortion;
