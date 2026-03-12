# Design Document: OAuth Client Flow

## Overview

This design implements an OAuth 2.0 authorization code flow that enables users to optionally link their local application account to an external storage system. The implementation provides secure credential management, token lifecycle operations (acquisition, refresh, and revocation), and seamless integration with the existing authentication system.

The OAuth integration serves two primary purposes:
1. Enable access to user qualification data from the external storage system
2. Allow qualified users to administer PHQ-9 assessments based on their training status

The design follows a graceful degradation approach where the application remains fully functional without OAuth configuration or when users choose not to link their accounts. Unlinked users can still perform PHQ-2 assessments, while linked and qualified users gain access to PHQ-9 capabilities.

### Key Design Principles

- **Optional by Default**: OAuth linking is optional; core functionality works without it
- **Secure Token Management**: Tokens are stored securely in the database with proper encryption considerations
- **Automatic Token Refresh**: Expired access tokens are automatically refreshed without user intervention
- **CSRF Protection**: State parameter validation prevents cross-site request forgery attacks
- **Error Resilience**: Network failures and API errors are handled gracefully with appropriate fallbacks

## Architecture

### System Components

The OAuth client flow integrates with the existing Next.js application architecture through several new components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Settings   │      │  Assessment  │                     │
│  │     Page     │      │     Flow     │                     │
│  └──────┬───────┘      └──────┬───────┘                     │
│         │                     │                              │
│         │                     │                              │
│  ┌──────▼──────────────────────▼──────┐                     │
│  │      OAuth Client Library          │                     │
│  │  - initiateLinking()               │                     │
│  │  - handleCallback()                │                     │
│  │  - unlinkAccount()                 │                     │
│  │  - refreshTokenIfNeeded()          │                     │
│  └──────┬─────────────────────────────┘                     │
│         │                                                    │
│  ┌──────▼──────────────────────────────┐                    │
│  │      Token Store (Database)         │                    │
│  │  - oauthTokens table                │                    │
│  └──────┬──────────────────────────────┘                    │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │ HTTPS
          │
┌─────────▼────────────────────────────────────────────────────┐
│              External Storage System                          │
│  - Authorization Endpoint                                     │
│  - Token Endpoint                                             │
│  - Qualifications API                                         │
└───────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**OAuth Client Library** (`lib/oauth.ts`)
- Constructs authorization URLs with proper parameters
- Generates and validates CSRF state tokens
- Exchanges authorization codes for access/refresh tokens
- Manages token refresh logic
- Provides helper functions for token operations

**OAuth Server Actions** (`app/actions/oauth.ts`)
- Handles user-initiated linking requests
- Processes OAuth callbacks with state validation
- Manages account unlinking
- Integrates with session management

**OAuth Callback Route Handler** (`app/api/oauth/callback/route.ts`)
- Receives authorization callbacks from external system
- Validates state parameter against session
- Exchanges authorization code for tokens
- Redirects to success/error pages

**Settings Page** (`app/settings/page.tsx`)
- Displays current linking status
- Provides UI for initiating linking
- Allows users to unlink accounts
- Shows qualification status for linked accounts

**Enhanced Auth Library** (`lib/auth.ts`)
- Extended `getUserQualificationStatus()` to use OAuth tokens
- Automatic token refresh before API calls
- Graceful fallback when tokens are invalid or expired

### Data Flow

**Linking Flow:**
1. User clicks "Link Account" button in settings
2. Server Action generates state token, stores in session
3. User redirected to external authorization URL
4. User authorizes on external system
5. External system redirects to callback URL with code and state
6. Callback handler validates state, exchanges code for tokens
7. Tokens stored in database, user redirected to settings

**Qualification Check Flow:**
1. Assessment flow checks if user is qualified for PHQ-9
2. `getUserQualificationStatus()` retrieves tokens from database
3. If token expired, automatic refresh attempted
4. API call made to external system with valid access token
5. Qualification status returned and cached in memory
6. Assessment flow proceeds based on qualification

## Components and Interfaces

### OAuth Configuration

Environment variables required for OAuth functionality:

```typescript
// Environment variables (in .env.local)
OAUTH_CLIENT_ID=<client_id>
OAUTH_CLIENT_SECRET=<client_secret>
OAUTH_AUTHORIZATION_URL=https://storage.example.com/oauth/authorize
OAUTH_TOKEN_URL=https://storage.example.com/oauth/token
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/callback
EXTERNAL_API_URL=https://storage.example.com
```

Configuration validation function:

