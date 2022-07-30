import { createApp } from 'vue';
import App from '../App.vue';
import { createWebHistory, createRouter } from 'vue-router';

import Home from '../Home.vue';
import Projects from '../Projects.vue';
import CreateAccount from '../CreateAccount.vue';
import Login from '../Login.vue';
import Editor from '../Editor.vue';
import NotFound from '../NotFound.vue';

const routes = [
  { 
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects,
  },
  {
    path: '/create-account',
    name: 'Create Account',
    component: CreateAccount,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: "/projects/:pathMatch(.*)*",
    name: "Editor",
    component: Editor,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
});

import { nextTick } from 'vue';
router.afterEach((to, from) => {
  nextTick(() => {
    document.title = 'RHYTHM | ' + (to.name ?? '');
  });
});

const app = createApp(App);
app.use(router);
app.mount('#app');
window.app = app;