import * as Tone from 'tone';
import { urls } from '../js/samples.js';
import { Key } from './classes.js';
import { allKeys } from '../js/utility.js';


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

function playKeyAndStop({ key , synth, start, duration }) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }
  if (!key) return;
  if (key instanceof Key) key = key.fullName;
  if (!start && start !== 0) start = Tone.now();
  if (!duration) duration = 1/8;

  lastSynth = synth;
  Tone.Transport.scheduleOnce(time => {
    synths[synth].triggerAttackRelease(key, duration, time);
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