```typescript
// lib/oauth.ts
export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
};

export function getOAuthConfig(): OAuthConfig | null {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const authorizationUrl = process.env.OAUTH_AUTHORIZATION_URL;
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !authorizationUrl || !tokenUrl || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    authorizationUrl,
    tokenUrl,
    redirectUri,
    scope: 'training',
  };
}

export function isOAuthConfigured(): boolean {
  return getOAuthConfig() !== null;
}
```

### OAuth Client Library

Core functions for OAuth operations:

```typescript
// lib/oauth.ts

/**
 * Generates a cryptographically secure state token for CSRF protection
 */
export function generateStateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Constructs the authorization URL for initiating OAuth flow
 */
export function buildAuthorizationUrl(state: string): string {
  const config = getOAuthConfig();
  if (!config) throw new Error('OAuth not configured');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const config = getOAuthConfig();
  if (!config) throw new Error('OAuth not configured');

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Refreshes an expired access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getOAuthConfig();
  if (!config) throw new Error('OAuth not configured');

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Stores OAuth tokens in the database for a user
 */
export async function storeTokens(
  userId: number,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  await db
    .insert(oauthTokens)
    .values({
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: oauthTokens.userId,
      set: {
        accessToken,
        refreshToken,
        expiresAt,
        updatedAt: now,
      },
    });
}

/**
 * Retrieves OAuth tokens for a user
 */
export async function getTokensForUser(userId: number): Promise<OAuthToken | null> {
  return db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.userId, userId),
  });
}

/**
 * Deletes OAuth tokens for a user (unlinking)
 */
export async function deleteTokensForUser(userId: number): Promise<void> {
  await db.delete(oauthTokens).where(eq(oauthTokens.userId, userId));
}

/**
 * Checks if a token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

/**
 * Refreshes token if expired and returns valid access token
 */
export async function getValidAccessToken(userId: number): Promise<string | null> {
  const tokens = await getTokensForUser(userId);
  
  if (!tokens) {
    return null;
  }

  // If token is not expired, return it
  if (!isTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  // Token is expired, attempt refresh
  if (!tokens.refreshToken) {
    // No refresh token available, delete invalid tokens
    await deleteTokensForUser(userId);
    return null;
  }

  try {
    const response = await refreshAccessToken(tokens.refreshToken);
    
    // Store new tokens
    await storeTokens(
      userId,
      response.access_token,
      response.refresh_token || tokens.refreshToken,
      response.expires_in
    );

    return response.access_token;
  } catch (error) {
    // Refresh failed, delete invalid tokens
    console.error('Token refresh failed:', error);
    await deleteTokensForUser(userId);
    return null;
  }
}
```

### Type Definitions

```typescript
// lib/oauth.ts

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export type OAuthError = {
  error: string;
  error_description?: string;
};
```

### Server Actions

```typescript
// app/actions/oauth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  isOAuthConfigured,
  generateStateToken,
  buildAuthorizationUrl,
  deleteTokensForUser,
} from '@/lib/oauth';

/**
 * Initiates the OAuth linking flow
 */
export async function initiateLinking(): Promise<{ error?: string }> {
  // Check if OAuth is configured
  if (!isOAuthConfigured()) {
    return { error: 'OAuth is not configured' };
  }

  try {
    // Require authentication
    const user = await requireAuth();

    // Generate state token
    const state = generateStateToken();

    // Store state in session cookie
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(state);

    // Redirect to authorization URL
    redirect(authUrl);
  } catch (error) {
    console.error('Error initiating linking:', error);
    return { error: 'Failed to initiate linking' };
  }
}

/**
 * Unlinks the user's OAuth account
 */
export async function unlinkAccount(): Promise<{ error?: string }> {
  try {
    const user = await requireAuth();

    await deleteTokensForUser(user.id);

    return {};
  } catch (error) {
    console.error('Error unlinking account:', error);
    return { error: 'Failed to unlink account' };
  }
}
```

### OAuth Callback Route Handler

