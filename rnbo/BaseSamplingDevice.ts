import BaseSynth from './BaseSynth'
import type { Dictionary } from "../types";
import { samples } from "./data/samples";

class BaseSamplingDevice extends BaseSynth {
    /** @hidden */
    nextBuffer = 0

    /** @hidden */
    banks: Dictionary = {}

    /** @hidden */
    currentBank = ''

    /** @hidden */
    buffers: Dictionary = {}

    /** @hidden */
    constructor() {
        super()
        this.bank = this.bank.bind(this)
        this.i = this.i.bind(this)
    }

    /**
     * Sample bank to use.
     * @param name - name of the bank
     */ 
    bank(name: string) {
        this.currentBank = name 
    }

    /**
     * Load a sample into a buffer
     * @param bank - name of the bank
     * @param index - index of the sample in the bank
     * @ignore
     * @returns index of the buffer interal to the synth
     */
    async loadSample(bank: string, index: number) {
        if(!this.ready) return
        index = Math.floor(index)
        const url = this.banks[bank][index]

        // check if the sample is already loaded into a buffer
        const i = Object.values(this.buffers).indexOf(url)
        // if it's not loaded, load it
        if(i < 0) {
            // check whether we've already fetched the sample
            const ref = `${bank}-${index}`

            const sample = samples[ref] || 
            await fetch(url)
                .then(res => res.arrayBuffer())
                .then(arrayBuf => this.context.decodeAudioData(arrayBuf))
                .catch(err => console.log(err))

            const b = `b${this.nextBuffer}`
            // set buffer in rnbo device
            this.device.setDataBuffer(b, sample)
            // note that the buffer is loaded
            this.buffers[b] = url
            // note that the sample has been fetched
            samples[ref] = sample
            // increment next buffer index
            this.nextBuffer = (this.nextBuffer + 1) % 32
        }

        return i
    }

    /**
     * Index of sample in bank.
     * @param value - index of sample in bank
     */ 
    async i(value: number = 0, time: number) {
        if(!this.currentBank) return
        const index = Math.floor(value) % this.banks[this.currentBank].length
        const bufferI = await this.loadSample(this.currentBank, index)
        this.messageDevice('i', bufferI, time)
    }
    
}

export default BaseSamplingDevice