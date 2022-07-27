<template>
  <h1>{{ text }}</h1>
</template>

<style scoped>
h1 {
  font-size: 50px;
}
</style>

<script>
export default {
  props: {
    text: String
  }
}
</script>