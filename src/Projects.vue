<script setup>
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from './js/cloud.js';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { ref as reference, get, push, remove, set } from 'firebase/database';
import { getBase } from './js/url-manager.js';

const user = ref(await new Promise(resolve => {
  onAuthStateChanged(auth, resolve);
}));
if (!user.value) useRouter().push(getBase() + '/login');

const projects = ref(
  (await get(
    reference(db, `users/${user.value.uid}/projects/`)
  )).val()
);
if (!projects.value) projects.value = {};
</script>

<template>
  <a-page-header
    style="border: 1px solid rgb(235, 237, 240)"
    title="Projects"
    @back="$router.push(getBase() + '/')"
  >
    <template #extra>
      <a-button @click="logOut">Log Out</a-button>
    </template>
  </a-page-header>

  <a-button @click="openCreateProject = true;" class="create" type="primary" shape="circle">
    <template #icon><PlusOutlined /></template>
  </a-button>

  <a-card
    class="project"
    v-for="project, key in projects"
    :key="key"
    :title="project.name">
    <template #extra><span>{{ Math.round(project.bars / project.bpm * 60 * 4) }}s</span></template>
    
    <div class="icons">
      <a-button type="primary" shape="circle" class="icon green" @click="$router.push(getBase() + `/projects/${key}`)">
        <template #icon><EditOutlined /></template>
      </a-button>
      <a-button type="primary" shape="circle" class="icon grey" @click="editKey = key; openProjectOptions = true;">
        <template #icon><SettingOutlined /></template>
      </a-button>
      <a-button type="primary" shape="circle" class="icon red" @click="editKey = key; openDeleteProject = true;">
        <template #icon><DeleteOutlined /></template>
      </a-button>
    </div>
    
  </a-card>

  <a-modal v-model:visible="openDeleteProject" title="Delete Project" @ok="confirmDelete()" @cancel="openDeleteProject = false;">
    Are you sure you want to delete "{{ editProject.name }}"? This action cannot be reversed.
  </a-modal>

  <a-modal v-model:visible="openCreateProject" title="Create Project" @ok="createProject">
    <a-input v-model:value="newProjectName" addonBefore="Project Name" />
  </a-modal>

  <a-drawer
    v-model:visible="openProjectOptions"
    title="Project Settings"
    placement="left"
    @close="openProjectOptions = false;"
  >
    <a-space direction="vertical" size="large" style="width: 100%">
      <a-input v-model:value="editProject.name" addonBefore="Project Name" />
      <a-input disabled addonBefore="Project ID" :value="editKey" />
      <a-button style="margin: 0 auto; display: block;" type="primary" @click="saveChanges">Save</a-button>
    </a-space>
  </a-drawer>

</template>

<style scoped>
.create {
  margin: 50px;
  width: 100px;
  height: 100px;
}
.create span {
  font-size: 32px;
}
.project {
  margin: 10px;
  height: 200px;
  width: 300px;
  display: inline-block;
}
.project div.icons {
  display: flex;
  justify-content: space-evenly;
  align-content: center;
  align-items: center;
}
.project div.icons .icon {
  width: 75px;
  height: 75px;
}
.project div.icons .icon span {
  font-size: 35px;
}
.green {
  background-color: #28a745;
  border-color: #28a745;
}
.grey {
  background-color: #999;
  border-color: #999;
}
.red {
  background-color: #dc3545;
  border-color: #dc3545;
}
</style>

<script>
import { EditOutlined, SettingOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { notification } from 'ant-design-vue';
import { throttle, randomKey } from './js/utility.js';
import { h } from 'vue';

export default {
  data() {
    return {
      openDeleteProject: false,
      openProjectOptions: false,
      openCreateProject: false,
      editKey: null,
      newProjectName: '',
    }
  },
  computed: {
    editProject() {
      return this.projects[this.editKey] ?? {};
    },
  },
  methods: {
    async createProject() {
      const r = reference(db, `users/${this.user.uid}/projects`);
      const newRef = await push(r, {
        name: this.newProjectName,
        bars: 4,
        bpm: 60,
        tracks: []
      });
      this.$router.push(getBase() + `/projects/${newRef.key}`);
    },
    async logOut() {
      await signOut(auth);
      this.$router.push(getBase() + '/');
    },
    async confirmDelete() {
      const r = reference(db, `users/${this.user.uid}/projects/${this.editKey}`);
      await remove(r);
      delete this.projects[this.editKey];
      this.openDeleteProject = false;
    },
    saveChanges: throttle(async function() {
      const r = reference(db, `users/${this.user.uid}/projects/${this.editKey}`);
      const key = randomKey();
      notification.open({
        placement: 'bottomRight',
        message: 'Saving project...',
        icon: h(LoadingOutlined, {
          style: 'color: #1890ff'
        }),
        duration: 0,
        key
      });
      try {
        await set(r, this.editProject);
        notification.success({
          placement: 'bottomRight',
          message: 'Project saved!',
          duration: 2,
          key
        });
      } catch (e) {
        notification.error({
          placement: 'bottomRight',
          message: 'An error occurred while saving.',
          duration: 2,
          key
        });
      }
    }, 3e3)
  },
  mounted() {
    onAuthStateChanged(auth, user => {
      if (user) {
        if (this.user && user.uid != this.user.uid) this.$router.push(getBase() + '/projects');
        this.user = user;
      } else {
        this.user = null;
        this.$router.push(getBase() + '/');
      }
    });
  },
  components: {
    EditOutlined,
    SettingOutlined,
    DeleteOutlined,
    PlusOutlined
  }
}
</script>