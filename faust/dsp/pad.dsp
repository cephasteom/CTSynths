import("stdfaust.lib");

// --- Pad: 7 detuned saws spread symmetrically across the stereo field ---
// detune: total spread in cents across all voices
// drift:  per-voice slow random Hz offset amplitude

gate    = button("gate");

// --- VarLag (snap on gate rising edge) ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

// --- Polyphony controls (Faust poly naming convention) ---
freq    = varlag(hslider("freq", 440, 20, 20000, 1));
gain    = hslider("gain", 1, 0, 1, 0.01);



// --- Per-voice controls ---
pan     = varlag(hslider("pan", 0.5, 0, 1, 0.01));
detune  = varlag(hslider("detune", 30, 0, 200, 0.1));   // total spread in cents
drift   = varlag(hslider("drift", 0.5, 0, 10, 0.01));   // per-voice drift in Hz

// --- Envelope ---
a       = hslider("a", 500, 0, 5000, 1) * 0.001;
d       = hslider("d", 0,   0, 5000, 1) * 0.001;
s       = hslider("s", 1.0, 0, 1,    0.01);
r       = hslider("r", 800, 0, 10000, 1) * 0.001;

// --- Filters (matching fm.dsp convention) ---
lpf     = varlag(hslider("lpfv", 0, 0, 1, 0.001));
hpf     = varlag(hslider("hpfv", 0, 0, 1, 0.001));
bpf     = varlag(hslider("bpfv", 0, 0, 1, 0.001));
res     = varlag(hslider("resv", 0.01, 0, 1, 0.001));

// --- Keyscaling ---
nL      = ba.hz2midikey(freq);
ks      = (nL - 60.0) / 12.0;
ksScale = pow(2.0, ks * -0.5);
ampL    = gain * ksScale;

// --- Envelope ---
env     = en.adsr(a, d, s, r, gate);

// --- Supersaw helpers ---

// 2^(cents/1200) pitch ratio
centsRatio(c) = pow(2.0, c / 1200.0);

// Slow per-voice drift LFO — spread rates 0.1..0.5 Hz across voices
driftHz(rate) = no.lfnoiseN(1, rate) * drift;

// One voice → (L sample, R sample)
// pos maps i ∈ 0..6 linearly to -1..1
// Equal-power pan: pos -1 → full left, pos 1 → full right
voice(i, f, det) = saw * panL, saw * panR
with {
    numV        = 7.0;
    pos         = i / (numV - 1.0) * 2.0 - 1.0;    // -1..1
    detuneCents = pos * (det / 2.0);                 // ±det/2 cents
    driftRate   = 0.1 + (i / (numV - 1.0)) * 0.4;  // 0.1..0.5 Hz
    voiceFreq   = max(20.0, f * centsRatio(detuneCents) + driftHz(driftRate));
    saw         = os.sawtooth(voiceFreq);
    panAngle    = (pos + 1.0) * 0.25 * ma.PI;        // 0..π/2
    panL        = cos(panAngle);
    panR        = sin(panAngle);
};

// Faust doesn't have a stereo fold-add, so we sum L and R channels separately.
// Each voice(i,...) expression is shared by the compiler — both the L and R
// extractions reference the same node, so the sawtooth runs once per voice.
sumL = (voice(0, freq, detune) : _, !) +
       (voice(1, freq, detune) : _, !) +
       (voice(2, freq, detune) : _, !) +
       (voice(3, freq, detune) : _, !) +
       (voice(4, freq, detune) : _, !) +
       (voice(5, freq, detune) : _, !) +
       (voice(6, freq, detune) : _, !);

sumR = (voice(0, freq, detune) : !, _) +
       (voice(1, freq, detune) : !, _) +
       (voice(2, freq, detune) : !, _) +
       (voice(3, freq, detune) : !, _) +
       (voice(4, freq, detune) : !, _) +
       (voice(5, freq, detune) : !, _) +
       (voice(6, freq, detune) : !, _);

// --- Master pan (Balance2 equivalent) ---
// balance ∈ -1..1; attenuates opposite side linearly
balance  = pan * 2.0 - 1.0;
masterL  = sumL / 7.0 * max(0.0, 1.0 - balance) * env * ampL;
masterR  = sumR / 7.0 * max(0.0, 1.0 + balance) * env * ampL;

// --- Filters ---
lpfFreq = max(20.0, min(19999.0, pow(20000.0, 1.0 - lpf) * pow(20.0, lpf)));
hpfFreq = max(20.0, min(19999.0, pow(20.0,    1.0 - hpf) * pow(20000.0, hpf)));
bpfFreq = max(20.0, min(19999.0, pow(20.0,    1.0 - bpf) * pow(20000.0, bpf)));
safeRes = pow(40.0, res) * 0.5;

lpfSVF(x) = fi.svf.lp(lpfFreq, safeRes, x);
hpfSVF(x) = fi.svf.hp(hpfFreq, safeRes, x);
bpfSVF(x) = fi.svf.bp(bpfFreq, safeRes, x);

withLPF(l, r) = select2(lpf > 0, l, lpfSVF(l)),
                select2(lpf > 0, r, lpfSVF(r));
withHPF(l, r) = select2(hpf > 0, l, hpfSVF(l)),
                select2(hpf > 0, r, hpfSVF(r));
withBPF(l, r) = select2(bpf > 0, l, bpfSVF(l)),
                select2(bpf > 0, r, bpfSVF(r));

process = masterL, masterR : withLPF : withHPF : withBPF;
