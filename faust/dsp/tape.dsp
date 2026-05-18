// @effect
import("stdfaust.lib");

lagtime = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
lagpole = exp(-1.0 / max(lagtime * ma.SR, 1.0));
varlag(x) = x : si.smooth(lagpole);

// --- Controls ---
mix      = varlag(hslider("mix",      0,    0, 1,     0.001));
hiss     = varlag(hslider("hiss",     0.5,  0, 1,     0.001));
sat      = varlag(hslider("sat",      0,    0, 1,     0.001));
wow      = varlag(hslider("wow",      0,    0, 1,     0.001));  // slow drift
flutter  = varlag(hslider("flutter",  0,    0, 1,     0.001));  // fast flutter
crosstalk= varlag(hslider("xtalk",    0,    0, 1,     0.001));

// --- Hiss (independent per channel) ---
hissL = no.noise * hiss * 0.1 : fi.highpass(1, 4000);
hissR = no.noise * hiss * 0.1 : fi.highpass(1, 4000);

// --- Saturation ---
// Soft clip via tanh, drive controlled by sat
drive(x) = x * (1.0 + sat * 4.0);
saturate(x) = ma.tanh(drive(x)) / max(ma.tanh(drive(1.0)), 0.001);

// --- Wow & Flutter (pitch/time modulation) ---
// Wow: slow (0.5–2 Hz), Flutter: faster (8–12 Hz)
wowLFO    = os.lf_triangle(0.5 + wow * 1.5) * wow * 0.003;
flutterLFO= os.lf_triangle(8.0 + flutter * 4.0) * flutter * 0.001
          + no.noise * flutter * 0.0005;  // add noise component to flutter

modL = wowLFO + flutterLFO;
modR = wowLFO * 0.97 + flutterLFO * 1.03;  // slight difference between channels

// Simple chorus-style delay for pitch modulation
// delay in samples, modulated around a small center
centerDelay = 256.0;
delayL(x) = x : de.fdelay(1024, centerDelay + modL * 512.0);
delayR(x) = x : de.fdelay(1024, centerDelay + modR * 512.0);

// --- Crosstalk (bleed between L and R) ---
withCrosstalk(l, r) = l + r * crosstalk * 0.3,
                      r + l * crosstalk * 0.3;

// --- Per-channel processing chain ---
processL(x) = x : saturate : delayL : +(hissL * mix);
processR(x) = x : saturate : delayR : +(hissR * mix);

// --- Dry/wet blend ---
channelL(x) = x * (1 - mix) + processL(x) * mix;
channelR(x) = x * (1 - mix) + processR(x) * mix;

process = channelL, channelR : withCrosstalk;