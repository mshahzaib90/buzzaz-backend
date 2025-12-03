import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../../components/ProtectedRoute';

// Mock AuthContext hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { role: 'influencer' },
  }),
}));

// Mock userAPI
jest.mock('../../services/api', () => ({
  userAPI: {
    getProfileStatus: jest.fn(),
  },
}));

// Mock react-router-dom minimal APIs used by ProtectedRoute
let mockedPathname = '/influencer/dashboard';
jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }) => <div>NavTo:{to}</div>,
    useLocation: () => ({ pathname: mockedPathname }),
  }),
  { virtual: true }
);

const { userAPI } = require('../../services/api');

function Dashboard() {
  return <div>InfluencerDashboard</div>;
}
function Wizard() {
  return <div>InfluencerWizard</div>;
}

describe('ProtectedRoute onboarding (influencer)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to wizard when requiresOnboarding is true', async () => {
    userAPI.getProfileStatus.mockResolvedValueOnce({
      data: { role: 'influencer', hasCompletedProfile: false, requiresOnboarding: true },
    });

    mockedPathname = '/influencer/dashboard';
    render(
      <ProtectedRoute requireRole="influencer">
        <Dashboard />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('NavTo:/influencer/wizard')).toBeInTheDocument();
    });
  });

  test('redirects to dashboard when visiting wizard with onboarding complete', async () => {
    userAPI.getProfileStatus.mockResolvedValueOnce({
      data: { role: 'influencer', hasCompletedProfile: true, requiresOnboarding: false },
    });

    mockedPathname = '/influencer/wizard';
    render(
      <ProtectedRoute requireRole="influencer">
        <Wizard />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('NavTo:/influencer/dashboard')).toBeInTheDocument();
    });
  });
});
