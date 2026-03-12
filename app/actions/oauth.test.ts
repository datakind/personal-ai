import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initiateLinking, unlinkAccount } from './oauth';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock auth module
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

// Mock oauth module
vi.mock('@/lib/oauth', () => ({
  isOAuthConfigured: vi.fn(),
  generateStateToken: vi.fn(),
  buildAuthorizationUrl: vi.fn(),
  deleteTokensForUser: vi.fn(),
}));

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  isOAuthConfigured,
  generateStateToken,
  buildAuthorizationUrl,
  deleteTokensForUser,
} from '@/lib/oauth';

describe('OAuth Server Actions', () => {
  // Store original environment
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset all mocks before each test (clears call history and implementations)
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('initiateLinking', () => {
    it('should return error when OAuth is not configured', async () => {
      vi.mocked(isOAuthConfigured).mockReturnValue(false);

      const result = await initiateLinking();

      expect(result).toEqual({ error: 'OAuth is not configured' });
      expect(requireAuth).not.toHaveBeenCalled();
    });

    it('should return error when user is not authenticated', async () => {
      vi.mocked(isOAuthConfigured).mockReturnValue(true);
      vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

      const result = await initiateLinking();

      expect(result).toEqual({ error: 'Failed to initiate linking' });
      expect(isOAuthConfigured).toHaveBeenCalled();
      expect(requireAuth).toHaveBeenCalled();
    });

    it('should generate state token and store in cookie when authenticated', async () => {
      // Setup mocks
      vi.mocked(isOAuthConfigured).mockReturnValue(true);
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(generateStateToken).mockReturnValue('test-state-token');
      vi.mocked(buildAuthorizationUrl).mockReturnValue('https://example.com/oauth/authorize?state=test-state-token');

      const mockCookieSet = vi.fn();
      const mockCookies = {
        set: mockCookieSet,
        get: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      // Mock redirect - Next.js redirect() throws a special error
      const redirectError = new Error('NEXT_REDIRECT');
      vi.mocked(redirect).mockImplementation(() => {
        throw redirectError;
      });

      // Call the function - should re-throw redirect error
      await expect(initiateLinking()).rejects.toThrow('NEXT_REDIRECT');

      // Verify state token was generated
      expect(generateStateToken).toHaveBeenCalled();

      // Verify cookie was set with correct parameters
      expect(mockCookieSet).toHaveBeenCalledWith('oauth_state', 'test-state-token', {
        httpOnly: true,
        secure: false, // NODE_ENV is not 'production' in tests
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });

      // Verify authorization URL was built
      expect(buildAuthorizationUrl).toHaveBeenCalledWith('test-state-token');

      // Verify redirect was called
      expect(redirect).toHaveBeenCalledWith('https://example.com/oauth/authorize?state=test-state-token');
    });

    it('should set secure cookie in production environment', async () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';

      // Setup mocks
      vi.mocked(isOAuthConfigured).mockReturnValue(true);
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(generateStateToken).mockReturnValue('test-state-token');
      vi.mocked(buildAuthorizationUrl).mockReturnValue('https://example.com/oauth/authorize?state=test-state-token');

      const mockCookieSet = vi.fn();
      const mockCookies = {
        set: mockCookieSet,
        get: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      // Mock redirect
      const redirectError = new Error('NEXT_REDIRECT');
      vi.mocked(redirect).mockImplementation(() => {
        throw redirectError;
      });

      // Call the function - should re-throw redirect error
      await expect(initiateLinking()).rejects.toThrow('NEXT_REDIRECT');

      // Verify cookie was set with secure flag
      expect(mockCookieSet).toHaveBeenCalledWith('oauth_state', 'test-state-token', {
        httpOnly: true,
        secure: true, // Should be true in production
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      });
    });

    it('should set cookie with 10-minute expiration (600 seconds)', async () => {
      // Setup mocks
      vi.mocked(isOAuthConfigured).mockReturnValue(true);
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(generateStateToken).mockReturnValue('test-state-token');
      vi.mocked(buildAuthorizationUrl).mockReturnValue('https://example.com/oauth/authorize?state=test-state-token');

      const mockCookieSet = vi.fn();
      const mockCookies = {
        set: mockCookieSet,
        get: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      // Mock redirect
      const redirectError = new Error('NEXT_REDIRECT');
      vi.mocked(redirect).mockImplementation(() => {
        throw redirectError;
      });

      // Call the function - should re-throw redirect error
      await expect(initiateLinking()).rejects.toThrow('NEXT_REDIRECT');

      // Verify maxAge is 600 seconds (10 minutes)
      const cookieOptions = mockCookieSet.mock.calls[0][2];
      expect(cookieOptions.maxAge).toBe(600);
    });

    it('should handle errors during linking initiation', async () => {
      // Setup mocks
      vi.mocked(isOAuthConfigured).mockReturnValue(true);
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(generateStateToken).mockImplementation(() => {
        throw new Error('Random error');
      });

      const result = await initiateLinking();

      expect(result).toEqual({ error: 'Failed to initiate linking' });
    });
  });
});

  describe('unlinkAccount', () => {
    it('should successfully unlink account for authenticated user', async () => {
      // Setup mocks
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(deleteTokensForUser).mockResolvedValue();

      const result = await unlinkAccount();

      expect(result).toEqual({});
      expect(requireAuth).toHaveBeenCalled();
      expect(deleteTokensForUser).toHaveBeenCalledWith(1);
    });

    it('should return error when user is not authenticated', async () => {
      // Explicitly reset and setup mocks for this test
      vi.mocked(requireAuth).mockReset().mockRejectedValue(new Error('Authentication required'));
      vi.mocked(deleteTokensForUser).mockReset().mockResolvedValue();

      const result = await unlinkAccount();

      expect(result).toEqual({ error: 'Failed to unlink account' });
      expect(requireAuth).toHaveBeenCalled();
      expect(deleteTokensForUser).not.toHaveBeenCalled();
    });

    it('should return error when deleteTokensForUser fails', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(deleteTokensForUser).mockRejectedValue(new Error('Database error'));

      const result = await unlinkAccount();

      expect(result).toEqual({ error: 'Failed to unlink account' });
      expect(requireAuth).toHaveBeenCalled();
      expect(deleteTokensForUser).toHaveBeenCalledWith(1);
    });

    it('should call deleteTokensForUser with correct user ID', async () => {
      const testUserId = 42;
      vi.mocked(requireAuth).mockResolvedValue({
        id: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
      vi.mocked(deleteTokensForUser).mockResolvedValue();

      await unlinkAccount();

      expect(deleteTokensForUser).toHaveBeenCalledWith(testUserId);
    });
  });
