# Product Overview

Training application that delivers pre-created knowledge materials to users based on their training history.

## Core Functionality

- Local user identification via incrementing identifier (login-like form)
- OAuth 2 authorization flow for optional storage system integration
- Local tracking of successful training delivery
- Bidirectional sync with shared storage system when users link accounts
- Training history queries on user sign-in for linked accounts

## Key Features

- Users can operate independently without linking to storage system
- Linked accounts receive API updates when training is delivered
- System checks for new training records from storage on each sign-in
- Training materials are selectively presented based on user history
