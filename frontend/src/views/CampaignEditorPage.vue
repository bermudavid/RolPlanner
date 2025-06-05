<template>
  <div class="campaign-editor-page">
    <MapViewer v-if="modelUrl" :model-url="modelUrl" />
  </div>
</template>

<script>
import MapViewer from '../components/MapViewer.vue';
import api from '../api';

export default {
  name: 'CampaignEditorPage',
  components: { MapViewer },
  data() {
    return { modelUrl: null, id: null };
  },
  created() {
    this.id = this.$route.params.id;
    this.fetchCampaign();
  },
  methods: {
    async fetchCampaign() {
      const { data } = await api.get(`/campaigns/${this.id}`);
      if (data.model_path) {
        const base = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '');
        this.modelUrl = `${base}/${data.model_path}`;
      }
    },
  },
};
</script>

<style scoped>
.campaign-editor-page {
  width: 100%;
  height: 100%;
}
</style>
