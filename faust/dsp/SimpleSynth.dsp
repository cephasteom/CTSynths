import("stdfaust.lib");

freq = hslider("freq", 440, 20, 20000, 1);
gain = hslider("gain", 1, 0, 1, 0.01);
gate = button("gate");

lagtime = hslider("lagtime", 0, 0, 10000, 1) * 0.001;

// On gate rising edge, snap smooth filters to current target values (per-voice).
// Active voices are unaffected so their mutations continue normally.
gate_trigger = gate > gate';
lagpole = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x) = x : si.smooth(lagpole);

a = hslider("a", 10, 0, 5000, 1) * 0.001;
d = hslider("d", 100, 0, 5000, 1) * 0.001;
s = hslider("s", 0.8, 0, 1, 0.01);
r = hslider("r", 500, 0, 10000, 1) * 0.001;

vol = varlag(hslider("vol", 1, 0, 1, 0.01));

// Equal-power pan: 0 = full left, 0.5 = centre, 1 = full right
pan = varlag(hslider("pan", 0.5, 0, 1, 0.01));
angle = pan * ma.PI / 2.0;

envelope = en.adsr(a, d, s, r, gate) * gain * 0.25;
mono = os.osc(varlag(freq)) * envelope * vol;
process = mono * cos(angle), mono * sin(angle);
