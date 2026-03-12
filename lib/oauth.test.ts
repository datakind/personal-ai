import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getOAuthConfig, isOAuthConfigured, generateStateToken, buildAuthorizationUrl } from './oauth';

describe('OAuth Configuration', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear OAuth-related environment variables before each test
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CLIENT_SECRET;
    delete process.env.OAUTH_AUTHORIZATION_URL;
    delete process.env.OAUTH_TOKEN_URL;
    delete process.env.OAUTH_REDIRECT_URI;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  describe('getOAuthConfig', () => {
    it('should return null when no environment variables are set', () => {
      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when only some environment variables are set', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      // Missing other required variables

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when OAUTH_CLIENT_ID is missing', () => {
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when OAUTH_CLIENT_SECRET is missing', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when OAUTH_AUTHORIZATION_URL is missing', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when OAUTH_TOKEN_URL is missing', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return null when OAUTH_REDIRECT_URI is missing', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';

      const config = getOAuthConfig();
      expect(config).toBeNull();
    });

    it('should return valid config when all environment variables are set', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();

      expect(config).not.toBeNull();
      expect(config).toEqual({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        redirectUri: 'http://localhost:3000/api/oauth/callback',
        scope: 'training',
      });
    });

    it('should always set scope to "training"', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      const config = getOAuthConfig();

      expect(config?.scope).toBe('training');
    });
  });

  describe('isOAuthConfigured', () => {
    it('should return false when OAuth is not configured', () => {
      expect(isOAuthConfigured()).toBe(false);
    });

    it('should return false when only some environment variables are set', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';

      expect(isOAuthConfigured()).toBe(false);
    });

    it('should return true when all environment variables are set', () => {
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';

      expect(isOAuthConfigured()).toBe(true);
    });
  });

  describe('generateStateToken', () => {
    it('should generate a non-empty string', () => {
      const token = generateStateToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateStateToken();
      const token2 = generateStateToken();
      const token3 = generateStateToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate URL-safe tokens (base64url encoding)', () => {
      const token = generateStateToken();
      
      // base64url should not contain +, /, or = characters
      expect(token).not.toMatch(/[+/=]/);
      
      // Should only contain alphanumeric, -, and _ characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate tokens of consistent length', () => {
      const token1 = generateStateToken();
      const token2 = generateStateToken();
      const token3 = generateStateToken();

      // 32 bytes encoded as base64url should produce 43 characters
      expect(token1.length).toBe(43);
      expect(token2.length).toBe(43);
      expect(token3.length).toBe(43);
    });
  });

  describe('buildAuthorizationUrl', () => {
    beforeEach(() => {
      // Set up valid OAuth configuration for these tests
      process.env.OAUTH_CLIENT_ID = 'test-client-id';
      process.env.OAUTH_CLIENT_SECRET = 'test-secret';
      process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
      process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';
    });

    it('should throw error when OAuth is not configured', () => {
      // Clear environment variables
      delete process.env.OAUTH_CLIENT_ID;
      delete process.env.OAUTH_CLIENT_SECRET;
      delete process.env.OAUTH_AUTHORIZATION_URL;
      delete process.env.OAUTH_TOKEN_URL;
      delete process.env.OAUTH_REDIRECT_URI;

      expect(() => buildAuthorizationUrl('test-state')).toThrow('OAuth not configured');
    });

    it('should build URL with all required parameters', () => {
      const state = 'test-state-token';
      const url = buildAuthorizationUrl(state);

      const parsedUrl = new URL(url);
      
      expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://example.com/oauth/authorize');
      expect(parsedUrl.searchParams.get('client_id')).toBe('test-client-id');
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/oauth/callback');
      expect(parsedUrl.searchParams.get('response_type')).toBe('code');
      expect(parsedUrl.searchParams.get('scope')).toBe('training');
      expect(parsedUrl.searchParams.get('state')).toBe(state);
    });

    it('should include the provided state parameter', () => {
      const state = 'my-custom-state-value';
      const url = buildAuthorizationUrl(state);

      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get('state')).toBe(state);
    });

    it('should properly encode special characters in parameters', () => {
      // Use a redirect URI with special characters
      process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback?test=value&other=data';
      
      const state = 'state+with/special=chars';
      const url = buildAuthorizationUrl(state);

      const parsedUrl = new URL(url);
      
      // URLSearchParams should properly encode the values
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/oauth/callback?test=value&other=data');
      expect(parsedUrl.searchParams.get('state')).toBe(state);
    });

    it('should always set response_type to "code"', () => {
      const url = buildAuthorizationUrl('test-state');
      const parsedUrl = new URL(url);
      
      expect(parsedUrl.searchParams.get('response_type')).toBe('code');
    });

    it('should always set scope to "training"', () => {
      const url = buildAuthorizationUrl('test-state');
      const parsedUrl = new URL(url);
      
      expect(parsedUrl.searchParams.get('scope')).toBe('training');
    });
  });
});

