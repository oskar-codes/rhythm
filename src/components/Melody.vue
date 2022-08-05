<template>
  <a-dropdown :trigger="['contextmenu']">
    <a-tooltip>
      <template #title>
        Start: {{ formatNumber(melody.start) }}<br>
        Duration: {{ formatNumber(melody.bars) }}<br>
      </template>
      <div ref="el" :style="style" class="interact" @dblclick="editMelody">
        <div v-if="preferences.previewNotes">
          <div
            v-for="note in melody.notes"
            class="note"
            :data-key="note.key.fullName"
            :style="noteStyle(note)"
            :key="note.identifier"
          ></div>
        </div>
      </div>
    </a-tooltip>
    <template #overlay>
      <a-menu>
        <a-menu-item @click="this.$emit('delete')">Delete</a-menu-item>
        <a-menu-item @click="this.$emit('duplicate')">Duplicate</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>


<style scoped>
.interact {
  box-sizing: border-box;
  background: #359eae;

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
  height: 75px;

  /* To prevent interact.js warnings */
  user-select: none;
  -ms-touch-action: none;
  touch-action: none;
}

.interact .note {
  position: absolute;
  background: yellow;
  height: 3px;
}

.interact:hover {
  background: #287985;
}

</style>

<script>
import interact from "interactjs";
import { allKeys, formatNumber } from '../js/utility.js';

export default {
  name: "Interact",
  props: ['melody', 'scale', 'preferences', 'bars', 'offset'],
  emits: ['update:melody', 'delete', 'duplicate', 'edit'],
  data: _ => ({
    el: null,
  }),
  watch: {
    scale() {

    }
  },
  computed: {
    x() {
      return this.melody.start * this.scale - this.offset;
    },
    width() {
      return this.melody.bars * this.scale;
    },
    style() {
      return {
        transform: `translate(${this.x}px, 0px)`,
        width: `${this.width}px`
      }
    }
  },
  methods: {
    noteStyle(note) {
      return {
        top: (allKeys.findIndex(e => e.fullName === note.key.fullName) / 88) * 65 + 5 + 'px',
        left: note.start * this.scale + 'px',
        width: note.duration * this.scale + 'px'
      }
    },
    formatNumber,
    editMelody() {
      this.$emit('edit');
    }
  },
  mounted() {
    const that = this;

    this.el = interact(this.$refs.el);

    this.el.draggable({
      startAxis: 'xy',
      lockAxis: this.preferences.lockNotes ? 'start' : 'xy',
      listeners: {
        move (event) {
          that.melody.start += event.dx / that.scale;
          if (that.melody.start <= 0) that.melody.start = 0;
          if (that.melody.start + that.melody.bars >= that.bars) {
            that.melody.start = that.bars - that.melody.bars;
          }
        },
      }
    });
  }
};
</script>