/**
 * Backend Route Guards (Node.js/Express)
 * 
 * MANDATORY server-side enforcement of console separation.
 * Frontend guards are UX - these are security.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser, ErrorCodes, APIError } from '../types/api-contracts';

// ============================================
// Type Extensions
// ============================================

declare global {
    namespace Express {
        interface Request {
            user?: AdminUser;
            customerSession?: {
                sessionId: string;
                expiresAt: Date;
            };
            consoleType?: 'ADMIN' | 'CUSTOMER';
        }
    }
}

// ============================================
// Utility Functions
// ============================================

function sendError(res: Response, code: string, message: string, status: number = 403) {
    const error: APIError = {
        code,
        message,
        timestamp: new Date().toISOString(),
    };
    res.status(status).json(error);
}

// ============================================
// Console Type Detection
// ============================================

/**
 * Detect console type from request headers
 * CRITICAL: This prevents cross-console API abuse
 */
export function detectConsoleType(req: Request, res: Response, next: NextFunction) {
    const consoleType = req.headers['x-console-type'] as string;

    if (!consoleType || !['ADMIN', 'CUSTOMER'].includes(consoleType)) {
        return sendError(
            res,
            ErrorCodes.CONSOLE_TYPE_MISMATCH,
            'Missing or invalid X-Console-Type header',
            400
        );
    }

    req.consoleType = consoleType as 'ADMIN' | 'CUSTOMER';
    next();
}

// ============================================
// Admin Authentication Middleware
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify admin JWT token
 * MUST be used on all /api/admin/* routes
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
    // 1. Check console type
    if (req.consoleType !== 'ADMIN') {
        console.error('[RemoteX Security] Non-admin console attempted admin API access');
        return sendError(
            res,
            ErrorCodes.CONSOLE_TYPE_MISMATCH,
            'Admin APIs require admin console',
            403
        );
    }

    // 2. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return sendError(res, ErrorCodes.UNAUTHORIZED, 'Missing authorization token', 401);
    }

    const token = authHeader.substring(7);

    // 3. Verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return sendError(res, ErrorCodes.TOKEN_EXPIRED, 'Token has expired', 401);
        }
        return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid token', 401);
    }
}

// ============================================
// Role-Based Access Control
// ============================================

/**
 * Require specific admin role
 * 
 * Usage:
 * router.post('/sessions', requireRole('Super Admin'), createSession);
 */
export function requireRole(...allowedRoles: AdminUser['role'][]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.error(
                `[RemoteX Security] Role mismatch. User: ${req.user.role}, Required: ${allowedRoles}`
            );
            return sendError(
                res,
                ErrorCodes.FORBIDDEN,
                `Requires role: ${allowedRoles.join(' or ')}`,
                403
            );
        }

        next();
    };
}

/**
 * Require specific permission
 * 
 * Usage:
 * router.post('/execute', requirePermission('executeCommands'), executeCommand);
 */
export function requirePermission(permission: keyof AdminUser['permissions']) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401);
        }

        if (!req.user.permissions[permission]) {
            console.error(
                `[RemoteX Security] Permission denied. User: ${req.user.username}, Required: ${permission}`
            );
            return sendError(
                res,
                ErrorCodes.INSUFFICIENT_PERMISSIONS,
                `Missing permission: ${permission}`,
                403
            );
        }

        next();
    };
}

// ============================================
// Customer Session Validation
// ============================================

/**
 * Validate customer token (NOT admin JWT)
 * MUST be used on all /api/customer/* routes (except validate/join)
 */
