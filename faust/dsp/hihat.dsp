import("stdfaust.lib");

gate = button("gate");

// --- VarLag ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Core controls ---
freq = hslider("freq", 205, 20, 2000, 1);
gain = hslider("gain", 1, 0, 1, 0.01) * 0.5;
pan  = varlag(hslider("pan", 0.5, 0, 1, 0.01));

// --- Keyscaling ---
nL      = ba.hz2midikey(freq);
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);
ampL    = gain * ksScale;

// --- Amplitude envelope ---
a = hslider("a",   1, 0,  500, 1) * 0.001;
d = hslider("d",  80, 0, 2000, 1) * 0.001;
s = hslider("s", 0.0, 0,    1, 0.01);
r = hslider("r",  20, 0, 1000, 1) * 0.001;

// --- Metal & cutoff controls ---
metalAmt  = hslider("metal",  0.5, 0,   1, 0.01);
cutoffAmt = hslider("cutoff", 0.5, 0, 1, 0.01);

// --- Envelope ---
env = en.adsr(a, d, s, r, gate);

// --- Metallic oscillator bank (non-harmonic intervals, 808-style) ---
oscBank = (os.square(freq) + os.square(freq * 1.80)
        +  os.square(freq * 2.56) + os.square(freq * 3.22)) * 0.25;

// --- Highpass both components at the same cutoff ---
cutFreq  = freq * pow(8.0, cutoffAmt);
metalSig = fi.svf.hp(cutFreq, 0.7, oscBank);
noiseSig = fi.svf.hp(cutFreq, 0.7, no.noise);

// --- Blend ---
blend  = metalSig * metalAmt + noiseSig * (1.0 - metalAmt);
mono   = blend * env * ampL * 0.5;
angle  = pan * ma.PI / 2.0;
stereo = mono * cos(angle), mono * sin(angle);

process = stereo;
