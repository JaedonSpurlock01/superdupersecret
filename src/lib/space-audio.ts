/**
 * Sound for space mode (see SpaceMode), synthesized with the Web Audio API so
 * there are no audio files to ship or license:
 *
 * - a detonation when the mode opens (sub boom, shockwave, shimmer),
 * - a soft pulse each time a shock front leaves the core,
 * - ambient music: slow pad chords in D minor with a sparse bell melody.
 */

const VOLUME = 0.4;
const CHORD_SECONDS = 14;
const NOTE_SECONDS = CHORD_SECONDS / 8;
/** Matches the gap between the two `.sp-wave` rings in globals.css. */
const PULSE_SECONDS = 5.5;

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

// Dm9, Bbmaj7, Fmaj9, Cadd9: bass note plus an open voicing above it.
const CHORDS = [
  { bass: 38, notes: [57, 62, 64, 65] },
  { bass: 34, notes: [58, 62, 65, 69] },
  { bass: 41, notes: [57, 60, 64, 67] },
  { bass: 36, notes: [55, 60, 62, 64] },
];

// D minor pentatonic, which sits well over all four chords.
const MELODY = [74, 77, 79, 81, 84, 86, 89, 91];

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;

/**
 * Create and resume the AudioContext. Browsers only allow this from inside a
 * user gesture, so call it synchronously from the click or key handler that
 * turns space mode on, before any rendering.
 */
export function primeSpaceAudio() {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;

  if (!context || context.state === "closed") context = new Ctor();
  void context.resume().catch(() => {});
}

export function setSpaceAudioMuted(muted: boolean) {
  if (!context || !masterGain) return;
  masterGain.gain.setTargetAtTime(
    muted ? 0 : VOLUME,
    context.currentTime,
    0.08,
  );
}

/** A few seconds of decaying stereo noise: a cheap, lush reverb tail. */
function createImpulse(audio: AudioContext, seconds: number) {
  const length = Math.floor(audio.sampleRate * seconds);
  const impulse = audio.createBuffer(2, length, audio.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
  }
  return impulse;
}

