<template>
  <div class="session-view">
    <h2>Game Session</h2>
    <p>Session ID: {{ sessionId }}</p>

    <MapViewer v-if="modelUrl" :modelUrl="modelUrl" />
    <div v-else>
      <p>Loading map...</p>
    </div>

    <hr class="separator" />

    <div class="session-content">
      <div class="events-panel">
        <h3>Session Events</h3>
        <div v-if="events.length === 0" class="no-events">
          No events yet.
        </div>
        <ul v-else class="event-list">
          <li v-for="(event, index) in events" :key="index" class="event-item">
            {{ event.message }}
          </li>
        </ul>
      </div>

      <div v-if="isMasterUser" class="master-controls">
        <h3>Master Controls</h3>
        <form @submit.prevent="sendEvent" class="event-form">
          <div class="form-group">
            <label for="eventMessage">Event Message:</label>
            <textarea v-model="newEventMessage" id="eventMessage" rows="3" required></textarea>
          </div>
          <p v-if="eventError" class="error">{{ eventError }}</p>
          <button type="submit">Send Event</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import MapViewer from '../components/MapViewer.vue';

export default {
  name: 'SessionViewPage',
  components: {
    MapViewer,
  },
  data() {
    return {
      sessionId: null,
      modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
      events: [], // To store event messages locally
      newEventMessage: '',
      eventError: '',
      userRole: null, // To determine if the current user is a Master
    };
  },
  computed: {
    isMasterUser() {
      return this.userRole === 'Master';
    }
  },
  created() {
    this.sessionId = this.$route.params.id;
    this.determineUserRole();
    // In a real app, you would fetch session details here, including the map/model URL
    // and potentially existing events if they were persisted and retrievable.
  },
  methods: {
    determineUserRole() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userRole = payload.role;
        } catch (e) {
          console.error('Error decoding token:', e);
          this.userRole = null;
        }
      }
    },
    async sendEvent() {
      if (!this.newEventMessage.trim()) {
        this.eventError = "Event message cannot be empty.";
        return;
      }
      this.eventError = '';

      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `http://localhost:3000/api/sessions/${this.sessionId}/event`,
          { message: this.newEventMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Add to local events array for immediate display (MVP simulation)
        this.events.push({ message: this.newEventMessage, sender: 'Master (Self)' }); // Added sender for clarity
        this.newEventMessage = ''; // Clear the input field
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          this.eventError = Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message;
        } else {
          this.eventError = 'Failed to send event. Please try again.';
        }
        console.error('Error sending event:', err);
      }
    },
  }
};
</script>

<style scoped>
.session-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.map-viewer-container { /* Assuming this class is inside MapViewer.vue or applied to its root */
  margin-bottom: 20px;
}

.separator {
  margin: 20px 0;
}

.session-content {
  display: flex;
  gap: 20px;
}

.events-panel {
  flex: 2;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  background-color: #f9f9f9;
  max-height: 400px; /* Or adjust as needed */
  overflow-y: auto;
}

.events-panel h3 {
  margin-top: 0;
}

.no-events {
  color: #777;
  font-style: italic;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-item {
  background-color: #fff;
  border: 1px solid #eee;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.master-controls {
  flex: 1;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.master-controls h3 {
  margin-top: 0;
}

.event-form textarea {
  width: calc(100% - 22px);
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.event-form button {
  background-color: #5cb85c;
  color: white;
}

.event-form button:hover {
  background-color: #4cae4c;
}

.error {
  color: #d9534f; /* Bootstrap danger color */
  margin-bottom: 10px;
}
</style>
