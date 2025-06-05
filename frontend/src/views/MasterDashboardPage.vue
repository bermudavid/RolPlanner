<template>
  <div class="master-dashboard-page">
    <header class="dashboard-header">
      <h1>Master Dashboard</h1>
      <div class="user-indicator">
        <span>Master</span> <!-- Or use actual username if available -->
      </div>
    </header>

    <div class="dashboard-main-content">
      <!-- Left Column -->
      <aside class="dashboard-column left-column">
        <div class="card campaigns-card">
          <h2 class="card-title">Campaigns</h2>
          <p>Manage your game campaigns, create new adventures, and track ongoing stories.</p>
          <button class="btn" @click="showForm = !showForm">New Campaign</button>
          <form v-if="showForm" @submit.prevent="createCampaign" class="campaign-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input id="name" v-model="name" required />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" v-model="description"></textarea>
            </div>
            <div class="form-group">
              <label for="model">GLTF Model</label>
              <input id="model" type="file" @change="onFileChange" />
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="isPublic" /> Public
              </label>
            </div>
            <div class="form-group" v-if="!isPublic">
              <label for="password">Password</label>
              <input id="password" type="password" v-model="password" />
            </div>
            <button type="submit" class="btn">Save</button>
            <p v-if="joinLink" class="join-link">Share: {{ joinLink }}</p>
          </form>
          <ul class="campaign-list">
            <li v-for="c in campaigns" :key="c.id" class="campaign-item">
              <div class="campaign-info">
                <strong>{{ c.name }}</strong>
                <p class="campaign-description">{{ c.description }}</p>
              </div>
              <div class="campaign-actions">
                <button class="btn" @click="openCampaign(c.id)">Open</button>
                <button class="btn btn-danger" @click="deleteCampaign(c.id)">Delete</button>
              </div>
            </li>
          </ul>
        </div>

        <div class="card sessions-card">
          <h2 class="card-title">Sessions</h2>
          <button class="btn" @click="showSessionForm = !showSessionForm">New Session</button>
          <form v-if="showSessionForm" @submit.prevent="createSession" class="session-form">
            <div class="form-group">
              <label for="sessionName">Name</label>
              <input id="sessionName" v-model="sessionName" required />
            </div>
            <div class="form-group">
              <label for="sessionCampaign">Campaign</label>
              <select id="sessionCampaign" v-model="sessionCampaignId" required>
                <option disabled value="">Select campaign</option>
                <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <button type="submit" class="btn">Create</button>
          </form>
          <ul class="campaign-list">
            <li v-for="s in sessions" :key="s.id" class="campaign-item">
              <div class="campaign-info">
                <strong>{{ s.name }}</strong>
                <p class="campaign-description">Campaign: {{ s.campaign.name }}</p>
                <p class="campaign-description">Status: {{ s.status }}</p>
              </div>
              <div class="campaign-actions">
                <button
                  v-if="s.status === 'Pending'"
                  class="btn"
                  @click="startSession(s.id)"
                >
                  Start
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="card event-manager-card">
          <h2 class="card-title">Recent Events</h2>
          <ul>
            <li>Event: Player "Adventurer01" joined "The Lost Mine".</li>
            <li>Event: Quest "Find the Artifact" completed by Player "HeroPlayer".</li>
            <li>Alert: Player "NewbieGamer" has critically low supplies in "Survival Challenge".</li>
            <li>Event: Session "Cave Exploration" ended.</li>
          </ul>
        </div>
      </aside>

      <!-- Center Column (Placeholder for 3D Scene) -->
      <section class="dashboard-column center-column">
        <div class="card scene-placeholder-card">
          <h2 class="card-title">Game World Overview</h2>
          <p>This area will display a visual overview of the current game state, map, or key locations.</p>
          <div class="placeholder-graphic">[Placeholder for Interactive Map / 3D Scene]</div>
        </div>
      </section>

      <!-- Right Column -->
      <aside class="dashboard-column right-column">
        <div class="card subscriptions-card">
          <h2 class="card-title">Player Subscriptions</h2>
          <p>View and manage active player subscriptions and access levels.</p>
          <!-- Subscription details or links -->
           <button class="btn btn-secondary" style="margin-top: 10px;">Manage Subscriptions</button>
        </div>

        <div class="card tips-card">
          <h2 class="card-title">Game Master Tips</h2>
          <ul>
            <li>Tip: Engage players with moral dilemmas for deeper role-playing.</li>
            <li>Tip: Use dynamic soundscapes to enhance immersion during sessions.</li>
            <li>Tip: Regularly solicit feedback from your players to improve campaigns.</li>
          </ul>
        </div>

        <div class="card empty-placeholder-card">
          <h2 class="card-title">Future Content</h2>
          <p>This space is reserved for upcoming features, analytics, or quick-access tools.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'MasterDashboardPage',
  data() {
    return {
      showForm: false,
      showSessionForm: false,
      name: '',
      description: '',
      file: null,
      password: '',
      isPublic: true,
      campaigns: [],
      sessions: [],
      sessionName: '',
      sessionCampaignId: '',
      joinLink: '',
    };
  },
  created() {
    this.fetchCampaigns();
    this.fetchSessions();
  },
  methods: {
    onFileChange(e) {
      this.file = e.target.files[0];
    },
    async createCampaign() {
      const formData = new FormData();
      formData.append('name', this.name);
      formData.append('description', this.description);
      formData.append('is_public', this.isPublic);
      if (this.password) {
        formData.append('password', this.password);
      }
      if (this.file) {
        formData.append('model', this.file);
      }
      const { data } = await api.post('/campaigns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data.joinLink) {
        this.joinLink = data.joinLink;
      }
      await this.fetchCampaigns();
      this.showForm = false;
      this.name = '';
      this.description = '';
      this.file = null;
      this.password = '';
      this.isPublic = true;
    },
    async fetchCampaigns() {
      const { data } = await api.get('/campaigns');
      this.campaigns = data;
    },
    async fetchSessions() {
      const { data } = await api.get('/sessions');
      this.sessions = data;
    },
    openCampaign(id) {
      this.$router.push(`/campaign/${id}/edit`);
    },
    async deleteCampaign(id) {
      if (!confirm('Delete this campaign?')) return;
      await api.delete(`/campaigns/${id}`);
      await this.fetchCampaigns();
    },
    async startSession(id) {
      await api.patch(`/sessions/${id}/start`);
      await this.fetchSessions();
    },

    async createSession() {
      await api.post('/sessions', {
        name: this.sessionName,
        campaign_id: Number(this.sessionCampaignId),
      });
      this.sessionName = '';
      this.sessionCampaignId = '';
      this.showSessionForm = false;
      await this.fetchSessions();
    },
  },
};
</script>

