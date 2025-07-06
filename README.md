# 🚀 Real-Time Messaging System

> A scalable and high-performance real-time messaging system developed using modern web technologies. A secure and fast platform where users can chat with each other in real-time, supported by an automatic messaging system.

### 🎯 Main Features

-   **Real-Time Messaging**: Instant message sending and receiving with Socket.IO
-   **Smart User Management**: Secure JWT-based authentication system
-   **Automatic Message System**: Automatic user pairing with scheduled tasks
-   **Performance Optimization**: Fast API responses with Redis cache system
-   **Asynchronous Operations**: Reliable message queue management with RabbitMQ
-   **Search & Analytics**: Full-text search and analytics with Elasticsearch
-   **Comprehensive Documentation**: Detailed API documentation with Swagger/OpenAPI

### 🏗️ Technical Details

-   **Scalable Architecture**: Modular structure with microservice approach
-   **Security-Focused**: Rate limiting, input validation, security headers
-   **Production Ready**: Error handling, logging, monitoring
-   **Modern Technologies**: Latest Node.js ecosystem tools

## 📋 Table of Contents

-   [Features](#-features)
-   [Technologies](#-technologies)
-   [Installation](#-installation)
-   [API Endpoints](#-api-endpoints)
-   [API Documentation](#-api-documentation)
-   [Socket.IO Events](#socketio-events)
-   [System Architecture](#-system-architecture)
-   [Security](#-security)
-   [Performance](#-performance)

## ✨ Features

### 🔑 Authentication & Security

-   **JWT Token Authentication** - Access and Refresh token system
-   **Password Hashing** - Secure encryption with bcryptjs
-   **Token Blacklisting** - Secure session termination
-   **Rate Limiting** - Rate limiting for API security
-   **Input Validation** - Data validation with Express-validator
-   **Security Headers** - Security headers with Helmet.js

### 💬 Real-Time Messaging

-   **Real-time Messaging** - Real-time messaging with Socket.IO
-   **Typing Indicators** - Typing indicator
-   **Message Read Status** - Message read notification
-   **Online/Offline Status** - User status tracking
-   **Room Management** - Conversation room management

### 🤖 Automatic System

-   **Scheduled Messages** - Scheduled automatic messages
-   **User Pairing** - Random user pairing
-   **Queue Management** - Asynchronous operations with RabbitMQ
-   **Retry Mechanism** - Retry on error

### ⚡ Performance & Cache

-   **Redis Caching** - API response caching
-   **Database Indexing** - MongoDB performance optimization
-   **Connection Pooling** - Database connection management
-   **Memory Optimization** - Memory usage optimization
-   **Search Optimization** - Elasticsearch indexing and query optimization

### 📖 Documentation & Monitoring

-   **Swagger/OpenAPI** - Comprehensive API documentation
-   **Winston Logging** - Detailed logging system
-   **Error Handling** - Centralized error management
-   **Health Checks** - System health monitoring

## 🛠 Technologies

### Backend

-   **Node.js** - JavaScript runtime
-   **Express.js** - Web framework
-   **Socket.IO** - Real-time communication
-   **MongoDB** - NoSQL database
-   **Mongoose** - MongoDB ODM

### Message Queue & Cache

-   **RabbitMQ** - Message queue system
-   **Redis** - In-memory data store
-   **amqplib** - RabbitMQ client

### Search & Analytics

-   **Elasticsearch** - Full-text search and analytics engine
-   **@elastic/elasticsearch** - Elasticsearch client for Node.js

### Security & Validation

-   **JWT** - JSON Web Tokens
-   **bcryptjs** - Password hashing
-   **express-validator** - Input validation
-   **helmet** - Security headers
-   **express-rate-limit** - Rate limiting

### Documentation & Logging

-   **Swagger/OpenAPI** - API documentation
-   **Winston** - Logging framework
-   **node-cron** - Scheduled tasks

## 🚀 Installation

### Requirements

-   Node.js (v16 or higher)
-   MongoDB (v5 or higher)
-   Redis (v6 or higher)
-   RabbitMQ (v3.8 or higher)
-   Elasticsearch (v7 or higher)

### 1. Clone the Repository

```bash
git clone https://github.com/onurcansevinc/nodelabs-study-case.git
cd nodelabs-study-case
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/messaging_system

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 4. Start the Application

```bash
npm start
```

### 📖 API Endpoints

#### Authentication

```bash
# User Registration
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}

# User Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Token Refresh
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

# User Logout
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Users

```bash
# User List
GET /api/user/list
Authorization: Bearer <access_token>
```

#### Conversations

```bash
# Conversation List
GET /api/conversations
Authorization: Bearer <access_token>

# Create Conversation
POST /api/conversations
{
  "participantId": "user_id",
}

# Conversation List
GET /api/conversations

```

#### Messages

```bash
# Send Message
POST /api/messages/send
{
  "content": "Hello, world!",
  "conversationId": "conversation_id"
}

# Message List
GET /api/messages/:conversationId

# Message Read
PUT /api/messages/:messageId/read
```

### Socket.IO Events

#### Client Events

```javascript
// Connection
const socket = io('http://localhost:3000', {
    auth: { token: 'Bearer your_jwt_token' },
});

// Join room
socket.emit('join_room', 'conversation_id');

// Send message
socket.emit('send_message', {
    content: 'Hello!',
    conversationId: 'conversation_id',
});

// Typing indicator
socket.emit('typing_start', { conversationId: 'conversation_id' });
socket.emit('typing_stop', { conversationId: 'conversation_id' });

// Message read
socket.emit('message_read', { messageId: 'message_id' });
```

#### Server Events

```javascript
// Message received
socket.on('message_received', (data) => {
    console.log('New message:', data);
});

// Typing indicator
socket.on('user_typing', (data) => {
    console.log('User typing:', data);
});

// User status
socket.on('user_online', (data) => {
    console.log('User online:', data);
});

// Message read
socket.on('message_read_by', (data) => {
    console.log('Message read by:', data);
});
```

## 📖 API Documentation

Access API documentation with Swagger UI:
http://localhost:3000/api-docs

## 🏗 System Architecture

### Data Models

#### User

```javascript
{
  username: String,
  email: String,
  password: String,
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  isActive: Boolean
}
```

#### Conversation

```javascript
{
  participants: [ObjectId],
  name: String,
  isDirect: Boolean,
  lastMessage: ObjectId,
  lastMessageAt: Date
}
```

#### Message

```javascript
{
  content: String,
  sender: ObjectId,
  conversation: ObjectId,
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  isDeleted: Boolean
}
```

#### AutoMessage

```javascript
{
  content: String,
  senderId: ObjectId,
  receiverId: ObjectId,
  conversationId: ObjectId,
  sendDate: Date,
  isQueued: Boolean,
  isSent: Boolean
}
```

### System Flow

#### 1. Message Planning (02:00)

-   Fetches active users
-   Performs random pairing
-   Creates AutoMessage records

#### 2. Queue Management (Every Minute)

-   Detects messages ready for sending
-   Adds to RabbitMQ queue

#### 3. Message Distribution

-   Processes messages in queue
-   Sends real-time notifications via Socket.IO

## 🔒 Security

### Authentication

-   JWT-based authentication
-   Access and Refresh token system
-   Secure logout with token blacklisting

### Authorization

-   Role-based access control
-   Resource-level permissions
-   Secure middleware chain

### Data Protection

-   Password hashing (bcryptjs)
-   Input validation and sanitization
-   SQL injection protection
-   XSS protection

### API Security

-   Rate limiting
-   CORS configuration
-   Security headers (Helmet)
-   Request size limiting

## ⚡ Performance

### Caching Strategy

-   API response caching with Redis
-   Smart cache invalidation
-   User-specific cache keys
-   TTL-based cache management

### Search Strategy

-   Full-text search with Elasticsearch
-   Real-time indexing of messages and conversations
-   Advanced search queries and filters
-   Search result ranking and relevance scoring

### Database Optimization

-   MongoDB indexing
-   Connection pooling
-   Query optimization
-   Aggregation pipelines

### Real-time Performance

-   Socket.IO room management
-   Efficient broadcasting
-   Connection pooling
-   Memory optimization

## 📊 Monitoring

### Health Checks

```bash
GET /api/health
```

## 🙏 Acknowledgments

This project was developed using the following open-source projects:

-   [Express.js](https://expressjs.com/)
-   [Socket.IO](https://socket.io/)
-   [MongoDB](https://www.mongodb.com/)
-   [Redis](https://redis.io/)
-   [RabbitMQ](https://www.rabbitmq.com/)
-   [Swagger](https://swagger.io/)
-   [Elastic Search](https://www.elastic.co/)
