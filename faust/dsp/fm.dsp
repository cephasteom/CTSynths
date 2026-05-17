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

lpf     = varlag(hslider("lpfv", 0, 0, 1, 0.001));
hpf     = varlag(hslider("hpfv", 0, 0, 1, 0.001));
bpf     = varlag(hslider("bpfv", 0, 0, 1, 0.001));
res     = varlag(hslider("resv", 0.01, 0, 1, 0.001));

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
angle   = pan * ma.PI / 2.0;
mono    = car * env * ampL * 0.5;
stereo  = mono * cos(angle), mono * sin(angle);

// --- Filters ---
lpfFreq = max(20.0, min(19999.0, pow(20000.0, 1.0 - lpf) * pow(20.0, lpf)));
hpfFreq = max(20.0, min(19999.0, pow(20.0,    1.0 - hpf) * pow(20000.0, hpf)));
bpfFreq = max(20.0, min(19999.0, pow(20.0,    1.0 - bpf) * pow(20000.0, bpf)));
safeRes = pow(40.0, res) * 0.5;  // 0→0.5, 1→20

lpfSVF(x) = fi.svf.lp(lpfFreq, safeRes, x);
hpfSVF(x) = fi.svf.hp(hpfFreq, safeRes, x);
bpfSVF(x) = fi.svf.bp(bpfFreq, safeRes, x);

withLPF(l, r) = select2(lpf > 0, l, lpfSVF(l)),
                select2(lpf > 0, r, lpfSVF(r));

withHPF(l, r) = select2(hpf > 0, l, hpfSVF(l)),
                select2(hpf > 0, r, hpfSVF(r));

withBPF(l, r) = select2(bpf > 0, l, bpfSVF(l)),
                select2(bpf > 0, r, bpfSVF(r));

process = stereo : withLPF : withHPF : withBPF;