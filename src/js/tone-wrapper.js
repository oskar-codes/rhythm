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

function playKey(key, synth) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }

  lastSynth = synth;
  if (key instanceof Key) key = key.fullName;
  synths[synth].triggerAttack(key);
}

function stopKey(key, synth) {
  if (!synth) {
    if (!lastSynth) return;
    synth = lastSynth;
  }

  lastSynth = synth;
  if (key instanceof Key) key = key.fullName;
  synths[synth].triggerRelease(key);
}

function setVolume(volume, synth) {
  if (!synths[synth]) return;
  volume = volume - 50;
  synths[synth].volume.value = volume;
}

function stopAll() {
  for (const synth in synths) {
    synths[synth].releaseAll();
  }
}

export { loadSynth, playKey, stopKey, stopAll, setVolume }