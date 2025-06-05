<template>
  <div class="session-view-page">
    <header class="page-header session-header">
      <h1>Session: <span class="session-name">{{ sessionDisplayName }}</span></h1>
      <div class="session-status">Status: <span class="status-active">Active</span></div>
    </header>

    <div class="session-main-content">
      <div class="session-column main-column">
        <div class="card map-view-card" v-if="modelUrl">
          <MapViewer :model-url="modelUrl" />
        </div>
        <div class="card story-progression-card">
          <h2 class="card-title">Story Progression</h2>
          <div class="story-text">
            <p>The old tavern door creaks open, revealing a dimly lit room filled with the scent of ale and old wood. A mysterious figure in the corner beckons you closer, their face obscured by a heavy cloak. The air is thick with unspoken secrets and the low murmur of hushed conversations from other patrons.</p>
            <p>"Welcome, traveler," a raspy voice croaks from the figure. "You look like you've seen a few roads. Perhaps you're looking for something... or someone?"</p>
            <p>Around you, wanted posters plaster the walls, some faded and torn, others fresh. One particular poster near the bar catches your eye, detailing a hefty reward for a 'stolen artifact of immense power'.</p>
          </div>
        </div>

        <div class="card player-actions-card">
          <h2 class="card-title">Your Actions</h2>
          <div class="actions-grid">
            <button class="btn action-btn">Approach the Mysterious Figure</button>
            <button class="btn action-btn">Order a Drink at the Bar</button>
            <button class="btn action-btn">Examine the Wanted Posters</button>
            <button class="btn action-btn">Scan the Room for Exits</button>
            <button class="btn action-btn">Talk to the Barkeep</button>
            <button class="btn action-btn">Check Your Inventory</button>
          </div>
        </div>
      </div>

      <aside class="session-column side-column">
        <div class="card session-details-card">
          <h2 class="card-title">Session Details</h2>
          <p><strong>Objective:</strong> Uncover the truth behind the stolen Sunstone.</p>
          <p><strong>GM:</strong> MasterDM (The Storyteller)</p>
          <p><strong>Active Players:</strong></p>
          <ul>
            <li>Elara (PlayerOne) - Level 5 Ranger</li>
            <li>Grom (PlayerTwo) - Level 4 Barbarian</li>
            <li>Seraphina (PlayerThree) - Level 5 Sorcerer</li>
          </ul>
        </div>

        <div class="card event-log-card">
          <h2 class="card-title">Event Log</h2>
          <ul>
            <li v-for="(evt, idx) in eventLog" :key="idx">{{ evt }}</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import MapViewer from '../components/MapViewer.vue';
import api from '../api';
import { io } from 'socket.io-client';

export default {
  name: 'SessionViewPage',
  components: { MapViewer },
  data() {
    return {
      sessionId: null,
      sessionName: "[Placeholder Session Name]", // Could be fetched
      modelUrl: null,
      eventLog: [],
      socket: null,
      // userRole: null, // Example if needed for conditional rendering not shown in template
    };
  },
  computed: {
    sessionDisplayName() {
      // Example: could fetch actual session name based on ID
      return this.sessionName || `ID: ${this.sessionId}`;
    }
  },
  created() {
    this.sessionId = this.$route.params.id;
    this.fetchSessionDetails();

    this.socket = io('http://localhost:3000/sessions');
    this.socket.emit('joinSession', { sessionId: this.sessionId });
    this.socket.on('sessionEvent', payload => {
      this.eventLog.unshift(payload.message);
    });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    async fetchSessionDetails() {
      try {
        const { data } = await api.get(`/sessions/${this.sessionId}`);
        this.sessionName = data.name;
        if (data.campaign && data.campaign.model_path) {
          const base = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '');
          this.modelUrl = `${base}/${data.campaign.model_path}`;
        }
      } catch (e) {
        console.error('Failed to fetch session details:', e);
      }
    },
    // determineUserRole() {
    //   const token = localStorage.getItem('token');
    //   if (token) {
    //     try {
    //       const payload = JSON.parse(atob(token.split('.')[1]));
    //       this.userRole = payload.role;
    //     } catch (e) { console.error('Error decoding token:', e); this.userRole = null; }
    //   }
    // }
  }
};
</script>

<style scoped>
/* .session-view-page {
  Base padding handled by .page-container in App.vue if that class is applied to the router-view wrapper
} */

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px; /* Increased padding */
  border-bottom: 1px solid var(--color-accent-blue);
}

.session-header h1 {
  font-size: var(--font-size-titles-main);
  color: var(--color-text-primary);
  margin: 0;
}
.session-header .session-name {
  color: var(--color-text-secondary); /* Slightly different color for session name */
  font-style: italic; /* Italicize session name for distinction */
}

.session-status {
  font-family: var(--font-primary);
  font-size: var(--font-size-buttons); /* Using button font size */
  color: var(--color-text-secondary);
  background-color: var(--color-cards-panels); /* Consistent with other indicators */
  padding: 8px 15px;
  border-radius: 6px;
  border: 1px solid var(--color-accent-blue);
}
.session-status .status-active {
  color: #4CAF50; /* Green for active status */
  font-weight: bold;
}

