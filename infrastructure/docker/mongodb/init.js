// MongoDB initialization script for UltraChat

db = db.getSiblingDB('ultrachat');

// Create collections with validation
db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['chatId', 'senderId', 'type', 'createdAt'],
      properties: {
        chatId: { bsonType: 'string' },
        senderId: { bsonType: 'string' },
        content: { bsonType: 'string' },
        type: {
          enum: ['text', 'image', 'video', 'audio', 'file', 'voice', 'sticker', 'system', 'call']
        },
        replyToId: { bsonType: 'string' },
        forwardedFromId: { bsonType: 'string' },
        attachments: { bsonType: 'array' },
        reactions: { bsonType: 'array' },
        mentions: { bsonType: 'array' },
        isEdited: { bsonType: 'bool' },
        isDeleted: { bsonType: 'bool' },
        isPinned: { bsonType: 'bool' },
        readBy: { bsonType: 'array' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for messages
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ chatId: 1, isPinned: 1 });
db.messages.createIndex({ senderId: 1, createdAt: -1 });
db.messages.createIndex({ mentions: 1 });
db.messages.createIndex({ content: 'text' });

// Files collection
db.createCollection('files', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'filename', 'mimeType', 'size', 'bucket', 'path', 'url'],
      properties: {
        userId: { bsonType: 'string' },
        filename: { bsonType: 'string' },
        originalName: { bsonType: 'string' },
        mimeType: { bsonType: 'string' },
        size: { bsonType: 'number' },
        bucket: { bsonType: 'string' },
        path: { bsonType: 'string' },
        url: { bsonType: 'string' },
        thumbnailUrl: { bsonType: 'string' },
        metadata: { bsonType: 'object' },
        chatId: { bsonType: 'string' },
        messageId: { bsonType: 'string' },
        isProcessed: { bsonType: 'bool' }
      }
    }
  }
});

db.files.createIndex({ userId: 1, createdAt: -1 });
db.files.createIndex({ chatId: 1, createdAt: -1 });

// Stickers collection
db.createCollection('stickers');
db.stickers.createIndex({ packId: 1 });

db.createCollection('sticker_packs');
db.sticker_packs.createIndex({ isOfficial: 1 });
db.sticker_packs.createIndex({ createdBy: 1 });

// Call history
db.createCollection('call_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['chatId', 'initiatorId', 'type', 'status'],
      properties: {
        chatId: { bsonType: 'string' },
        initiatorId: { bsonType: 'string' },
        type: { enum: ['voice', 'video'] },
        status: { enum: ['ringing', 'connecting', 'active', 'ended', 'missed', 'declined', 'failed'] },
        participants: { bsonType: 'array' },
        startedAt: { bsonType: 'date' },
        endedAt: { bsonType: 'date' },
        duration: { bsonType: 'number' }
      }
    }
  }
});

db.call_history.createIndex({ chatId: 1, createdAt: -1 });
db.call_history.createIndex({ initiatorId: 1, createdAt: -1 });

// Notifications
db.createCollection('notifications');
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, isRead: 1 });

print('MongoDB initialization completed for UltraChat');
