import("stdfaust.lib");

// --- Controls ---
n       = hslider("n", 60, 0, 127, 1);
harm    = hslider("harm", 2.0, 0.1, 16.0, 0.01);
modi    = hslider("modi", 3.0, 0, 20.0, 0.01);
amp     = hslider("amp", 0.5, 0, 1, 0.01);
pan     = hslider("pan", 0.5, 0, 1, 0.01);
gate    = button("gate");

lagtime = hslider("lag", 0, 0, 10000, 1) * 0.001;

a       = hslider("a", 10, 0, 5000, 1) * 0.001;
d       = hslider("d", 100, 0, 5000, 1) * 0.001;
s       = hslider("s", 0.7, 0, 1, 0.01);
r       = hslider("r", 300, 0, 10000, 1) * 0.001;

moda    = hslider("moda", 0, 0, 5000, 1) * 0.001;
modd    = hslider("modd", 100, 0, 5000, 1) * 0.001;
mods    = hslider("mods", 1.0, 0, 1, 0.01);
modr    = hslider("modr", 500, 0, 10000, 1) * 0.001;

lpf     = hslider("lpf", 0, 0, 1, 0.001);
hpf     = hslider("hpf", 0, 0, 1, 0.001);
bpf     = hslider("bpf", 0, 0, 1, 0.001);
res     = hslider("res", 1.0, 0.01, 100.0, 0.01);

// --- VarLag (snap on gate rising edge) ---
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Derived values ---
nL      = varlag(n);
freq    = ba.midikey2hz(nL);
ks      = (nL - 60.0) / 12.0;          // octaves above/below middle C
ksScale = pow(2.0, ks * -0.5);         // 2^(-0.5) per octave above C4

ampL    = varlag(amp) * ksScale;
modIdx  = varlag(modi) * ksScale * ampL;
panL    = varlag(pan);

// --- Envelopes ---
modEnv  = en.adsr(moda, modd, mods, modr, gate);
env     = en.adsr(a, d, s, r, gate);

// --- FM core ---
modSig  = os.osc(freq * harm) * freq * modIdx * modEnv;
car     = os.oscrc(freq + modSig);     // os.oscrc resets phase on note-on

// --- Amplitude & pan ---
angle   = panL * ma.PI / 2.0;
mono    = car * env * ampL * 0.5;
stereo  = mono * cos(angle), mono * sin(angle);

// --- Filters (bypass when param = 0) ---
lpfFreq = pow(20000.0, 1.0 - lpf) * pow(20.0, lpf);
hpfFreq = pow(20.0,    1.0 - hpf) * pow(20000.0, hpf);
bpfFreq = pow(20.0,    1.0 - bpf) * pow(20000.0, bpf);

withLPF(l, r) = select2(lpf > 0, l, fi.lowpass(4, lpfFreq, l)),
                select2(lpf > 0, r, fi.lowpass(4, lpfFreq, r));

withHPF(l, r) = select2(hpf > 0, l, fi.highpass(4, hpfFreq, l)),
                select2(hpf > 0, r, fi.highpass(4, hpfFreq, r));

withBPF(l, r) = select2(bpf > 0, l, fi.bandpass(4, bpfFreq/res, bpfFreq*res, l)),
                select2(bpf > 0, r, fi.bandpass(4, bpfFreq/res, bpfFreq*res, r));

process = stereo : withLPF : withHPF : withBPF;