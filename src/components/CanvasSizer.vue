<template>
  <canvas :style="style" :width="outputWidth" :height="outputHeight" ref="canvas"></canvas>
</template>

<script>
export default {
  props: ['width', 'height', 'style', 'type'],
  data() {
    return {
      outputWidth: 100,
      outputHeight: 100
    }
  },
  watch: {
    width() { this.setDimensions() },
    height() { this.setDimensions() }
  },
  methods: {
    setDimensions() {
      if (String(this.width).includes('%')) {
        const w = Number(this.width.replace('%', ''));
        this.outputWidth = this.$el.parentNode[(this.type ?? 'scroll') + 'Width'] * (w / 100);
      } else {
        this.outputWidth = this.width;
      }

      if (String(this.height).includes('%')) {
        const h = Number(this.height.replace('%', ''));
        this.outputHeight = this.$el.parentNode[(this.type ?? 'scroll') + 'Height'] * (h / 100);
      } else {
        this.outputHeight = this.height;
      }
    }
  },
  mounted() {
    this.setDimensions();

    const that = this;

    this.$nextTick(() => {
      window.addEventListener('resize', e => {
        that.setDimensions();
      });
    });
  }
}
</script>