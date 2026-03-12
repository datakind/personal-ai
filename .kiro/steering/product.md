# Product Overview

This is a patient health reporting application that collects mental health assessment data on behalf of patients. The application implements a conditional assessment workflow based on user training and initial screening results.

## Core Functionality

Users collect patient health data through standardized questionnaires:

- All users complete a Patient Health Questionnaire-2 (PHQ-2) for patients
- Users with "PHQ-9" training complete an extended Patient Health Questionnaire-9 (PHQ-9) when the patient's PHQ-2 score is 3 or higher

## User Management

- Simple local login-like form identifies users by incrementing identifier
- Optional OAuth 2 authorization and consent flow for storage system integration
- Users can operate without linking to the storage system

## Data Storage

The application uses a local SQLite database managed through Drizzle ORM with better-sqlite3 for all data persistence.
