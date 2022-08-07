<template>
  <a-dropdown :trigger="['contextmenu']">
    <a-tooltip>
      <template #title>
        Start: {{ formatNumber(melody.start) }}<br />
        Duration: {{ formatNumber(melody.bars) }}<br />
      </template>
      <div ref="el" :style="style" class="interact" @dblclick="editMelody">
        <CanvasSizer type="client" width="100%" height="100%" />
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
  border-radius: 5px;
  overflow: hidden;
  display: inline-block;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 20px;
  color: white;
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
import { allKeys, formatNumber } from "../js/utility.js";
import CanvasSizer from "./CanvasSizer.vue";
import { SimpleCanvas } from "../js/simple-canvas.js";

export default {
  name: "Interact",
  props: ["melody", "scale", "preferences", "bars", "offset"],
  emits: ["update:melody", "delete", "duplicate", "edit"],
  data: (_) => ({
    el: null,
    sc: null,
  }),
  watch: {
    melody() {
      this.updateNotes();
    },
    scale() {
      this.updateNotes();
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
        width: `${this.width}px`,
      };
    },
  },
  methods: {
    noteStyle(note) {
      return {
        top: (allKeys.findIndex((e) => e.fullName === note.key.fullName) / 88) * 65 + 5,
        left: note.start * this.scale,
        width: note.duration * this.scale,
      };
    },
    formatNumber,
    editMelody() {
      this.$emit("edit");
    },
    updateNotes() {
      if (this.sc) {
        this.sc.cls();
        for (const note of this.melody.notes) {
          const { top, left, width } = this.noteStyle(note);
          // if (left + width + this.x < 0 || left + this.x > window.innerWidth - 200) continue;
          this.sc.rectfill(left, top, width, 2, 'yellow');
        }
      }
    }
  },
  async mounted() {
    const that = this;
    this.el = interact(this.$refs.el);
    this.el.draggable({
      startAxis: "xy",
      lockAxis: this.preferences.lockNotes ? "start" : "xy",
      listeners: {
        move(event) {
          that.melody.start += event.dx / that.scale;
          if (that.melody.start <= 0) that.melody.start = 0;
          if (that.melody.start + that.melody.bars >= that.bars) {
            that.melody.start = that.bars - that.melody.bars;
          }
        },
      },
    });

    await this.$nextTick();

    const canvas = this.$refs.el.children[0];
    const ctx = canvas.getContext("2d");
    this.sc = SimpleCanvas.setupCanvas(ctx);
    this.updateNotes();
  },
  components: { CanvasSizer },
};
</script>