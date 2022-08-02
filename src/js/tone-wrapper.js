import * as Tone from 'tone';
import { urls } from '../js/samples.js';
import { Key } from './classes.js';
import { allKeys } from '../js/utility.js';


const synths = {};

async function loadSynth(identifier) {
  if (!synths[identifier]) {
    synths[identifier] = new Tone.Sampler({
      urls: urls[identifier],
      release: 1,
      baseUrl: `/samples/${identifier}/`,
    }).toDestination();
    await Tone.loaded();
  }
}

function playKey(synth, key) {
  if (!synths[synth]) return;
  if (key instanceof Key) key = key.fullName;
  synths[synth].triggerAttack(key);
}

function stopKey(synth, key) {
  if (!synths[synth]) return;
  if (key instanceof Key) key = key.fullName;
  synths[synth].triggerRelease(key);
}

function stopAll() {
  for (const synth in synths) {
    synths[synth].releaseAll();
  }
}

export { loadSynth, playKey, stopKey, stopAll }