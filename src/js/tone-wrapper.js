import * as Tone from 'tone';
import { urls } from '../js/samples.js';
import { Key } from './classes.js';
import { barsToSeconds, secondsToBars } from '../js/utility.js';


const synths = {};
let lastSynth = '';

async function loadSynth(identifier) {
  if (!synths[identifier]) {
    synths[identifier] = new Tone.Sampler({
      urls: urls[identifier],
      release: 1,
      baseUrl: `/samples/${identifier}/`,
    }).toDestination();
    await Tone.loaded();
    lastSynth = identifier;
  }
}

function playKey({ key , synth, start }) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }
  if (!key) return;
  if (key instanceof Key) key = key.fullName;
  if (!start && start !== 0) start = Tone.now();

  lastSynth = synth;
  synths[synth].triggerAttack(key, start);
}

function getEffectStatusAtTime(effects, type, time) {
  const effect = effects[type];
  if (!effect) return {
    start: -1,
    duration: -1,
    value: false,
  };

  for (let i = 0; i < effect.controlPoints.length - 1; i++) {
    const point = effect.controlPoints[i];
    const nextPoint = effect.controlPoints[i + 1];
    if (time >= point.start && time < nextPoint.start) {
      return {
        start: point.start,
        duration: nextPoint.start - point.start,
        value: point.value
      };
    }
  }
  return {
    start: -1,
    duration: -1,
    value: false
  }
}

function playKeyAndStop({ key, synth, start, duration, effects, velocity }) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }
  if (!key) return;
  if (key instanceof Key) key = key.fullName;
  if (!start && start !== 0) start = Tone.now();
  if (!duration) duration = 1;

  lastSynth = synth;
  Tone.Transport.scheduleOnce(time => {
    if (effects) {
      const effect = getEffectStatusAtTime(effects, 'sustain', secondsToBars(start + duration));
      if (effect.value > 0) {
        duration = barsToSeconds(effect.start) + barsToSeconds(effect.duration) - start;
      }
    }
    synths[synth].triggerAttackRelease(key, duration, time, velocity);
  }, start);
}

let pedal = false;
function setPedal(on, start) {
  if (!start) start = Tone.now();

  Tone.Transport.scheduleOnce(time => {
    pedal = on;
  }, start);
}

function stopKey(key, synth, start) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }
  if (!key) return;
  if (key instanceof Key) key = key.fullName;
  if (!start && start !== 0) start = Tone.now();

  lastSynth = synth;
  synths[synth].triggerRelease(key, start);

}

function setVolume(volume, synth) {
  if (!synths[synth]) return;
  volume = volume - 50;
  synths[synth].volume.value = volume;
}

function stopAll() {
  Tone.Transport.cancel();
  Tone.Transport.stop();
  for (const synth in synths) {
    synths[synth].releaseAll();
  }
}

export { loadSynth, playKey, playKeyAndStop, stopKey, stopAll, setVolume }