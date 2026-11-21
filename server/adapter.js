// server/adapter.js
/**
 * Express adapter bridging incoming Express Node requests to Web API Request objects
 * consumed by Cloudflare Pages Function onRequest handlers.
 * @param {object} handlers
 * @param {Function} [handlers.onRequest]
 * @param {Function} [handlers.onRequestGet]
 * @param {Function} [handlers.onRequestPost]
 * @param {Function} [handlers.onRequestOptions]
 * @param {string} [endpointName='/api']
 * @returns {import('express').RequestHandler}
 */
export function createFunctionAdapter(handlers, endpointName = '/api') {
  return async function expressHandler(req, res) {
    try {
      const host = req.headers.host || 'localhost:3001';
      const url = `http://${host}${req.originalUrl}`;
      const init = {
        method: req.method,
        headers: req.headers
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const webReq = new Request(url, init);

      let handler = handlers.onRequest;
      if (req.method === 'OPTIONS' && handlers.onRequestOptions) {
        handler = handlers.onRequestOptions;
      } else if (req.method === 'GET' && handlers.onRequestGet) {
        handler = handlers.onRequestGet;
      } else if (req.method === 'POST' && handlers.onRequestPost) {
        handler = handlers.onRequestPost;
      }

      if (!handler) {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
      }

      const response = await handler({ request: webReq, env: process.env });
      res.status(response.status);
      response.headers.forEach((val, key) => res.setHeader(key, val));
      const text = await response.text();
      res.send(text);
    } catch (err) {
      console.error(`Express adapter error in ${endpointName}:`, err);
      res
        .status(500)
        .json({ error: 'Internal Server Error', message: 'Failed to process request.' });
    }
  };
}
