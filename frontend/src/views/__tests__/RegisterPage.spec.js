// Polyfill btoa if not available
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str).toString('base64');
}
if (typeof atob === 'undefined') { // atob is also used in LoginPage.vue
    global.atob = (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString();
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RegisterPage from '../RegisterPage.vue'; // Adjust path as needed
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock environment variables
vi.stubGlobal('import.meta.env', {
  VITE_API_BASE_URL: 'http://localhost:3000/api',
});

describe('RegisterPage.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          // If there are child components that are not relevant and complex, stub them here
          // Example: 'ChildComponent': true
        }
      }
    });
  });

  it('renders the registration form correctly', () => {
    expect(wrapper.find('h2').text()).toBe('Register');
    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('select#role').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('Register');
  });

  it('submits the form and calls the register API successfully, then navigates', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Registration successful' } });

    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('select#role').setValue('Player');
    await wrapper.find('form').trigger('submit.prevent');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register',
      { username: 'testuser', password: 'password123', role: 'Player' }
    );

    // Wait for potential DOM updates if success message is shown before navigation
    await wrapper.vm.$nextTick();
    // Wait for setTimeout used for redirection
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000); // As per component's setTimeout
    vi.useRealTimers();

    expect(wrapper.find('.success-message').text()).toContain('Registration successful!');
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('displays an error message if registration API call fails', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'Username already exists' } }
    });

    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(axios.post).toHaveBeenCalledTimes(1);

    await wrapper.vm.$nextTick(); // Wait for error message to render
    expect(wrapper.find('.error-message').text()).toBe('Username already exists');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays a generic error message if API error response is not structured as expected', async () => {
    axios.post.mockRejectedValue(new Error('Network Error')); // Simulate a different error

    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-message').text()).toBe('Registration failed. Please try again.');
  });
});
