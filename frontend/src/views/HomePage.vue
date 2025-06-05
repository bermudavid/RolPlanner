<template>
  <div class="home-page-container">
    <img src="../assets/banner.svg" alt="Rol Planner banner" class="home-banner" />
    <div class="card welcome-card">
      <h1 class="card-title">Welcome to the Interactive Fiction Platform</h1>
      <p>
        Discover, create, and play engaging interactive stories.
        Log in or register to start your adventure.
      </p>
      <div class="home-actions">
        <button @click="explore" class="btn">Explore Stories</button>
        <!-- Example: Player might go to /player/dashboard, Master to /master/dashboard -->
        <!-- These would typically be router-links if always available, or shown conditionally -->
        <!-- <router-link to="/login" class="btn">Login</router-link> -->
        <!-- <router-link to="/register" class="btn btn-secondary">Register</router-link> -->
      </div>
    </div>

    <div class="card features-card">
      <h2 class="card-title">Platform Features</h2>
      <ul>
        <li>Create your own branching narratives.</li>
        <li>Play stories created by others.</li>
        <li>Immersive storytelling experience.</li>
        <li>(More features coming soon!)</li>
      </ul>
    </div>

  </div>
</template>

<script>
export default {
  name: 'HomePage',
  methods: {
    explore() {
      // Placeholder action for "Explore Stories"
      // In a real app, this might navigate to a public stories listing
      alert('Navigating to story exploration (not implemented yet).');
      // Or, if there's a public route: this.$router.push('/stories');
    },
    // goToLogin() {
    //   this.$router.push('/login');
    // }
  }
};
</script>

<style scoped>
.home-page-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* Centers cards horizontally */
  padding-top: 20px; /* Add some space at the top */
}

.home-banner {
  width: 100%;
  max-width: 1000px;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.welcome-card, .features-card {
  text-align: center;
  width: 100%;
  max-width: 700px; /* Adjust as needed */
  margin-bottom: 30px; /* Space between cards */
  /* General card styling (background, padding, border) comes from global .card */
}

.card-title {
  /* Font size and color from global .card-title or h1/h2 */
  margin-bottom: 20px; /* Space below title */
}

.welcome-card p {
  font-size: var(--font-size-subtitles); /* Use subtitle font size for emphasis */
  color: var(--color-text-secondary);
  margin-bottom: 25px;
  line-height: 1.7;
}

.home-actions .btn {
  margin: 0 10px; /* Space out buttons if multiple are present */
}

.features-card ul {
  list-style-type: none; /* Remove default bullet points */
  padding: 0;
  margin: 0;
  color: var(--color-text-secondary);
}

.features-card li {
  padding: 8px 0; /* Spacing for list items */
  border-bottom: 1px solid var(--color-accent-blue); /* Subtle separator */
  font-size: var(--font-size-lists-events);
}

.features-card li:last-child {
  border-bottom: none; /* Remove border for the last item */
}

@media (max-width: 768px) {
  .welcome-card, .features-card {
    max-width: 95%; /* Allow cards to use more width on smaller screens */
    margin-left: auto; /* Keep them centered */
    margin-right: auto;
    padding: 15px; /* Adjust padding for smaller cards */
  }

  .card-title {
    font-size: calc(var(--font-size-subtitles) * 0.95); /* Slightly smaller titles */
  }

  .welcome-card p {
    font-size: calc(var(--font-size-subtitles) * 0.9); /* Adjust paragraph font size */
  }

  .home-actions .btn {
    padding: 10px 15px; /* Adjust button padding */
    font-size: calc(var(--font-size-buttons) * 0.95);
  }

  .features-card li {
    font-size: calc(var(--font-size-lists-events) * 0.95);
  }
}

@media (max-width: 480px) {
  .welcome-card, .features-card {
    padding: 10px;
  }
  .card-title {
    font-size: calc(var(--font-size-subtitles) * 0.85);
    margin-bottom: 15px;
  }
  .welcome-card p {
    font-size: calc(var(--font-size-subtitles) * 0.85);
    margin-bottom: 20px;
  }
  .home-actions .btn {
    width: 100%; /* Stack buttons */
    margin-bottom: 10px;
  }
  .home-actions .btn:last-child {
    margin-bottom: 0;
  }
}
</style>
