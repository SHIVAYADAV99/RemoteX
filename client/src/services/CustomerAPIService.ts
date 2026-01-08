/**
 * Customer Console API Service
 * 
 * Handles all API interactions for the Customer Console.
 * NO admin authentication - session-scoped access only.
 * 
 * SECURITY: This service MUST reject any admin JWTs
 */

import {
    CustomerAPI,
    APIError,
    ErrorCodes
} from '../types/api-contracts';

export class CustomerAPIService {
    private baseURL: string;
    private customerToken: string | null = null;
    private sessionId: string | null = null;

    constructor(baseURL: string = '/api/customer') {
        this.baseURL = baseURL;
    }

    // ============================================
    // Token Management
    // ============================================

    setCustomerToken(token: string, sessionId: string) {
        this.customerToken = token;
        this.sessionId = sessionId;
    }

    clearToken() {
        this.customerToken = null;
        this.sessionId = null;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'X-Console-Type': 'CUSTOMER', // Console boundary marker
        };

        if (this.customerToken) {
            headers['X-Customer-Token'] = this.customerToken;
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

            // Security check: Reject if admin token was attempted
            if (error.code === ErrorCodes.ADMIN_TOKEN_IN_CUSTOMER_API) {
                console.error('[RemoteX Security] Admin token rejected in Customer API');
                throw new Error('Security violation: Admin credentials not allowed');
            }

            throw error;
        }
        return response.json();
    }

    // ============================================
    // Session Operations
    // ============================================

    /**
     * Validate a session code before joining
     * @public No authentication required
     */
    async validateSession(
        sessionId: string
    ): Promise<CustomerAPI.ValidateSessionResponse> {
        const response = await fetch(`${this.baseURL}/session/validate`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId }),
        });

        return this.handleResponse<CustomerAPI.ValidateSessionResponse>(response);
    }

    /**
     * Join an active session
     * @public No authentication required (session code is authorization)
     */
    async joinSession(
        request: CustomerAPI.JoinSessionRequest
    ): Promise<CustomerAPI.JoinSessionResponse> {
        const response = await fetch(`${this.baseURL}/session/join`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request),
        });

        const result = await this.handleResponse<CustomerAPI.JoinSessionResponse>(
            response
        );

        // Store token for subsequent requests
        this.setCustomerToken(result.customerToken, request.sessionId);

        return result;
    }

    /**
     * End the current session (customer-initiated)
     * @requires Customer token
     */
    async endSession(
        reason?: CustomerAPI.EndSessionRequest['reason']
    ): Promise<CustomerAPI.EndSessionResponse> {
        if (!this.sessionId || !this.customerToken) {
            throw new Error('No active session');
        }

        const response = await fetch(`${this.baseURL}/session/end`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ reason }),
        });

        const result = await this.handleResponse<CustomerAPI.EndSessionResponse>(
            response
        );

        // Clear token after ending
        this.clearToken();

        return result;
    }

    /**
     * Send heartbeat to keep session alive
     * @requires Customer token
     */
    async sendHeartbeat(): Promise<{ alive: boolean; expiresIn: number }> {
        if (!this.sessionId || !this.customerToken) {
            throw new Error('No active session');
        }

        const response = await fetch(`${this.baseURL}/session/heartbeat`, {
            method: 'POST',
            headers: this.getHeaders(),
        });

        return this.handleResponse(response);
    }

    // ============================================
    // Permissions & Consent
    // ============================================

    /**
     * Update customer consent permissions mid-session
     * @requires Customer token
     */
    async updateConsent(permissions: {
        screenView?: boolean;
        remoteControl?: boolean;
        fileTransfer?: boolean;
    }): Promise<void> {
        if (!this.sessionId || !this.customerToken) {
            throw new Error('No active session');
        }

        const response = await fetch(`${this.baseURL}/session/consent`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({ permissions }),
        });

        await this.handleResponse<void>(response);
    }

    /**
     * Revoke specific permission
     * @requires Customer token
     */
    async revokePermission(
        permission: 'remoteControl' | 'fileTransfer' | 'clipboardSync'
    ): Promise<void> {
        return this.updateConsent({ [permission]: false });
    }

    // ============================================
    // Status & Info (Read-only)
    // ============================================

    /**
     * Get current session status
     * @requires Customer token
     */
    async getSessionStatus(): Promise<{
        status: 'ACTIVE' | 'EXPIRED' | 'ENDED';
        expiresAt: string;
        activePermissions: string[];
    }> {
        if (!this.sessionId || !this.customerToken) {
            throw new Error('No active session');
        }

        const response = await fetch(`${this.baseURL}/session/status`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse(response);
    }
}

// Singleton instance
export const customerAPI = new CustomerAPIService(
    process.env.REACT_APP_CUSTOMER_API_URL || '/api/customer'
);
