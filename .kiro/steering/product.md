# Product Overview

Shared Storage System - A data storage application that manages person-specific data shared by external systems.

## Core Purpose

Manages a SQLite-based storage system using Drizzle ORM where each person has their own isolated data. Data is never shared between people.

## Key Features

- List and view people in the system
- View person-specific stored data
- API endpoints for adding three data types:
  - Facts: Primitive data (given name, family name, date of birth)
  - Activities: Actions performed by a person (category, timestamp)
  - Training: Education received (timestamp, name, description)

## User Experience

The application provides both a web interface for viewing people and their data, plus REST API endpoints for external systems to add data programmatically.
