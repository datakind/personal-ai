# Shared Storage System

This application manages a data storage system shared by outside systems. It uses Drizzle ORM with better-sqlite3 to manage the storage system interactions.

The data stored in the system is unique to each person. Data is not shared between people.

## Features

- List people
- View a person and the data stored for them
- API endpoints to add and retrieve fact data to a person
- API endpoints to add and retrieve activity data to a person
- API endpoints to add and retrieve training data to a person

### Data Types

- Facts: Facts are primitive data about a person. Examples of this include given name, family name, date of birth.
- Activities: Activities are actions performed by a person. This data includes a category, a time of activity.
- Training: Training is education a persons has received for a subject area. This data includes a timestamp, name, and description of the training received.