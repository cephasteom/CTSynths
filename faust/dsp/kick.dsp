import("stdfaust.lib");

gate = button("gate");

// --- VarLag ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Core controls ---
freq = hslider("freq", 60, 20, 500, 1);
gain = hslider("gain", 1, 0, 1, 0.01) * 0.5;
pan  = varlag(hslider("pan", 0.5, 0, 1, 0.01));

// --- Keyscaling (defined early so ampL is available below) ---
nL      = ba.hz2midikey(freq);
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);
ampL    = gain * ksScale;

// --- Amplitude envelope ---
a = hslider("a",   1, 0,  500, 1) * 0.001;
d = hslider("d", 400, 0, 5000, 1) * 0.001;
s = hslider("s", 0.0, 0,    1, 0.01);
r = hslider("r", 100, 0, 2000, 1) * 0.001;

// --- Punch & click (both scaled by ampL) ---
punchAmt   = hslider("punch", 0.4, 0, 1, 0.01);
clickAmt   = hslider("click", 0.4, 0, 1, 0.01);

pitchAmt   = punchAmt * punchAmt * 60.0 * ampL;
pitchTime  = punchAmt * punchAmt * 120.0 * 0.001;
clickLevel = clickAmt * ampL;
clickDecay = clickAmt * 80.0 * 0.001;

// --- Envelopes ---
env      = en.adsr(a, d, s, r, gate);
pitchEnv = en.ar(0.001, pitchTime, gate);
clickEnv = en.ar(0.001, clickDecay, gate);

// --- Sine body ---
sweepFreq = freq * pow(2.0, pitchAmt * pitchEnv / 12.0);
body      = os.osc(sweepFreq);

// --- Ring mod + FM click ---
noiseFiltered = fi.svf.bp(sweepFreq, 8.0, no.noise);
clickSig      = noiseFiltered * body * clickEnv * clickLevel;

// --- Mix ---
mono   = (body * env + clickSig) * ampL * 0.5;
angle  = pan * ma.PI / 2.0;
stereo = mono * cos(angle), mono * sin(angle);

process = stereo;