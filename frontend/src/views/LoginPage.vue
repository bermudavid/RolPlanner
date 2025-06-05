<template>
  <div class="auth-page-container"> <!-- For centering -->
    <div class="card auth-form-card"> <!-- Card styling -->
      <h2 class="card-title">Login</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" v-model="username" id="username" required />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" v-model="password" id="password" required />
        </div>
        <p v-if="error" class="error-message">{{ error }}</p> <!-- Ensure .error-message is styled -->
        <button type="submit" class="btn">Login</button>
      </form>
    </div>
  </div>
</template>

<script>
import api from '../api';

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
        const response = await api.post('/auth/login', {
          username: this.username,
          password: this.password,
        });
        localStorage.setItem('token', response.data.access_token);
        
        let userRole = null;
        try {
            const token = response.data.access_token;
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch (e) {
            console.error('Error decoding token:', e);
            this.error = 'Login successful, but could not determine user role. Logging out.';
            localStorage.removeItem('token');
            this.$router.go(0);
            return;
        }

        if (userRole === 'Master') {
          this.$router.push('/master/dashboard');
        } else if (userRole === 'Player') {
          this.$router.push('/player/dashboard');
        } else {
          this.$router.push('/'); // Fallback to home
        }

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

<style scoped>
.auth-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* Adjust as needed, considering nav bar height perhaps */
  padding: 20px; /* Ensures some padding on smaller screens if card is too wide */
}

.auth-form-card {
  width: 100%;
  max-width: 400px; /* Or desired width */
  /* Card styles like background, padding, border-radius are from global .card */
}

.card-title {
  text-align: center; /* Center title in card */
  margin-bottom: 25px; /* More space after title */
  /* Font size and color are from global .card-title or h2 styles */
}

.form-group {
  margin-bottom: 20px; /* Increased margin for better spacing */
}

.form-group label {
  display: block;
  margin-bottom: 8px; /* Increased space after label */
  color: var(--color-text-secondary); /* From global CSS variables */
  font-size: 14px; /* Consistent label size */
  font-weight: 500; /* Slightly bolder labels */
}

/* Input fields will pick up global styles */

.error-message {
  color: #ff6b6b; /* A common error color */
  background-color: rgba(255, 107, 107, 0.1); /* Light red background */
  border: 1px solid #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 14px;
}

.btn {
  width: 100%; /* Make button full width of the card */
  padding: 12px; /* Slightly larger padding for better clickability */
  /* Other .btn styles (font, color, background, etc.) come from global CSS */
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
}
</style>
