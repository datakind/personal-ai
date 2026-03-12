import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/oauth', () => ({
  isOAuthConfigured: vi.fn(),
  exchangeCodeForTokens: vi.fn(),
  storeTokens: vi.fn(),
}));

import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { isOAuthConfigured, exchangeCodeForTokens, storeTokens } from '@/lib/oauth';

describe('OAuth Callback Route Handler', () => {
  const mockCookieStore = {
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  it('should redirect with error when OAuth is not configured', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=xyz');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=oauth_not_configured');
  });

  it('should redirect with error when authorization is denied', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?error=access_denied');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=authorization_denied');
  });

  it('should redirect with error when code or state is missing', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=invalid_callback');
  });

  it('should redirect to login when user is not authenticated', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=xyz');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?error=authentication_required');
  });

  it('should redirect with error when state does not match', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() });
    mockCookieStore.get.mockReturnValue({ value: 'different-state' });

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=xyz');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=invalid_state');
  });

  it('should redirect with error when state cookie is missing', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() });
    mockCookieStore.get.mockReturnValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=xyz');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=invalid_state');
  });

  it('should exchange code for tokens and redirect with success', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() });
    mockCookieStore.get.mockReturnValue({ value: 'matching-state' });
    vi.mocked(exchangeCodeForTokens).mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    });
    vi.mocked(storeTokens).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=matching-state');
    const response = await GET(request);

    expect(exchangeCodeForTokens).toHaveBeenCalledWith('abc');
    expect(storeTokens).toHaveBeenCalledWith(1, 'access-token', 'refresh-token', 3600);
    expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth_state');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?success=account_linked');
  });

  it('should redirect with error when token exchange fails', async () => {
    vi.mocked(isOAuthConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() });
    mockCookieStore.get.mockReturnValue({ value: 'matching-state' });
    vi.mocked(exchangeCodeForTokens).mockRejectedValue(new Error('Token exchange failed'));

    const request = new NextRequest('http://localhost:3000/api/oauth/callback?code=abc&state=matching-state');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings?error=token_exchange_failed');
  });
});