export function requireCustomerToken(req: Request, res: Response, next: NextFunction) {
    // 1. Check console type
    if (req.consoleType !== 'CUSTOMER') {
        console.error('[RemoteX Security] Non-customer console attempted customer API access');
        return sendError(
            res,
            ErrorCodes.CONSOLE_TYPE_MISMATCH,
            'Customer APIs require customer console',
            403
        );
    }

    // 2. SECURITY: Reject admin tokens
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        console.error('[RemoteX Security] Admin JWT rejected in customer API');
        return sendError(
            res,
            ErrorCodes.ADMIN_TOKEN_IN_CUSTOMER_API,
            'Admin tokens not allowed in customer APIs',
            403
        );
    }

    // 3. Extract customer token
    const customerToken = req.headers['x-customer-token'] as string;
    if (!customerToken) {
        return sendError(
            res,
            ErrorCodes.UNAUTHORIZED,
            'Missing customer token',
            401
        );
    }

    // 4. Validate token (implementation depends on your session store)
    try {
        const decoded = jwt.verify(customerToken, JWT_SECRET) as {
            sessionId: string;
            expiresAt: string;
        };

        req.customerSession = {
            sessionId: decoded.sessionId,
            expiresAt: new Date(decoded.expiresAt),
        };

        // 5. Check expiration
        if (req.customerSession.expiresAt < new Date()) {
            return sendError(
                res,
                ErrorCodes.SESSION_EXPIRED,
                'Session has expired',
                401
            );
        }

        next();
    } catch (error) {
        return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid customer token', 401);
    }
}

// ============================================
// Session Ownership Validation
// ============================================

/**
 * Ensure admin owns the session they're trying to access
 */
export function requireSessionOwnership(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.params.sessionId;
    const userId = req.user?.id;

    // In a real app, you'd query the database
    // const session = await db.sessions.findById(sessionId);
    // if (session.createdBy !== userId) { ... }

    // Placeholder for demonstration
    console.log(`[RemoteX] Validating session ownership: ${sessionId} by ${userId}`);
    next();
}

// ============================================
// Rate Limiting (Per Console Type)
// ============================================

const requestCounts = new Map<string, { count: number; resetAt: Date }>();

/**
 * Rate limit by console type + IP
 */
export function rateLimitByConsole(maxRequests: number, windowMs: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = `${req.consoleType}_${req.ip}`;
        const now = new Date();

        let record = requestCounts.get(key);

        if (!record || record.resetAt < now) {
            record = {
                count: 1,
                resetAt: new Date(now.getTime() + windowMs),
            };
            requestCounts.set(key, record);
            return next();
        }

        if (record.count >= maxRequests) {
            return res.status(429).json({
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
                retryAfter: Math.ceil((record.resetAt.getTime() - now.getTime()) / 1000),
            });
        }

        record.count++;
        next();
    };
}

// ============================================
// Example Router Setup
// ============================================

/**
 * Example: Admin routes with full security stack
 * 
 * import express from 'express';
 * import { 
 *   detectConsoleType, 
 *   requireAdminAuth, 
 *   requireRole,
 *   rateLimitByConsole
 * } from './guards/backend-guards';
 * 
 * const adminRouter = express.Router();
 * 
 * // Apply to all admin routes
 * adminRouter.use(detectConsoleType);
 * adminRouter.use(requireAdminAuth);
 * adminRouter.use(rateLimitByConsole(100, 60000)); // 100 req/min
 * 
 * // Session creation (any admin)
 * adminRouter.post('/sessions', createSession);
 * 
 * // Terminate session (requires Super Admin or Team Lead)
 * adminRouter.post(
 *   '/sessions/:sessionId/end',
 *   requireRole('Super Admin', 'Admin / Team Lead'),
 *   requireSessionOwnership,
 *   terminateSession
 * );
 * 
 * // Execute command (requires executeCommands permission)
 * adminRouter.post(
 *   '/sessions/:sessionId/execute',
 *   requirePermission('executeCommands'),
 *   executeCommand
 * );
 */

/**
 * Example: Customer routes (minimal auth, max security checks)
 * 
 * const customerRouter = express.Router();
 * 
 * // Apply to all customer routes
 * customerRouter.use(detectConsoleType);
 * customerRouter.use(rateLimitByConsole(50, 60000)); // 50 req/min
 * 
 * // Public endpoints (no auth)
 * customerRouter.post('/session/validate', validateSessionCode);
 * customerRouter.post('/session/join', joinSession);
 * 
 * // Authenticated endpoints (customer token required)
 * customerRouter.post('/session/end', requireCustomerToken, endSession);
 * customerRouter.post('/session/heartbeat', requireCustomerToken, heartbeat);
 */
