// @effect
import("stdfaust.lib");

lagtime = hslider("lagtime", 0, 0, 10000, 1) * 0.001;
lagpole = exp(-1.0 / max(lagtime * ma.SR, 1.0));
lag(x)  = x : si.smooth(lagpole);

drive = lag(hslider("drive", 0.5, 0, 1, 0.001));
tone  = lag(hslider("tone",  0.5, 0, 1, 0.001));
mix   = lag(hslider("mix",   0.5, 0, 1, 0.001));

dist   = _ * (1 + drive * 15) : ma.tanh;
toneLP = fi.lowpass(1, 500 + tone * 19500);

channel = _ <: (*(1 - mix)), (dist : toneLP : *(mix)) :> _;

process = channel, channel;
