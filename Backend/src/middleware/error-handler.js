import { HttpError } from '../errors/http-error.js';
export function notFound(req, res) { res.status(404).json({ error: 'Route not found' }); }
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  console.error('Request failed:', error.code ?? error.name);
  return res.status(500).json({ error: 'An unexpected error occurred' });
}
