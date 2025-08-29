# Project Management System

## Setup

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `python manage.py migrate`
4. `python manage.py runserver`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Database
- Uses PostgreSQL. Update `settings.py` with your DB credentials.

## API Documentation

### GraphQL Queries
- `me`: Get current user
- `projects(organization_slug)`: List projects for organization
- `project(organization_slug, project_slug)`: Get project details
- `tasks(organization_slug, project_slug)`: List tasks for project

### Mutations
- `signup(username, password, organization_name)`
- `login(username, password)`
- `logout`
- `createProject`
- `createTask`
- `createTaskComment`

## Demo

Add screenshots or a link to a demo video.

## Technical Summary

- Multi-tenant architecture with organization isolation.
- Apollo Client for frontend GraphQL integration.
- Responsive UI with TailwindCSS.
- Future improvements: Add subscriptions, Docker, more tests.