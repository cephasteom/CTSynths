import Synth from "./rnbo/Synth";
import Synth2 from "./rnbo/Synth2";
import SuperFM from "./rnbo/SuperFM";
import Sampler from "./rnbo/Sampler";
import Granulator from "./rnbo/Granular";
import Additive from "./rnbo/Additive";
import AcidSynth from "./rnbo/AcidSynth";
import DroneSynth from "./rnbo/DroneSynth";
import SubSynth from "./rnbo/SubSynth";
import Wavetable from "./rnbo/Wavetable";
import FXChain from "./rnbo/FXChain";
import FXChannel from "./rnbo/FXChannel";
import FXReverb from "./rnbo/Reverb";
import FXDelay from "./rnbo/Delay";
import ReverbGen from "./rnbo/ReverbGen";
import ToneSynth from "./tone/Synth";
import MonoSynth from "./tone/MonoSynth";
import FMSynth from "./tone/FMSynth";
import AMSynth from "./tone/AMSynth";

export const CtSynth = Synth
export const CtSynth2 = Synth2
export const CtSuperFM = SuperFM
export const CtSampler = Sampler
export const CtGranulator = Granulator
export const CtAdditive = Additive
export const CtFXChain = FXChain
export const CtFXChannel = FXChannel
export const CtAcidSynth = AcidSynth
export const CtDroneSynth = DroneSynth
export const CtSubSynth = SubSynth
export const CtWavetable = Wavetable
export const CtFXReverb = FXReverb
export const CtFXDelay = FXDelay
export const CtReverbGen = ReverbGen

import SimpleSynth from "./faust/SimpleSynth";
export const CtFaustSimpleSynth = SimpleSynth
import FMSynth from "./faust/FMSynth";
export const CtFaustFMSynth = FMSynth

export const CtToneSynth = ToneSynth
export const CtToneMonoSynth = MonoSynth
export const CtToneFMSynth = FMSynth
export const CtToneAMSynth = AMSynth