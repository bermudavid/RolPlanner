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
        <div class="card active-campaigns-card">
          <h2 class="card-title">My Active Campaigns</h2>
          <p>You are currently participating in <strong>"The Dragon's Curse"</strong>.</p>
          <ul>
            <li>Campaign: The Dragon's Curse - Session 5 ongoing. Next session: Tomorrow at 7 PM.</li>
            <li>Campaign: Secrets of the Old Forest - Awaiting Game Master to schedule next session.</li>
          </ul>
          <button class="btn">View Campaign Details</button>
        </div>

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
export default {
  name: 'PlayerDashboardPage',
  // Add methods or data properties if needed for interactivity
};
</script>

<style scoped>
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
  background-color: var(--color-buttons-end); /* Using button color */
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

.active-campaigns-card .btn,
.character-summary-card .btn {
  margin-top: 20px; /* Increased margin for better separation */
  width: 100%; /* Make buttons full width */
}

.active-campaigns-card ul,
.recent-activity-card ul {
  list-style: none; /* Consider using a more thematic list style if desired */
  padding-left: 0;
  font-size: var(--font-size-lists-events);
  color: var(--color-text-secondary);
  margin-top: 15px; /* Space above list */
}

.active-campaigns-card li,
.recent-activity-card li {
  padding: 10px 5px; /* Adjusted padding */
  border-bottom: 1px solid var(--color-buttons-end);
  line-height: 1.5; /* Improve readability */
}

.active-campaigns-card li:last-child,
.recent-activity-card li:last-child {
  border-bottom: none;
}

.character-summary-card p {
  margin-bottom: 10px; /* Spacing for paragraphs in character summary */
  font-size: var(--font-size-lists-events); /* Consistent font size */
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
