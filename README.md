# IELTS Smart Practice Server

Backend server for IELTS Smart Practice Platform with complete authentication system.

## Features

- User registration with email validation
- Secure login with JWT authentication
- Protected routes with middleware
- Password hashing with bcrypt
- Cookie-based session management
- Input validation and sanitization

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=5000
   MONGO_CONNECTION_STRING=mongodb://localhost:27017/ielts
   COOKIE_SECRET=your_cookie_secret_here
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info (requires authentication)
- `POST /api/auth/logout` - Logout user

### Registration Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "targetBand": 7,
  "currentLevel": "intermediate",
  "examDate": "2023-12-31"
}
```

### Login Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

## Response Format

Successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation message",
  "user": { /* user data */ },
  "token": "jwt_token"
}
```

## Security Features

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens with configurable expiration
- Input validation with custom validators
- HTTP-only cookies for secure token storage
- CORS configured for secure cross-origin requests

## Running the Application

```bash
npm start
```

The server will start on the port specified in the `.env` file (default: 5000).