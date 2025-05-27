<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" v-model="username" id="username" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" v-model="password" id="password" required />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      error: '',
    };
  },
  methods: {
    async login() {
      this.error = ''; // Clear previous errors
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          username: this.username,
          password: this.password,
        });
        localStorage.setItem('token', response.data.access_token);
        
        // The App.vue component will react to the route change and token presence
        // The router's beforeEach guard will handle redirection based on role
        
        // Attempt to trigger a route change or rely on App.vue's watcher
        // Forcing a navigation to '/' then letting the router redirect is one way
        // Or directly push to a generic path that router will resolve
        
        let userRole = null;
        try {
            const token = response.data.access_token;
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch (e) {
            console.error('Error decoding token:', e);
            this.error = 'Login successful, but could not determine user role. Logging out.';
            localStorage.removeItem('token');
            // Need to ensure App.vue also updates
            this.$router.go(0); // Force reload if App.vue doesn't react to token removal well
            return;
        }

        if (userRole === 'Master') {
          this.$router.push('/master/dashboard');
        } else if (userRole === 'Player') {
          this.$router.push('/player/dashboard');
        } else {
          this.$router.push('/'); // Fallback to home
        }
        // A more robust way to ensure App.vue updates is to emit an event or use a global store.
        // For now, App.vue's created hook and route watcher should handle it.

      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          this.error = Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message;
        } else {
          this.error = 'Login failed. Please try again.';
        }
        console.error(err);
      }
    },
  },
};
</script>
