<script setup>
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './js/cloud.js';
import { getBase } from './js/url-manager.js';

const user = await new Promise(resolve => {
  onAuthStateChanged(auth, resolve);
});

</script>

<template>
  <main>
    <Title text="RHYTHM"/>
    <p>An easy to use yet powerful music making website.</p>
    <a-button type="primary" v-if="user" @click="$router.push(getBase() + '/projects')">Go to your projects</a-button>
    <a-button type="primary" v-else @click="$router.push(getBase() + '/create-account')">Get started</a-button>
  </main>
</template>

<style>
@import 'ant-design-vue/dist/antd.css';
</style>

<style scoped>
main {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
main > p {
  font-size: 28px;
}
</style>

<script>
import Title from './components/Title.vue';
export default {
  data() {
    return {}
  },
  mounted() {
    onAuthStateChanged(auth, user => {
      this.user = user;
    });
  },
  components: {
    Title
  },
}
</script>