<style scoped>
/* .master-dashboard-page {
  padding: already handled by page-container in App.vue if that class is applied to the router-view wrapper
} */

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px; /* Increased padding */
  border-bottom: 1px solid var(--color-accent-blue);
}

.dashboard-header h1 {
  font-size: var(--font-size-titles-main);
  color: var(--color-text-primary);
  margin: 0;
}

.user-indicator span {
  font-family: var(--font-primary);
  font-size: var(--font-size-buttons); /* Using button font size for consistency */
  color: var(--color-text-primary); /* Primary text for better visibility */
  background-color: var(--color-buttons-end); /* Using button color */
  padding: 10px 18px; /* Adjusted padding */
  border-radius: 6px;
  border: 1px solid var(--color-accent-blue);
  font-weight: 500;
}

.dashboard-main-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px; /* Space between columns */
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 25px; /* Space between cards within a column */
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.center-column {
  display: flex;
  flex-direction: column;
  gap: 25px;
  grid-column: span 2;
}

@media (max-width: 800px) {
  .center-column {
    grid-column: span 1;
  }
}

/* Card specific styles */
.card {
  /* Global .card styles (padding, bg, border-radius) will apply. */
  /* Add any specific overrides or additions here if necessary. */
  /* For example, ensuring cards fill column width if not by default: */
   width: 100%;
}

