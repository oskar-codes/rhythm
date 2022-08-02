<template>
  <a-dropdown :trigger="['contextmenu']">
    <a-tooltip>
      <template #title>
        Start: {{ note.start }}<br>
        Duration: {{ note.duration }}
      </template>
      <div :style="style" ref="el" class="interact">
        {{ note.key.fullName }}
      </div>
    </a-tooltip>
    <template #overlay>
      <a-menu>
        <a-menu-item @click="this.$emit('delete')">Delete Note</a-menu-item>
        <a-sub-menu title="Move">
          <a-menu-item @click="addY(50*12)">1 Octave Down</a-menu-item>
          <a-menu-item @click="addY(-50*12)">1 Octave Up</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </template>
  </a-dropdown>
</template>


<style scoped>
.interact {
  box-sizing: border-box;
  background: #41b883;

  width: 120px;
  height: var(--y-scale);
  border-radius: 5px;
  overflow: hidden;
  display: inline-block;
  position: absolute;
  left: 0; top: 0;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: white;
  padding-left: 10px;

  /* To prevent interact.js warnings */
  user-select: none;
  -ms-touch-action: none;
  touch-action: none;
}

.interact:hover {
  background: #359369;
}

</style>

<script>
import interact from "interactjs";
import { allKeys } from '../js/utility.js';
import { Key } from '../js/classes.js';

export default {
  name: "Interact",
  props: ['note', 'scale', 'preferences', 'bars'],
  emits: ['update:note', 'delete'],
  data: _ => ({
    el: null,
    y: 0,
    style: {
      transform: 'translate(0px, 0px)',
      width: '200px'
    }
  }),
  watch: {
    'scale.x'() {
      this.style.transform = `translate(${this.x}px, ${this.y}px)`;
      this.style.width = this.width + 'px';
    },
    'scale.y'() {
      this.y = this.keyToY(this.note.key);
      this.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
  },
  computed: {
    x() {
      return this.note.start * this.scale.x;
    },
    width() {
      return this.note.duration * this.scale.x;
    }
  },
  methods: {
    keyToY(key) {
      return allKeys.findIndex(e => e.name === key.name && e.octave === key.octave) * this.scale.y;
    },
    yToKey(y) {
      return allKeys[Math.floor(y / this.scale.y)];
    },
    addY(delta) {
      this.y += delta;
      if (this.y <= 0) this.y = 0;
      if (this.y >= 87 * this.scale.y) this.y = 87 * this.scale.y;

      this.style.transform = `translate(${this.x}px, ${this.y - this.y % this.scale.y}px)`;
      this.note.key = this.yToKey(this.y);
      
      this.$emit('update:note', this.note);
    }
  },
  mounted() {
    const that = this;
    this.y = this.keyToY(this.note.key);
    Object.assign(this.style, {
      transform: `translate(${this.x}px, ${this.y}px)`,
      width: this.width + 'px'
    });

    this.el = interact(this.$refs.el);
    this.el.resizable({
      edges: { top: false, left: true, bottom: false, right: true },
      listeners: {
        move: function (event) {
          that.note.start += event.deltaRect.left / that.scale.x;
          if (that.note.start <= 0) {
            that.note.start = 0;
          } else {
            that.note.duration += event.deltaRect.width / that.scale.x;
            if (that.note.duration <= 1/8) {
              that.note.duration = 1/8;
            }
            if (that.note.start + that.note.duration >= that.bars) {
              that.note.duration = that.bars - that.note.start;
            }
          }
          that.$emit('update:note', that.note);

          Object.assign(that.style, {
            width: `${that.width}px`,
            transform: `translate(${that.x}px, ${that.y - that.y % that.scale.y}px)`
          });
        }
      }
    });

    this.el.draggable({
      startAxis: 'xy',
      lockAxis: this.preferences.lockNotes ? 'start' : 'xy',
      listeners: {
        move (event) {
          that.note.start += event.dx / that.scale.x;
          that.addY(event.dy);
          if (that.note.start <= 0) {
            that.note.start = 0;
          }
          if (that.note.start + that.note.duration >= that.bars) {
            that.note.duration = that.bars - that.note.start;
          }
          that.style.transform =
            `translate(${that.note.start}px, ${that.y - that.y % that.scale.y}px)`;
        },
      }
    });
  }
};
</script>