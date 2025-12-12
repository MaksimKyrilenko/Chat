# UltraChat Architecture

## Overview

UltraChat is a modern, scalable web messenger built with microservices architecture. The system is designed for high availability, horizontal scalability, and real-time communication.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │   Web   │  │ Mobile  │  │ Desktop │  │   API   │                    │
│  │ (Vue 3) │  │  (PWA)  │  │(Electron│  │ Clients │                    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘                    │
└───────┼────────────┼────────────┼────────────┼──────────────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────┐
│                    LOAD BALANCER (nginx/HAProxy)                         │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────┐
│                     API GATEWAY (BFF)                                    │
│  ┌───────────────────────┴───────────────────────────────────────────┐  │
│  │                    NestJS Gateway                                  │  │
│  │  • REST API endpoints                                              │  │
│  │  • WebSocket Gateway (Socket.IO)                                   │  │
│  │  • Rate Limiting (Throttler)                                       │  │
│  │  • JWT Authentication                                              │  │
│  │  • Request Validation                                              │  │
│  └───────────────────────┬───────────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────┐
│                    MESSAGE BROKER (NATS)                                 │
│  • Request/Reply pattern for sync communication                          │
│  • Pub/Sub for async events                                              │
│  • Queue groups for load balancing                                       │
│  • JetStream for persistence                                             │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────────────┐
│                        MICROSERVICES                                     │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │    Auth    │  │    User    │  │    Chat    │  │  Messages  │        │
│  │  Service   │  │  Service   │  │  Service   │  │  Service   │        │
│  │            │  │            │  │            │  │            │        │
│  │ • Login    │  │ • Profile  │  │ • Create   │  │ • Send     │        │
│  │ • Register │  │ • Settings │  │ • Members  │  │ • History  │        │
│  │ • JWT      │  │ • Presence │  │ • Invites  │  │ • Reactions│        │
│  │ • OAuth    │  │ • Search   │  │ • Roles    │  │ • Search   │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Files    │  │   WebRTC   │  │   Notif.   │  │   Search   │        │
│  │  Service   │  │ Signaling  │  │  Service   │  │  Service   │        │
│  │            │  │            │  │            │  │            │        │
│  │ • Upload   │  │ • Calls    │  │ • Push     │  │ • Index    │        │
│  │ • Process  │  │ • ICE      │  │ • Email    │  │ • Query    │        │
│  │ • Serve    │  │ • SDP      │  │ • In-app   │  │ • Suggest  │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────────────┐
│                         DATA LAYER                                       │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   MySQL    │  │  MongoDB   │  │   Redis    │  │   MinIO    │        │
│  │            │  │            │  │            │  │            │        │
│  │ • Users    │  │ • Messages │  │ • Cache    │  │ • Images   │        │
│  │ • Chats    │  │ • Files    │  │ • Sessions │  │ • Videos   │        │
│  │ • Members  │  │ • Stickers │  │ • Presence │  │ • Audio    │        │
│  │ • Settings │  │ • Calls    │  │ • Typing   │  │ • Files    │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
│                                                                          │
│  ┌────────────┐                                                          │
│  │ Elastic    │                                                          │
│  │ Search     │                                                          │
│  │            │                                                          │
│  │ • Messages │                                                          │
│  │ • Users    │                                                          │
│  │ • Chats    │                                                          │
│  └────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Message Sending Flow

```
1. Client sends message via WebSocket
2. Gateway validates JWT and forwards to NATS
3. Messages Service receives and stores in MongoDB
4. Messages Service indexes in ElasticSearch
5. Messages Service emits event to NATS
6. Gateway broadcasts to chat room via WebSocket
7. Notifications Service sends push to offline users
```

### Authentication Flow

```
1. Client sends credentials to /api/auth/login
2. Gateway forwards to Auth Service via NATS
3. Auth Service validates credentials against MySQL
4. Auth Service generates JWT tokens
5. Auth Service stores session in MySQL
6. Tokens returned to client
7. Client stores refresh token, uses access token for requests
```

### WebRTC Call Flow

```
1. Initiator sends call:initiate via WebSocket
2. WebRTC Service creates call state in Redis
3. WebRTC Service notifies participants
4. Participants exchange SDP offers/answers
5. ICE candidates exchanged for NAT traversal
6. Direct P2P connection established
7. Call state tracked in Redis, history saved to MongoDB
```

## Database Design

### MySQL (Relational Data)

- **users**: User accounts, credentials, profile
- **sessions**: Active sessions, refresh tokens
- **user_settings**: Preferences, privacy settings
- **chats**: Chat metadata, settings
- **chat_members**: Membership, roles, permissions
- **chat_invites**: Invite links
- **contacts**: Friend relationships

### MongoDB (Document Data)

- **messages**: Message content, attachments, reactions
- **files**: File metadata, processing status
- **stickers**: Sticker packs and items
- **call_history**: Call records
- **notifications**: Notification history

### Redis (Cache & Real-time)

- **presence:{userId}**: Online status, last seen
- **sockets:{userId}**: Active socket connections
- **typing:{chatId}**: Users currently typing
- **call:{callId}**: Active call state
- **ratelimit:{key}**: Rate limiting counters

## Security

### Authentication
- JWT access tokens (15 min expiry)
- Refresh tokens (30 day expiry, stored hashed)
- OAuth 2.1 support (Google, GitHub, Apple)
- Optional 2FA with TOTP

### Authorization
- Role-based access control (RBAC) for chats
- Permission checks at service level
- Resource ownership validation

### Rate Limiting
- Per-endpoint limits
- Per-user limits
- IP-based limits for auth endpoints

### Data Protection
- Passwords hashed with bcrypt (cost 12)
- Tokens hashed with SHA-256
- HTTPS enforced
- CORS configured
- Security headers (Helmet)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, TypeScript, Vite, TailwindCSS, Pinia |
| API Gateway | NestJS, Socket.IO |
| Microservices | NestJS, TypeScript |
| Message Broker | NATS with JetStream |
| Relational DB | MySQL 8.0 |
| Document DB | MongoDB 7.0 |
| Cache | Redis 7 |
| File Storage | MinIO |
| Search | ElasticSearch 8 |
| Container | Docker, Kubernetes |
| CI/CD | GitHub Actions |
