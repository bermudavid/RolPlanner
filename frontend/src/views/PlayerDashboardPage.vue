<template>
  <div class="player-dashboard-page">
    <header class="dashboard-header">
      <h1>Player Dashboard</h1>
      <div class="user-indicator">
        <span>Player</span> <!-- Or use actual username if available -->
      </div>
    </header>

    <div class="dashboard-main-content">
      <div class="dashboard-column full-width-column">
        <!-- Error Display -->
        <div v-if="error" class="error-message">{{ error }}</div>

        <!-- Loading Indicator -->
        <div v-if="isLoading && !error" class="loading-indicator">
          <p>Loading campaigns...</p>
        </div>

        <!-- Joined Campaigns Section -->
        <div class="card joined-campaigns-card" v-if="!isLoading">
          <h2 class="card-title">My Joined Campaigns</h2>
          <div v-if="joinedCampaigns.length === 0">
            <p>You haven't joined any campaigns yet. Explore available campaigns below!</p>
          </div>
          <ul v-else>
            <li v-for="campaign in joinedCampaigns" :key="'joined-' + campaign.id">
              <h3>{{ campaign.name }}</h3>
              <p class="campaign-description">{{ campaign.description }}</p>
              <p class="campaign-master">Master: {{ getMasterUsername(campaign) }}</p>
              <button class="btn btn-danger" @click="leaveCampaign(campaign.id)">Leave Campaign</button>
            </li>
          </ul>
        </div>

        <!-- Available Campaigns Section -->
        <div class="card available-campaigns-card" v-if="!isLoading">
          <h2 class="card-title">Available Campaigns to Join</h2>
          <div v-if="availableCampaigns.length === 0 && !isLoading">
             <p>No campaigns available to join at the moment, or all are joined.</p>
          </div>
          <ul v-else>
            <li v-for="campaign in availableCampaigns" :key="'avail-' + campaign.id">
              <h3>{{ campaign.name }}</h3>
              <p class="campaign-description">{{ campaign.description }}</p>
              <p class="campaign-master">Master: {{ getMasterUsername(campaign) }}</p>
              <button class="btn" @click="joinCampaign(campaign.id)" v-if="!isJoined(campaign.id)">Join Campaign</button>
              <button class="btn btn-disabled" disabled v-else>Already Joined</button>
            </li>
          </ul>
        </div>

        <!-- Existing cards can remain or be adjusted as needed -->
        <div class="card character-summary-card">
          <h2 class="card-title">My Character: Elara Windrider</h2>
          <p>Level 5 Ranger</p>
          <p>Health: 45/45 | Focus: 30/30</p>
          <p>Key Item: Sunstone Amulet</p>
          <button class="btn">View Full Character Sheet</button>
        </div>

        <div class="card recent-activity-card">
          <h2 class="card-title">Recent Activity Log</h2>
          <ul>
            <li>Successfully navigated the Whispering Caves.</li>
            <li>Discovered the hidden glade and spoke with the Elder Treant.</li>
            <li>Acquired the Sunstone from the ancient ruins.</li>
            <li>Leveled up to 5 after defeating the Shadow Stalker.</li>
            <li>Session "The Sunstone Quest" ended.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // Assuming axios is installed and configured

