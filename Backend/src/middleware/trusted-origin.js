import { env } from '../config/env.js';
import { HttpError } from '../errors/http-error.js';
export function trustedOrigin(req, res, next) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      ((req.get('origin') && req.get('origin') !== env.CLIENT_ORIGIN) || req.get('sec-fetch-site') === 'cross-site')) {
    return next(new HttpError(403, 'Untrusted request origin'));
  }
  next();
}
