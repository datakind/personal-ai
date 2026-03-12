# Requirements Document

## Introduction

This document specifies requirements for adding user authentication and session management to the patient health reporting application. The system will implement a simple local login interface that identifies users through incrementing identifiers, enabling user tracking for patient data collection. The authentication mechanism focuses on user identification rather than complex security, as the application is designed for internal use by trained staff.

## Glossary

- **Auth_System**: The authentication and session management subsystem
- **Login_Form**: The user interface component that collects user identification
- **Session_Manager**: The component responsible for creating, validating, and terminating user sessions
- **User_Record**: A database entry representing a registered user with a unique identifier
- **Session_Token**: A cryptographically secure identifier that represents an active user session
- **Protected_Route**: Any application route that requires an authenticated session to access
- **Session_Store**: The persistent storage mechanism for active session data
- **User_Identifier**: An auto-incrementing integer that uniquely identifies each user

## Requirements

### Requirement 1: User Registration

**User Story:** As a staff member, I want to register with the system, so that I can be identified when collecting patient data.

#### Acceptance Criteria

1. WHEN a new user submits the Login_Form, THE Auth_System SHALL create a User_Record with an auto-incremented User_Identifier
2. THE Auth_System SHALL store User_Records in the SQLite database using Drizzle ORM
3. WHEN creating a User_Record, THE Auth_System SHALL assign the next sequential User_Identifier starting from 1
4. FOR ALL User_Records, the User_Identifier SHALL be unique and immutable
5. THE Auth_System SHALL NOT persist training qualifications locally, as these will be retrieved from an external API

### Requirement 2: Session Creation

**User Story:** As a staff member, I want to log in to the system, so that I can access the patient data collection interface.

#### Acceptance Criteria

1. WHEN a user submits valid credentials through the Login_Form, THE Session_Manager SHALL create a new session
2. THE Session_Manager SHALL generate a cryptographically secure Session_Token for each new session
3. THE Session_Manager SHALL store the Session_Token in an HTTP-only cookie
4. THE Session_Manager SHALL persist session data in the Session_Store with the associated User_Identifier
5. WHEN session creation succeeds, THE Auth_System SHALL redirect the user to the main application page
6. THE Session_Manager SHALL set session expiration to 8 hours from creation time

### Requirement 3: Route Protection

**User Story:** As a system administrator, I want all application routes protected except the login page, so that only authenticated users can access patient data.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a Protected_Route, THE Auth_System SHALL redirect them to the Login_Form
2. THE Auth_System SHALL allow unauthenticated access to the login route
3. WHEN an authenticated user accesses a Protected_Route, THE Auth_System SHALL allow the request to proceed
4. THE Auth_System SHALL validate the Session_Token on every request to a Protected_Route
5. WHEN a user with a valid session accesses the login route, THE Auth_System SHALL redirect them to the main application page

### Requirement 4: Session Validation

**User Story:** As a staff member, I want my session to remain active while I work, so that I can collect patient data without repeated logins.

#### Acceptance Criteria

1. WHEN a request includes a Session_Token, THE Session_Manager SHALL verify the token exists in the Session_Store
2. WHEN a Session_Token is valid and not expired, THE Session_Manager SHALL allow the request to proceed
3. IF a Session_Token is invalid or missing, THEN THE Session_Manager SHALL treat the request as unauthenticated
4. WHEN a Session_Token is expired, THE Session_Manager SHALL remove it from the Session_Store and treat the request as unauthenticated
5. THE Session_Manager SHALL validate session expiration time on every request

### Requirement 5: Session Termination

**User Story:** As a staff member, I want to log out of the system, so that I can end my session when I finish collecting patient data.

#### Acceptance Criteria

1. WHEN a user initiates logout, THE Session_Manager SHALL remove the Session_Token from the Session_Store
2. THE Session_Manager SHALL clear the Session_Token cookie from the user's browser
3. WHEN logout completes, THE Auth_System SHALL redirect the user to the Login_Form
4. THE Session_Manager SHALL remove expired sessions from the Session_Store within 1 hour of expiration

### Requirement 6: Login Interface

**User Story:** As a staff member, I want a simple login form, so that I can quickly identify myself and begin collecting patient data.

#### Acceptance Criteria

1. THE Login_Form SHALL display input fields for user identification
2. THE Login_Form SHALL display a submit button to initiate authentication
3. WHEN the Login_Form is submitted with empty fields, THE Auth_System SHALL display a validation error message
4. WHEN authentication fails, THE Login_Form SHALL display an error message to the user
5. THE Login_Form SHALL use Server Actions for form submission
6. THE Login_Form SHALL display a loading state while authentication is in progress

### Requirement 7: Session Security

**User Story:** As a system administrator, I want sessions stored securely, so that user sessions cannot be hijacked or tampered with.

#### Acceptance Criteria

1. THE Session_Manager SHALL generate Session_Tokens using a cryptographically secure random number generator with at least 128 bits of entropy
2. THE Session_Manager SHALL set the HTTP-only flag on session cookies
3. THE Session_Manager SHALL set the Secure flag on session cookies when the application runs over HTTPS
4. THE Session_Manager SHALL set the SameSite attribute to "lax" on session cookies
5. THE Session_Store SHALL store session data in the SQLite database using Drizzle ORM

### Requirement 8: User Context Access

**User Story:** As a developer, I want to access the current user's information in Server Components, so that I can implement user-specific functionality.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a function to retrieve the current User_Identifier from the session
2. THE Auth_System SHALL provide a function to retrieve the complete User_Record for the authenticated user
3. WHEN called from a Server Component with a valid session, THE Auth_System SHALL return the user information
4. WHEN called from a Server Component without a valid session, THE Auth_System SHALL return null
5. THE Auth_System SHALL use the Session_Token from the request cookies to identify the user
