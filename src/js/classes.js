/*

Project: {
  name: String,
  bars: Number,
  bpm: Number,
  tracks: [{
    name: String,
    volume: Number,
    instrument: {
      name: String,
      identifier: String
    },
    melodies: [{
      start: Number,
      bars: Number,
      notes: [{
        start: Number,
        duration: Number,
        key: {
          name: String,
          octave: Number
        }
      }]
    }],
    effects: [{
      type: String,
      controlPoints: [{
        start: Number,
        value: Number | Boolean
      }]
    }]
  }]
}

*/

/**
 * Class representing a Track
 * @class
 */
class Track {
  /**
   * @param {String} name
   * @param {Instrument} instrument
   * @param {Number} volume - between 0 and 100
   * @param {Melody[]} melodies
   */
  constructor({name, instrument, volume, melodies}) {
    this.name = name;
    this.instrument = instrument;
    this.volume = volume;
    this.melodies = [];
    if (melodies) this.melodies = melodies;
  }
  get identifier() {
    return this.melodies.map(melody => melody.identifier).join(',') + this.name + this.volume;
  }
  copy() {
    return new Track({
      name: this.name,
      instrument: this.instrument,
      volume: this.volume,
      melodies: this.melodies.map(melody => melody.copy())
    });
  }
}

/**
 * Class representing an Instrument
 * @class
 */
class Instrument {
  /**
   * @param {String} name
   * @param {String} identifier
   */
  constructor({name, identifier}) {
    this.name = name;
    this.identifier = identifier;
  }
  copy() {
    return new Instrument({
      name: this.name,
      identifier: this.identifier
    });
  }
}

/**
 * Class representing a Melody
 * @class
 */
class Melody {
  /**
   * @param {Note[]} notes
   * @param {Effect{}} effects
   * @param {Number} start - in bars
   * @param {Number} bars
   */
  constructor({ notes, effects, start, bars }) {
    this.notes = notes ?? [];
    this.effects = effects ?? [];
    this.start = start ?? 0;
    this.bars = bars ?? 4;
  }
  get identifier() {
    return this.notes.map(e => e.identifier).join('') + this.start + this.bars;
  }
  copy() {
    return new Melody({
      start: this.start,
      bars: this.bars,
      notes: this.notes.map(e => e.copy()),
      effects: this.effects.map(e => e.copy())
    })
  }
}

/**
 * Class representing a Note
 * @class
 */
class Note {
  /**
   * @param {Key} key
   * @param {Number} start - in bars
   * @param {Number} duration - in bars
   */
  constructor({ key, start, duration, velocity }) {
    this.key = key;
    this.start = start;
    this.duration = duration;
    this.velocity = velocity ?? 1;
  }
  get identifier() {
    return this.key.fullName + this.start.toString() + this.duration.toString();
  }
  copy() {
    return new Note({
      key: this.key.copy(),
      start: this.start,
      duration: this.duration
    })
  }
}

/**
 * Class representing a Key
 * @class
 */
class Key {
  /**
   * @param {String} name
   * @param {Number} octave
   * @param {String} fullName
   */
  constructor(name, octave) {
    this.name = name;
    this.octave = octave;
  }
  get fullName() {
    return this.name + this.octave.toString();
  }
  copy() {
    return new Key(this.name, this.octave);
  }
}

/**
 * Class representing an effect
 * @class
 */

class Effect {
  /**
   * @param {String} type
   * @param {ControlPoint[]} controlPoints
   */
  constructor({ type, controlPoints }) {
    this.type = type;
    this.controlPoints = controlPoints ?? [];
  }
  copy() {
    return new Effect({
      type: this.type,
      controlPoints: this.controlPoints.map(e => e.copy())
    })
  }
}

/**
 * Class representing an effect control point
 * @class
 */
class ControlPoint {
  /**
   * @param {Number} start - in bars
   * @param {Number | Boolean} value
   */
  constructor({ start, value }) {
    this.start = start;
    this.value = value;
  }
  copy() {
    return new ControlPoint({
      start: this.start,
      value: this.value
    })
  }
}

export { Track, Instrument, Melody, Note, Key, Effect, ControlPoint };