describe('exchangeCodeForTokens', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Set up valid OAuth configuration
    process.env.OAUTH_CLIENT_ID = 'test-client-id';
    process.env.OAUTH_CLIENT_SECRET = 'test-secret';
    process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
    process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it('should throw error when OAuth is not configured', async () => {
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CLIENT_SECRET;
    delete process.env.OAUTH_AUTHORIZATION_URL;
    delete process.env.OAUTH_TOKEN_URL;
    delete process.env.OAUTH_REDIRECT_URI;

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('OAuth not configured');
  });

  it('should successfully exchange code for tokens with all fields', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe('https://example.com/oauth/token');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const body = new URLSearchParams(init?.body as string);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('test-code');
      expect(body.get('redirect_uri')).toBe('http://localhost:3000/api/oauth/callback');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-secret');

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    const result = await exchangeCodeForTokens('test-code');

    expect(result).toEqual(mockResponse);
  });

  it('should successfully exchange code for tokens without refresh_token', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    const result = await exchangeCodeForTokens('test-code');

    expect(result).toEqual({
      access_token: 'test-access-token',
      refresh_token: undefined,
      expires_in: 3600,
      token_type: 'Bearer',
    });
  });

  it('should throw error when token endpoint returns 400 error', async () => {
    global.fetch = async () => {
      return new Response(JSON.stringify({ error: 'invalid_grant' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('invalid-code')).rejects.toThrow(/Token exchange failed: 400 Bad Request/);
  });

  it('should throw error when token endpoint returns 401 error', async () => {
    global.fetch = async () => {
      return new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow(/Token exchange failed: 401 Unauthorized/);
  });

  it('should throw error when token endpoint returns 500 error', async () => {
    global.fetch = async () => {
      return new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow(/Token exchange failed: 500 Internal Server Error/);
  });

  it('should throw error when response is missing access_token', async () => {
    const mockResponse = {
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid access_token');
  });

  it('should throw error when access_token is not a string', async () => {
    const mockResponse = {
      access_token: 12345,
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid access_token');
  });

  it('should throw error when response is missing expires_in', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid expires_in');
  });

  it('should throw error when expires_in is not a number', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      expires_in: '3600',
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid expires_in');
  });

  it('should throw error when response is missing token_type', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      expires_in: 3600,
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid token_type');
  });

  it('should throw error when token_type is not a string', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      expires_in: 3600,
      token_type: true,
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: missing or invalid token_type');
  });

  it('should throw error when refresh_token is not a string', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      refresh_token: 12345,
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Invalid token response: invalid refresh_token');
  });

  it('should handle network errors', async () => {
    global.fetch = async () => {
      throw new Error('Network error: Failed to fetch');
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow('Network error: Failed to fetch');
  });

  it('should handle non-JSON response', async () => {
    global.fetch = async () => {
      return new Response('Not JSON', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    };

    const { exchangeCodeForTokens } = await import('./oauth');
    
    await expect(exchangeCodeForTokens('test-code')).rejects.toThrow();
  });
});


describe('refreshAccessToken', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Set up valid OAuth configuration
    process.env.OAUTH_CLIENT_ID = 'test-client-id';
    process.env.OAUTH_CLIENT_SECRET = 'test-secret';
    process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
    process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it('should throw error when OAuth is not configured', async () => {
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CLIENT_SECRET;
    delete process.env.OAUTH_AUTHORIZATION_URL;
    delete process.env.OAUTH_TOKEN_URL;
    delete process.env.OAUTH_REDIRECT_URI;

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('OAuth not configured');
  });

  it('should successfully refresh token with new access and refresh tokens', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe('https://example.com/oauth/token');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const body = new URLSearchParams(init?.body as string);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('test-refresh-token');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-secret');

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    const result = await refreshAccessToken('test-refresh-token');

    expect(result).toEqual(mockResponse);
  });

  it('should successfully refresh token without new refresh_token', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    const result = await refreshAccessToken('test-refresh-token');

    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: undefined,
      expires_in: 3600,
      token_type: 'Bearer',
    });
  });

  it('should throw error when token endpoint returns 400 error', async () => {
    global.fetch = async () => {
      return new Response(JSON.stringify({ error: 'invalid_grant' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('invalid-refresh-token')).rejects.toThrow(/Token refresh failed: 400 Bad Request/);
  });

  it('should throw error when token endpoint returns 401 error', async () => {
    global.fetch = async () => {
      return new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow(/Token refresh failed: 401 Unauthorized/);
  });

  it('should throw error when token endpoint returns 500 error', async () => {
    global.fetch = async () => {
      return new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow(/Token refresh failed: 500 Internal Server Error/);
  });

  it('should throw error when response is missing access_token', async () => {
    const mockResponse = {
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid access_token');
  });

  it('should throw error when access_token is not a string', async () => {
    const mockResponse = {
      access_token: 12345,
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid access_token');
  });

  it('should throw error when response is missing expires_in', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid expires_in');
  });

  it('should throw error when expires_in is not a number', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      expires_in: '3600',
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid expires_in');
  });

  it('should throw error when response is missing token_type', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid token_type');
  });

  it('should throw error when token_type is not a string', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      token_type: true,
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: missing or invalid token_type');
  });

  it('should throw error when refresh_token is not a string', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 12345,
      expires_in: 3600,
      token_type: 'Bearer',
    };

    global.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Invalid token response: invalid refresh_token');
  });

  it('should handle network errors', async () => {
    global.fetch = async () => {
      throw new Error('Network error: Failed to fetch');
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Network error: Failed to fetch');
  });

  it('should handle non-JSON response', async () => {
    global.fetch = async () => {
      return new Response('Not JSON', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    };

    const { refreshAccessToken } = await import('./oauth');
    
    await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow();
  });
});

describe('storeTokens', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set up valid OAuth configuration
    process.env.OAUTH_CLIENT_ID = 'test-client-id';
    process.env.OAUTH_CLIENT_SECRET = 'test-secret';
    process.env.OAUTH_AUTHORIZATION_URL = 'https://example.com/oauth/authorize';
    process.env.OAUTH_TOKEN_URL = 'https://example.com/oauth/token';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/api/oauth/callback';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should store tokens for a user', async () => {
    const { storeTokens } = await import('./oauth');
    const { db } = await import('@/db');
    const { oauthTokens, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user first
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Store tokens
    await storeTokens(
      testUser.id,
      'test-access-token',
      'test-refresh-token',
      3600
    );

    // Verify tokens were stored
    const storedTokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });

    expect(storedTokens).toBeDefined();
    expect(storedTokens?.userId).toBe(testUser.id);
    expect(storedTokens?.accessToken).toBe('test-access-token');
    expect(storedTokens?.refreshToken).toBe('test-refresh-token');
    expect(storedTokens?.expiresAt).toBeInstanceOf(Date);
    expect(storedTokens?.createdAt).toBeInstanceOf(Date);
    expect(storedTokens?.updatedAt).toBeInstanceOf(Date);

    // Verify expiration is approximately 3600 seconds from now
    const expectedExpiry = new Date(Date.now() + 3600 * 1000);
    const actualExpiry = storedTokens!.expiresAt;
    const timeDiff = Math.abs(actualExpiry.getTime() - expectedExpiry.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second

    // Cleanup
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should update existing tokens for a user', async () => {
    const { storeTokens } = await import('./oauth');
    const { db } = await import('@/db');
    const { oauthTokens, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Store initial tokens
    await storeTokens(
      testUser.id,
      'initial-access-token',
      'initial-refresh-token',
      3600
    );

    const initialTokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });

    // Update tokens
    await storeTokens(
      testUser.id,
      'updated-access-token',
      'updated-refresh-token',
      7200
    );

    const updatedTokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });

    // Verify tokens were updated
    expect(updatedTokens?.accessToken).toBe('updated-access-token');
    expect(updatedTokens?.refreshToken).toBe('updated-refresh-token');
    expect(updatedTokens?.createdAt).toEqual(initialTokens?.createdAt);
    // updatedAt should be set (may be same as createdAt due to SQLite second precision)
    expect(updatedTokens?.updatedAt).toBeInstanceOf(Date);

    // Verify expiration is approximately 7200 seconds from now
    const expectedExpiry = new Date(Date.now() + 7200 * 1000);
    const actualExpiry = updatedTokens!.expiresAt;
    const timeDiff = Math.abs(actualExpiry.getTime() - expectedExpiry.getTime());
    expect(timeDiff).toBeLessThan(1000);

    // Cleanup
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should handle null refresh token', async () => {
    const { storeTokens } = await import('./oauth');
    const { db } = await import('@/db');
    const { oauthTokens, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Store tokens with null refresh token
    await storeTokens(
      testUser.id,
      'test-access-token',
      null,
      3600
    );

    const storedTokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });

    expect(storedTokens?.accessToken).toBe('test-access-token');
    expect(storedTokens?.refreshToken).toBeNull();

    // Cleanup
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });
});

