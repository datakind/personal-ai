# Training Application

This application trains users by presenting them with pre-created knowledge about a topic area.

Training materials are selectively presented to the user based on their training history.

This application uses Drizzle ORM with better-sqlite3 to manage the storage system interactions.

## Features

- A simple, local login-like form to identify a user by an incrementing identifier.
- An OAuth 2 authorization and consent flow to optionally act on behalf of the user with the storage system. Users are not required to link in this system. 
- Successful user training delivery history is stored locally to the application. As training is successfully delivered to the user
- As training is successfully delivered, if the user has linked their account to the shared storage system, then the shared storage system receives API updates indicating the user has received the training.
- Each time a user signs in, and that user has linked to the storage system, then the storage system should be queried to check for any new training records.