# Bot_Man Logging & Performance Guide

## Logging Configuration

### Logger Setup

Bot_Man uses Winston for logging with environment-based configuration:

| Environment | Log Level | Format                    |
| ----------- | --------- | ------------------------- |
| Development | `debug`   | Colorized, human-readable |
| Production  | `info`    | JSON format               |

### Log Level Override

Set `LOG_LEVEL` environment variable to override default:

```bash
LOG_LEVEL=debug npm run start  # Enable debug in production
LOG_LEVEL=warn npm run dev     # Reduce noise in development
```

### Available Log Levels

1. **error** - Application errors requiring attention
2. **warn** - Warning conditions (non-critical issues)
3. **info** - Normal but significant events
4. **debug** - Detailed debugging information

### Logging Patterns

**Success operations:**

```typescript
logger.info(`DM sent to ${user.tag} by ${sender.tag}`);
logger.info(`Created temp voice channel ${channel.name}`);
```

**Debugging flow:**

```typescript
logger.debug(`Processing event log job: ${type}`);
logger.debug(`Synced ${count} users for guild: ${guild.name}`);
```

**Warnings (non-critical):**

```typescript
logger.warn(`No cached invites for guild ${guild.name}`);
logger.warn(`Role ${roleId} not found in guild`);
```

**Errors:**

```typescript
logger.error(`Failed to sync server ${name}:`, error);
logger.error('Error handling reaction add:', error);
```

### Production Logging

In production, logs are also written to:

- `logs/error.log` - Error-level logs only
- Console (stdout) - All configured levels in JSON format

---

## Performance Considerations

### Command Response Times

Target response times:

- Simple commands (`/ping`, `/me`): < 100ms
- Database queries (`/quote get`): < 500ms
- Complex operations (`/massmove`): < 3000ms

### Database Optimization

**Prisma Configuration:**

- Connection pooling enabled by default
- Query batching for bulk operations

**Indexed Fields:**

- `servers.uid` (primary lookup)
- `discord_users.uid` (user lookups)
- `quotes.server_uid` (quote filtering)
- `invites.server_uid` (invite tracking)
- `reaction_role.message_uid` (reaction lookups)

### Memory Management

**Expected Memory Usage:**

- Bot idle: ~80-120MB
- Active (processing): ~150-200MB
- Peak (large operations): ~300-400MB

**Memory Optimization Tips:**

1. Discord.js caches are managed automatically
2. Prisma client is singleton (single connection pool)
3. Event listeners are properly cleaned up

### Concurrent Operations

**Rate Limiting:**

- Discord API rate limits handled by discord.js
- Database connection pool: 10 connections default
- pg-boss queue: concurrent job processing

**Bottlenecks to Monitor:**

1. Database connection exhaustion
2. Discord API rate limiting (429 responses)
3. Memory pressure from large guild operations

### Background Jobs (pg-boss)

**Queue Configuration:**

- `EVENT_LOG` queue: Event persistence
- Job retention: 7 days
- Dead letter queue enabled

**Performance Tuning:**

```typescript
// Adjust concurrent jobs
const boss = new PgBoss({
  db: { connectionString: DATABASE_URL },
  max: 10, // Max concurrent jobs
});
```

---

## Performance Testing

### Manual Performance Checks

1. **Command Latency:**
   - Run `/ping` multiple times
   - Check response times in logs

2. **Database Operations:**
   - Add 100 quotes, measure time
   - Query random quotes, measure response

3. **Voice Operations:**
   - Join/leave jump channels rapidly
   - Monitor channel creation/deletion timing

### Load Testing Recommendations

For comprehensive load testing, consider:

1. **Artillery.io** for API testing
2. **Custom scripts** for Discord interaction simulation
3. **Database stress tests** with pgbench

### Monitoring in Production

**Key Metrics to Track:**

- Response time percentiles (p50, p95, p99)
- Memory usage over time
- Database query times
- Error rates

**Recommended Tools:**

- Prometheus + Grafana for metrics
- Sentry for error tracking
- Datadog APM for full observability

---

## Troubleshooting

### High Memory Usage

1. Check for unhandled event listeners
2. Review Prisma query patterns
3. Monitor Discord.js cache sizes

### Slow Commands

1. Enable debug logging
2. Check database query plans (EXPLAIN ANALYZE)
3. Review rate limit status

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check connection pool exhaustion
3. Review Prisma connection logs

---

## Environment Variables

| Variable           | Description           | Default                       |
| ------------------ | --------------------- | ----------------------------- |
| `LOG_LEVEL`        | Logging verbosity     | `debug` (dev) / `info` (prod) |
| `NODE_ENV`         | Environment mode      | `development`                 |
| `DATABASE_URL`     | PostgreSQL connection | Required                      |
| `BOTMAN_BOT_TOKEN` | Discord bot token     | Required                      |
