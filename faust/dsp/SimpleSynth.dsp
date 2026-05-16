import("stdfaust.lib");

freq = hslider("freq", 440, 20, 20000, 1);
gain = hslider("gain", 1, 0, 1, 0.01);
gate = button("gate");

// Mutation lag time in ms — 0 = instant, >0 ramps via first-order IIR
lagtime = hslider("lagtime", 0, 0, 10000, 1) * 0.001;

// Variable-lag helper: first-order IIR, time constant lagtime seconds.
// Clamp denominator to 1 sample minimum to avoid division by zero.
lagpole = exp(-1.0 / max(lagtime * ma.SR, 1.0));
varlag(x) = x : si.smooth(lagpole);

// ADSR times in ms, smoothed by lagtime
a = varlag(hslider("a", 10, 0, 5000, 1)) * 0.001;
d = varlag(hslider("d", 100, 0, 5000, 1)) * 0.001;
s = varlag(hslider("s", 0.8, 0, 1, 0.01));
r = varlag(hslider("r", 500, 0, 10000, 1)) * 0.001;

vol = varlag(hslider("vol", 1, 0, 1, 0.01));

envelope = en.adsr(a, d, s, r, gate) * gain * 0.25;
process = os.osc(freq) * envelope * vol <: _, _;
