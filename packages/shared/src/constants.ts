// NATS Subjects
export const NATS_SUBJECTS = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_VALIDATE: 'auth.validate',

  // User
  USER_GET: 'user.get',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_SEARCH: 'user.search',
  USER_PRESENCE: 'user.presence',

  // Chat
  CHAT_CREATE: 'chat.create',
  CHAT_GET: 'chat.get',
  CHAT_UPDATE: 'chat.update',
  CHAT_DELETE: 'chat.delete',
  CHAT_LIST: 'chat.list',
  CHAT_JOIN: 'chat.join',
  CHAT_LEAVE: 'chat.leave',
  CHAT_MEMBERS: 'chat.members',

  // Messages
  MESSAGE_SEND: 'message.send',
  MESSAGE_GET: 'message.get',
  MESSAGE_UPDATE: 'message.update',
  MESSAGE_DELETE: 'message.delete',
  MESSAGE_LIST: 'message.list',
  MESSAGE_REACT: 'message.react',
  MESSAGE_PIN: 'message.pin',
  MESSAGE_SEARCH: 'message.search',

  // Files
  FILE_UPLOAD_URL: 'file.upload.url',
  FILE_UPLOAD_COMPLETE: 'file.upload.complete',
  FILE_GET: 'file.get',
  FILE_DELETE: 'file.delete',

  // Notifications
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_BROADCAST: 'notification.broadcast',
  NOTIFICATION_SUBSCRIBE: 'notification.subscribe',

  // WebRTC
  CALL_INITIATE: 'call.initiate',
  CALL_SIGNAL: 'call.signal',
  CALL_END: 'call.end',

  // Search
  SEARCH_MESSAGES: 'search.messages',
  SEARCH_USERS: 'search.users',
  SEARCH_CHATS: 'search.chats',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_REACTION: 'message:reaction',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Chat
  CHAT_UPDATE: 'chat:update',
  CHAT_MEMBER_JOIN: 'chat:member:join',
  CHAT_MEMBER_LEAVE: 'chat:member:leave',

  // Calls
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPTED: 'call:accepted',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  CALL_SIGNAL: 'call:signal',

  // Notifications
  NOTIFICATION: 'notification',
} as const;

// Redis Keys
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_PRESENCE: (userId: string) => `presence:${userId}`,
  USER_SOCKETS: (userId: string) => `sockets:${userId}`,
  CHAT_TYPING: (chatId: string) => `typing:${chatId}`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
  REFRESH_TOKEN: (tokenId: string) => `refresh:${tokenId}`,
  CALL_STATE: (callId: string) => `call:${callId}`,
} as const;

// Rate Limits
export const RATE_LIMITS = {
  AUTH_LOGIN: { points: 5, duration: 60 }, // 5 attempts per minute
  AUTH_REGISTER: { points: 3, duration: 3600 }, // 3 per hour
  MESSAGE_SEND: { points: 30, duration: 60 }, // 30 messages per minute
  FILE_UPLOAD: { points: 10, duration: 60 }, // 10 uploads per minute
  API_GENERAL: { points: 100, duration: 60 }, // 100 requests per minute
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;
