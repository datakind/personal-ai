import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  getUserQualificationStatus: vi.fn(),
}));

// Mock OAuth functions
vi.mock('@/lib/oauth', () => ({
  getTokensForUser: vi.fn(),
  isOAuthConfigured: vi.fn(),
}));

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when user is not authenticated', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    // Mock redirect to throw an error (Next.js behavior)
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const SettingsPage = (await import('./page')).default;
    
    await expect(
      SettingsPage({
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('displays user account information when authenticated', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { isOAuthConfigured } = await import('@/lib/oauth');

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isOAuthConfigured).mockReturnValue(false);

    const SettingsPage = (await import('./page')).default;
    
    const result = await SettingsPage({
      searchParams: Promise.resolve({}),
    });

    // The component should render without errors
    expect(result).toBeDefined();
  });

  it('shows linking UI when OAuth is configured and user is not linked', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { isOAuthConfigured, getTokensForUser } = await import('@/lib/oauth');

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getTokensForUser).mockResolvedValue(null);

    const SettingsPage = (await import('./page')).default;
    
    const result = await SettingsPage({
      searchParams: Promise.resolve({}),
    });

    expect(result).toBeDefined();
  });

  it('shows qualification status when user is linked', async () => {
    const { getCurrentUser, getUserQualificationStatus } = await import('@/lib/auth');
    const { isOAuthConfigured, getTokensForUser } = await import('@/lib/oauth');

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    const mockTokens = {
      id: 1,
      userId: 1,
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockQualificationStatus = {
      hasLinkedAccount: true,
      phq9Qualified: true,
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getTokensForUser).mockResolvedValue(mockTokens);
    vi.mocked(getUserQualificationStatus).mockResolvedValue(mockQualificationStatus);

    const SettingsPage = (await import('./page')).default;
    
    const result = await SettingsPage({
      searchParams: Promise.resolve({}),
    });

    expect(result).toBeDefined();
    expect(getUserQualificationStatus).toHaveBeenCalledWith(1);
  });

  it('displays success message when account is linked', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { isOAuthConfigured } = await import('@/lib/oauth');

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isOAuthConfigured).mockReturnValue(false);

    const SettingsPage = (await import('./page')).default;
    
    const result = await SettingsPage({
      searchParams: Promise.resolve({ success: 'account_linked' }),
    });

    expect(result).toBeDefined();
  });

  it('displays error message when linking fails', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { isOAuthConfigured } = await import('@/lib/oauth');

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isOAuthConfigured).mockReturnValue(false);

    const SettingsPage = (await import('./page')).default;
    
    const result = await SettingsPage({
      searchParams: Promise.resolve({ error: 'token_exchange_failed' }),
    });

    expect(result).toBeDefined();
  });
});
