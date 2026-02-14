# IELTS Smart Practice API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Tokens are provided in response to successful login/registration and should be included in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "targetBand": 7.0,
  "currentLevel": "intermediate",
  "examDate": "2024-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "targetBand": 7.0,
    "currentLevel": "intermediate"
  },
  "token": "Bearer jwt_token_here"
}
```

#### POST `/login`
Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { /* user data */ },
  "token": "Bearer jwt_token_here"
}
```

#### GET `/me`
Get current user information (requires authentication).

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Users (`/api/v1/users`)

#### GET `/dashboard`
Get user dashboard data with statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user profile */ },
    "statistics": {
      "totalTests": 15,
      "totalPractice": 42,
      "avgScore": 6.8,
      "completedTests": 12
    },
    "skillPerformance": [
      {
        "skill": "listening",
        "accuracy": 75.5,
        "avgTime": 45.2
      }
    ],
    "recentActivity": [ /* recent practice sessions */ ],
    "weakAreas": [ /* skills needing improvement */ ]
  }
}
```

#### PUT `/profile`
Update user profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "targetBand": 7.5,
  "currentLevel": "advanced",
  "examDate": "2024-06-30"
}
```

#### GET `/tests/history`
Get user's test history with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (started, completed, paused, abandoned)
- `skill` (listening, reading, writing, speaking)

### Tests (`/api/v1/tests`)

#### GET `/`
Get all tests with filtering and pagination.

**Query Parameters:**
- `type` (full-mock, practice, mini, daily)
- `difficulty` (easy, medium, hard, exam)
- `status` (draft, published, archived)
- `skill` (listening, reading, writing, speaking)
- `search` (search by title or testId)
- `page`, `limit` for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [ /* array of tests */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### GET `/:id`
Get specific test by ID.

#### GET `/popular`
Get most popular tests.

#### GET `/type/:type`
Get tests by type.

### Practice Sessions (`/api/v1/practice`)

#### POST `/start`
Start a new practice session.

**Request Body:**
```json
{
  "test": "test_id",
  "section": "section_id",
  "type": "full-test",
  "skill": "listening"
}
```

#### GET `/active`
Get currently active practice session.

#### GET `/sessions`
Get user's practice sessions history.

**Query Parameters:**
- `status`, `type`, `skill`
- `startDate`, `endDate`
- `page`, `limit`

#### PUT `/sessions/:id`
Update practice session (submit answers, change status).

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question_id",
      "answer": "A",
      "isCorrect": true,
      "timeTaken": 45
    }
  ],
  "status": "completed"
}
```

#### POST `/submit-answers`
Submit answers in real-time during practice.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "answers": [
    {
      "questionId": "question_id",
      "answer": "Student's answer",
      "timeTaken": 30
    }
  ]
}
```

### Questions

#### Listening Questions (`/api/v1/questions/listening`)
- `GET /` - Get all listening questions
- `GET /:id` - Get question by ID
- `GET /test/:testId` - Get questions for specific test
- `GET /random` - Get random questions for practice

#### Reading Questions (`/api/v1/questions/reading`)
- Same endpoints as listening questions

#### Writing Questions (`/api/v1/questions/writing`)
- Same endpoints as listening questions

#### Speaking Questions (`/api/v1/questions/speaking`)
- Same endpoints as listening questions

### Results (`/api/v1/results`)

#### POST `/submit`
Submit test results.

**Request Body:**
```json
{
  "test": "test_id",
  "answers": [
    {
      "questionId": "question_id",
      "answer": "A",
      "isCorrect": true,
      "timeTaken": 45
    }
  ],
  "timeTaken": 165
}
```

#### GET `/my-results`
Get user's submitted results.

#### GET `/statistics`
Get user's performance statistics.

#### GET `/leaderboard`
Get top performers leaderboard.

### Tips (`/api/v1/tips`)

#### GET `/`
Get all tips with filtering.

**Query Parameters:**
- `category` (listening, reading, writing, speaking)
- `difficulty` (beginner, intermediate, advanced)
- `search` (search by title or content)

#### GET `/category/:category`
Get tips by category.

#### GET `/search`
Search tips by query.

#### GET `/popular`
Get most popular tips.

### Resources (`/api/v1/resources`)

#### GET `/`
Get all resources with filtering.

**Query Parameters:**
- `category` (cambridge, practice, vocabulary, etc.)
- `skill` (listening, reading, writing, speaking)
- `type` (book, pdf, audio, video, etc.)
- `isPremium` (true/false)

#### GET `/popular`
Get most downloaded resources.

#### POST `/:id/download`
Track resource download.

#### POST `/:id/rate`
Rate a resource (1-5 stars).

### Admin (`/api/v1/admin`)

#### GET `/dashboard`
Get admin dashboard statistics.

#### GET `/users`
Get all users (admin only).

#### GET `/users/:id`
Get specific user details.

#### PUT `/users/:id`
Update user information (admin only).

#### DELETE `/users/:id`
Delete user (admin only).

#### GET `/analytics`
Get system analytics and performance data.

#### GET `/content-stats`
Get content management statistics.

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": 400,
    "details": "Additional error details"
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Validation Rules

### User Registration
- Name: 2-50 characters, letters and spaces only
- Email: Valid email format
- Password: Minimum 8 characters with uppercase, lowercase, number, and special character
- Target Band: 0-9
- Current Level: beginner, intermediate, advanced

### Test Creation (Admin)
- Test ID: 1-20 characters
- Title: 3-200 characters
- Type: full-mock, practice, mini, daily
- Skills: Array of listening, reading, writing, speaking
- Difficulty: easy, medium, hard, exam
- Duration: Positive number (minutes)

### Resource Creation (Admin)
- Title: 3-200 characters
- Type: book, pdf, audio, video, link, practice-material
- Category: Valid category options
- Skill: Valid skill options
- File URL: Valid URL format (optional)

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## Security

- Passwords are hashed using bcrypt (12 rounds)
- JWT tokens with 7-day expiration
- HTTP-only cookies for secure token storage
- CORS configured for cross-origin requests
- Input validation and sanitization
- Helmet.js for security headers

## File Uploads

Supported file types:
- **Audio**: MP3, WAV, MP4 (max 50MB)
- **Images**: JPEG, JPG, PNG, GIF, WEBP (max 50MB)
- **Documents**: PDF, DOC, DOCX (max 50MB)

## Scoring System

### Listening/Reading
- Based on correct answers percentage
- Converted to IELTS band scores (0-9)
- Rounded to nearest 0.5

### Writing
- Task Achievement (40%)
- Coherence and Cohesion (25%)
- Lexical Resource (20%)
- Grammatical Range (15%)

### Speaking
- Fluency and Coherence
- Lexical Resource
- Grammatical Range
- Pronunciation

## Real-time Features

- Practice session tracking
- Answer submission with timestamps
- Progress monitoring
- Automatic session timing

## Seeding Data

To populate the database with sample data:
```bash
npm run seed:comprehensive
```

This creates:
- Sample users (admin, content admin, students)
- Various test types
- Practice questions for all skills
- Helpful tips and resources
- Sample content for testing

## Testing

The API includes comprehensive testing with sample data to ensure all features work correctly with real-world scenarios.