export default {
  name: 'PlayerDashboardPage',
  data() {
    return {
      availableCampaigns: [],
      joinedCampaigns: [],
      error: null,
      isLoading: false,
    };
  },
  methods: {
    async fetchAllCampaigns() {
      this.isLoading = true;
      this.error = null;
      try {
        // Ensure your API prefix is correct, e.g., /api from vue.config.js or direct
        const response = await axios.get('/api/campaigns');
        this.availableCampaigns = response.data;
      } catch (err) {
        this.error = 'Failed to load available campaigns. ' + (err.response?.data?.message || err.message);
        console.error("Error fetching all campaigns:", err);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchJoinedCampaigns() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get('/api/campaigns/player/my-campaigns'); // Auth needed
        this.joinedCampaigns = response.data;
      } catch (err) {
        this.error = 'Failed to load your joined campaigns. ' + (err.response?.data?.message || err.message);
        console.error("Error fetching joined campaigns:", err);
      } finally {
        this.isLoading = false;
      }
    },
    async joinCampaign(campaignId) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.post(`/api/campaigns/${campaignId}/join`); // Auth needed
        // alert('Successfully joined campaign!'); // Optional: use a more sophisticated notification system
        await this.fetchAllCampaigns(); // Refresh available (might change status)
        await this.fetchJoinedCampaigns(); // Refresh joined
      } catch (err) {
        this.error = 'Failed to join campaign. ' + (err.response?.data?.message || err.message);
        console.error("Error joining campaign:", err);
      } finally {
        this.isLoading = false;
      }
    },
    async leaveCampaign(campaignId) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.post(`/api/campaigns/${campaignId}/leave`); // Auth needed
        // alert('Successfully left campaign!'); // Optional
        await this.fetchAllCampaigns(); // Refresh available
        await this.fetchJoinedCampaigns(); // Refresh joined
      } catch (err) {
        this.error = 'Failed to leave campaign. ' + (err.response?.data?.message || err.message);
        console.error("Error leaving campaign:", err);
      } finally {
        this.isLoading = false;
      }
    },
    isJoined(campaignId) {
      return this.joinedCampaigns.some(campaign => campaign.id === campaignId);
    },
    // Utility to get master username, handling potential undefined master
    getMasterUsername(campaign) {
      return campaign.master && campaign.master.username ? campaign.master.username : 'N/A';
    }
  },
  created() {
    // Assuming auth token is set globally for axios, e.g., in main.js or an axios interceptor
    // Example: axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    this.fetchAllCampaigns();
    this.fetchJoinedCampaigns();
  },
};
</script>

<style scoped>
.error-message {
  color: var(--color-accent-red);
  background-color: rgba(255, 0, 0, 0.1);
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  border: 1px solid var(--color-accent-red);
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-size: var(--font-size-large); /* Ensure this var exists or use direct value */
  color: var(--color-text-secondary);
}
.loading-indicator p {
    font-size: var(--font-size-subtitles); /* Example size, adjust as needed */
}

/* .player-dashboard-page {
  Base padding handled by .page-container in App.vue if that class is applied to the router-view wrapper
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
  font-size: var(--font-size-buttons); /* Using button font size */
  color: var(--color-text-primary); /* Primary text for better visibility */
  background-color: var(--color-buttons); /* Using button color */
  padding: 10px 18px; /* Adjusted padding */
  border-radius: 6px;
  border: 1px solid var(--color-accent-blue);
  font-weight: 500;
}

.dashboard-main-content {
  /* No flex columns needed for a single column layout, direct children will stack */
}

.dashboard-column.full-width-column {
  display: flex;
  flex-direction: column;
  gap: 25px; /* Increased space between cards */
}

/* Card specific styles */
.card {
   width: 100%; /* Ensure cards take full width of the column */
}

.campaign-description {
  margin-bottom: 8px;
  font-size: var(--font-size-small-text); /* Or your preferred size */
  color: var(--color-text-secondary);
}

.campaign-master {
  margin-bottom: 12px;
  font-style: italic;
  font-size: var(--font-size-small-text);
  color: var(--color-text-secondary);
}

.joined-campaigns-card ul,
.available-campaigns-card ul,
.recent-activity-card ul {
  list-style: none;
  padding-left: 0;
  font-size: var(--font-size-lists-events);
  color: var(--color-text-secondary);
  margin-top: 15px; /* Space above list */
}