.campaigns-card > .btn {
  margin-top: 15px;
  width: 100%; /* Make button full width */
}

.campaign-list {
  list-style: none;
  padding-left: 0;
  margin-top: 15px;
}
.campaign-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-buttons-end);
}
.campaign-item:last-child {
  border-bottom: none;
}
.campaign-info {
  flex: 1;
}
.campaign-description {
  margin: 5px 0 0 0;
  font-size: var(--font-size-lists-events);
  color: var(--color-text-secondary);
}
.campaign-actions {
  display: flex;
  gap: 10px;
}
.btn-danger {
  background-color: #d9534f;
}
.btn-danger:hover {
  background-color: #c9302c;
}

.subscriptions-card .btn-secondary {
    background-color: var(--color-accent-blue); /* Different color for secondary actions */
    width: 100%;
}
.subscriptions-card .btn-secondary:hover {
    background-color: var(--color-button-hover);
}


.event-manager-card ul, .tips-card ul {
  list-style: none;
  padding-left: 0;
  font-size: var(--font-size-lists-events);
  color: var(--color-text-secondary);
  margin-top: 10px; /* Add some space above the list */
}

.event-manager-card li, .tips-card li {
  padding: 10px 5px; /* Increased padding for list items */
  border-bottom: 1px solid var(--color-buttons-end); /* Subtle separator */
  line-height: 1.5; /* Improve readability */
}

.event-manager-card li:last-child, .tips-card li:last-child {
  border-bottom: none;
}

.scene-placeholder-card .placeholder-graphic {
  height: 500px;
  background-color: var(--color-background-main); /* Slightly different from cards-panels for contrast */
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-secondary);
  border-radius: 6px; /* Consistent border-radius */
  margin-top: 20px; /* More space above */
  border: 1px dashed var(--color-accent-blue); /* Dashed border for placeholder feel */
  font-style: italic;
}

/* Card titles are globally styled via .card .card-title or h2.
   If reinforcement or specific adjustments are needed: */
.card-title { /* This is already in global style.css for .card-title */
  font-size: var(--font-size-subtitles);
  font-weight: 500; /* Medium weight for subtitles as per some design systems */
  color: var(--color-text-primary);
  margin-bottom: 15px; /* Consistent margin */
}

/* Buttons are globally styled via .btn.
   If reinforcement or specific adjustments are needed: */
.btn { /* This is already in global style.css */
   font-size: var(--font-size-buttons);
   /* other properties like padding, color, bg-color are global */
}

@media (max-width: 1024px) { /* Breakpoint for tablets */
  .center-column {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
   .dashboard-header {
      flex-direction: column; /* Stack header items */
      align-items: flex-start; /* Align items to the start */
      gap: 15px; /* Add gap between stacked items */
   }
   .dashboard-header h1 {
    font-size: calc(var(--font-size-titles-main) * 0.9); /* Slightly smaller title */
   }
   .user-indicator span {
    padding: 8px 12px; /* Adjust padding for user indicator */
    font-size: calc(var(--font-size-buttons) * 0.95);
   }
}

@media (max-width: 480px) {
  .dashboard-column {
    gap: 15px; /* Reduce gap between cards on very small screens */
  }
  .card {
    padding: 15px; /* Reduce card padding */
  }
  .card-title {
    font-size: calc(var(--font-size-subtitles) * 0.9);
  }
  .btn { /* Adjust button font size or padding if necessary */
    font-size: calc(var(--font-size-buttons) * 0.9);
    padding: 10px 15px;
  }
  .event-manager-card li, .tips-card li {
    padding: 8px 2px; /* Adjust list item padding */
  }
}
</style>
