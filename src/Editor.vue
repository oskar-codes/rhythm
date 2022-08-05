<script setup>
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, set } from 'firebase/database';
import { auth, db } from './js/cloud.js';
import { useRouter } from 'vue-router';
import { ref as reactive } from 'vue';
import { Track, Instrument, Melody as M, Key, Note } from './js/classes.js';
const router = useRouter();

const user = reactive(await new Promise(resolve => {
  onAuthStateChanged(auth, resolve);
}));

if (!user.value) router.push('/login');
const id = router.currentRoute.value.params.pathMatch[0];

const project = reactive(
  (await get(
    ref(db, `users/${user.value.uid}/projects/${id}`)
  )).val()
);

if (project.value) {
  if (!project.value.tracks) project.value.tracks = [];
  
  project.value.tracks = project.value.tracks.map(track => {
    if (!track.melodies) track.melodies = [];

    return new Track(
      {
        name: track.name,
        volume: track.volume,
        instrument: new Instrument({...track.instrument}),
        melodies: track.melodies.map(melody => {
          if (!melody.notes) melody.notes = [];
          return new M({
            notes: melody.notes.map(note => new Note({
              key: new Key(note.key.name, note.key.octave),
              start: note.start,
              duration: note.duration
            })),
            start: melody.start,
            bars: melody.bars
          }
          );
        })
      })
  });

  for (const track of project.value.tracks) {
    if (!track.melodies) track.melodies = [];
  }
} else {
  router.push('/projects');
}

const defaultPreferences = {
  autoSave: true,
  invertScroll: false,
  lockNotes: true,
  previewNotes: true
}
const editor = reactive(
  {
    preferences: (await get(
      ref(db, `users/${user.value.uid}/preferences/`)
    )).val() ?? defaultPreferences,
    cursor: 0,
    scale: 100,
    x: 0,
    y: 0
  }
);
</script>

