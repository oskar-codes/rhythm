<template>
  <a-modal
    v-model:visible="visible"
    width="100%"
    wrap-class-name="full-modal"
    @ok="handleMelodyCreation"
    @cancel="cancel"
  >
    <template #title>
      <div>
        <a-space>
          <span>Melody Editor</span>
          <a-button @click="play" shape="circle">
            <PauseOutlined v-if="playing" />
            <CaretRightOutlined v-if="!playing" />
          </a-button>
        </a-space>
      </div>
    </template>

    <div class="container">
      <div id="piano" ref="piano">

        <div class="key"
          v-for="key, i in allKeys"
          @mousedown="pressKey(key, $event.target)"
          :key="i"
          :color="key.name.includes('#') ? 'black' : 'white'">
          <span>{{ key.name }}{{ key.octave }}</span>
        </div>

      </div>

      <div class="content">
        <div class="notes-container">
          <div class="note-track"
            v-for="key, i in allKeys"
            :key="i"
            :color="key.name.includes('#') ? 'black' : 'white'"
            @click="createNote($event, key)"
            :style="{ width: width + 'px' }">
          </div>

          <div class="note-elements">
            <Note
              v-model:note="melody.notes[i]"
              @delete="deleteNote(note)"
              :scale="scale"
              :bars="melody.bars"
              v-for="note,i in melody.notes"
              :key="note.identifier"
              :preferences="preferences">
            </Note>
          </div>
        </div>
      </div>

    </div>
    
    <div class="canvas-wrapper">
      <CanvasSizer ref="canvas" width="100%" height="100%"></CanvasSizer>
    </div>

  </a-modal>
</template>

<style>
.full-modal .ant-modal-body {
  flex: 1;
  padding: 0;
  position: relative;
  height: auto;
  overflow-y: scroll;
}
.ant-modal-root {
  --y-scale: 50px;
}
</style>

<style scoped>
.container {
  width: 100%;
  display: flex;
}
#piano {
  width: 200px;
  background: #ccc;
  margin-top: 50px;
}
.content {
  flex: 1;
  position: relative;
  overflow-x: scroll;
}
.canvas-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  pointer-events: none;
}
.canvas-wrapper canvas {
  position: fixed;
  pointer-events: none;
}
.content .notes-container {
  margin-top: 50px;
}
.content .notes-container .note-elements {
  position: absolute;
  top: 0;
  margin-top: 50px;
}
.content .note-track {
  height: var(--y-scale);
  border-top: 1px solid black;
  border-right: 1px solid black;
  background: #efefef;
  position: relative;
  user-select: none;
  -ms-touch-action: none;
  touch-action: none;
}
.content .note-track[color='black'] {
  background: #d0d0d0;
}
.content .note-track:hover {
  background: #bbb;
}
.key {
  width: 100%;
  height: var(--y-scale);
  background: white;
  color: black;
  display: flex;
  align-items: center;
  border-top: 1px solid black;
  border-right: 1px solid black;
}
.key[color="black"] {
  background: black;
  color: white;
}
.key:hover {
  background: #ddd;
}
.key.active {
  background: #ccc;
}
.key[color='black']:hover {
  background: #666;
}
.key[color='black'].active {
  background: #555;
}
</style>

<script>
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons-vue';
import CanvasSizer from './CanvasSizer.vue';
import Note from './Note.vue';
import { Track, Instrument, Melody, Note as N, Key } from '../js/classes.js';
import { allKeys, delay } from '../js/utility.js';
import { SimpleCanvas } from '../js/simple-canvas.js';
import { loadSynth, playKey, playKeyAndStop, stopKey, stopAll } from '../js/tone-wrapper.js';
import * as Tone from 'tone';

