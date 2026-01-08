/**
 * Admin Console API Service
 * 
 * Handles all API interactions for the Admin Console.
 * Requires admin authentication for all operations.
 */

import {
    AdminAPI,
    Session,
    APIError,
    ErrorCodes,
    AdminAuthToken
} from '../types/api-contracts';

export class AdminAPIService {
    private baseURL: string;
    private authToken: string | null = null;

    constructor(baseURL: string = '/api/admin') {
        this.baseURL = baseURL;
    }

    // ============================================
    // Authentication
    // ============================================

    setAuthToken(token: string) {
        this.authToken = token;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'X-Console-Type': 'ADMIN', // Console boundary marker
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error: APIError = await response.json().catch(() => ({
                code: 'UNKNOWN_ERROR',
                message: response.statusText,
                timestamp: new Date().toISOString(),
            }));
            throw error;
        }
        return response.json();
    }

    // ============================================
    // Session Management
    // ============================================

    /**
     * Create a new remote support session
     * @requires Admin authentication
     */
    async createSession(
        request: AdminAPI.CreateSessionRequest
    ): Promise<AdminAPI.CreateSessionResponse> {
        const response = await fetch(`${this.baseURL}/sessions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request),
        });

        return this.handleResponse<AdminAPI.CreateSessionResponse>(response);
    }

    /**
     * List all active sessions
     * @requires Admin authentication
     */
    async listSessions(
        status?: 'ACTIVE' | 'ALL'
    ): Promise<AdminAPI.ListSessionsResponse> {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${this.baseURL}/sessions${query}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<AdminAPI.ListSessionsResponse>(response);
    }

    /**
     * Get detailed information about a specific session
     * @requires Admin authentication
     */
    async getSessionDetails(
        sessionId: string
    ): Promise<AdminAPI.SessionDetailsResponse> {
        const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<AdminAPI.SessionDetailsResponse>(response);
    }

    /**
     * Terminate an active session
     * @requires Admin authentication
     */
    async terminateSession(
        sessionId: string,
        request?: AdminAPI.TerminateSessionRequest
    ): Promise<void> {
        const response = await fetch(`${this.baseURL}/sessions/${sessionId}/end`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request || {}),
        });

        await this.handleResponse<void>(response);
    }

    /**
     * Update session permissions mid-session
     * @requires Admin authentication
     */
    async updateSessionPermissions(
        sessionId: string,
        permissions: Partial<AdminAPI.CreateSessionRequest['permissions']>
    ): Promise<Session> {
        const response = await fetch(
            `${this.baseURL}/sessions/${sessionId}/permissions`,
            {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ permissions }),
            }
        );

        return this.handleResponse<Session>(response);
    }

    // ============================================
    // Remote Operations (Admin → Customer)
    // ============================================

    /**
     * Execute remote command on customer machine
     * @requires Admin authentication + session permission
     */
    async executeRemoteCommand(
        sessionId: string,
        command: string
    ): Promise<{ output: string; exitCode: number }> {
        const response = await fetch(
            `${this.baseURL}/sessions/${sessionId}/execute`,
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ command }),
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Request detailed diagnostics from customer machine
     * @requires Admin authentication
     */
    async getDetailedDiagnostics(
        sessionId: string
    ): Promise<AdminAPI.SystemDiagnostics> {
        const response = await fetch(
            `${this.baseURL}/sessions/${sessionId}/diagnostics`,
            {
                method: 'GET',
                headers: this.getHeaders(),
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Switch monitor on customer machine
     * @requires Admin authentication + remoteControl permission
     */
    async switchMonitor(sessionId: string, monitorIndex: number): Promise<void> {
        const response = await fetch(
            `${this.baseURL}/sessions/${sessionId}/monitor`,
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ monitorIndex }),
            }
        );

        await this.handleResponse<void>(response);
    }
}

// Singleton instance
export const adminAPI = new AdminAPIService(
    process.env.REACT_APP_ADMIN_API_URL || '/api/admin'
);
