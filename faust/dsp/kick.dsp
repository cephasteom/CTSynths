import("stdfaust.lib");

gate = button("gate");

// --- VarLag (snap on gate rising edge) ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Polyphony controls ---
freq = hslider("freq", 60, 20, 500, 1);
gain = hslider("gain", 1, 0, 1, 0.01) * 0.5;

// --- Pan ---
pan   = varlag(hslider("pan", 0.5, 0, 1, 0.01));

// --- Amplitude envelope ---
a = hslider("a", 1,   0, 500,   1) * 0.001;
d = hslider("d", 400, 0, 5000,  1) * 0.001;
s = hslider("s", 0.0, 0, 1,  0.01);
r = hslider("r", 100, 0, 2000,  1) * 0.001;

// --- Pitch envelope ---
// pitchStart: how many semitones above freq to begin the sweep
// pitchTime:  how long (ms) the sweep takes to reach freq
punch     = hslider("punch", 0.4, 0, 1, 0.01);
pitchAmt  = punch * punch * 60;        // 0–60 semitones, curved
pitchTime = punch * punch * 120 * 0.001; // 0–120ms, curved

// --- Keyscaling ---
nL      = ba.hz2midikey(freq);
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);
ampL    = gain * ksScale;

// --- Envelopes ---
env      = en.adsr(a, d, s, r, gate);
pitchEnv = en.ar(0.001, pitchTime, gate);   // fast attack, decays over pitchTime

// --- Pitch sweep ---
sweepFreq = freq * pow(2.0, pitchAmt * pitchEnv / 12.0);

// --- Oscillator ---
car = os.osc(sweepFreq);

// --- Amplitude & pan ---
angle  = pan * ma.PI / 2.0;
mono   = car * env * ampL * 0.5;
stereo = mono * cos(angle), mono * sin(angle);

process = stereo;