.joined-campaigns-card li,
.available-campaigns-card li,
.recent-activity-card li {
  padding: 15px 5px; /* Increased padding for better separation */
  border-bottom: 1px solid var(--color-buttons);
  line-height: 1.5;
}
.joined-campaigns-card li h3,
.available-campaigns-card li h3 {
  font-size: var(--font-size-card-subtitle); /* Assuming you have such a variable */
  color: var(--color-text-primary);
  margin-bottom: 8px;
}


.joined-campaigns-card li:last-child,
.available-campaigns-card li:last-child,
.recent-activity-card li:last-child {
  border-bottom: none;
}

/* Button styling adjustments */
.btn {
  width: auto; /* Override full width if previously set for all buttons */
  padding: 8px 15px; /* Adjust padding for smaller action buttons */
  font-size: calc(var(--font-size-buttons) * 0.9); /* Slightly smaller font for action buttons */
  margin-right: 10px; /* Space between buttons if multiple */
  margin-top: 10px; /* Add some top margin for spacing from text */
}

.btn-danger {
  background-color: var(--color-accent-red); /* Ensure this var exists */
  color: var(--color-text-on-dark-bg); /* Ensure this var exists */
  border: 1px solid var(--color-accent-red-dark); /* Ensure this var exists */
}
.btn-danger:hover {
  background-color: var(--color-accent-red-dark); /* Ensure this var exists */
}

.btn-disabled {
  background-color: var(--color-button-disabled-bg); /* Ensure this var exists */
  color: var(--color-text-disabled); /* Ensure this var exists */
  border: 1px solid var(--color-button-disabled-border); /* Ensure this var exists */
  cursor: not-allowed;
}

/* Ensure full-width buttons in other cards still look good, or adjust their specific styles */
.character-summary-card .btn {
  margin-top: 20px;
  width: 100%; /* Keep this full width */
   /* Reset padding if affected by general .btn changes above and needs to be larger */
  padding: 12px 20px;
  font-size: var(--font-size-buttons);
}

.character-summary-card p {
  margin-bottom: 10px; /* Spacing for paragraphs in character summary */
  font-size: var(--font-size-lists-events); /* Consistent font size */
  /* Resetting top margin for buttons if general btn styles added one */
}
.character-summary-card .btn {
    margin-top: 20px; /* Explicitly define top margin for this specific button */
}

/* Ensure list items inside cards don't have conflicting paragraph margins */
.card ul li p {
  margin-bottom: 5px; /* Standard spacing for paragraphs within list items */
}
.card ul li p.campaign-master {
  margin-bottom: 10px; /* More space before action buttons */
}

/* Titles for campaign items */
.card ul li h3 {
  font-size: var(--font-size-card-item-title); /* Define if not existing, e.g., 1.1rem */
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

/* Paragraphs inside list items */
.card ul li p {
  font-size: var(--font-size-base-text); /* Or a specific smaller size */
  color: var(--color-text-secondary);
}
.character-summary-card p:first-of-type { /* After title */
    margin-top: 5px;
}


/* Card titles are globally styled. Reinforce or adjust if necessary. */
.card-title { /* This is already in global style.css for .card-title */
  font-size: var(--font-size-subtitles);
  /* font-weight: bold; from prompt, but 500 might be better if "bold" is too much for subtitles */
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 15px; /* Consistent margin */
}

/* Buttons are globally styled. Reinforce or adjust if necessary. */
.btn { /* This is already in global style.css */
   font-size: var(--font-size-buttons);
   /* other properties like padding, color, bg-color are global */
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
  .dashboard-column.full-width-column {
    gap: 15px; /* Reduce gap between cards */
  }
  .card {
    padding: 15px; /* Reduce card padding */
  }
  .card-title {
    font-size: calc(var(--font-size-subtitles) * 0.9);
  }
  .btn {
    font-size: calc(var(--font-size-buttons) * 0.9);
    padding: 10px 15px;
  }
  .active-campaigns-card ul, .recent-activity-card ul, .character-summary-card p {
    font-size: calc(var(--font-size-lists-events) * 0.95); /* Adjust list/paragraph font size */
  }
}
</style>
