# Reporting Application

This application collects patient health reporting data from users. Users are collecting this data on behalf of a patient.

Depending on the training of the user and reporting data collected, this application will present forms to collect the following:

- All users must fill out a Patient Health Questionnaire-2 (PHQ-2) for a patient,
- If the user is has "PHQ-9" training, and the patient's calculated PHQ-2 score is 3 ore higher, then the user must fill out a Patient Health Questionnaire-9 (PHQ-9)
for the patient.

This application uses Drizzle ORM with better-sqlite3 to manage the storage system interactions.

## Features

- Capture PHQ-2 data from a user on behalf of a patient.
- If the user has sufficient training and the patient meets PHQ-2 criteria, capture PHQ-9 data from a user on behalf of a patient.
- A simple, local login-like form to identify a user by an incrementing identifier.
- An OAuth 2 authorization and consent flow to optionally act on behalf of the user with the storage system. Users are not required to link in this system.