export default {
  props: ['track', 'melody', 'visible', 'preferences', 'bpm'],
  emits: ['update:visible', 'update:melody', 'done', 'cancel', 'loading'],
  data() {
    return {
      resizeOption: {
        edges: { left: true, right: true, bottom: true, top: true }
      },
      playedNotes: [],
      playing: false,
      scale: {
        x: 400,
        y: 50
      },
      cursor: 0,
      allKeys,
      firstOpened: true
    }
  },
  computed: {
    width() {
      return this.scale.x * this.melody.bars;
    }
  },
  watch: {
    async track(val) {
      if (!val) return;

      this.$emit('loading', true);
      
      await loadSynth(this.track.instrument.identifier);
      
      this.$emit('loading', false);
    },
    'scale.y': {
      handler() {
        document.querySelector('.ant-modal-root').style.setProperty('--y-scale', `${this.scale.y}px`);
      }
    },
    melody: {
      handler() {
        
      },
      deep: true
    },
    visible(val) {
      if (val && this.firstOpened) this.start();
    }
  },
  methods: {
    start() {
      this.firstOpened = false;
      this.$nextTick(() => {
        const canvas = this.$refs.canvas.$el;
        const ctx = canvas.getContext('2d');
        const sc = SimpleCanvas.setupCanvas(ctx);

        addEventListener('keydown' , e => {
          if (e.code === 'Space' && document.activeElement === document.body) this.play();
          if (e.code === 'AltLeft') e.preventDefault();
        });
        
        document.querySelector('.ant-modal-body').addEventListener('wheel', e => {
          if (sc.btn('ALT')) e.preventDefault();
        });

        let movingCursor = false;

        sc.update = delta => {
          const { btn, getscrolldelta, width, height } = sc;

          sc.cls();

          if (btn('ALT')) {
            if (btn('SHIFT')) {
              this.scale.y += getscrolldelta() / 10;
            } else {
              this.scale.x += getscrolldelta() / 5;
            }
            this.scale.x = Math.max(100, Math.min(800, this.scale.x));
            
            this.scale.y = Math.max(25, Math.min(100, this.scale.y));
          }

          sc.rectfill(0, 0, width(), 50, '#eee');

          const offset = document.querySelector('.container > .content')?.scrollLeft;
          if (offset === undefined) return;
          for (let i = 1; i <= this.melody.bars; i++) {
            const x = i * this.scale.x + 200 - offset;
            if (x + this.scale.x < 0) continue;
            if (x - this.scale.x > width()) break;


            for (let j = 1; j < 4; j++) {
              const x2 = x + j * this.scale.x / 4 - this.scale.x;
              sc.line(x2, 25, x2, 50, '#aaa');
            }

            sc.line(x, 0, x, height(), '#aaa');
            sc.text(i, x-this.scale.x+3, 17, '#aaa');
          }
          const x = this.cursor * this.scale.x + 200 - offset;
          sc.line(x, 0, x, height(), '#555');
          sc.rectfill(x-5, 0, 10, 50, '#555');

          sc.clearrect(0, 50, 200, height() - 50);
          sc.rectfill(0, 0, 195, 50, '#eee');

          if (sc.mousedown() && !movingCursor) {
            if (sc.mouse()[1] <= 50 && sc.mouse()[1] > 0 && sc.mouse()[0] > 200) {
              movingCursor = true;
              this.playing = false;
            }
          }

          if (movingCursor) {
            this.cursor = (sc.mouse()[0] + offset - 200) / this.scale.x;
          }
          if (!sc.mousedown()) movingCursor = false;
          if (this.cursor <= 0) this.cursor = 0;
          if (this.playing) {
            const advance = (delta * this.bpm) / 240000;
            this.cursor += advance;
          }
          if (this.cursor > this.melody.bars) {
            this.playing = false;
            this.cursor = this.melody.bars;
            stopAll();
          }
        }
      });
    },
    handleMelodyCreation() {
      this.$emit('done');
      this.$emit('melody', this.melody);
      this.reset();
      this.$emit('update:visible', false);
    },
    cancel() {
      this.reset();
      this.$emit('cancel');
      this.$emit('update:visible', false);
    },
    reset() {
      this.playing = false;
      this.cursor = 0;
    },
    play() {

      if (!this.visible) return;

      if (!this.playing) {
        for (const note of this.melody.notes) {
          if (note.time < this.cursor) continue;
          const start = (note.start - this.cursor) / this.bpm * 60 * 4;
          const duration = note.duration / this.bpm * 60 * 4;
          playKeyAndStop({
            key: note.key,
            instrument: this.track.instrument.identifier,
            start,
            duration
          });
        }
        Tone.Transport.start();
      } else {
        stopAll();
      }

      this.playing = !this.playing;
      if (this.playing && this.cursor >= this.melody.bars) this.cursor = 0;
    },
    pressKey(key, target) {

      if (!this.track) return;

      playKey({
        key,
        synth: this.track.instrument.identifier
      });
      if (target) target.classList.add('active');
    },
    releaseKey(key) {

      if (!this.track) return;
      stopKey(key instanceof Key ? [key.fullName] : allKeys.map(e => e.fullName), this.track.instrument.identifier);
      
      const active = document.querySelectorAll('.key.active');
      active.forEach(e => e.classList.remove('active'));
    },
    filterNotes(note) {
      return this.melody.notes.filter(e => e.note.name === note.name && e.note.octave === note.octave);
    },
    async createNote(event, key) {
      const y = document.querySelector('.canvas-wrapper canvas').getBoundingClientRect().y + 50;
      if (event.clientY < y) return;
      if (!event.target.classList.contains('note-track')) return;
      this.pressKey(key);
      this.melody.notes.push(new N({
        start: (event.clientX - 200 + document.querySelector('.container > .content').scrollLeft)/this.scale.x,
        duration: 0.25,
        key
      }));
      await delay(100);
      this.releaseKey(key);
    },
    deleteNote(note) {
      const index = this.melody.notes.findIndex(e => e.identifier === note.identifier);
      this.melody.notes.splice(index, 1);
    },
  },
  mounted() {
    addEventListener('mouseup', _ => {
      if (this.visible) this.releaseKey();
    });
  },
  components: {
    CaretRightOutlined, PauseOutlined, CanvasSizer, Note
  }
}
</script>