<template>
  <a-dropdown :trigger="['contextmenu']">
    <div ref="el" :style="style" class="interact"></div>
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

.interact:hover {
  background: #287985;
}

</style>

<script>
import interact from "interactjs";

export default {
  name: "Interact",
  props: ['melody', 'scale', 'preferences', 'bars'],
  emits: ['update:melody', 'delete', 'duplicate'],
  data: _ => ({
    el: null,
    style: {
      transform: 'translate(0px, 0px)',
      width: '200px'
    }
  }),
  computed: {
    x() {
      return this.melody.start * this.scale;
    },
    width() {
      return this.melody.bars * this.scale;
    }
  },
  mounted() {
    const that = this;
    Object.assign(this.style, {
      transform: `translateX(${this.x}px)`,
      width: this.width + 'px'
    });

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
          that.style.transform = `translateX(${that.x}px)`;
        },
      }
    });
  }
};
</script>