import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db';
import { users, oauthTokens } from '@/db/schema';
import { getUserQualificationStatus, isUserPHQ9Qualified } from './auth';
import { eq } from 'drizzle-orm';

describe('User Qualification Checking', () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user
    const result = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();
    testUserId = result[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('getUserQualificationStatus', () => {
    it('should return not qualified when user has no linked account', async () => {
      const status = await getUserQualificationStatus(testUserId);

      expect(status).toEqual({
        hasLinkedAccount: false,
        phq9Qualified: false,
      });
    });

    it('should return not qualified when OAuth token is expired and refresh fails', async () => {
      // Insert expired OAuth token
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const status = await getUserQualificationStatus(testUserId);

      // When token refresh fails (OAuth not configured in test env),
      // tokens are deleted and account is marked as unlinked
      expect(status).toEqual({
        hasLinkedAccount: false,
        phq9Qualified: false,
      });

      // Verify tokens were deleted after failed refresh
      const tokensAfter = await db.query.oauthTokens.findFirst({
        where: eq(oauthTokens.userId, testUserId),
      });
      expect(tokensAfter).toBeUndefined();
    });

    it('should automatically refresh expired token and return qualification status', async () => {
      // Set up OAuth configuration for this test
      const originalEnv = { ...process.env };
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-client-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://auth.example.com/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://auth.example.com/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';
      process.env.EXTERNAL_API_URL = 'https://api.example.com';

      // Insert expired OAuth token
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch for both token refresh and qualification API
      const originalFetch = global.fetch;
      const fetchMock = vi.fn();
      
      // First call: token refresh
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      // Second call: qualification API
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qualifications: {
            phq9: true,
          },
        }),
      });

      global.fetch = fetchMock;

      const status = await getUserQualificationStatus(testUserId);

      // Should successfully refresh token and get qualification
      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: true,
      });

      // Verify token refresh was called
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://auth.example.com/token', expect.objectContaining({
        method: 'POST',
      }));

      // Verify qualification API was called with new token
      expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.example.com/api/user/qualifications', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer new-access-token',
        }),
      }));

      // Verify tokens were updated in database
      const updatedTokens = await db.query.oauthTokens.findFirst({
        where: eq(oauthTokens.userId, testUserId),
      });
      expect(updatedTokens?.accessToken).toBe('new-access-token');
      expect(updatedTokens?.refreshToken).toBe('new-refresh-token');

      // Restore environment and fetch
      process.env = originalEnv;
      global.fetch = originalFetch;
    });

    it('should return not qualified when external API is unavailable', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate API unavailability
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const status = await getUserQualificationStatus(testUserId);

      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: false,
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should return not qualified when external API returns error status', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate API error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const status = await getUserQualificationStatus(testUserId);

      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: false,
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should return qualified when external API returns phq9: true', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate successful API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          qualifications: {
            phq9: true,
          },
        }),
      });

      const status = await getUserQualificationStatus(testUserId);

      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: true,
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should return not qualified when external API returns phq9: false', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate API response with not qualified
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          qualifications: {
            phq9: false,
          },
        }),
      });

      const status = await getUserQualificationStatus(testUserId);

      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: false,
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should timeout after 5 seconds', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate slow API that respects abort signal
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((_url, options) => 
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve({
            ok: true,
            json: async () => ({ qualifications: { phq9: true } }),
          }), 10000); // 10 seconds - longer than timeout
          
          // Listen for abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        })
      );

      const status = await getUserQualificationStatus(testUserId);

      // Should default to not qualified on timeout
      expect(status).toEqual({
        hasLinkedAccount: true,
        phq9Qualified: false,
      });

      // Restore original fetch
      global.fetch = originalFetch;
    }, 15000); // Increase test timeout to allow for the 5-second timeout
  });

  describe('isUserPHQ9Qualified', () => {
    it('should return false when user has no linked account', async () => {
      const qualified = await isUserPHQ9Qualified(testUserId);
      expect(qualified).toBe(false);
    });

    it('should return true when user is qualified', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate successful API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          qualifications: {
            phq9: true,
          },
        }),
      });

      const qualified = await isUserPHQ9Qualified(testUserId);
      expect(qualified).toBe(true);

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should return false when user is not qualified', async () => {
      // Insert valid OAuth token
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      await db.insert(oauthTokens).values({
        userId: testUserId,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetch to simulate API response with not qualified
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          qualifications: {
            phq9: false,
          },
        }),
      });

      const qualified = await isUserPHQ9Qualified(testUserId);
      expect(qualified).toBe(false);

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });
});