describe('getTokensForUser', () => {
  it('should return tokens for a user', async () => {
    const { getTokensForUser, storeTokens } = await import('./oauth');
    const { db } = await import('@/db');
    const { oauthTokens, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Store tokens
    await storeTokens(
      testUser.id,
      'test-access-token',
      'test-refresh-token',
      3600
    );

    // Retrieve tokens
    const tokens = await getTokensForUser(testUser.id);

    expect(tokens).toBeDefined();
    expect(tokens?.userId).toBe(testUser.id);
    expect(tokens?.accessToken).toBe('test-access-token');
    expect(tokens?.refreshToken).toBe('test-refresh-token');
    expect(tokens?.expiresAt).toBeInstanceOf(Date);

    // Cleanup
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should return null for a user with no tokens', async () => {
    const { getTokensForUser } = await import('./oauth');
    const { db } = await import('@/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user without tokens
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Try to retrieve tokens
    const tokens = await getTokensForUser(testUser.id);

    expect(tokens).toBeNull();

    // Cleanup
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should return null for a non-existent user', async () => {
    const { getTokensForUser } = await import('./oauth');

    // Use a user ID that doesn't exist
    const tokens = await getTokensForUser(999999);

    expect(tokens).toBeNull();
  });
});

describe('deleteTokensForUser', () => {
  it('should delete tokens for a user', async () => {
    const { deleteTokensForUser, storeTokens, getTokensForUser } = await import('./oauth');
    const { db } = await import('@/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Store tokens
    await storeTokens(
      testUser.id,
      'test-access-token',
      'test-refresh-token',
      3600
    );

    // Verify tokens exist
    let tokens = await getTokensForUser(testUser.id);
    expect(tokens).toBeDefined();

    // Delete tokens
    await deleteTokensForUser(testUser.id);

    // Verify tokens are deleted
    tokens = await getTokensForUser(testUser.id);
    expect(tokens).toBeNull();

    // Cleanup
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should not throw error when deleting tokens for user with no tokens', async () => {
    const { deleteTokensForUser } = await import('./oauth');
    const { db } = await import('@/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Create a test user without tokens
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      createdAt: new Date(),
    }).returning();

    // Delete tokens (should not throw)
    await expect(deleteTokensForUser(testUser.id)).resolves.not.toThrow();

    // Cleanup
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should not throw error when deleting tokens for non-existent user', async () => {
    const { deleteTokensForUser } = await import('./oauth');

    // Delete tokens for non-existent user (should not throw)
    await expect(deleteTokensForUser(999999)).resolves.not.toThrow();
  });
});

describe('isTokenExpired', () => {
  it('should return true for expired token', async () => {
    const { isTokenExpired } = await import('./oauth');

    // Create a date in the past
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago

    expect(isTokenExpired(pastDate)).toBe(true);
  });

  it('should return false for valid token', async () => {
    const { isTokenExpired } = await import('./oauth');

    // Create a date in the future
    const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    expect(isTokenExpired(futureDate)).toBe(false);
  });

  it('should return true for token expiring right now', async () => {
    const { isTokenExpired } = await import('./oauth');

    // Create a date that's very close to now (within a few milliseconds in the past)
    const almostNow = new Date(Date.now() - 10);

    // Token expiring in the very recent past should be considered expired
    expect(isTokenExpired(almostNow)).toBe(true);
  });

  it('should handle dates far in the past', async () => {
    const { isTokenExpired } = await import('./oauth');

    const veryOldDate = new Date('2020-01-01');

    expect(isTokenExpired(veryOldDate)).toBe(true);
  });

  it('should handle dates far in the future', async () => {
    const { isTokenExpired } = await import('./oauth');

    const farFutureDate = new Date('2030-01-01');

    expect(isTokenExpired(farFutureDate)).toBe(false);
  });
});
