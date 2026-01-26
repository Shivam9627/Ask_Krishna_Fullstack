# Ask Krishna Backend

MERN stack backend for Ask Krishna - A Bhagavad Gita Q&A application using Google Gemini API.

## Features

- 🔐 User authentication (JWT-based)
- 💬 Chat with AI powered by Google Gemini
- 📚 Bhagavad Gita-based responses
- 🌐 Multi-language support (English & Hindi)
- 📝 Chat history management
- ✉️ Email OTP verification
- 👤 User profile management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
- MongoDB connection string
- JWT secret key
- Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Email credentials (optional, for OTP)

### 3. Start MongoDB

Make sure MongoDB is running on your system. You can:
- Install MongoDB locally, or
- Use MongoDB Atlas (cloud)

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/send-registration-otp` - Send registration OTP
- `POST /api/auth/verify-registration-otp` - Verify registration OTP
- `POST /api/auth/send-delete-otp` - Send account deletion OTP
- `DELETE /api/auth/account` - Delete account

### Chat
- `POST /api/chat` - Send message and get AI response

### History
- `GET /api/history` - Get all chat history
- `GET /api/history/:id` - Get specific chat
- `DELETE /api/history/:id` - Delete specific chat
- `DELETE /api/history` - Delete all chats

## Getting Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to your `.env` file

## Notes

- In development mode, OTPs are logged to console if email is not configured
- Make sure to set a strong JWT_SECRET in production
- MongoDB connection string can be local or Atlas