<template>
  <main>

    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="project.name"
      @back="$router.push('/projects')"
    >
      <template #extra>
        <a-button @click="saveProject">Save Project</a-button>
        <a-input-number style="width: 120px" v-model:value="project.bpm" :min="5" :max="600" addon-after="bpm" />
        <a-button @click="play" shape="circle">
          <PauseOutlined v-if="playing" />
          <CaretRightOutlined v-if="!playing" />
        </a-button>
      </template>
    </a-page-header>
    
    <div class="editor">

      <div class="side" ref="side">

        <div class="tools">
          <a-dropdown :trigger="['click']">
            <a-button>
              <template #icon>
                <PlusOutlined />
              </template>
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="addTrack">Track</a-menu-item>
                <a-sub-menu title="Bars">
                  <a-menu-item v-for="i in [1,2,4,8]" :key="i" @click="project.bars += i">Add {{ i }}</a-menu-item>
                </a-sub-menu>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button @click="openSettings = true">
            <template #icon>
              <SettingOutlined />
            </template>
          </a-button>
        </div>

        <div v-for="track, i in project.tracks" :key="track.name" class="track">

          <div class="details">
            <span :title="`${track.name} (${track.instrument.name})`">{{ track.name }} ({{ track.instrument.name }})</span>
            <div>
              <a-dropdown :trigger="['click']">
                <a-tooltip>
                  <template #title>Add Melody</template>
                  <a-button shape="circle" ><template #icon><PlusOutlined /></template></a-button>
                </a-tooltip>
                <template #overlay>
                  <a-menu>
                    <a-sub-menu title="Melody Editor">
                      <a-menu-item @click="addMelody(track, bars)" v-for="bars in [1,2,4,8]" :key="bars">{{ bars }} bars</a-menu-item>
                    </a-sub-menu>
                    <a-sub-menu title="Midi File">
                      <a-menu-item @click="uploadMidi(track)">Upload File</a-menu-item>
                      <a-menu-item>Record File</a-menu-item>
                    </a-sub-menu>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-tooltip>
                <template #title>Delete Track</template>
                <a-button shape="circle" @click="removeTrack(i)"><template #icon><DeleteOutlined /></template></a-button>
              </a-tooltip>
            </div>
          </div>

          <div class="settings">
            <a-slider 
              v-model:value="track.volume"
              :tip-formatter="val => 'Volume: ' + val" />
          </div>

        </div>

      </div>
      <a-dropdown :disabled="focusMelodyContext" :trigger="['contextmenu']">
        <div class="content" ref="content" :class="{ 'no-tracks': project.tracks.length === 0 }">
          <h1 v-if="project.tracks.length === 0">Start by <a @click="addTrack">creating a track.</a></h1>
          <div class="tracks-container" ref="tracks">
            <div class="tracks">
              <div class="track-content" v-for="track in project.tracks" :key="track.identifier">
                <Melody
                v-for="melody,i in track.melodies"
                :key="melody.identifier"
                :preferences="editor.preferences"
                :scale="editor.scale"
                :bars="project.bars"
                :offset="editor.x"
                v-model:melody="track.melodies[i]"
                @delete="removeMelody(track, i)"
                @duplicate="duplicateMelody(track, melody)"
                @edit="editMelody(track, melody)"
                class="melody" />
              </div>
            </div>
          </div>

          <CanvasSizer width="100%" height="100%" ref="tracksCanvas"></CanvasSizer>

        </div>

        <template #overlay>
          <a-menu>
            <a-sub-menu title="Move View">
              <a-menu-item @click="editor.x = 0">To start</a-menu-item>
              <a-menu-item @click="editor.x = project.bars * editor.scale">To end</a-menu-item>
              <a-menu-item @click="editor.x = editor.cursor * editor.scale">To cursor</a-menu-item>
            </a-sub-menu>
            <a-sub-menu title="Move Cursor">
              <a-menu-item @click="editor.cursor = 0">To start</a-menu-item>
              <a-menu-item @click="editor.cursor = project.bars * editor.scale">To end</a-menu-item>
            </a-sub-menu>
            <a-sub-menu title="Add Bars">
              <a-menu-item v-for="i in [1,2,4,8]" :key="i" @click="project.bars += i">Add {{ i }}</a-menu-item>
            </a-sub-menu>
          </a-menu>
        </template>
      </a-dropdown>

    </div>

  </main>

  <a-modal v-model:visible="openAddTrack" title="Add Track" @ok="createTrack">
    
    <a-space size="large" direction="vertical" style="width: 100%">
      <a-input v-model:value="newTrack.name" addonBefore="Track Name" />
      <a-cascader style="width: 100%" v-model:value="newTrack.instrument" :options="newTrack.options" placeholder="Select instrument" />
    </a-space>

  </a-modal>

  <MelodyEditor 
    :track="melodyEditor.track"
    :bpm="project.bpm"
    :preferences="editor.preferences"
    @loading="setLoading"
    v-model:melody="melodyEditor.melody"
    v-model:visible="melodyEditor.open"
    @done="melodyEditor.done"
    @cancel="melodyEditor.cancel"
  />


  <a-drawer
    v-model:visible="openSettings"
    title="Settings"
    placement="left"
    @close="openSettings = false;"
    class="settings"
  >
    <a-space direction="vertical" size="middle" style="width: 100%">
      <h3>Project Settings</h3>
      <a-input v-model:value="project.name" addonBefore="Project Name" />
      <a-input-number min="0" max="9999" v-model:value="project.bars" addonBefore="Bars" />
      <a-button type="primary" @click="saveProject">Save Project Settings</a-button>
    </a-space>

    <a-divider />

    <a-space direction="vertical" size="middle" style="width: 100%">
      <h3>Editor Settings</h3>
      <div class="switch">
        <span>Auto save project</span>
        <a-switch v-model:checked="editor.preferences.autoSave"/>
      </div>
      <div class="switch">
        <span>Invert scroll directions</span>
        <a-switch v-model:checked="editor.preferences.invertScroll"/>
      </div>
      <div class="switch">
        <span>Lock movement direction when moving notes</span>
        <a-switch v-model:checked="editor.preferences.lockNotes"/>
      </div>
      <div class="switch">
        <span>Preview notes in editor</span>
        <a-switch v-model:checked="editor.preferences.previewNotes"/>
      </div>
      <a-button type="primary" @click="saveEditorChanges">Save Editor Settings</a-button>
    </a-space>
  </a-drawer>


  <Loading :show="loading" />

