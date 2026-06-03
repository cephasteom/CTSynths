import("stdfaust.lib");

gate = button("gate");

// --- VarLag (snap on gate rising edge) ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Polyphony controls (Faust poly naming convention) ---
freq = varlag(hslider("freq", 440, 20, 20000, 1));
gain = hslider("gain", 1, 0, 1, 0.01) * 0.5;

// --- Per-voice controls ---
pan        = varlag(hslider("pan",    0.5, 0.0, 1.0, 0.001));  // 0=left, 0.5=centre, 1=right
att        = varlag(hslider("att",    0.1, 0.0, 1.0, 0.0001));  // 0=sustain, 1=fast decay
detune     = varlag(hslider("detune", 0.0, 0.0, 1.0, 0.0001));  // 0=in tune, 1=+512 samples offset
exciteSize = hslider("excite",        0.1, 0.0, 1.0, 0.001);   // 0=2 samples, 1=512 samples

a = hslider("a", 1, 0, 5000, 1) * 0.001;
d = hslider("d", 100, 0, 5000, 1) * 0.001;
s = hslider("s", 0.0, 0, 1, 0.01);
r = hslider("r", 300, 0, 10000, 1) * 0.001;

lpf = varlag(hslider("lpfv", 0, 0, 1, 0.001));
hpf = varlag(hslider("hpfv", 0, 0, 1, 0.001));
bpf = varlag(hslider("bpfv", 0, 0, 1, 0.001));
res = varlag(hslider("resv", 0.01, 0, 1, 0.001));

// --- Remap normalised controls to internal ranges ---
detuneSamples = detune * 512.0;
exciteSamples = 2.0 + exciteSize * 510.0;  // 0→2 samples, 1→512 samples

// --- Keyscaling (2^(-0.5) per octave above middle C) ---
nL      = ba.hz2midikey(freq);
ks_sc   = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks_sc * -0.5);

ampL = gain * ksScale;

// --- Envelope ---
env = en.adsr(a, d, s, r, gate);

// --- Excitator ---
leak           = 1.0 / 65536.0;
upfront(x)     = (x - x') > 0.0;
decay_e(n, x)  = x - (x > 0) / n;
release(n)     = + ~ decay_e(n);
excitator      = gate : upfront : release(exciteSamples) : >(0.0) : +(leak);

// --- Noise source gated by excitator ---
excitation = no.noise * excitator;

// --- Resonator ---
period     = ma.SR / max(freq, 1.0);
average(x) = (x + x') / 2;
resonator  = (+ : de.delay(65536, max(0.0, period + detuneSamples - 1.5))) ~ (average : *(1.0 - att));

// --- KS output ---
karpStr = excitation : resonator;

// --- Amplitude & pan ---
angle  = pan * ma.PI / 2.0;
mono   = karpStr * env * ampL * 0.5;
stereo = mono * cos(angle), mono * sin(angle);

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
