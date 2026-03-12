# Implementation Plan: OAuth Client Flow

## Overview

This plan implements OAuth 2.0 authorization code flow for optional account linking to an external storage system. The implementation enables users to link their local accounts to access PHQ-9 qualification data while maintaining full application functionality for unlinked users. The approach follows Next.js 16 App Router patterns with Server Components, Server Actions, and secure token management using SQLite/Drizzle ORM.

## Tasks

- [x] 1. Set up OAuth configuration and environment validation
  - Create `lib/oauth.ts` with configuration types and validation functions
  - Implement `getOAuthConfig()` to load credentials from environment variables
  - Implement `isOAuthConfigured()` to check if OAuth is available
  - Add environment variable validation for OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_AUTHORIZATION_URL, OAUTH_TOKEN_URL, OAUTH_REDIRECT_URI
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ]* 1.1 Write unit tests for OAuth configuration validation
  - Test configuration loading with valid environment variables
  - Test configuration returns null when variables are missing
  - Test isOAuthConfigured() returns correct boolean values
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement OAuth authorization flow initiation
  - [x] 2.1 Create state token generation and authorization URL builder
    - Implement `generateStateToken()` using crypto.randomBytes for CSRF protection
    - Implement `buildAuthorizationUrl(state)` with proper query parameters
    - Include client_id, redirect_uri, response_type=code, scope=training, and state
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.2 Create Server Action for initiating linking flow
    - Create `app/actions/oauth.ts` with `initiateLinking()` Server Action
    - Check OAuth configuration availability
    - Require user authentication using `requireAuth()`
    - Generate state token and store in httpOnly cookie with 10-minute expiration
    - Build authorization URL and redirect user to external system
    - _Requirements: 2.2, 2.3, 2.4, 1.5_

  - [ ]* 2.3 Write unit tests for authorization flow initiation
    - Test state token generation produces unique values
    - Test authorization URL construction with correct parameters
    - Test Server Action handles missing OAuth configuration
    - Test Server Action requires authentication
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Verify authorization redirect works
  - Ensure OAuth configuration loads correctly
  - Ensure authorization URL redirects to external system
  - Ask the user if questions arise

- [x] 4. Implement OAuth callback handling and token exchange
  - [x] 4.1 Create token exchange functions
    - Implement `exchangeCodeForTokens(code)` to call token endpoint
    - Send grant_type=authorization_code with client credentials
    - Parse TokenResponse with access_token, refresh_token, expires_in
    - Handle network errors and invalid responses
    - _Requirements: 3.3, 3.4, 3.5, 3.7_

  - [x] 4.2 Create callback route handler
    - Create `app/api/oauth/callback/route.ts` with GET handler
    - Validate OAuth configuration is available
    - Extract code, state, and error parameters from query string
    - Handle authorization denial errors
    - Validate state parameter matches stored session value
    - Get current authenticated user
    - Exchange authorization code for tokens
    - Redirect to settings page with success/error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.3 Write integration tests for callback handling
    - Test successful callback with valid state and code
    - Test callback rejection with invalid state
    - Test callback handling of authorization denial
    - Test callback requires authenticated user
    - _Requirements: 3.1, 3.2, 3.7_

- [x] 5. Implement token persistence and management
  - [x] 5.1 Create token storage functions
    - Implement `storeTokens(userId, accessToken, refreshToken, expiresIn)` in `lib/oauth.ts`
    - Calculate expiration timestamp from expires_in seconds
    - Use Drizzle's `onConflictDoUpdate` to replace existing tokens
    - Store creation and update timestamps
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Create token retrieval and deletion functions
    - Implement `getTokensForUser(userId)` to query oauthTokens table
    - Implement `deleteTokensForUser(userId)` for unlinking
    - Implement `isTokenExpired(expiresAt)` helper function
    - _Requirements: 4.1, 4.5, 6.1, 6.2_

  - [ ]* 5.3 Write unit tests for token storage
    - Test token storage creates new records
    - Test token storage updates existing records
    - Test token retrieval returns correct data
    - Test token deletion removes records
    - Test unique constraint enforcement
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 6. Implement automatic token refresh
  - [x] 6.1 Create token refresh function
    - Implement `refreshAccessToken(refreshToken)` to call token endpoint
    - Send grant_type=refresh_token with client credentials
    - Parse response and extract new tokens
    - Handle refresh failures with descriptive errors
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 6.2 Create smart token retrieval with auto-refresh
    - Implement `getValidAccessToken(userId)` in `lib/oauth.ts`
    - Check if current token is expired
    - Return valid token immediately if not expired
    - Attempt refresh if token is expired
    - Update stored tokens with new values from refresh
    - Delete tokens if refresh fails
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.3 Write integration tests for token refresh
    - Test refresh succeeds with valid refresh token
    - Test refresh updates stored tokens
    - Test refresh handles new refresh token in response
    - Test refresh deletes tokens on failure
    - Test getValidAccessToken returns valid token without refresh
    - Test getValidAccessToken triggers refresh for expired token
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [x] 7. Checkpoint - Verify token lifecycle works
  - Ensure tokens are stored after successful callback
  - Ensure expired tokens trigger automatic refresh
  - Ensure failed refresh deletes tokens
  - Ask the user if questions arise

