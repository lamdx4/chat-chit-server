# Chat-Chit Server

A real-time chat application backend built with Node.js, TypeScript, Socket.IO, and TypeORM. This server provides REST APIs and WebSocket functionality for a comprehensive social messaging platform with features like group chats, stories, friend management, and file sharing.

## 🚀 Features

### Core Features

- **Real-time Messaging**: WebSocket-based instant messaging with Socket.IO
- **Group Chat Management**: Create, manage, and participate in group conversations
- **Direct Messages**: Private one-on-one conversations
- **Story System**: Share temporary stories (images/videos) with friends
- **Friend Management**: Send/accept friend requests, block/unblock users
- **File Sharing**: Upload and share images, videos, documents, and more
- **User Authentication**: JWT-based authentication with refresh tokens
- **Google OAuth**: Link Google accounts for enhanced authentication

### Advanced Features

- **Message Reactions**: React to messages with emojis
- **Poll Messages**: Create and vote on polls within groups
- **Message Replies**: Reply to specific messages in conversations
- **Read Receipts**: Track message read status
- **User Privacy Settings**: Control who can message you and find you
- **Real-time Notifications**: Live updates for messages and activities
- **Cursor-based Pagination**: Efficient data loading for large datasets

## 🛠 Tech Stack

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL with TypeORM
- **Real-time**: Socket.IO with Redis adapter
- **Caching**: Redis
- **File Storage**: AWS S3
- **Authentication**: JWT + Google OAuth
- **File Upload**: Multer
- **Validation**: Express Validator
- **Logging**: Winston
- **Containerization**: Docker

## 📁 Project Structure

```plaintext
src/
├── application/          # Business logic layer
│   ├── auth/            # Authentication services
│   ├── group/           # Group and messaging services
│   ├── story/           # Story management services
│   ├── user/            # User management services
│   └── utils/           # Application utilities
├── core/
│   └── entities/        # TypeORM entity definitions
├── infras/              # Infrastructure layer
│   ├── data/           # Database repositories and migrations
│   ├── jwt/            # JWT token management
│   └── s3/             # AWS S3 integration
├── shared-kernel/       # Shared utilities
│   ├── env/            # Environment configuration
│   ├── logger/         # Logging utilities
│   └── decorators/     # Custom decorators
└── web/                 # Presentation layer
    ├── controllers/     # HTTP route controllers
    ├── middlewares/     # Express middlewares
    ├── routers/         # Route definitions
    ├── socketio/        # WebSocket handlers
    ├── configurations/ # App configurations
    └── utils/           # Web utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8.0+
- Redis 6.0+
- AWS S3 bucket (for file storage)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chat-chit-server
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with the following variables:

   ```env
   # Server Configuration
   SERVER_PORT=36363
   CORS_ORIGIN=http://localhost:5173
   ENVIRONMENT=DEVELOPMENT

   # Database Configuration
   DB_HOST=localhost
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_DATABASE=ChatChitDb
   DB_PORT=3306

   # Redis Configuration
   REDIS_CACHE_HOST=localhost
   REDIS_CACHE_PORT=6379
   REDIS_ADAPTER_SOCKET_HOST=localhost
   REDIS_ADAPTER_SOCKET_PORT=6379

   # JWT Configuration
   JWT_ISSUER=ChatChit
   JWT_AUDIENCE=ChatChit
   JWT_ACCESS_TOKEN_SECRET=your_access_secret
   JWT_REFRESH_TOKEN_SECRET=your_refresh_secret
   JWT_ACCESS_TOKEN_EXPIRATION=12
   JWT_REFRESH_TOKEN_EXPIRATION=5

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/u/link-to-google

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_BUCKET_NAME=your_bucket_name
   ```

4. **Database Setup**
   - Create a MySQL database named `ChatChitDb`
   - Run database migrations (if available)
   - Optionally seed data:

     ```bash
     yarn seed
     ```

5. **Start the development server**

   ```bash
   yarn dev
   ```

The server will start on `http://localhost:36363`

## 🐳 Docker Deployment

### Development

```bash
# Start development environment
yarn docker:run-dev

# Stop development environment
yarn docker:down-dev
```

### Production

```bash
# Build production image
yarn docker:build-prod

# Start production environment
yarn docker:run

# Stop production environment
yarn docker:down
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `PUT /api/auth/change-password` - Change password

### User Management

- `GET /api/user/my-profile` - Get current user profile
- `PUT /api/user/my-profile` - Update user profile
- `POST /api/user/profile/change-avatar` - Update user avatar
- `GET /api/user/search` - Search users
- `POST /api/user/relationship/send-friend-request` - Send friend request
- `GET /api/user/relationship/friend` - Get friends list
- `POST /api/user/relationship/block-user` - Block a user

### Group Management

- `POST /api/group/create` - Create a new group
- `GET /api/group/list` - Get user's groups
- `GET /api/group/:groupId/information` - Get group details
- `POST /api/group/:groupId/add-member` - Add members to group
- `GET /api/group/:groupId/message/list` - Get group messages
- `POST /api/group/:groupId/message/send` - Send text message
- `POST /api/group/:groupId/message/send/files` - Send file message

### Story Management

- `POST /api/story/` - Create a new story
- `GET /api/story/friends` - Get friends' stories
- `GET /api/story/recent` - Get recent stories
- `POST /api/story/:storyId/view` - Mark story as viewed
- `POST /api/story/:storyId/react` - React to story
- `DELETE /api/story/:storyId` - Delete story

## 🔌 WebSocket Events

### Client → Server

- `join-group` - Join a group room
- `leave-group` - Leave a group room
- `typing` - Indicate typing status
- `message-send` - Send a message

### Server → Client

- `new-message` - New message received
- `user-typing` - User is typing
- `user-joined` - User joined group
- `user-left` - User left group
- `message-reaction` - Message reaction update

## 🗃️ Database Schema

### Core Entities

- **User**: User profiles and authentication
- **GroupChat**: Group information and settings
- **Member**: Group membership and roles
- **Message**: Chat messages and metadata
- **Relationship**: Friend connections and status
- **Story**: Temporary story posts
- **File**: File storage references

### Key Relationships

- Users have many group memberships
- Groups contain multiple members
- Messages belong to members and groups
- Stories belong to users
- Relationships connect users

## 🔧 Configuration

### File Upload Limits

- **Images**: JPEG, PNG, GIF, WebP (max 10MB)
- **Videos**: MP4, WebM, MOV (max 50MB)
- **Documents**: PDF, DOC, XLS, etc. (max 25MB)
- **Maximum files per message**: 5

### Rate Limiting

- API requests are rate-limited to prevent abuse
- WebSocket connections have connection limits

### Security Features

- JWT token validation
- Input sanitization and validation
- File type verification
- CORS protection
- Helmet security headers

## 🚀 Deployment

### Production Environment Variables

Use `.env.prod` for production settings with:

- Production database connections
- Redis cluster configurations
- AWS S3 production bucket
- Production domain for CORS

### GitHub Actions

The project includes CI/CD workflows:

- **Continuous Integration**: Code quality checks and builds
- **Docker Build**: Automated Docker image building and pushing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- **Chat-Chit Client**: Frontend application for this server
- **Chat-Chit Mobile**: Mobile application

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.

---

Built with ❤️ using Node.js, TypeScript, and Socket.IO