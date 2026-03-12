# Requirements Document

## Introduction

This document specifies requirements for patient data collection functionality in the patient health reporting application. The system will enable authenticated users to create patient records and collect mental health assessment data through standardized PHQ-2 and PHQ-9 questionnaires. The implementation follows a conditional assessment workflow where initial PHQ-2 screening determines whether extended PHQ-9 assessment is required, based on both the screening score and the user's training qualifications.

## Glossary

- **Patient_Record**: A database entry representing a patient with demographic information
- **Assessment_Record**: A database entry storing responses to a PHQ-2 or PHQ-9 questionnaire
- **PHQ2_Questionnaire**: A 2-question depression screening tool with scores ranging from 0-6
- **PHQ9_Questionnaire**: A 9-question depression assessment tool with scores ranging from 0-27
- **Data_Collection_Interface**: The user interface for entering patient information and assessment responses
- **Assessment_Workflow**: The conditional logic that determines which questionnaires to present
- **Patient_Manager**: The component responsible for creating and retrieving patient records
- **Assessment_Manager**: The component responsible for storing and retrieving assessment data
- **PHQ9_Qualified_User**: A user with training certification to administer PHQ-9 questionnaires
- **Score_Threshold**: The PHQ-2 score value (3 or higher) that triggers PHQ-9 assessment requirement

## Requirements

### Requirement 1: Patient Record Management

**User Story:** As a staff member, I want to create patient records, so that I can associate assessment data with specific patients.

#### Acceptance Criteria

1. THE Patient_Manager SHALL store Patient_Records in the SQLite database using Drizzle ORM
2. WHEN creating a Patient_Record, THE Patient_Manager SHALL assign a unique auto-incremented identifier
3. THE Patient_Manager SHALL store the patient's first name, last name, and date of birth
4. THE Patient_Manager SHALL record the User_Identifier of the staff member who created the Patient_Record
5. THE Patient_Manager SHALL record the creation timestamp for each Patient_Record
6. FOR ALL Patient_Records, the unique identifier SHALL be immutable after creation

### Requirement 2: Patient Record Retrieval

**User Story:** As a staff member, I want to view existing patient records, so that I can select a patient for assessment.

#### Acceptance Criteria

1. THE Patient_Manager SHALL provide a function to retrieve all Patient_Records ordered by creation date
2. THE Patient_Manager SHALL provide a function to retrieve a specific Patient_Record by identifier
3. WHEN retrieving Patient_Records, THE Patient_Manager SHALL include the patient's name, date of birth, and creation date
4. THE Patient_Manager SHALL return an empty list when no Patient_Records exist
5. WHEN a requested Patient_Record does not exist, THE Patient_Manager SHALL return null

### Requirement 3: PHQ-2 Assessment Collection

**User Story:** As a staff member, I want to collect PHQ-2 assessment data for patients, so that I can screen for depression symptoms.

#### Acceptance Criteria

1. THE Assessment_Manager SHALL store PHQ2_Questionnaire responses in the SQLite database using Drizzle ORM
2. THE Data_Collection_Interface SHALL display both PHQ-2 questions with response options (0-3 scale)
3. WHEN a user submits a PHQ2_Questionnaire, THE Assessment_Manager SHALL calculate and store the total score (0-6)
4. THE Assessment_Manager SHALL record the Patient_Record identifier, User_Identifier, and completion timestamp
5. THE Assessment_Manager SHALL store individual question responses for each PHQ-2 question
6. THE Assessment_Manager SHALL mark the assessment type as "PHQ-2"

### Requirement 4: PHQ-9 Assessment Collection

**User Story:** As a PHQ-9 qualified staff member, I want to collect PHQ-9 assessment data for patients with elevated PHQ-2 scores, so that I can perform comprehensive depression assessment.

#### Acceptance Criteria

1. THE Assessment_Manager SHALL store PHQ9_Questionnaire responses in the SQLite database using Drizzle ORM
2. THE Data_Collection_Interface SHALL display all 9 PHQ-9 questions with response options (0-3 scale)
3. WHEN a user submits a PHQ9_Questionnaire, THE Assessment_Manager SHALL calculate and store the total score (0-27)
4. THE Assessment_Manager SHALL record the Patient_Record identifier, User_Identifier, and completion timestamp
5. THE Assessment_Manager SHALL store individual question responses for each PHQ-9 question
6. THE Assessment_Manager SHALL mark the assessment type as "PHQ-9"

### Requirement 5: Conditional Assessment Workflow

**User Story:** As a staff member, I want the system to determine which assessments I should complete, so that I follow the correct clinical protocol.

#### Acceptance Criteria

