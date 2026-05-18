import FaustDevice from './FaustDevice';
import { dspUrl, meta } from './wasm/tape/index';

class FTape extends FaustDevice {
    constructor() {
        super();
        this.prefix = 'ftape';
        this.initEffectDevice(dspUrl, meta);
        this.defaults = {
            ftape: 0,
            ftapehiss: 0.05,
            ftapesat: .1,
            ftapewow: .1,
            ftapeflutter: .1,
            ftapextalk: .1
        }

    }
}

export default FTape;
