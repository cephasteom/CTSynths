import("stdfaust.lib");

// --- Polyphony controls (Faust poly naming convention) ---
freq    = hslider("freq", 440, 20, 20000, 1);
gain    = hslider("gain", 1, 0, 1, 0.01);
gate    = button("gate");

// --- VarLag (snap on gate rising edge) ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Per-voice controls ---
harm    = varlag(hslider("harm", 2.0, 0.1, 16.0, 0.01));
modi    = varlag(hslider("modi", 3.0, 0, 20.0, 0.01));
pan     = varlag(hslider("pan", 0.5, 0, 1, 0.01));

a       = hslider("a", 10, 0, 5000, 1) * 0.001;
d       = hslider("d", 100, 0, 5000, 1) * 0.001;
s       = hslider("s", 0.7, 0, 1, 0.01);
r       = hslider("r", 300, 0, 10000, 1) * 0.001;

moda    = hslider("moda", 0, 0, 5000, 1) * 0.001;
modd    = hslider("modd", 100, 0, 5000, 1) * 0.001;
mods    = hslider("mods", 1.0, 0, 1, 0.01);
modr    = hslider("modr", 500, 0, 10000, 1) * 0.001;

// --- Keyscaling (2^(-0.5) per octave above middle C) ---
nL      = ba.hz2midikey(varlag(freq));
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);

ampL    = gain * ksScale;
modIdx  = modi * ksScale * ampL;

// --- Envelopes ---
modEnv  = en.adsr(moda, modd, mods, modr, gate);
env     = en.adsr(a, d, s, r, gate);

// --- FM core ---
modSig  = os.osc(freq * harm) * freq * modIdx * modEnv;
car     = os.osc(freq + modSig);

// --- Amplitude & pan ---
angle   = varlag(pan) * ma.PI / 2.0;
mono    = car * env * ampL * 0.5;

process = mono * cos(angle), mono * sin(angle);