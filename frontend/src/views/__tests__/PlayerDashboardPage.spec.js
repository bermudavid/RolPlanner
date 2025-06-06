// Polyfill btoa and atob if not available
if (typeof btoa === 'undefined') {
  global.btoa = str => Buffer.from(str).toString('base64');
}
if (typeof atob === 'undefined') {
  global.atob = b64 => Buffer.from(b64, 'base64').toString();
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerDashboardPage from '../PlayerDashboardPage.vue';
import api from '../../api';

vi.mock('../../api');

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
vi.stubGlobal('localStorage', mockLocalStorage);

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  })
}));

vi.stubGlobal('import.meta.env', {
  VITE_API_BASE_URL: 'http://localhost:3000/api'
});

const sampleSessions = [
  {
    id: 1,
    name: 'S1',
    status: 'Pending',
    campaign: { id: 2, name: 'C1', description: 'd1', is_public: true },
    active_players: []
  },
  {
    id: 2,
    name: 'S2',
    status: 'Active',
    campaign: { id: 3, name: 'C2', description: 'd2', is_public: true },
    active_players: [{ id: 10 }]
  }
];

const sampleCampaigns = [
  { id: 2, name: 'C1', description: 'd1' },
  { id: 3, name: 'C2', description: 'd2' }
];

describe('PlayerDashboardPage.vue', () => {
  let wrapper;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    const token = 'part.' + btoa(JSON.stringify({ sub: 10, role: 'Player' })) + '.sig';
    mockLocalStorage.setItem('token', token);
    api.get.mockImplementation(url => {
      if (url === '/sessions') return Promise.resolve({ data: sampleSessions });
      if (url === '/campaigns') return Promise.resolve({ data: sampleCampaigns });
      return Promise.resolve({ data: [] });
    });
    wrapper = mount(PlayerDashboardPage, { global: { stubs: {} } });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
  });

  it('loads and displays available sessions', () => {
    const items = wrapper.findAll('.session-item');
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain('S1');
  });

  it('loads and displays available campaigns', () => {
    const items = wrapper.findAll('.campaign-item');
    expect(items.length).toBe(2);
    expect(items[1].text()).toContain('C2');
  });

  it('computes active campaigns from sessions', () => {
    const items = wrapper.findAll('.active-campaigns-card li');
    expect(items.length).toBe(1);
    expect(items[0].text()).toContain('C2');
  });
});

