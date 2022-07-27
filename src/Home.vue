<template>
  <main>
    <Title text="RHYTHM"/>
    <p>An easy to use yet powerful music making website</p>
    <a-button type="primary" v-if="user" href="/projects">Go to your projects</a-button>
    <a-button type="primary" v-else href="/create-account">Get started</a-button>
  </main>
</template>

<style>
@import 'ant-design-vue/dist/antd.css';
</style>

<style scoped>
button {
  font-weight: bold;
}
main {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
</style>

<script>
import Title from './components/Title.vue'
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './cloud.js';

export default {
  data() {
    return {
      user: null
    }
  },
  components: {
    Title
  },
  mounted() {
    onAuthStateChanged(auth, user => {
      if (user) {
        this.user = user;
      } else {
        this.user = null;
      }
    });
  }
}
</script>