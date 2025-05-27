<template>
  <div id="app">
    <nav>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/register">Register</router-link></li>
        <li v-if="isMaster"><router-link to="/master/dashboard">Master Dashboard</router-link></li>
        <li v-if="isPlayer"><router-link to="/player/dashboard">Player Dashboard</router-link></li>
        <li v-if="isLoggedIn"><button @click="logout">Logout</button></li>
      </ul>
    </nav>
    <div class="container">
      <router-view></router-view>
    </div>
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
      this.updateLoginState();
    }
  },
  created() {
    this.updateLoginState();
  }
};
</script>

<style>
/* Styles from style.css are global. Add any App-specific styles here if needed */
nav button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1em;
  text-decoration: underline;
}
nav button:hover {
  text-decoration: none;
}
</style>
