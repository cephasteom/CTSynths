import("stdfaust.lib");

gate = button("gate");

// --- VarLag ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Core controls ---
freq = hslider("freq", 200, 20, 500, 1);
gain = hslider("gain", 1, 0, 1, 0.01) * 0.5;
pan  = varlag(hslider("pan", 0.5, 0, 1, 0.01));

// --- Keyscaling ---
nL      = ba.hz2midikey(freq);
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);
ampL    = gain * ksScale;

// --- Amplitude envelope ---
a = hslider("a",   2, 0,  500, 1) * 0.001;
d = hslider("d", 150, 0, 5000, 1) * 0.001;
s = hslider("s", 0.0, 0,    1, 0.01);
r = hslider("r", 100, 0, 2000, 1) * 0.001;

// --- Snap & wire controls ---
snapAmt = hslider("snap", 0.5, 0, 1, 0.01);
wireAmt = hslider("wire", 0.6, 0, 1, 0.01);

pitchAmt  = snapAmt * snapAmt * 40.0;
pitchTime = snapAmt * snapAmt * 60.0 * 0.001;
snapDecay = 0.002 + snapAmt * 0.03;
snapBoost = snapAmt * 4.0;

// --- Envelopes ---
env      = en.adsr(a, d, s, r, gate);
pitchEnv = en.ar(0.001, pitchTime, gate);
snapEnv  = en.ar(0.001, snapDecay, gate);

// --- Two-oscillator body (808-style dual resonators) ---
sweepFreq = freq * pow(2.0, pitchAmt * pitchEnv / 12.0);
body      = os.osc(sweepFreq) + os.osc(sweepFreq * 1.47);

// --- Noise (highpass, wideband) ---
noiseHP = fi.svf.hp(200.0, 0.7, no.noise);

// --- Blend tone and noise, shape with snap ---
blend  = body * (1.0 - wireAmt) + noiseHP * wireAmt;
snap   = 1.0 + snapBoost * snapEnv;
mono   = blend * env * snap * ampL * 0.5;
angle  = pan * ma.PI / 2.0;
stereo = mono * cos(angle), mono * sin(angle);

process = stereo;
