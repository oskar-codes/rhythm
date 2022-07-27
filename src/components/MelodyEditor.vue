<template>
  <a-modal
    v-model:visible="visible"
    width="100%"
    wrap-class-name="full-modal"
    @ok="handleMelodyCreation"
  >
    <template #title>
      <div>
        <span>Melody Editor</span>
        <a-button @click="play" shape="circle">
          <PauseOutlined v-if="playing" />
          <CaretRightOutlined v-if="!playing" />
        </a-button>
      </div>
    </template>

    <div id="piano">
      <div id="keyboard"></div>
    </div>

    <div class="content" @click="createNote($event)">
      <CanvasSizer ref="melodyCanvas" style="position: fixed;" width="100%" height="100%"></CanvasSizer>
    </div>

  </a-modal>
</template>

<style scoped>
#piano + .content {
  flex: 1;
}
#piano {
  width: 200px;
  background: #ccc;
}

#keyboard {
  transform: rotate(-90deg) translateY(-2080px);
  transform-origin: top right;
}
.key {
  width: 195px;
  height: 45px;
  background: white;
  color: black;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.key[color="black"] {
  background: black;
  color: white;
}
.key:first-of-type {
  margin-top: 5px;
}
</style>

<script>
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons-vue';
import CanvasSizer from './CanvasSizer.vue';
import { urls } from '../samples.js';
import * as Tone from 'tone';
import { Piano } from 'nexusui';

const synths = [];

export default {
  props: ['visible', 'instrument'],
  data() {
    return {
      notes: [],
      playing: false,
      noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (!document.querySelector('[nexus-ui]')) {
          this.$nextTick(() => {
            const piano = new Piano('#keyboard', {
              'size': [1040*2, 200],
              'mode': 'button',  // 'button', 'toggle', or 'impulse'
              'lowNote': 9,
              'highNote': 96
            });
            const that = this;
            piano.on('change',function(v) {
              const octave = Math.floor(v.note / 12);
              const noteIndex = (v.note+12)%12;
              const noteName = that.noteNames[noteIndex];
              const now = Tone.now();
              const instrument = that.instrument;

              if (v.state) {
                synths[instrument].triggerAttack([noteName + octave], now);
              } else {
                synths[instrument].triggerRelease([noteName + octave], now);
              }
            });
          });
        }
      }
    },
    async instrument(val) {
      if (!val) return;
      this.notes = [];

      if (!synths[this.instrument]) {
        this.$emit('loading', true);

        synths[this.instrument] = new Tone.Sampler({
          urls: urls[this.instrument],
          release: 1,
          baseUrl: `/samples/${this.instrument}/`,
        }).toDestination();
        await Tone.loaded();
        
        this.$emit('loading', false);
      }
    }
  },
  methods: {
    handleMelodyCreation() {
      
    },
    play() {
      this.playing = !this.playing;
    },
    createNote(evt) {
      const y = evt.clientY;
      const keys = document.querySelectorAll('#keyboard > div > span');
      let pressed = null;
      let pressedDistance = Infinity;
      for (const key of keys) {
        const keyY = key.getBoundingClientRect().y + key.getBoundingClientRect().height / 2;
        const dist = Math.abs(keyY - y);
        if (dist < pressedDistance) {
          pressedDistance = dist;
          pressed = key;
        }
      }
      const noteIndex = Array.from(keys).indexOf(pressed);
      const octave = Math.floor((noteIndex + 9) / 12);
      const noteName = this.noteNames[(noteIndex + 9)%12];
      this.notes.push({
        start: evt.clientX - 200,
        duration: 8,
        noteName: noteName + octave,
        noteIndex
      });
    }
  },
  components: {
    CaretRightOutlined, PauseOutlined, CanvasSizer
  }
}
</script>