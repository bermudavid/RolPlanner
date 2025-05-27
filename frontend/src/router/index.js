import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import MasterDashboardPage from '../views/MasterDashboardPage.vue';
import PlayerDashboardPage from '../views/PlayerDashboardPage.vue';
import SessionViewPage from '../views/SessionViewPage.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', component: RegisterPage, meta: { guestOnly: true } },
  {
    path: '/master/dashboard',
    component: MasterDashboardPage,
    meta: { requiresAuth: true, role: 'Master' }
  },
  {
    path: '/player/dashboard',
    component: PlayerDashboardPage,
    meta: { requiresAuth: true, role: 'Player' }
  },
  {
    path: '/session/:id',
    component: SessionViewPage,
    meta: { requiresAuth: true } // Accessible by both Player and Master
  },
  // Redirect to home if path not found
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const loggedIn = !!localStorage.getItem('token');
  let userRole = null;

  if (loggedIn) {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role;
    } catch (e) {
      console.error('Error decoding token for routing:', e);
      localStorage.removeItem('token'); // Clear invalid token
      // Potentially redirect to login or show an error
      return next('/login');
    }
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!loggedIn) {
      next('/login');
    } else {
      if (to.meta.role && to.meta.role !== userRole) {
        // Role mismatch, redirect to home or an unauthorized page
        next('/'); // Or a specific unauthorized page
      } else {
        next(); // Proceed
      }
    }
  } else if (to.matched.some(record => record.meta.guestOnly)) {
    if (loggedIn) {
      // If user is logged in, redirect from guest-only pages
      if (userRole === 'Master') {
        next('/master/dashboard');
      } else if (userRole === 'Player') {
        next('/player/dashboard');
      } else {
        next('/'); // Fallback if role is somehow not set
      }
    } else {
      next(); // Proceed
    }
  } else {
    next(); // Always proceed for public pages or if no specific meta rules apply
  }
});

export default router;
