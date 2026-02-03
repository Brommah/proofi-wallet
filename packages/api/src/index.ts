/**
 * @proofi/api — Auth API server
 */

export const VERSION = '0.0.1';
export { app, jwtService } from './server.js';
export { JwtService } from './jwt/service.js';
export type { JwtClaims } from './jwt/service.js';
