<template>
  <div id="app"> 
      <header class="global-header">
        <nav class="global-nav">
          <ul class="nav-list">
            <li class="nav-item"><router-link to="/" class="nav-link">Home</router-link></li>
            <li class="nav-item" v-if="!isLoggedIn"><router-link to="/login" class="nav-link">Login</router-link></li>
            <li class="nav-item" v-if="!isLoggedIn"><router-link to="/register" class="nav-link">Register</router-link></li>
            <li class="nav-item" v-if="isMaster"><router-link to="/master/dashboard" class="nav-link">Master Dashboard</router-link></li>
            <li class="nav-item" v-if="isPlayer"><router-link to="/player/dashboard" class="nav-link">Player Dashboard</router-link></li>
          </ul>
        </nav>
        <button v-if="isLoggedIn" @click="logout" class="btn logout-button">Logout</button>
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
  background: linear-gradient(45deg,
      var(--color-cards-panels),
      var(--color-buttons-end));
  padding: 15px 30px;
  border-bottom: 1px solid var(--color-accent-gold);
  box-shadow: 0 2px 5px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.global-nav {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 25px;
  width: 100%;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 25px;
}

.nav-item {
  margin: 0;
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
  color: var(--color-accent-gold);
  border-bottom-color: var(--color-accent-gold);
}

.nav-link.router-link-exact-active { /* Styling for the active link */
  color: var(--color-accent-gold);
  font-weight: bold; /* Bolder for active link */
  border-bottom-color: var(--color-accent-gold); /* Or a more prominent accent color */
}

.logout-button {
  margin-left: 15px;
}
</style>
