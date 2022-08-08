<script setup>
import { getBase } from './js/url-manager.js';
</script>

<template>
  <a-result status="404" title="404" sub-title="Sorry, the page you visited does not exist.">
    <template #extra>
      <a-button :href="getBase() + '/'" type="primary">Back Home</a-button>
    </template>
  </a-result>
</template>

<style>
Title {
  text-align: center;
}
</style>