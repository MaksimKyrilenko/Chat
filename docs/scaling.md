# UltraChat Scaling Guide

## Horizontal Scaling Strategy

### 1. API Gateway Scaling

```yaml
# Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Key considerations:**
- Use sticky sessions for WebSocket connections
- Deploy behind load balancer with health checks
- Use Redis adapter for Socket.IO to share state across instances

### 2. Microservices Scaling

Each microservice can scale independently based on load:

| Service | Scaling Trigger | Min Pods | Max Pods |
|---------|-----------------|----------|----------|
| Auth | CPU > 70% | 2 | 10 |
| User | CPU > 70% | 2 | 10 |
| Chat | CPU > 70% | 3 | 15 |
| Messages | CPU > 60%, Memory > 70% | 5 | 30 |
| Files | CPU > 60% | 3 | 20 |
| WebRTC | Connections > 1000 | 3 | 20 |
| Notifications | Queue depth > 1000 | 2 | 15 |
| Search | CPU > 70% | 2 | 10 |

### 3. Database Scaling

#### MySQL Scaling

**Read Replicas:**
```
┌─────────────┐
│   Primary   │
│   (Write)   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──┴──┐ ┌──┴──┐
│Read │ │Read │
│Rep 1│ │Rep 2│
└─────┘ └─────┘
```

**Configuration:**
- Primary for writes
- Read replicas for queries
- Connection pooling with ProxySQL
- Future: Vitess for sharding

**Sharding Strategy (Future):**
- Shard by user_id for user data
- Shard by chat_id for chat data
- Use consistent hashing

#### MongoDB Scaling

**Replica Set:**
```
┌─────────────┐
│   Primary   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──┴──┐ ┌──┴──┐
│Sec 1│ │Sec 2│
└─────┘ └─────┘
```

**Sharding (for high volume):**
```javascript
// Shard messages by chatId
sh.shardCollection("ultrachat.messages", { chatId: "hashed" })

// Shard files by userId
sh.shardCollection("ultrachat.files", { userId: "hashed" })
```

#### Redis Scaling

**Redis Cluster:**
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Master1 │ │ Master2 │ │ Master3 │
│ Slots   │ │ Slots   │ │ Slots   │
│ 0-5460  │ │5461-10922│10923-16383│
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
┌────┴────┐ ┌────┴────┐ ┌────┴────┐
│ Replica │ │ Replica │ │ Replica │
└─────────┘ └─────────┘ └─────────┘
```

### 4. Message Broker Scaling

**NATS Cluster:**
```yaml
# NATS cluster with 3 nodes
nats:
  cluster:
    enabled: true
    replicas: 3
  jetstream:
    enabled: true
    memStorage: 1Gi
    fileStorage: 10Gi
```

### 5. File Storage Scaling

**MinIO Distributed Mode:**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ MinIO 1 │ │ MinIO 2 │ │ MinIO 3 │ │ MinIO 4 │
│ Drive 1 │ │ Drive 1 │ │ Drive 1 │ │ Drive 1 │
│ Drive 2 │ │ Drive 2 │ │ Drive 2 │ │ Drive 2 │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- Erasure coding for data protection
- Load balancer in front
- CDN for static file delivery

### 6. Search Scaling

**ElasticSearch Cluster:**
```
┌─────────────────────────────────────────┐
│           Coordinating Nodes            │
│         (Load balancing, routing)       │
└────────────────────┬────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────┴────┐    ┌────┴────┐    ┌────┴────┐
│ Data 1  │    │ Data 2  │    │ Data 3  │
│ Primary │    │ Primary │    │ Primary │
│ Replica │    │ Replica │    │ Replica │
└─────────┘    └─────────┘    └─────────┘
```

## Vertical Scaling

### Resource Recommendations

| Component | Small (< 10K users) | Medium (10K-100K) | Large (100K+) |
|-----------|---------------------|-------------------|---------------|
| Gateway | 2 CPU, 2GB RAM | 4 CPU, 4GB RAM | 8 CPU, 8GB RAM |
| Services | 1 CPU, 1GB RAM | 2 CPU, 2GB RAM | 4 CPU, 4GB RAM |
| MySQL | 4 CPU, 8GB RAM | 8 CPU, 32GB RAM | 16 CPU, 64GB RAM |
| MongoDB | 4 CPU, 8GB RAM | 8 CPU, 32GB RAM | 16 CPU, 64GB RAM |
| Redis | 2 CPU, 4GB RAM | 4 CPU, 16GB RAM | 8 CPU, 32GB RAM |
| ElasticSearch | 4 CPU, 8GB RAM | 8 CPU, 32GB RAM | 16 CPU, 64GB RAM |

## Performance Optimization

### 1. Caching Strategy

```typescript
// Multi-level caching
class CacheService {
  // L1: In-memory (per instance)
  private localCache = new Map();
  
  // L2: Redis (shared)
  private redis: Redis;
  
  async get(key: string) {
    // Check L1
    if (this.localCache.has(key)) {
      return this.localCache.get(key);
    }
    
    // Check L2
    const value = await this.redis.get(key);
    if (value) {
      this.localCache.set(key, value);
      return value;
    }
    
    return null;
  }
}
```

### 2. Connection Pooling

```typescript
// MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 100,
  queueLimit: 0,
  waitForConnections: true,
  acquireTimeout: 10000,
});

// MongoDB connection pool
mongoose.connect(uri, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
});
```

### 3. Message Batching

```typescript
// Batch message inserts
class MessageBatcher {
  private batch: Message[] = [];
  private timer: NodeJS.Timeout;
  
  add(message: Message) {
    this.batch.push(message);
    
    if (this.batch.length >= 100) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 100);
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    const messages = this.batch;
    this.batch = [];
    clearTimeout(this.timer);
    
    await this.messageModel.insertMany(messages);
  }
}
```

### 4. WebSocket Optimization

```typescript
// Binary protocol for reduced bandwidth
const encoder = new MessagePackEncoder();

socket.on('message', (data) => {
  const decoded = encoder.decode(data);
  // Process message
});

// Compression
const io = new Server(server, {
  perMessageDeflate: {
    threshold: 1024,
  },
});
```

## Monitoring & Alerts

### Key Metrics

| Metric | Warning | Critical |
|--------|---------|----------|
| API Latency P99 | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| DB Connections | > 80% | > 95% |
| Message Queue Depth | > 10000 | > 50000 |
| WebSocket Connections | > 80% capacity | > 95% capacity |

### Prometheus Metrics

```typescript
// Custom metrics
const messagesSent = new Counter({
  name: 'ultrachat_messages_sent_total',
  help: 'Total messages sent',
  labelNames: ['chat_type'],
});

const wsConnections = new Gauge({
  name: 'ultrachat_websocket_connections',
  help: 'Current WebSocket connections',
});

const apiLatency = new Histogram({
  name: 'ultrachat_api_latency_seconds',
  help: 'API request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
```

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| MySQL | Hourly | 30 days | mysqldump + binlog |
| MongoDB | Hourly | 30 days | mongodump |
| Redis | Every 5 min | 7 days | RDB + AOF |
| MinIO | Continuous | 90 days | Replication |
| ElasticSearch | Daily | 14 days | Snapshots |

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single service failure | < 1 min | 0 |
| Database failover | < 5 min | < 1 min |
| Full region failure | < 30 min | < 5 min |
| Data corruption | < 1 hour | < 1 hour |
