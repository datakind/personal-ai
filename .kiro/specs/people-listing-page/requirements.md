# Requirements Document

## Introduction

This feature replaces the default Next.js landing page with a people listing page that displays all people stored in the Shared Storage System. The page serves as the primary entry point for users to view and navigate to individual person records. The implementation uses Next.js Server Components for data fetching and follows the application's existing architecture patterns with Drizzle ORM and SQLite.

## Glossary

- **Landing_Page**: The root route (/) of the application that users see when they first access the system
- **People_Listing_Page**: The Server Component that displays all people from the database
- **Person_Record**: A row in the people table with associated facts, activities, and training data
- **Person_Facts**: Key-value pairs stored in the facts table (e.g., givenName, familyName, dateOfBirth)
- **Display_Name**: The human-readable name derived from a person's facts (givenName and familyName)
- **Empty_State**: The UI displayed when no people exist in the database
- **Person_Detail_Page**: The individual page for viewing a specific person's complete data
- **Database_Query**: A Drizzle ORM operation that retrieves data from SQLite

## Requirements

### Requirement 1: Replace Landing Page

**User Story:** As a user, I want to see a list of all people when I visit the application, so that I can quickly access person records without navigating through multiple pages.

#### Acceptance Criteria

1. THE Landing_Page SHALL display the People_Listing_Page at the root route (/)
2. THE Landing_Page SHALL remove all default Next.js template content
3. THE People_Listing_Page SHALL use React Server Components for rendering
4. THE People_Listing_Page SHALL fetch data directly from the database without client-side JavaScript

### Requirement 2: Fetch People Data

**User Story:** As a user, I want the system to load all people from the database, so that I can see everyone currently in the system.

#### Acceptance Criteria

1. THE People_Listing_Page SHALL execute a Database_Query to retrieve all Person_Records
2. THE Database_Query SHALL include related Person_Facts for each Person_Record
3. THE Database_Query SHALL use Drizzle ORM relational queries with the `with` clause
4. WHEN the database connection fails, THE People_Listing_Page SHALL display an error message

### Requirement 3: Display Person Information

**User Story:** As a user, I want to see relevant information about each person in the list, so that I can identify and distinguish between different people.

#### Acceptance Criteria

1. FOR EACH Person_Record, THE People_Listing_Page SHALL display a Display_Name
2. WHEN givenName and familyName facts exist, THE People_Listing_Page SHALL format the Display_Name as "givenName familyName"
3. WHEN only givenName exists, THE People_Listing_Page SHALL display the givenName as the Display_Name
4. WHEN no name facts exist, THE People_Listing_Page SHALL display "Person #[id]" as the Display_Name
5. THE People_Listing_Page SHALL display the person's creation date in a human-readable format

### Requirement 4: Navigate to Person Details

**User Story:** As a user, I want to click on a person in the list, so that I can view their complete information on a dedicated page.

#### Acceptance Criteria

1. FOR EACH Person_Record, THE People_Listing_Page SHALL render a clickable link
2. THE clickable link SHALL navigate to the Person_Detail_Page route at /people/[id]
3. THE clickable link SHALL use Next.js Link component for client-side navigation
4. WHEN a user clicks a person link, THE application SHALL navigate without a full page reload

### Requirement 5: Handle Empty State

**User Story:** As a user, I want to see a helpful message when no people exist, so that I understand the system is working but empty.

#### Acceptance Criteria

1. WHEN zero Person_Records exist in the database, THE People_Listing_Page SHALL display an Empty_State
2. THE Empty_State SHALL include a message indicating no people are currently in the system
3. THE Empty_State SHALL provide guidance on how people can be added to the system
4. THE Empty_State SHALL maintain consistent styling with the rest of the application

### Requirement 6: Apply Consistent Styling

**User Story:** As a user, I want the people listing page to match the application's design system, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. THE People_Listing_Page SHALL use Tailwind CSS classes for styling
2. THE People_Listing_Page SHALL support both light and dark color schemes
3. THE People_Listing_Page SHALL use the Geist font family defined in the root layout
4. THE People_Listing_Page SHALL be responsive and display properly on mobile and desktop viewports
5. THE People_Listing_Page SHALL maintain consistent spacing and typography with existing application styles

### Requirement 7: Optimize Performance

**User Story:** As a user, I want the people listing page to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. THE People_Listing_Page SHALL fetch data at build time or request time using Server Components
2. THE People_Listing_Page SHALL minimize client-side JavaScript by avoiding unnecessary 'use client' directives
3. THE Database_Query SHALL retrieve only the necessary fields for display (id, createdAt, and name-related facts)
4. THE People_Listing_Page SHALL leverage Next.js automatic code splitting for optimal bundle size
