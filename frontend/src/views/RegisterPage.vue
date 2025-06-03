<template>
  <div class="auth-page-container">
    <div class="card auth-form-card">
      <h2 class="card-title">Register</h2>
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
        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">{{ success }}</p>
        <button type="submit" class="btn">Register</button>
      </form>
    </div>
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
        // Assuming your API returns some data upon successful registration if needed
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
          username: this.username,
          password: this.password,
          role: this.role,
        });
        this.success = 'Registration successful! Redirecting to login...';
        // Consider clearing form fields here if desired
        // this.username = '';
        // this.password = '';
        // this.role = 'Player';
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
.auth-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* Adjust as needed */
  padding: 20px;
}

.auth-form-card {
  width: 100%;
  max-width: 400px;
}

.card-title {
  text-align: center;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
}

/* Input and select fields will pick up global styles */

.error-message {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 14px;
}

.success-message {
  color: #4CAF50; /* Material Design green for success */
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 12px;
}

@media (max-width: 480px) {
  .auth-form-card {
    margin-left: 10px; /* Reduce horizontal margin */
    margin-right: 10px;
    padding: 20px; /* Adjust padding */
    max-width: calc(100% - 20px); /* Ensure it doesn't exceed screen width due to margins */
  }
  .card-title {
     font-size: calc(var(--font-size-subtitles) * 0.9); /* Slightly smaller title */
  }
  .btn {
    padding: 10px; /* Slightly smaller button padding */
  }
  .form-group {
    margin-bottom: 15px; /* Slightly reduce form group margin */
  }
}
</style>
