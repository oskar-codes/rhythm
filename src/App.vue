<script>
import { RouterView } from 'vue-router'
import Loading from './components/Loading.vue'
export default {
  data() {
    return {}
  },
  components: {
    RouterView, Loading
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
div.wrapper {
  height: 100%;
}
</style>

<template>

  <RouterView v-slot="{ Component, route }">
    <template v-if="Component">
      <Transition name="fade">
        <div class="wrapper" :key="route.name">
          <Suspense>
            <component :is="Component"></component>
            <template #fallback>
              <Loading :show="true" />
            </template>
          </Suspense>
        </div>
      </Transition>
    </template>
  </RouterView>

</template>