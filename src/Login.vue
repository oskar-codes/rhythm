<template>

  <main>
    <h1>Login</h1>
    <a-form
      :model="formState"
      name="Login"
      autocomplete="off"
      layout="vertical"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item
        label="Email"
        name="email"
        :rules="{ required: true, message: 'Please input your email.' }"
      >
        <a-input v-model:value="formState.email" />
      </a-form-item>

      <a-form-item
        label="Password"
        name="password"
        :rules="{ required: true, message: 'Please input your password.' }"
      >
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit">Login</a-button>
      </a-form-item>

      <p style="color: red;" v-if="formState.error">{{ formState.error }}</p>
    </a-form>

    <p>Don't have an account? <a href="/create-account">Create one.</a></p>
  </main>

</template>

<style scoped>
main {
  width: 60%;
  margin: 20px auto;
  text-align: center;
}
</style>

<script>
import { auth } from './js/cloud.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default {
  data() {
    return {
      formState: {
        email: '',
        password: '',
        error: ''
      }
    }
  },
  methods: {
    onFinish() {
      this.formState.error = '';
      signInWithEmailAndPassword(auth, this.formState.email, this.formState.password)
        .then(_ => {
          this.$router.push('/projects');
        })
        .catch((error) => {
          this.formState.error = error.message;
        });
    }
  }
}
</script>