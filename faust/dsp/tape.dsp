// @effect
import("stdfaust.lib");

// --- Lag ---
lagtime = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
lagpole = exp(-1.0 / max(lagtime * ma.SR, 1.0));
varlag(x) = x : si.smooth(lagpole);

// --- Controls ---
mix      = varlag(hslider("mix",      0,    0, 1, 0.001));
hiss     = varlag(hslider("hiss",     0.5,  0, 1, 0.001));
sat      = varlag(hslider("sat",      0,    0, 1, 0.001));
wow      = varlag(hslider("wow",      0,    0, 1, 0.001));
flutter  = varlag(hslider("flutter",  0,    0, 1, 0.001));
crosstalk= varlag(hslider("xtalk",    0,    0, 1, 0.001));

// --- Envelope follower ---
attackTime  = hslider("attackTime",  50,  10, 1000, 1) * 0.001;
releaseTime = hslider("releaseTime", 500, 10, 5000, 1) * 0.001;
threshold   = hslider("threshold",   0.01, 0, 1,    0.001);

releasePole = exp(-1.0 / max(releaseTime * ma.SR, 1.0));

envFollowAR(x) = abs(x) : ba.peakholder(ba.sec2samp(attackTime))
                         : si.smooth(releasePole);

signalEnv(l, r) = max(envFollowAR(l), envFollowAR(r));

autoMix(l, r) = mix * (signalEnv(l, r) > threshold : si.smooth(releasePole));

// --- Hiss (independent per channel) ---
hissL = no.noise * hiss * 0.1 : fi.highpass(1, 4000);
hissR = no.noise * hiss * 0.1 : fi.highpass(1, 4000);

// --- Saturation ---
drive(x)    = x * (1.0 + sat * 4.0);
saturate(x) = ma.tanh(drive(x)) / max(ma.tanh(drive(1.0)), 0.001);

// --- Wow & Flutter ---
wowLFO     = os.lf_triangle(0.5 + wow * 1.5) * wow * 0.003;
flutterLFO = os.lf_triangle(8.0 + flutter * 4.0) * flutter * 0.001
           + no.noise * flutter * 0.0005;

modL = wowLFO + flutterLFO;
modR = wowLFO * 0.97 + flutterLFO * 1.03;

centerDelay = 256.0;
delayL(x) = x : de.fdelay(1024, centerDelay + modL * 512.0);
delayR(x) = x : de.fdelay(1024, centerDelay + modR * 512.0);

// --- Crosstalk ---
withCrosstalk(l, r) = l + r * crosstalk * 0.3,
                      r + l * crosstalk * 0.3;

// --- Per-channel chain ---
processL(x) = x : saturate : delayL : +(hissL * mix);
processR(x) = x : saturate : delayR : +(hissR * mix);

// --- Dry/wet with automix ---
channelL(x, am) = x * (1 - am) + processL(x) * am;
channelR(x, am) = x * (1 - am) + processR(x) * am;

process(l, r) = channelL(l, am), channelR(r, am) : withCrosstalk
    with { am = autoMix(l, r); };