- [ ] 8. Implement account unlinking
  - [x] 8.1 Create unlinking Server Action
    - Add `unlinkAccount()` Server Action to `app/actions/oauth.ts`
    - Require user authentication
    - Call `deleteTokensForUser()` to remove stored tokens
    - Return success or error response
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.2 Write unit tests for unlinking
    - Test unlinking requires authentication
    - Test unlinking deletes user tokens
    - Test unlinking allows re-linking afterward
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 9. Enhance auth library with OAuth integration
  - [x] 9.1 Update getUserQualificationStatus to use OAuth tokens
    - Modify `getUserQualificationStatus()` in `lib/auth.ts`
    - Check for linked account using `getTokensForUser()`
    - Return not qualified if no linked account
    - Use `getValidAccessToken()` to get valid token (auto-refresh)
    - Call external API with Bearer token in Authorization header
    - Parse qualification response and extract PHQ-9 status
    - Handle API failures gracefully with default not qualified
    - Add 5-second timeout for API calls
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 9.2 Write integration tests for qualification checking
    - Test qualification check with valid linked account
    - Test qualification check returns not qualified without linked account
    - Test qualification check triggers token refresh for expired token
    - Test qualification check handles API failures gracefully
    - Test qualification check respects timeout
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 10. Create settings page and UI components
  - [x] 10.1 Create settings page with linking status
    - Create `app/settings/page.tsx` as Server Component
    - Get current authenticated user
    - Check OAuth configuration availability
    - Query user's token status to determine if linked
    - Fetch qualification status for linked users
    - Display account information and linking status
    - Show success/error messages from query parameters
    - Conditionally render linking UI based on OAuth configuration
    - _Requirements: 9.1, 9.3, 9.4, 1.5_

  - [x] 10.2 Create LinkAccountButton client component
    - Create `app/settings/components/LinkAccountButton.tsx` with 'use client'
    - Call `initiateLinking()` Server Action on button click
    - Show pending state during redirect
    - Display error alert if linking initiation fails
    - _Requirements: 9.1, 8.5_

  - [x] 10.3 Create UnlinkAccountButton client component
    - Create `app/settings/components/UnlinkAccountButton.tsx` with 'use client'
    - Show confirmation dialog before unlinking
    - Call `unlinkAccount()` Server Action on confirmation
    - Show pending state during operation
    - Refresh page on success using router.refresh()
    - Display error alert if unlinking fails
    - _Requirements: 6.3, 6.4_

  - [ ]* 10.4 Write integration tests for settings page
    - Test settings page displays linked status correctly
    - Test settings page shows qualification status for linked users
    - Test settings page hides OAuth UI when not configured
    - Test LinkAccountButton initiates linking flow
    - Test UnlinkAccountButton requires confirmation
    - _Requirements: 9.1, 9.3, 9.4, 1.5_

- [x] 11. Add error handling and user feedback
  - [x] 11.1 Implement error message mapping
    - Add `getErrorMessage()` helper function in settings page
    - Map error codes to user-friendly messages
    - Handle oauth_not_configured, authorization_denied, invalid_callback, invalid_state, token_exchange_failed
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 11.2 Add error logging throughout OAuth flow
    - Add console.error logging in token exchange failures
    - Add console.error logging in refresh failures
    - Add console.error logging in API call failures
    - Log detailed errors while showing user-friendly messages
    - _Requirements: 8.5_

  - [ ]* 11.3 Write tests for error handling
    - Test error messages display correctly for each error type
    - Test errors are logged without exposing sensitive data
    - Test user-friendly messages shown for all error scenarios
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Create database migration for oauthTokens table
  - Generate Drizzle migration for oauthTokens table (already in schema)
  - Run migration to create table in SQLite database
  - Verify table structure matches schema definition
  - Verify foreign key constraint and cascade delete work
  - _Requirements: 4.1, 4.5, 7.2, 7.3_

- [x] 13. Add environment variable documentation
  - Create or update .env.local.example with OAuth variables
  - Document required OAuth environment variables
  - Add comments explaining each variable's purpose
  - Ensure .env.local is in .gitignore
  - _Requirements: 1.1, 1.4_

- [x] 14. Final integration and testing
  - [x] 14.1 Test complete linking flow end-to-end
    - Test user can initiate linking from settings
    - Test authorization redirect works correctly
    - Test callback processes tokens and redirects to settings
    - Test linked status displays in settings
    - Test qualification check works with linked account
    - _Requirements: 2.4, 3.6, 9.3, 10.1_

  - [x] 14.2 Test unlinking flow end-to-end
    - Test user can unlink account from settings
    - Test tokens are deleted from database
    - Test user can re-link after unlinking
    - Test PHQ-9 access is restricted after unlinking
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 14.3 Test graceful degradation scenarios
    - Test application works without OAuth configuration
    - Test linking UI is hidden when OAuth not configured
    - Test users can perform PHQ-2 assessments without linking
    - Test qualification check defaults to not qualified on API failures
    - Test application continues working when external system is unavailable
    - _Requirements: 1.5, 9.2, 9.4, 9.5, 10.5_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all integration tests pass
  - Ensure error handling works correctly
  - Ensure graceful degradation works
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation uses TypeScript with Next.js 16 App Router patterns
- OAuth integration is optional and doesn't block core functionality
- Token refresh happens automatically before API calls
- All sensitive credentials are stored in environment variables
- Database operations use Drizzle ORM with SQLite
