import("stdfaust.lib");

freq  = hslider("freq",  440, 20, 20000, 1);
gain  = hslider("gain",  1,   0,  1,     0.01);
gate  = button("gate");

lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

a = hslider("a", 10,  0, 5000,  1) * 0.001;
d = hslider("d", 100, 0, 5000,  1) * 0.001;
s = hslider("s", 0.8, 0, 1,    0.01);
r = varlag(hslider("r", 500, 0, 10000, 1)) * 0.001;

vol   = varlag(hslider("vol",  1,   0, 1,    0.01));
pan   = varlag(hslider("pan",  0.5, 0, 1,    0.01));
angle = pan * ma.PI / 2.0;

// 0 = sine, 1 = saw, 2 = tri, 3 = square
oscType  = hslider("osc",      0,    0, 3,    1)    : int;
drift    = varlag(hslider("drift",    0,    0, 1,    0.01));
modi     = varlag(hslider("modi",     0,    0, 20,   0.01));
harm     = varlag(hslider("harm",     1,    0.01, 16, 0.01));
lforate  = hslider("lforate",  1,    0.01, 20,  0.01);
lfodepth = varlag(hslider("lfodepth", 0,    0, 1,    0.01));

// Mod envelope: scales FM depth over time (AD-style use: set mods=0, modr short)
moda = hslider("moda", 10,  0, 5000, 1) * 0.001;
modd = hslider("modd", 500, 0, 5000, 1) * 0.001;
mods = varlag(hslider("mods", 0,   0, 1,    0.01));
modr = varlag(hslider("modr", 100, 0, 5000, 1)) * 0.001;

// Slow random detuning: smoothed noise up to ±20 Hz at drift=1
driftHz = no.noise : si.smooth(ba.tau2pole(0.5)) * drift * 20;

// Sine LFO for vibrato: ±10% of carrier freq at depth=1
lfoMod = os.osc(lforate) * lfodepth * 0.1;

carrierFreq = varlag(freq) * (1.0 + lfoMod) + driftHz;
modFreq     = carrierFreq * harm;

modenv = en.adsr(moda, modd, mods, modr, gate);

// Standard FM: modulator adds instantaneous frequency deviation of modi * modFreq, scaled by mod envelope
fmDev = os.osc(modFreq) * modi * modFreq * modenv;

osc_wave(f) = select2(oscType >= 3,
                  select2(oscType >= 2,
                      select2(oscType >= 1, os.osc(f), os.sawtooth(f)),
                      os.triangle(f)),
                  os.square(f));

envelope = en.adsr(a, d, s, r, gate) * gain * 0.25;
mono     = osc_wave(carrierFreq + fmDev) * envelope * vol;
process  = mono * cos(angle), mono * sin(angle);
