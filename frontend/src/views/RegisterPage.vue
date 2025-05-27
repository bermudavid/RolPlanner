<template>
  <div>
    <h2>Register</h2>
    <form @submit.prevent="register">
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" v-model="username" id="username" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" v-model="password" id="password" required />
      </div>
      <div class="form-group">
        <label for="role">Role:</label>
        <select v-model="role" id="role" required>
          <option value="Player">Player</option>
          <option value="Master">Master</option>
        </select>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      username: '',
      password: '',
      role: 'Player', // Default role
      error: '',
      success: '',
    };
  },
  methods: {
    async register() {
      this.error = '';
      this.success = '';
      try {
        await axios.post('http://localhost:3000/api/auth/register', {
          username: this.username,
          password: this.password,
          role: this.role,
        });
        this.success = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
         this.error = Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message;
        } else {
          this.error = 'Registration failed. Please try again.';
        }
        console.error(err);
      }
    },
  },
};
</script>

<style scoped>
.success {
  color: green;
  margin-bottom: 10px;
}
</style>