function createNoise(audio: AudioContext) {
  const length = audio.sampleRate * 2;
  const noise = audio.createBuffer(1, length, audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/**
 * Start everything. Returns a function that fades it out and releases the
 * audio device. Does nothing if audio isn't available.
 */
export function startSpaceAudio(muted: boolean): () => void {
  primeSpaceAudio();
  const audio = context;
  if (!audio) return () => {};

  // --- Output chain: master -> limiter -> speakers ---------------------------
  const master = audio.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  masterGain = master;

  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.4;
  master.connect(limiter).connect(audio.destination);

  // --- Shared effects ---------------------------------------------------------
  const reverb = audio.createConvolver();
  reverb.buffer = createImpulse(audio, 5.5);
  const reverbTone = audio.createBiquadFilter();
  reverbTone.type = "lowpass";
  reverbTone.frequency.value = 4200;
  const reverbLevel = audio.createGain();
  reverbLevel.gain.value = 0.85;
  reverb.connect(reverbTone).connect(reverbLevel).connect(master);

  // Echo for the bells; each repeat comes back darker.
  const echo = audio.createDelay(2);
  echo.delayTime.value = NOTE_SECONDS * 0.375;
  const echoTone = audio.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 2400;
  const echoFeedback = audio.createGain();
  echoFeedback.gain.value = 0.4;
  echo.connect(echoTone).connect(echoFeedback).connect(echo);
  const echoLevel = audio.createGain();
  echoLevel.gain.value = 0.5;
  echoTone.connect(echoLevel);
  echoLevel.connect(master);
  echoLevel.connect(reverb);

  // The pad goes through one slowly opening and closing filter.
  const padFilter = audio.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1100;
  padFilter.Q.value = 0.5;
  const padSweep = audio.createOscillator();
  padSweep.frequency.value = 0.04;
  const padSweepDepth = audio.createGain();
  padSweepDepth.gain.value = 380;
  padSweep.connect(padSweepDepth).connect(padFilter.frequency);
  padSweep.start();
  const padDry = audio.createGain();
  padDry.gain.value = 0.7;
  padFilter.connect(padDry).connect(master);
  const padWet = audio.createGain();
  padWet.gain.value = 0.6;
  padFilter.connect(padWet).connect(reverb);

  const noise = createNoise(audio);

  /** One oscillator with its own gain envelope, wired to `out`. */
  const voice = (
    type: OscillatorType,
    hz: number,
    out: AudioNode,
    start: number,
    stop: number,
  ) => {
    const osc = audio.createOscillator();
    osc.type = type;
    osc.frequency.value = hz;
    const gain = audio.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(stop);
    return { osc, gain: gain.gain };
  };

  // --- Music ------------------------------------------------------------------
  const playChord = (time: number, chord: (typeof CHORDS)[number]) => {
    const attack = 5;
    const release = 6;
    const end = time + CHORD_SECONDS + release;

    const swell = (gain: AudioParam, peak: number) => {
      gain.setValueAtTime(0, time);
      gain.linearRampToValueAtTime(peak, time + attack);
      gain.setValueAtTime(peak, time + CHORD_SECONDS);
      gain.linearRampToValueAtTime(0, end);
    };

    swell(voice("sine", midiToHz(chord.bass), padFilter, time, end).gain, 0.2);
    swell(
      voice("sine", midiToHz(chord.bass + 12), padFilter, time, end).gain,
      0.07,
    );

    for (const note of chord.notes) {
      // Two slightly detuned oscillators per note, for a slow chorus.
      for (const cents of [-7, 7]) {
        const v = voice(
          cents < 0 ? "triangle" : "sine",
          midiToHz(note),
          padFilter,
          time,
          end,
        );
        v.osc.detune.value = cents;
        swell(v.gain, 0.05);
      }
    }
  };

  const playBell = (time: number, note: number, velocity: number) => {
    const out = audio.createGain();
    out.gain.value = velocity;
    out.connect(master);
    out.connect(echo);
    out.connect(reverb);

    const hz = midiToHz(note);
    // Fundamental plus two quieter, faster-fading overtones.
    for (const [ratio, level, seconds] of [
      [1, 0.11, 3.6],
      [2.003, 0.03, 1.8],
      [3.01, 0.012, 0.7],
    ]) {
      const v = voice("sine", hz * ratio, out, time, time + seconds + 0.1);
      v.gain.setValueAtTime(0, time);
      v.gain.linearRampToValueAtTime(level, time + 0.012);
      v.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
    }
  };

  // --- Sound effects ----------------------------------------------------------
  /** Band of noise whose pitch and level follow the given envelopes. */
  const noiseSweep = (
    time: number,
    seconds: number,
    shape: (frequency: AudioParam, gain: AudioParam) => void,
    dry: number,
    wet: number,
  ) => {
    const source = audio.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    const gain = audio.createGain();
    gain.gain.value = 0;
    shape(band.frequency, gain.gain);
    source.connect(band).connect(gain);
    const toDry = audio.createGain();
    toDry.gain.value = dry;
    gain.connect(toDry).connect(master);
    const toWet = audio.createGain();
    toWet.gain.value = wet;
    gain.connect(toWet).connect(reverb);
    source.start(time);
    source.stop(time + seconds + 0.1);
  };

  /** The supernova going off, once, as the mode opens. */
  const detonate = (time: number) => {
    // Sub boom: a sine that drops in pitch as it dies away.
    const boom = voice("sine", 110, master, time, time + 3.6);
    boom.osc.frequency.setValueAtTime(110, time);
    boom.osc.frequency.exponentialRampToValueAtTime(32, time + 1.5);
    boom.gain.setValueAtTime(0, time);
    boom.gain.linearRampToValueAtTime(0.75, time + 0.015);
    boom.gain.exponentialRampToValueAtTime(0.0001, time + 3.5);

    // Shockwave: noise that rushes up, then falls away into the reverb.
    noiseSweep(
      time,
      4.5,
      (frequency, gain) => {
        frequency.setValueAtTime(140, time);
        frequency.exponentialRampToValueAtTime(2600, time + 0.7);
        frequency.exponentialRampToValueAtTime(380, time + 4);
        gain.setValueAtTime(0, time);
        gain.linearRampToValueAtTime(0.32, time + 0.3);
        gain.exponentialRampToValueAtTime(0.0001, time + 4.5);
      },
      0.6,
      0.9,
    );

    // Shimmer: high partials of the home chord, fading in after the blast.
    const shimmer = audio.createGain();
    shimmer.gain.value = 1;
    shimmer.connect(reverb);
    const shimmerDry = audio.createGain();
    shimmerDry.gain.value = 0.35;
    shimmer.connect(shimmerDry).connect(master);
    [86, 93, 98, 101, 105].forEach((note, i) => {
      const start = time + 0.25 + i * 0.16;
      const v = voice("sine", midiToHz(note), shimmer, start, start + 6.1);
      v.osc.detune.value = (i % 2 ? 1 : -1) * 5;
      v.gain.setValueAtTime(0, start);
      v.gain.linearRampToValueAtTime(0.022, start + 0.9);
      v.gain.exponentialRampToValueAtTime(0.0001, start + 6);
    });
  };

  /** A shock front leaving the core: a low throb and a passing breath of air. */
  const pulse = (time: number) => {
    const throb = voice("sine", 62, master, time, time + 2.1);
    throb.osc.frequency.setValueAtTime(62, time);
    throb.osc.frequency.exponentialRampToValueAtTime(44, time + 1.2);
    throb.gain.setValueAtTime(0, time);
    throb.gain.linearRampToValueAtTime(0.2, time + 0.06);
    throb.gain.exponentialRampToValueAtTime(0.0001, time + 2);

    noiseSweep(
      time,
      4,
      (frequency, gain) => {
        frequency.setValueAtTime(420, time);
        frequency.exponentialRampToValueAtTime(1500, time + 1.6);
        frequency.exponentialRampToValueAtTime(700, time + 4);
        gain.setValueAtTime(0, time);
        gain.linearRampToValueAtTime(0.045, time + 1.3);
        gain.exponentialRampToValueAtTime(0.0001, time + 4);
      },
      0.5,
      1,
    );
  };

  // --- Scheduler --------------------------------------------------------------
  // Events are queued on the audio clock a little ahead of time, so timing
  // doesn't depend on how punctual the timer is.
  const start = audio.currentTime + 0.05;
  detonate(start);

  let chordAt = start + 0.8;
  let chordIndex = 0;
  let noteAt = start + 7;
  let slot = 0;
  let degree = 3;
  let pulseAt = start + PULSE_SECONDS;

  const schedule = () => {
    const horizon = audio.currentTime + 1.5;

    while (chordAt < horizon) {
      playChord(chordAt, CHORDS[chordIndex % CHORDS.length]);
      chordAt += CHORD_SECONDS;
      chordIndex += 1;
    }

    while (noteAt < horizon) {
      // Notes land on the beat more often than off it, and the melody moves
      // by step rather than leaping, which keeps it singable.
      const rest = slot % 2 === 0 ? 0.25 : 0.6;
      if (Math.random() > rest) {
        const steps = [-2, -1, -1, 1, 1, 2];
        degree += steps[Math.floor(Math.random() * steps.length)];
        degree = Math.max(0, Math.min(MELODY.length - 1, degree));
        playBell(
          noteAt + Math.random() * 0.03,
          MELODY[degree],
          0.55 + Math.random() * 0.45,
        );
      }
      noteAt += NOTE_SECONDS;
      slot += 1;
    }

    while (pulseAt < horizon) {
      pulse(pulseAt);
      pulseAt += PULSE_SECONDS;
    }
  };

  schedule();
  const timer = window.setInterval(schedule, 250);

  // Don't keep playing in a background tab.
  const onVisibility = () => {
    if (audio.state === "closed") return;
    if (document.hidden) void audio.suspend();
    else void audio.resume();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    if (context === audio) context = null;
    if (masterGain === master) masterGain = null;
    if (audio.state === "closed") return;

    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(0, audio.currentTime, 0.1);
    window.setTimeout(() => void audio.close().catch(() => {}), 600);
  };
}
