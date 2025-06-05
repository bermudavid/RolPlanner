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
            <button type="submit" class="btn">Save</button>
          </form>
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
import axios from 'axios';

export default {
  name: 'MasterDashboardPage',
  data() {
    return {
      showForm: false,
      name: '',
      description: '',
      file: null,
    };
  },
  methods: {
    onFileChange(e) {
      this.file = e.target.files[0];
    },
    async createCampaign() {
      const formData = new FormData();
      formData.append('name', this.name);
      formData.append('description', this.description);
      if (this.file) {
        formData.append('model', this.file);
      }
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/campaigns`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      this.showForm = false;
      this.name = '';
      this.description = '';
      this.file = null;
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
  display: flex;
  gap: 25px; /* Increased space between columns */
  flex-wrap: wrap; /* Allow columns to wrap on smaller screens */
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 25px; /* Increased space between cards within a column */
}

.left-column {
  flex: 1 1 280px; /* Flex grow, shrink, basis. Basis helps with responsiveness */
  min-width: 280px;
}

.center-column {
  flex: 2 1 400px;
  min-width: 300px; /* Ensure it doesn't get too squished */
}

.right-column {
  flex: 1 1 280px;
  min-width: 280px;
}

/* Card specific styles */
.card {
  /* Global .card styles (padding, bg, border-radius) will apply. */
  /* Add any specific overrides or additions here if necessary. */
  /* For example, ensuring cards fill column width if not by default: */
   width: 100%;
}

.campaigns-card .btn {
  margin-top: 15px;
  width: 100%; /* Make button full width */
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
  min-height: 250px; /* Increased height */
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

@media (max-width: 1024px) { /* Breakpoint for larger tablets or smaller desktop views */
  .dashboard-main-content {
    flex-direction: column; /* Stack columns */
  }
  .left-column, .center-column, .right-column {
    flex-basis: auto; /* Reset flex-basis to allow natural sizing in column flow */
    width: 100%; /* Each column takes full width */
    min-width: unset; /* Reset min-width if it causes issues in column layout */
  }
  .center-column {
    order: -1; /* Optionally move center column (e.g., map) to top on mobile */
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