```typescript
// app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import {
  exchangeCodeForTokens,
  storeTokens,
  isOAuthConfigured,
} from '@/lib/oauth';

export async function GET(request: NextRequest) {
  // Check if OAuth is configured
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/settings?error=oauth_not_configured', request.url)
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle authorization denial
  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=authorization_denied&details=${error}`, request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=invalid_callback', request.url)
    );
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=authentication_required', request.url)
      );
    }

    // Validate state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      );
    }

    // Clear state cookie
    cookieStore.delete('oauth_state');

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    // Store tokens
    await storeTokens(
      user.id,
      tokenResponse.access_token,
      tokenResponse.refresh_token || null,
      tokenResponse.expires_in
    );

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL('/settings?success=account_linked', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?error=token_exchange_failed', request.url)
    );
  }
}
```

### Settings Page UI

```typescript
// app/settings/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { getTokensForUser, isOAuthConfigured } from '@/lib/oauth';
import { getUserQualificationStatus } from '@/lib/auth';
import { LinkAccountButton } from './components/LinkAccountButton';
import { UnlinkAccountButton } from './components/UnlinkAccountButton';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    redirect('/login');
  }

  const oauthConfigured = isOAuthConfigured();
  const tokens = oauthConfigured ? await getTokensForUser(user.id) : null;
  const isLinked = !!tokens;

  let qualificationStatus = null;
  if (isLinked) {
    qualificationStatus = await getUserQualificationStatus(user.id);
  }

  return (
    <div>
      <h1>Settings</h1>

      {params.success === 'account_linked' && (
        <div className="success">Account successfully linked!</div>
      )}

      {params.error && (
        <div className="error">
          {getErrorMessage(params.error)}
        </div>
      )}

      <section>
        <h2>Account Information</h2>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
      </section>

      {oauthConfigured && (
        <section>
          <h2>External Account Linking</h2>
          
          {isLinked ? (
            <div>
              <p>✓ Your account is linked to the storage system</p>
              
              {qualificationStatus && (
                <p>
                  PHQ-9 Qualification: {qualificationStatus.phq9Qualified ? '✓ Qualified' : '✗ Not Qualified'}
                </p>
              )}

              <UnlinkAccountButton />
            </div>
          ) : (
            <div>
              <p>Link your account to access PHQ-9 assessments (if qualified)</p>
              <LinkAccountButton />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    oauth_not_configured: 'OAuth is not configured on this server',
    authorization_denied: 'You declined to authorize the application',
    invalid_callback: 'Invalid callback parameters received',
    invalid_state: 'Security validation failed. Please try again.',
    token_exchange_failed: 'Failed to complete linking. Please try again.',
  };

  return messages[error] || 'An unknown error occurred';
}
```

### Client Components for Actions

```typescript
// app/settings/components/LinkAccountButton.tsx
'use client';

import { initiateLinking } from '@/app/actions/oauth';
import { useState } from 'react';

export function LinkAccountButton() {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    const result = await initiateLinking();
    
    if (result.error) {
      alert(result.error);
      setPending(false);
    }
    // If successful, user will be redirected
  };

  return (
    <button onClick={handleClick} disabled={pending}>
      {pending ? 'Redirecting...' : 'Link Account'}
    </button>
  );
}
```

```typescript
// app/settings/components/UnlinkAccountButton.tsx
'use client';

import { unlinkAccount } from '@/app/actions/oauth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function UnlinkAccountButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (!confirm('Are you sure you want to unlink your account?')) {
      return;
    }

    setPending(true);
    const result = await unlinkAccount();
    
    if (result.error) {
      alert(result.error);
      setPending(false);
    } else {
      router.refresh();
    }
  };

  return (
    <button onClick={handleClick} disabled={pending}>
      {pending ? 'Unlinking...' : 'Unlink Account'}
    </button>
  );
}
```

## Data Models

### Database Schema Extensions

The OAuth flow requires extending the existing database schema with the `oauthTokens` table (already defined in `db/schema.ts`):

```typescript
export const oauthTokens = sqliteTable('oauth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

### Schema Constraints

- **Primary Key**: Auto-incrementing `id` field
- **Unique Constraint**: `userId` is unique, ensuring one user can only have one set of tokens
- **Foreign Key**: `userId` references `users.id` with cascade delete
- **Nullable Field**: `refreshToken` is optional (some OAuth providers don't issue refresh tokens)
- **Timestamps**: All timestamps use SQLite integer storage with TypeScript Date mode

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                          │
└─────────────────────────────────────────────────────────────┘

1. Authorization → Code Exchange → Store Tokens
   - User authorizes application
   - Code exchanged for access_token + refresh_token
   - Tokens stored with expiration timestamp

2. Token Usage → Check Expiration → Refresh if Needed
   - Before API call, check if access_token expired
   - If expired, use refresh_token to get new access_token
   - Update stored tokens with new values

3. Refresh Failure → Delete Tokens → Mark Unlinked
   - If refresh fails (invalid/revoked refresh_token)
   - Delete all tokens from database
   - User must re-authorize to link again

4. User Unlink → Delete Tokens
   - User explicitly unlinks account
   - All tokens deleted from database
   - No revocation call to external system (optional enhancement)
```

### External API Response Formats

**Token Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "def50200a1b2c3d4e5f6...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Qualification Response:**
```json
{
  "qualifications": {
    "phq9": true
  }
}
```

