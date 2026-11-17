// server/middleware/rateLimiter.js
// In-memory sliding window rate limiter per client IP

const windowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 60; // 60 requests per minute
const ipRequestCounts = new Map();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now - data.resetTime > windowMs) {
      ipRequestCounts.delete(ip);
    }
  }
}, 30000);

export function rateLimiter(req, res, next) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let clientData = ipRequestCounts.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipRequestCounts.set(clientIp, clientData);
    res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
    res.setHeader('X-RateLimit-Remaining', maxRequestsPerWindow - 1);
    return next();
  }

  clientData.count += 1;
  const remaining = Math.max(0, maxRequestsPerWindow - clientData.count);
  res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
  res.setHeader('X-RateLimit-Remaining', remaining);

  if (clientData.count > maxRequestsPerWindow) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Foggy rate limit reached. Please wait a moment before sending more requests to protect free-tier quotas.',
      retryAfterSeconds: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  next();
}
