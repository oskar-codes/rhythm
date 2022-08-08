import { fileURLToPath, URL } from 'url'

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue'

import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default ({ mode }) => {
  return defineConfig({
    base: mode === 'development' ? '/' : '/rhythm/',
    plugins: [
      vue(/*{
        reactivityTransform: true
      }*/),
      Components({
        resolvers: [AntDesignVueResolver()],
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  });
}