.session-main-content {
  display: flex;
  gap: 25px; /* Increased gap */
  flex-wrap: wrap; /* Allow columns to wrap on smaller screens */
}

.session-column.main-column {
  flex: 2 1 450px; /* Main content takes more space, adjusted basis */
  display: flex;
  flex-direction: column;
  gap: 25px; /* Increased gap */
  min-width: 300px; /* Prevent excessive squishing */
}

.session-column.side-column {
  flex: 1 1 300px; /* Sidebar takes less space, adjusted basis */
  display: flex;
  flex-direction: column;
  gap: 25px; /* Increased gap */
  min-width: 280px; /* Prevent excessive squishing */
}

.card { /* Ensure cards take full width of their column */
    width: 100%;
}

.story-progression-card .story-text {
  font-size: 1.05em; /* Slightly larger for readability of story, relative to base */
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-height: 400px; /* Limit height and allow scroll if story is very long */
  overflow-y: auto;
  padding-right: 10px; /* For scrollbar spacing */
}

.story-progression-card .story-text p {
  margin-bottom: 1.2em; /* Paragraph spacing relative to font size */
}
/* Custom scrollbar for story text (optional, webkit only) */
.story-progression-card .story-text::-webkit-scrollbar {
  width: 8px;
}
.story-progression-card .story-text::-webkit-scrollbar-track {
  background: var(--color-buttons);
  border-radius: 4px;
}
.story-progression-card .story-text::-webkit-scrollbar-thumb {
  background: var(--color-accent-blue);
  border-radius: 4px;
}
.story-progression-card .story-text::-webkit-scrollbar-thumb:hover {
  background: var(--color-button-hover);
}


.player-actions-card .actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); /* Adjusted minmax */
  gap: 15px; /* Increased gap */
}

.player-actions-card .action-btn {
  width: 100%; /* Buttons take full width of their grid cell */
  padding: 12px 10px; /* Adjusted padding for potentially longer text */
  font-size: 0.95em; /* Slightly smaller font if actions text is long */
}

.session-details-card ul,
.event-log-card ul {
  list-style: none;
  padding-left: 0;
  font-size: var(--font-size-lists-events);
  color: var(--color-text-secondary);
  margin-top: 10px; /* Space above list */
}

.session-details-card li,
.event-log-card li {
  padding: 8px 5px; /* Adjusted padding */
  border-bottom: 1px solid var(--color-buttons);
  line-height: 1.5; /* Improve readability */
}

.session-details-card li:last-child,
.event-log-card li:last-child {
  border-bottom: none;
}

.session-details-card p {
    margin-bottom: 0.8em; /* Consistent paragraph spacing */
    font-size: var(--font-size-lists-events);
}
.session-details-card p strong {
 color: var(--color-text-primary);
 font-weight: 500; /* Medium weight for strong elements */
}


/* Card titles are globally styled. Reinforce or adjust if necessary. */
.card-title { /* This is already in global style.css for .card-title */
  font-size: var(--font-size-subtitles);
  /* font-weight: bold; from prompt, but 500 might be better for subtitles */
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 15px;
}

/* Buttons are globally styled. Reinforce or adjust if necessary. */
.btn { /* This is already in global style.css */
   font-size: var(--font-size-buttons);
}

@media (max-width: 900px) {
  .session-main-content {
    flex-direction: column; /* Stack main and side columns */
  }
  .session-column.main-column, .session-column.side-column {
    flex-basis: auto; /* Reset flex-basis */
    width: 100%;
    min-width: unset; /* Reset min-width */
  }
}

@media (max-width: 768px) {
   .session-header {
      flex-direction: column; /* Stack header items */
      align-items: flex-start; /* Align items to the start */
      gap: 10px; /* Add gap between stacked items */
   }
   .session-header h1 {
    font-size: calc(var(--font-size-titles-main) * 0.9);
   }
   .session-status {
    padding: 6px 10px;
    font-size: calc(var(--font-size-buttons) * 0.9);
   }
   .player-actions-card .actions-grid {
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); /* Smaller min button size for more density */
      gap: 10px;
   }
   .player-actions-card .action-btn {
    font-size: calc(0.95em * 0.95); /* Further reduce font if necessary */
    padding: 10px 8px;
   }
}

@media (max-width: 480px) {
  .session-column.main-column, .session-column.side-column {
    gap: 15px; /* Reduce gap between cards */
  }
  .card {
    padding: 15px; /* Reduce card padding */
  }
  .card-title {
    font-size: calc(var(--font-size-subtitles) * 0.9);
  }
  .story-progression-card .story-text {
    font-size: 1em; /* Adjust story text font size */
    max-height: 300px; /* Reduce max height */
  }
  .player-actions-card .actions-grid {
    grid-template-columns: 1fr; /* Stack action buttons */
  }
}
</style>
