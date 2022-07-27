<template>
  <a-page-header
    style="border: 1px solid rgb(235, 237, 240)"
    title="PROJECTS"
    @back="$router.push('/')"
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
    v-for="project, i in projects"
    :key="i"
    :title="project.name">
    <template #extra><span>{{ project.duration }}s</span></template>
    
    <div class="icons">
      <a-button type="primary" shape="circle" class="icon green" @click="this.$router.push(`/projects/${project.id}`)">
        <template #icon><EditOutlined /></template>
      </a-button>
      <a-button type="primary" shape="circle" class="icon grey" @click="projectOptions = copy(project); openProjectOptions = true;">
        <template #icon><SettingOutlined /></template>
      </a-button>
      <a-button type="primary" shape="circle" class="icon red" @click="deleteProject = project; openDeleteProject = true;">
        <template #icon><DeleteOutlined /></template>
      </a-button>
    </div>
    
  </a-card>

  <a-modal v-model:visible="openDeleteProject" title="Delete Project" @ok="confirmDelete(deleteProject)" @cancel="openDeleteProject = false;">
    Are you sure you want to delete "{{ deleteProject.name }}"?
  </a-modal>

  <a-modal v-model:visible="openCreateProject" title="Create Project" @ok="createProject">
    <a-input v-model:value="newProjectName" addonBefore="Project Name" />
  </a-modal>

  <!-- <Settings 
    @close-options="openProjectOptions = false; updateProjects();"
    :open="openProjectOptions"
    :project="projectOptions"
    :uid="user?.uid" /> -->

  <a-drawer
    v-model:visible="openProjectOptions"
    title="Project Settings"
    placement="left"
    @close="openProjectOptions = false; updateProjects();"
  >
    <a-space direction="vertical" size="large">
      <a-input v-model:value="projectOptions.name" addonBefore="Project Name" />
      <a-button style="margin: 0 auto; display: block;" type="primary" @click="saveChanges">Save</a-button>
    </a-space>
  </a-drawer>

  <Loading :show="loading" />

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
import { EditOutlined, SettingOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, push, remove, set } from 'firebase/database';
import { auth, db } from './cloud.js';

export default {
  data() {
    return {
      projects: [{
        name: 'test',
        duration: 0,
        tracks: []
      },{
        name: 'test',
        duration: 0,
        tracks: []
      }],
      user: null,
      deleteProject: null,
      openDeleteProject: false,
      openProjectOptions: false,
      projectOptions: null,
      openCreateProject: false,
      newProjectName: '',
      loading: true
    }
  },
  methods: {
    async createProject() {
      const r = ref(db, `users/${this.user.uid}/projects`);
      const newRef = await push(r, {
        name: this.newProjectName,
        duration: 0,
        beats: 4,
        bpm: 60,
        tracks: []
      });
      this.$router.push(`/projects/${newRef.key}`);
    },
    logOut() {
      signOut(auth);
    },
    async confirmDelete(project) {
      const r = ref(db, `users/${this.user.uid}/projects/${project.id}`);
      await remove(r);
      this.updateProjects();
      this.openDeleteProject = false;
    },
    async updateProjects() {
      if (this.user) {
        this.loading = true;
        const snap = await get(ref(db, `users/${this.user.uid}/projects`));
        const data = snap.val();
        this.projects = [];
        if (data) this.projects = Object.values(data).map((e,i) => ({...e, id: Object.keys(data)[i]}));
        this.loading = false;
      }
    },
    async saveChanges() {
      const r = ref(db, `users/${this.user.uid}/projects/${this.projectOptions.id}`);
      delete this.projectOptions.id;
      await set(r, this.projectOptions);
      this.updateProjects();
      this.openProjectOptions = false;
    },
    copy(object) {
      return JSON.parse(JSON.stringify(object));
    }
  },
  async mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (this.user && user.uid !== this.user.uid) this.$router.push('/projects');
        this.user = user;
        this.updateProjects();
      } else {
        this.user = null;
        this.$router.push('/');
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