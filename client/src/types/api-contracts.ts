/**
 * RemoteX API Contracts
 * 
 * Zero-trust architecture between Admin and Customer consoles.
 * Session ID is the only bridge between the two systems.
 */

// ============================================
// Core Entities
// ============================================

export type SessionStatus = 'CREATED' | 'ACTIVE' | 'ENDED' | 'EXPIRED';

export interface SessionPermissions {
    screenView: boolean;
    remoteControl: boolean;
    fileTransfer: boolean;
    audioShare: boolean;
    clipboardSync?: boolean;
    terminalAccess?: boolean;
}

export interface Session {
    sessionId: string;
    status: SessionStatus;
    createdBy: string;
    createdAt: string;
    expiresAt: string;
    permissions: SessionPermissions;
    metadata?: {
        customerIP?: string;
        platform?: string;
        lastActivity?: string;
    };
}

// ============================================
// Admin Console APIs
// ============================================

export namespace AdminAPI {

    export interface CreateSessionRequest {
        permissions: SessionPermissions;
        expiresIn?: number; // seconds, default 1800 (30min)
        metadata?: Record<string, any>;
    }

    export interface CreateSessionResponse {
        sessionId: string;
        expiresAt: string;
        qrCode?: string; // Optional QR code for mobile
    }

    export interface ListSessionsResponse {
        sessions: Session[];
        total: number;
    }

    export interface SessionDetailsResponse extends Session {
        events: SessionEvent[];
        diagnostics?: SystemDiagnostics;
    }

    export interface TerminateSessionRequest {
        reason?: string;
    }

    export interface SessionEvent {
        timestamp: string;
        type: 'CREATED' | 'JOINED' | 'PERMISSION_CHANGED' | 'ENDED';
        actor: 'ADMIN' | 'CUSTOMER';
        details?: string;
    }

    export interface SystemDiagnostics {
        cpu: number;
        memory: number;
        network: string;
        processes: number;
    }
}

// ============================================
// Customer Console APIs
// ============================================

export namespace CustomerAPI {

    export interface ValidateSessionRequest {
        sessionId: string;
    }

    export interface ValidateSessionResponse {
        valid: boolean;
        permissions?: SessionPermissions;
        expiresAt?: string;
        message?: string; // Error message if invalid
    }

    export interface JoinSessionRequest {
        sessionId: string;
        customerConsent: boolean;
        deviceInfo?: {
            platform: string;
            userAgent: string;
        };
    }

    export interface JoinSessionResponse {
        customerToken: string; // Temporary scoped token
        expiresIn: number; // seconds
        permissions: SessionPermissions;
        adminInfo?: {
            organizationName?: string;
            technicianName?: string;
        };
    }

    export interface EndSessionRequest {
        reason?: 'USER_TERMINATED' | 'ISSUE_RESOLVED' | 'CONNECTION_LOST';
    }

    export interface EndSessionResponse {
        success: boolean;
        message: string;
    }
}

// ============================================
// Authentication & Authorization
// ============================================

export interface AdminUser {
    id: string;
    username: string;
    role: 'Super Admin' | 'Admin / Team Lead' | 'Technician' | 'Read-Only / Auditor';
    email?: string;
    permissions: {
        createSession: boolean;
        terminateSession: boolean;
        viewDiagnostics: boolean;
        executeCommands: boolean;
    };
}

export interface AdminAuthToken {
    token: string;
    expiresAt: string;
    user: AdminUser;
}

export interface CustomerToken {
    token: string;
    sessionId: string;
    expiresAt: string;
    permissions: SessionPermissions;
}

// ============================================
// Error Responses
// ============================================

export interface APIError {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
}

export const ErrorCodes = {
    // Authentication
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Session
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_ALREADY_ACTIVE: 'SESSION_ALREADY_ACTIVE',
    INVALID_SESSION_CODE: 'INVALID_SESSION_CODE',

    // Permissions
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

    // Security
    ADMIN_TOKEN_IN_CUSTOMER_API: 'ADMIN_TOKEN_IN_CUSTOMER_API',
    CUSTOMER_TOKEN_IN_ADMIN_API: 'CUSTOMER_TOKEN_IN_ADMIN_API',
    CONSOLE_TYPE_MISMATCH: 'CONSOLE_TYPE_MISMATCH',
} as const;
