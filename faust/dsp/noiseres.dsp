import("stdfaust.lib");

freq = hslider("freq", 440, 20, 20000, 1);
gain = hslider("gain", .75, 0, 1, 0.01);
gate = button("gate");

// --- VarLag ---
lagtime      = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
gate_trigger = gate > gate';
lagpole      = select2(gate_trigger, exp(-1.0 / max(lagtime * ma.SR, 1.0)), 0.0);
varlag(x)    = x : si.smooth(lagpole);

pan = varlag(hslider("pan", 0.5, 0, 1, 0.01));

// --- Amp envelope ---
a   = hslider("a", 500, 0, 5000, 1) * 0.001;
d   = hslider("d", 0,   0, 5000, 1) * 0.001;
s   = hslider("s", 1.0, 0, 1,    0.01);
r   = hslider("r", 800, 0, 10000, 1) * 0.001;

env = en.adsr(a, d, s, r, gate);

// --- Filter envelope ---
fila = hslider("fila", 500, 0, 5000, 1) * 0.001;
fild = hslider("fild", 0,   0, 5000, 1) * 0.001;
fils = hslider("fils", 1.0, 0, 1,    0.01);
filr = hslider("filr", 800, 0, 10000, 1) * 0.001;

filenv = en.adsr(fila, fild, fils, filr, gate);

// --- Keyscaling ---
midiNote = ba.hz2midikey(freq);
ks       = (midiNote - 60.0) / 12.0;
ksGain   = pow(2.0, ks * -0.5);
ksQ      = pow(2.0, ks * -0.5) * 1000.0;

// Filter env drives both Q and a gain boost
dynQ    = 1.0 + (ksQ - 1.0) * filenv;
filGain = 0.2 + filenv * 0.8;  // 0.2 at filenv=0, 1.0 at filenv=1

// --- Equal power pan ---
panL = cos(pan * ma.PI * 0.5);
panR = sin(pan * ma.PI * 0.5);

// --- Tremolo
tremelorate  = varlag(hslider("tremelorate",  4.0, 0.1, 20.0, 0.01));
tremolo = varlag(hslider("tremolo", 0.0, 0, 1, 0.01));

// depth=0 → no tremolo, depth=1 → full amplitude modulation
trem = 1.0 - tremolo * (1.0 - os.osc(tremelorate)) * 0.5;

mono = no.noise * 0.01
     : fi.resonbp(freq, dynQ, 0.01)
     : fi.svf.bp(freq, 20);

stereo = mono <: fi.svf.bp(freq * 0.999, 20),
                 fi.svf.bp(freq * 1.001, 20);

process = stereo : *(gain * ksGain * filGain * env * trem * panL), 
                   *(gain * ksGain * filGain * env * trem * panR);