</template>

<style>
div#app {
  height: 100%;
}
.full-modal .ant-modal {
  max-width: 100%;
  top: 0;
  padding-bottom: 0;
  margin: 0;
}
.full-modal .ant-modal-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh);
}
.ant-dropdown-menu-title-content {
  white-space: nowrap;
}
.ant-input-number-group-wrapper {
  width: 100%;
}
::-webkit-scrollbar {
  display: none;
}
* {
  user-select: none;
}
.ant-drawer-content button.ant-btn {
  display: block;
  margin: 0 auto;
}
</style>

<style scoped>
main {
  height: 100%;
  display: flex;
  flex-direction: column;
}
section.ant-layout {
  height: 100%;
}
.editor {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  overflow: hidden;
}
.editor .side {
  width: 250px;
  background: #ddd;
  display: flex;
  flex-direction: column;
  overflow: scroll;
}
.editor .side > .tools {
  display: flex;
  position: absolute;
  background: #eee;
  height: 50px;
  width: 250px;
  z-index: 1000;
  border-right: 1px solid #bbb;
}
.editor .side > .tools > * {
  flex: 1;
  height: 100%;
}
.editor .side > .track {
  display: flex;
  flex-direction: column;
  padding: 7px;
  width: 100%;
  height: 75px;
  background: #ccc;
  border-bottom: 2px solid #bbb;
  border-right: 2px solid #bbb;
}
.editor .side > .track .details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}
.editor .side > .track .details > span {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.editor .side > .track .details > div {
  display: flex;
}
.editor .side > .track:nth-child(2) {
  margin-top: 50px;
}
.editor .content {
  background: #eee;
  flex: 1;
  position: relative;
}
.editor .content.no-tracks {
  display: flex;
  align-items: center;
  justify-content: center;
}
.editor .content canvas {
  position: absolute;
  top: 0; left: 0;
  pointer-events: none;
}
.editor .content .tracks {
  display: flex;
  flex-direction: column;
  margin-top: 50px;
  overflow: scroll;
}
.editor .content .tracks > .track-content {
  width: 100%;
  height: 75px;
  background: #ccc;
  border-bottom: 2px solid #bbb;
  position: relative;
}
.editor .content .tracks-container {
  height: 100%;
  overflow: scroll;
}
.settings .switch {
  display: flex;
  justify-content: space-between;
}
.settings h3 {
  text-align: center;
}
</style>

<script>
import { DeleteOutlined, CaretRightOutlined, PauseOutlined, PlusOutlined, LoadingOutlined, SettingOutlined } from '@ant-design/icons-vue';
import CanvasSizer from './components/CanvasSizer.vue';
import MelodyEditor from './components/MelodyEditor.vue';
import Melody from './components/Melody.vue';
import { SimpleCanvas } from './js/simple-canvas.js';
import * as Tone from 'tone';
import { notification } from 'ant-design-vue';
import { h } from 'vue';
import { throttle, clamp, matchParent, NOOP } from './js/utility.js';
import { Midi } from '@tonejs/midi';
import { loadSynth, playKey, stopKey, stopAll, setVolume } from './js/tone-wrapper.js';

export default {
  data() {
    const id = this.$router.currentRoute.value.params.pathMatch[0];
    return {
      id,
      openMelodyEditor: false,
      currentTrack: null,
      octave: [0,1,0,1,0,0,1,0,1,0,1,0],
      noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      loading: false,
      openAddTrack: false,
      openSettings: false,
      playing: false,
      playedNotes: [],
      focusMelodyContext: false,
      barsToAdd: 1,
      melodyEditor: {
        done: NOOP,
        cancel: NOOP,
        track: null,
        melody: null,
        open: false
      },
      newTrack: {
        name: '',
        instrument: null,
        options: [{
          value: 'keyboards',
          label: 'Keyboards',
          children: [{
            value: 'piano',
            label: 'Piano'
          },{
            value: 'organ',
            label: 'Organ'
          },{
            value: 'harmonium',
            label: 'Harmonium'
          },{
            value: 'xylophone',
            label: 'Xylophone'
          }]
        },{
          value: 'stringed',
          label: 'Stringed',
          children: [{
            value: 'harp',
            label: 'Harp'
          },{
            value: 'contrabass',
            label: 'Contrabass'
          },{
            value: 'cello',
            label: 'Cello'
          },{
            value: 'bass-electric',
            label: 'Electric Bass'
          },{
            value: 'violin',
            label: 'Violin'
          },{
            value: 'guitar-acoustic',
            label: 'Acoustic Guitar'
          },{
            value: 'guitar-electric',
            label: 'Electric Guitar'
          }]
        },{
          value: 'wind',
          label: 'Wind',
          children: [{
            value: 'bassoon',
            label: 'Bassoon'
          },{
            value: 'clarinet',
            label: 'Clarinet'
          },{
            value: 'flute',
            label: 'Flute'
          },{
            value: 'french-horn',
            label: 'French Horn'
          },{
            value: 'saxophone',
            label: 'Saxophone'
          },{
            value: 'trombone',
            label: 'Trombone'
          },{
            value: 'trumpet',
            label: 'Trumpet'
          },{
            value: 'tuba',
            label: 'Tuba'
          }]
        }]
      }
    }
  },
  watch: {
    project: {
      handler() {
        if (this.editor.preferences.autoSave && !this.openSettings) {
          this.saveProject();
        }
      },
      deep: true
    }
  },
  mounted() {

    this.start();

    onAuthStateChanged(auth, user => {
      if (user) {
        if (this.user && user.uid != this.user.uid) this.$router.push('/projects');
        this.user = user;
      } else {
        this.user = null;
        this.$router.push('/');
      }
    });
  },
  methods: {
    setLoading(val) {
      this.loading = val;
    },
    start() {
      /*** TRACKS CANVAS ***/
      this.$nextTick(() => {
        const canvas = this.$refs.tracksCanvas.$el;
        const ctx = canvas.getContext('2d');
        const sc = SimpleCanvas.setupCanvas(ctx);

        const MOVES = {
          cursor: 'cursor',
          track: 'track',
          none: ''
        }
        let moving = MOVES.none;

        addEventListener('keydown' , e => {
          if (e.code === 'Space' && document.activeElement === document.body) this.play();
          if (e.code === 'AltLeft') e.preventDefault();
        });
        const pd = e => e.preventDefault();
        this.$refs.side.addEventListener('wheel', pd);
        this.$refs.tracks.addEventListener('wheel', pd);

        sc.update = delta => {

          const { getscrolldelta, width } = sc;
          const tracksHeight = 75*this.project.tracks.length+50;

          sc.cls();

          sc.rectfill(0, 0, width(), 50, '#eee');

          // Draw beats and bars
          for (let i = 1; i <= this.project.bars; i++) {
            const x = i * this.editor.scale-this.editor.x;
            if (x + this.editor.scale < 0) continue;
            if (x - this.editor.scale > width()) break;

            for (let j = 1; j < 4; j++) {
              const x2 = x + j * this.editor.scale / 4 - this.editor.scale;
              sc.line(x2, 25, x2, 50, '#aaa');
            }

            sc.line(x, 0, x, tracksHeight, '#aaa');
            sc.text(i, x-this.editor.scale+3, 17, '#aaa');
          }

          // Draw cursor
          const cursorX = this.editor.cursor * this.editor.scale - this.editor.x;
          sc.line(cursorX, 0, cursorX, tracksHeight, '#555');
          sc.rectfill(cursorX-5, 0, 10, 50, '#555');

          // Enable moving cursor
          if (sc.mousedown() && !moving) {
            if (sc.mouse()[1] <= 50 && sc.mouse()[1] > 0 && sc.mouse()[0] > 0) {
              moving = MOVES.cursor;
              this.playing = false;
            }
          }
          if (!sc.mousedown()) moving = MOVES.none;

          switch (moving) {
            case MOVES.cursor:
              this.editor.cursor = (sc.mouse()[0] + this.editor.x) / this.editor.scale;
              break;

            case MOVES.track:

              break;
          }
          if (this.editor.cursor < 0) this.editor.cursor = 0;
          if (this.playing) {
            const advance = (delta / 1000) / (4 / (this.project.bpm / 60));
            this.editor.cursor += advance;

            for (const track of this.project.tracks) {
              for (const melody of track.melodies) {
                for (const note of melody.notes) {
                  if (this.editor.cursor >= note.start + melody.start && this.editor.cursor < melody.start + note.start + note.duration && !this.playedNotes.includes(note.identifier + melody.identifier)) {
                    playKey(note.key, track.instrument.identifier);
                    this.playedNotes.push(note.identifier + melody.identifier);
                  }

                  if (this.editor.cursor >= note.start + note.duration + melody.start && this.playedNotes.includes(note.identifier + melody.identifier)) {
                    stopKey(note.key, track.instrument.identifier);
                    this.playedNotes.splice(this.playedNotes.indexOf(note.identifier + melody.identifier), 1);
                  }
                }
              }
            }
          }
          if (this.editor.cursor > this.project.bars) {
            this.playing = false;
            this.editor.cursor = this.project.bars;
          }

          // Scrolling to zoom and pan
          if (sc.btn('ALT')) {
            this.editor.scale += -getscrolldelta() / 20;
          } else {
            if (sc.btn('SHIFT') && this.editor.preferences.invertScroll
            || !sc.btn('SHIFT') && !this.editor.preferences.invertScroll) {
              this.editor.y += getscrolldelta() / 4;
            } else {
              this.editor.x += getscrolldelta() / 4;
            }
          }
          this.editor.scale = clamp(this.editor.scale, 10, 500);
          this.editor.x = clamp(this.editor.x, 0, Math.max(0, this.project.bars * this.editor.scale - width()));
          this.editor.y = clamp(this.editor.y, 0, Math.max(0, this.project.tracks.length * 75 - this.$refs.side?.clientHeight + 50));
          this.$refs.side?.scrollTo(0, this.editor.y);
          this.$refs.tracks?.scrollTo(0, this.editor.y);
        }

      });

      this.$nextTick(() => {
        window.addEventListener('mousedown', e => {
          Tone.start();
        });

        window.addEventListener('mousemove', e => {
          this.focusMelodyContext = matchParent(e.target, '.melody');
        });
      });
    },
    addTrack() {
      this.openAddTrack = true;
      this.newTrack.instrument = null;
      this.newTrack.name = '';
    },
    createTrack() {
      this.openAddTrack = false;

      const value = this.newTrack.instrument[1];
      let instrumentName = '';
      outer:for (const type of this.newTrack.options) {
        for (const instrument of type.children) {
          if (instrument.value === value) {
            instrumentName = instrument.label;
            break outer;
          }
        }
      }
      this.project.tracks.push(new Track({
        name: this.newTrack.name,
        instrument: new Instrument({
          name: instrumentName,
          identifier: value
        }),
        volume: 100,
        melodies: []
      }));
    },
    removeTrack(i) {
      this.project.tracks.splice(i, 1);
    },
    async addMelody(track, bars) {
      
      this.melodyEditor.melody = new M({
        notes: [],
        start: 0,
        bars
      });
      this.melodyEditor.track = track;
      this.melodyEditor.open = true;

      try {
        await new Promise((resolve, reject) => {
          this.melodyEditor.done = resolve;
          this.melodyEditor.cancel = reject;
        });
        track.melodies.push(this.melodyEditor.melody);
      } catch(e) {
        if (e !== undefined) console.error(e);
      }

      this.melodyEditor.done = NOOP;
      this.melodyEditor.cancel = NOOP;
    },
    removeMelody(track, i) {
      track.melodies.splice(i, 1);
    },
    duplicateMelody(track, melody) {
      const newMelody = melody.copy();
      newMelody.start += melody.bars;
      track.melodies.push(newMelody);
    },
    async editMelody(track, melody) {
      this.melodyEditor.open = true;
      this.melodyEditor.melody = melody;
      this.melodyEditor.track = track;

      try {
        await new Promise((resolve, reject) => {
          this.melodyEditor.done = resolve;
          this.melodyEditor.cancel = reject;
        });
      } catch(e) {
        if (e !== undefined) console.error(e);
      }
      this.melodyEditor.done = NOOP;
      this.melodyEditor.cancel = NOOP;
    },
    uploadMidi(track) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.mid';

      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        
        if (file.type !== 'audio/mid') {
          notification.error({
            placement: 'bottomRight',
            message: 'The uploaded file is not a MIDI file.',
            duration: 2
          });
          return;
        }

        const url = URL.createObjectURL(file);
        const midi = await Midi.fromUrl(url);

        console.log(midi.header);

        const bpm = midi.header.tempos[0].bpm;

        const notes = [];
        for (const track of midi.tracks) {
          for (const note of track.notes) {
            notes.push(new Note({
              key: new Key(note.pitch, note.octave),
              start: note.time * this.project.bpm / (60 * 4) * this.project.bpm / bpm,
              duration: note.duration * this.project.bpm / (60 * 4) * this.project.bpm / bpm,
            }));
          }
        }
        
        console.log(notes);

        track.melodies.push(new M({
          notes,
          start: 0,
          bars: midi.duration * this.project.bpm / (60 * 4)
        }));

        // const reader = new FileReader();
        // reader.onload = async () => {
        //   const data = reader.result;
        //   console.log(data);
        //   const midi = midiManager.parseMidi(data);
        //   console.log(midi);

        //   // for (const track of midi.tracks) {
        //   //   this.project.tracks.push(new Track({
        //   //     name: track.name,
        //   //     instrument: new Instrument({
        //   //       name: track.instrument,
        //   //       identifier: track.instrument
        //   //     }),
        //   //     volume: 100,
        //   //     melodies: []
        //   //   }));
        //   // }
        // };
        // reader.readAsArrayBuffer(file);
      };
    },
    saveProject: throttle(async function() {
      const key = (Math.floor(Math.random() * 0xffffff)).toString(16);
      notification.open({
        placement: 'bottomRight',
        message: 'Saving project...',
        icon: h(LoadingOutlined, {
          style: 'color: #1890ff'
        }),
        duration: 0,
        key
      });
      try {
        if (!this.user) throw new Error('No user logon.');
        console.log('[Firebase] Saving project...');
        try {
          await set(ref(db, `users/${this.user.uid}/projects/${this.id}`), this.project);
        } catch(e) {
          throw new Error(e);
        }
      } catch(e) {
        console.error(e);
        notification.error({
          placement: 'bottomRight',
          message: 'An error occurred while saving.',
          duration: 2,
          key
        });
        return;
      }
      notification.success({
        placement: 'bottomRight',
        message: 'Project saved!',
        duration: 2,
        key
      });
    }, 3e3),
    saveEditorChanges: throttle(async function() {
      const key = (Math.floor(Math.random() * 0xffffff)).toString(16);
      notification.open({
        placement: 'bottomRight',
        message: 'Saving preferences...',
        icon: h(LoadingOutlined, {
          style: 'color: #1890ff'
        }),
        duration: 0,
        key
      });
      try {
        console.log('[Firebase] Saving user preferences...');
        const r = ref(db, `users/${this.user.uid}/preferences/`);
        await set(r, this.editor.preferences);
      } catch(e) {
        console.error(e);
        notification.error({
          placement: 'bottomRight',
          message: 'An error occurred while saving.',
          duration: 2,
          key
        });
        return;
      }
      notification.success({
        placement: 'bottomRight',
        message: 'Editor preferences saved!',
        duration: 2,
        key
      });
    }, 3e3),
    async play() {

      if (this.openAddTrack || this.openMelodyEditor || this.openSettings) return;
      
      if (!this.playing) {
        for (const track of this.project.tracks) {
          if (track.melodies.length) {
            this.loading = true;
            await loadSynth(track.instrument.identifier);
            setVolume(track.volume, track.instrument.identifier)
            this.loading = false;
          }
        }
        this.playedNotes = [];
        if (this.editor.cursor >= this.project.bars) this.editor.cursor = 0;
      } else {
        stopAll();
      }
      this.playing = !this.playing;
    }
  },
  components: {
    DeleteOutlined, CaretRightOutlined, PauseOutlined, SettingOutlined,
    PlusOutlined, LoadingOutlined, CanvasSizer, MelodyEditor
  }
}

</script>