1. WHEN a user begins an assessment for a patient, THE Assessment_Workflow SHALL present the PHQ2_Questionnaire first
2. WHEN a PHQ2_Questionnaire is completed with a score below the Score_Threshold, THE Assessment_Workflow SHALL complete the assessment session
3. WHEN a PHQ2_Questionnaire is completed with a score at or above the Score_Threshold, THE Assessment_Workflow SHALL check if the user is a PHQ9_Qualified_User
4. IF the user is a PHQ9_Qualified_User AND the PHQ-2 score is at or above the Score_Threshold, THEN THE Assessment_Workflow SHALL present the PHQ9_Questionnaire
5. IF the user is not a PHQ9_Qualified_User AND the PHQ-2 score is at or above the Score_Threshold, THEN THE Assessment_Workflow SHALL display a message indicating PHQ-9 assessment is required but the user is not qualified
6. WHEN the assessment session completes, THE Assessment_Workflow SHALL redirect to the patient list or assessment summary

### Requirement 6: User Training Qualification

**User Story:** As a system administrator, I want to track which users are qualified to administer PHQ-9 assessments, so that the system enforces proper clinical protocols.

#### Acceptance Criteria

1. THE Auth_System SHALL retrieve PHQ-9 qualification status from the external common storage system API
2. WHEN a user has not linked their account via OAuth authorization, THE Auth_System SHALL assume the user is NOT qualified to administer PHQ-9 assessments
3. WHEN determining assessment eligibility, THE Assessment_Workflow SHALL check the current user's PHQ-9 qualification status via the Auth_System
4. THE Auth_System SHALL provide a function to check if a user has linked their account to the external API
5. THE Auth_System SHALL provide a function to retrieve the current user's qualification status from the external API
6. WHEN the external API is unavailable or returns an error, THE Auth_System SHALL default to not qualified for safety

### Requirement 7: Patient Data Collection Interface

**User Story:** As a staff member, I want an intuitive interface for entering patient information and assessments, so that I can efficiently collect data.

#### Acceptance Criteria

1. THE Data_Collection_Interface SHALL provide a form to create new Patient_Records with name and date of birth fields
2. THE Data_Collection_Interface SHALL display a list of existing Patient_Records with patient names and creation dates
3. THE Data_Collection_Interface SHALL provide a button to begin a new assessment for each patient
4. THE Data_Collection_Interface SHALL display questionnaire questions one at a time or all together based on usability
5. THE Data_Collection_Interface SHALL display response options clearly labeled with their numeric values
6. THE Data_Collection_Interface SHALL use Server Actions for form submission
7. THE Data_Collection_Interface SHALL display loading states during data submission

### Requirement 8: Assessment Data Retrieval

**User Story:** As a staff member, I want to view assessment history for patients, so that I can track depression screening over time.

#### Acceptance Criteria

1. THE Assessment_Manager SHALL provide a function to retrieve all Assessment_Records for a specific Patient_Record
2. WHEN retrieving Assessment_Records, THE Assessment_Manager SHALL include the assessment type, score, and completion timestamp
3. THE Assessment_Manager SHALL order Assessment_Records by completion timestamp in descending order
4. THE Assessment_Manager SHALL return an empty list when no Assessment_Records exist for a patient
5. THE Assessment_Manager SHALL include the User_Identifier of the staff member who completed each assessment

### Requirement 9: Data Validation

**User Story:** As a system administrator, I want all patient and assessment data validated before storage, so that the database maintains data integrity.

#### Acceptance Criteria

1. WHEN creating a Patient_Record, THE Patient_Manager SHALL validate that first name and last name are non-empty strings
2. WHEN creating a Patient_Record, THE Patient_Manager SHALL validate that date of birth is a valid date in the past
3. WHEN submitting a PHQ2_Questionnaire, THE Assessment_Manager SHALL validate that all 2 questions have responses
4. WHEN submitting a PHQ9_Questionnaire, THE Assessment_Manager SHALL validate that all 9 questions have responses
5. WHEN submitting any questionnaire, THE Assessment_Manager SHALL validate that each response is an integer between 0 and 3
6. IF validation fails, THEN THE Data_Collection_Interface SHALL display specific error messages to the user
7. THE Patient_Manager SHALL reject Patient_Record creation if the creating user is not authenticated

### Requirement 10: Assessment Score Calculation

**User Story:** As a staff member, I want assessment scores calculated automatically, so that I can quickly interpret screening results.

#### Acceptance Criteria

1. WHEN a PHQ2_Questionnaire is submitted, THE Assessment_Manager SHALL sum the 2 question responses to calculate the total score
2. WHEN a PHQ9_Questionnaire is submitted, THE Assessment_Manager SHALL sum the 9 question responses to calculate the total score
3. THE Assessment_Manager SHALL store the calculated total score with each Assessment_Record
4. THE Assessment_Manager SHALL verify that PHQ-2 total scores are between 0 and 6
5. THE Assessment_Manager SHALL verify that PHQ-9 total scores are between 0 and 27
6. IF a calculated score is outside the valid range, THEN THE Assessment_Manager SHALL reject the submission with an error

