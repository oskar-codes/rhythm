<template>
  <div class="overlay" v-if="show">
    <LoadingOutlined />
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 60px;
  background-color: white;
  z-index: 1001;
}
</style>

<script>
import { LoadingOutlined } from '@ant-design/icons-vue';

export default {
  props: ['show'],
  components: {
    LoadingOutlined
  }
}
</script>