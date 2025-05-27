<template>
  <div>
    <h2>Player Dashboard</h2>
    <p>Welcome, Player! This is where you will see available game sessions to join.</p>
    <!-- Session joining functionality will go here -->
    <hr>
    <p><strong>Temporary Test Link:</strong></p>
    <router-link to="/session/1">View Test Session (ID 1)</router-link>
  </div>
</template>

<script>
export default {
  name: 'PlayerDashboardPage',
};
</script>
