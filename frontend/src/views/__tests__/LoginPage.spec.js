// Polyfill btoa and atob if not available
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str).toString('base64');
}
if (typeof atob === 'undefined') {
  global.atob = (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString();
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPage from '../LoginPage.vue'; // Adjust path as needed
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock vue-router
const mockPush = vi.fn();
const mockGo = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    go: mockGo, // if used by the component
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
vi.stubGlobal('localStorage', mockLocalStorage);

// Mock atob for JWT decoding in component - this was already handled by global polyfill,
// but the test had a more specific mock. Let's keep the global one for consistency.
// vi.stubGlobal('atob', vi.fn(str => Buffer.from(str, 'base64').toString('binary')));


// Mock environment variables
vi.stubGlobal('import.meta.env', {
  VITE_API_BASE_URL: 'http://localhost:3000/api',
});


describe('LoginPage.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage store for each test if necessary
    mockLocalStorage.clear();
    wrapper = mount(LoginPage, {
      global: {
        stubs: {} // Add stubs if needed
      }
    });
  });

  it('renders the login form correctly', () => {
    expect(wrapper.find('h2').text()).toBe('Login');
    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('Login');
  });

  it('submits the form, calls login API, stores token, decodes role, and navigates for Player', async () => {
    const playerToken = 'fakeTokenPart1.' + btoa(JSON.stringify({ sub: 1, username: 'player', role: 'Player' })) + '.fakeTokenPart3';
    axios.post.mockResolvedValue({ data: { access_token: playerToken } });

    await wrapper.find('input#username').setValue('player');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      { username: 'player', password: 'password123' }
    );
    await wrapper.vm.$nextTick(); // Allow promises to resolve

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', playerToken);
    expect(mockPush).toHaveBeenCalledWith('/player/dashboard');
  });

  it('submits the form, calls login API, stores token, decodes role, and navigates for Master', async () => {
    const masterToken = 'fakeTokenPart1.' + btoa(JSON.stringify({ sub: 2, username: 'master', role: 'Master' })) + '.fakeTokenPart3';
    axios.post.mockResolvedValue({ data: { access_token: masterToken } });

    await wrapper.find('input#username').setValue('master');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      { username: 'master', password: 'password123' }
    );
    await wrapper.vm.$nextTick();

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', masterToken);
    expect(mockPush).toHaveBeenCalledWith('/master/dashboard');
  });

  it('displays an error message if login API call fails', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });

    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('wrongpassword');
    await wrapper.find('form').trigger('submit.prevent');

    expect(axios.post).toHaveBeenCalledTimes(1);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.error').text()).toBe('Invalid credentials');
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays an error and logs out if token decoding fails', async () => {
    const malformedToken = 'malformed.token'; // This token will cause atob to be called with "token"
    axios.post.mockResolvedValue({ data: { access_token: malformedToken } });

    // Ensure atob mock from polyfill is used, or override specifically for this test if needed
    // The global polyfill might be sufficient. If specific behavior for 'token' string is needed:
    const originalAtob = global.atob;
    global.atob = vi.fn(str => {
        if (str === 'token') throw new Error("Failed to decode base64 string");
        // Fallback to original polyfill or a simpler Buffer based one for other parts if any
        return Buffer.from(str, 'base64').toString('binary');
    });

    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    await wrapper.vm.$nextTick(); // for axios promise
    await wrapper.vm.$nextTick(); // for logic after promise

    expect(wrapper.find('.error').text()).toContain('Login successful, but could not determine user role.');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('dashboard'));

    global.atob = originalAtob; // Restore original atob mock/polyfill
  });
});
