<template>
  <div id="app"> 
    <header class="global-header"> 
       <nav class="global-nav">
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
            <li v-if="!isLoggedIn"><router-link to="/register">Register</router-link></li>
            <li v-if="isMaster"><router-link to="/master/dashboard">Master Dashboard</router-link></li>
            <li v-if="isPlayer"><router-link to="/player/dashboard">Player Dashboard</router-link></li>
            <li v-if="isLoggedIn"><button @click="logout">Logout</button></li>
          </ul> 
      </nav>
    </header>
    <main class="main-content page-container">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      userRole: null,
    };
  },
  computed: {
    isMaster() {
      return this.isLoggedIn && this.userRole === 'Master';
    },
    isPlayer() {
      return this.isLoggedIn && this.userRole === 'Player';
    }
  },
  methods: {
    updateLoginState() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userRole = payload.role;
        } catch (e) {
          console.error('Error decoding token:', e);
          this.logout(); // Clear invalid token
        }
      } else {
        this.userRole = null;
      }
    },
    logout() {
      localStorage.removeItem('token');
      this.updateLoginState();
      this.$router.push('/login');
    }
  },
  watch: {
    '$route'() {
      // This watcher ensures login state is updated on route changes.
      // Useful if parts of the app outside <router-view> depend on this state,
      // or if guards rely on this state being fresh.
      this.updateLoginState();
    }
  },
  created() {
    this.updateLoginState();
  }
};
</script>

<style scoped>
/* New styles for the global header and navigation */
.global-header {
  background-color: var(--color-cards-panels); /* Using card color for header bg */
  padding: 15px 30px; /* Vertical padding, horizontal padding */
  border-bottom: 1px solid var(--color-accent-blue);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  /* Ensure it spans full width if #app has max-width and margin auto for centering content */
  /* This might require #app to not have padding that restricts header width, */
  /* or header to be outside the main centered content of #app if that's the case */
}

.global-nav {
  display: flex;
  justify-content: flex-start; /* Align links to the start */
  align-items: center;
  gap: 25px; /* Space between nav links */
  /* If #app is centered with max-width, this nav will also be within that centered block. */
  /* If header needs to be full-width while page content is centered, structure of #app might need review. */
  /* For now, assuming #app allows header to appear as a top bar. */
  max-width: 1280px; /* Align with typical max-width for content if needed */
  margin: 0 auto; /* Center nav content if header is full-width */
}

.nav-link {
  font-family: var(--font-primary);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 16px; /* Or var(--font-size-buttons) */
  padding: 8px 0; /* Adjusted padding for better vertical alignment and spacing */
  transition: color 0.3s ease, border-bottom-color 0.3s ease;
  border-bottom: 2px solid transparent; /* For hover/active effect */
  font-weight: 500; /* Medium weight for nav links */
}

.nav-link:hover {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-accent-blue);
}

.nav-link.router-link-exact-active { /* Styling for the active link */
  color: var(--color-text-primary);
  font-weight: bold; /* Bolder for active link */
  border-bottom-color: var(--color-text-primary); /* Or a more prominent accent color */
}

/* Example for a logout button if it were styled as a nav-link */
.logout-button {
  background: none;
  border: none;
  cursor: pointer;
  /* Inherits .nav-link styles if class is combined, or define separately */
}
</style>
