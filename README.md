# IELTS Smart Practice Server

Backend server for IELTS Smart Practice Platform - A comprehensive system for IELTS exam preparation with full authentication, practice management, and admin capabilities.

## 🚀 Features

### Authentication & Security
- 🔐 Secure user registration and login with JWT
- 🛡️ Role-based access control (user, admin, content_admin)
- 🔒 Password hashing with bcrypt (12 rounds)
- 🍪 HTTP-only cookies for secure token storage
- 🚦 Rate limiting and security middleware
- 🕵️ Suspicious activity detection
- 📊 Comprehensive logging system

### Core Functionality
- 📝 Full IELTS test management (Listening, Reading, Writing, Speaking)
- 🎯 Practice session tracking with real-time progress
- 📊 Advanced scoring system with IELTS band conversion
- 💡 Tips and strategies for all IELTS skills
- 📚 Resource library with file upload capabilities
- 🏆 User dashboard with performance analytics
- 📈 Progress tracking and weak area analysis

### Admin Features
- 🛠️ Content management system
- 👥 User management and monitoring
- 📊 System analytics and reporting
- 📁 File upload and management
- 🛡️ Security monitoring and alerts

### Technical Features
- 🔄 Real-time practice session management
- 📁 File upload with multer (audio, images, documents)
- 📝 Comprehensive validation middleware
- 📊 Winston logging with multiple transports
- 🔒 Advanced security measures
- 📈 Performance monitoring

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_CONNECTION_STRING=mongodb://localhost:27017/ielts
   COOKIE_SECRET=your_secure_cookie_secret_here
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   LOG_LEVEL=info
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run prod
```

### Seeding Data
```bash
# Basic seeding
npm run seed

# Comprehensive seeding with sample data
npm run seed:comprehensive
```

## 📚 API Documentation

Full API documentation is available in [API_DOCS.md](API_DOCS.md)

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

#### Tests & Practice
- `GET /api/v1/tests` - Get all tests
- `POST /api/v1/practice/start` - Start practice session
- `PUT /api/v1/practice/sessions/:id` - Update session
- `GET /api/v1/practice/sessions` - Get session history

#### Questions
- `GET /api/v1/questions/listening` - Listening questions
- `GET /api/v1/questions/reading` - Reading questions
- `GET /api/v1/questions/writing` - Writing questions
- `GET /api/v1/questions/speaking` - Speaking questions

#### User Management
- `GET /api/v1/users/dashboard` - User dashboard
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/tests/history` - Test history

#### Resources & Tips
- `GET /api/v1/resources` - Learning resources
- `GET /api/v1/tips` - IELTS tips and strategies

#### Admin Panel
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/analytics` - System analytics

## 🛠️ Development

### Project Structure
```
src/
├── controller/          # Route handlers
├── middlewares/         # Custom middleware
│   ├── auth.js          # Authentication middleware
│   ├── validation.js    # Input validation
│   ├── upload.js        # File upload handling
│   └── security.js      # Security middleware
├── models/              # Database models
├── routers/             # Route definitions
├── utils/               # Utility functions
│   ├── logger.js        # Winston logging
│   ├── scoring.js       # IELTS scoring system
│   └── validators.js    # Custom validators
└── ...
```

### Seeding Sample Data
The comprehensive seeder creates:
- Sample users (admin, content admin, students)
- Various test types (full mocks, practice tests)
- Questions for all IELTS skills
- Helpful tips and resources
- Practice content for testing

### Logging
The system uses Winston for comprehensive logging:
- Console output with colors in development
- File logging for errors, combined logs, and exceptions
- Structured JSON logging for production
- Custom log levels for different event types

### Security Features
- Input validation and sanitization
- Rate limiting on all endpoints
- Suspicious activity detection
- User agent validation
- Request size limiting
- Enumeration attack prevention

## 🧪 Testing

### Available Scripts
```bash
npm run seed          # Run basic seeder
npm run seed:comprehensive  # Run comprehensive seeder
npm run dev           # Development mode with nodemon
npm run prod          # Production mode
```

### Test Credentials (after seeding)
```
Admin: admin@example.com / AdminPassword123!
Content Admin: content@example.com / ContentAdmin123!
Student 1: john@example.com / StudentPassword123!
Student 2: jane@example.com / StudentPassword456!
```

## 📊 System Architecture

### Database Models
- **User**: User accounts and profiles
- **Test**: IELTS test definitions
- **Section**: Test sections
- **Question**: Questions for all skills
- **PracticeHistory**: User practice sessions
- **Result**: Test results and scores
- **Resource**: Learning materials
- **Tip**: IELTS strategies and tips
- **Analytics**: System usage analytics

### Key Components
- **Authentication System**: JWT-based with role management
- **Practice Engine**: Real-time session tracking
- **Scoring System**: IELTS band conversion logic
- **File Management**: Multer-based upload system
- **Security Layer**: Comprehensive protection measures
- **Logging System**: Detailed operational logging

## 🎯 IELTS Skills Coverage

### Listening
- Multiple choice questions
- Form completion
- Map labeling
- Sentence completion
- Audio file management

### Reading
- Multiple choice
- True/False/Not Given
- Yes/No/Not Given
- Matching headings
- Sentence completion
- Passage management

### Writing
- Task 1: Report writing
- Task 2: Essay writing
- Word count tracking
- Band scoring system

### Speaking
- Part 1: Introduction questions
- Part 2: Cue card topics
- Part 3: Discussion questions
- Response time tracking

## 📈 Performance & Monitoring

### Logging Features
- API request/response tracking
- Database operation logging
- User activity monitoring
- Security event detection
- Performance metrics
- Error tracking with stack traces

### Security Monitoring
- Rate limit violations
- Suspicious activity alerts
- Authentication failures
- File operation security
- Request validation failures

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions, please create an issue in the repository or contact the development team.