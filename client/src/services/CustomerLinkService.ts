/**
 * Customer Download Link Service
 * 
 * Generates secure, one-time download links for customers
 * Links include session ID and auto-download the customer-only client
 */

import { Session } from '../types/api-contracts';

export interface CustomerDownloadLink {
    url: string;
    sessionId: string;
    expiresAt: string;
    downloadCount: number;
    maxDownloads: number;
}

export class CustomerLinkService {
    private baseURL: string;

    constructor(baseURL: string = 'https://support.remotex.com') {
        this.baseURL = baseURL;
    }

    /**
     * Generate customer download link
     * Admin calls this after creating a session
     */
    generateDownloadLink(sessionId: string, options?: {
        maxDownloads?: number;
        expiresIn?: number; // seconds
    }): CustomerDownloadLink {
        const expiresAt = new Date(
            Date.now() + (options?.expiresIn || 1800) * 1000
        ).toISOString();

        // Link format: https://support.remotex.com/join/{SESSION_ID}
        const url = `${this.baseURL}/join/${sessionId}`;

        return {
            url,
            sessionId,
            expiresAt,
            downloadCount: 0,
            maxDownloads: options?.maxDownloads || 1,
        };
    }

    /**
     * Generate QR code for mobile download
     */
    generateQRCode(sessionId: string): string {
        const url = `${this.baseURL}/join/${sessionId}`;
        // In real implementation, use a QR code library
        // For now, return a data URL to a QR code service
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    }

    /**
     * Copy download link to clipboard
     */
    async copyToClipboard(link: CustomerDownloadLink): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(link.url);
            return true;
        } catch (error) {
            console.error('[RemoteX] Failed to copy link:', error);
            return false;
        }
    }

    /**
     * Send download link via email (require backend API)
     */
    async sendViaEmail(
        link: CustomerDownloadLink,
        customerEmail: string
    ): Promise<boolean> {
        try {
            const message = this.generateEmailTemplate(link);

            const response = await fetch('/api/admin/send-customer-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customerEmail,
                    subject: 'RemoteX Support Session - Join Link',
                    html: message,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('[RemoteX] Failed to send email:', error);
            return false;
        }
    }

    /**
     * Generate email template with download link
     */
    private generateEmailTemplate(link: CustomerDownloadLink): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { background: linear-gradient(135deg, #004172 0%, #0078d4 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 20px 0; }
          .session-code { font-size: 32px; font-weight: bold; color: #004172; letter-spacing: 0.3em; background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ RemoteX Support Session</h1>
            <p>You have been invited to a remote support session</p>
          </div>
          
          <div class="content">
            <h2>How to Connect:</h2>
            <ol>
              <li>Click the link below to download the RemoteX Customer App</li>
              <li>Run the downloaded application</li>
              <li>Your session will connect automatically</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${link.url}" class="button">
                📥 Download & Connect
              </a>
            </div>
            
            <div class="session-code">
              ${link.sessionId}
            </div>
            
            <p><strong>Session Code (if needed):</strong> Enter the code above if prompted</p>
            <p><strong>Link expires:</strong> ${new Date(link.expiresAt).toLocaleString()}</p>
          </div>
          
          <div class="footer">
            <p>This is a secure session link. Do not share with others.</p>
            <p>Having trouble? Contact your support technician.</p>
            <p>© 2026 RemoteX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Validate if link is still active
     */
    async validateLink(sessionId: string): Promise<{
        valid: boolean;
        reason?: string;
    }> {
        try {
            const response = await fetch(
                `/api/customer/session/validate-link/${sessionId}`,
                {
                    method: 'GET',
                    headers: { 'X-Console-Type': 'CUSTOMER' },
                }
            );

            const data = await response.json();
            return {
                valid: response.ok && data.valid,
                reason: data.message,
            };
        } catch (error) {
            return {
                valid: false,
                reason: 'Network error',
            };
        }
    }

    /**
     * Get download statistics for a link
     */
    async getLinkStats(sessionId: string): Promise<{
        downloads: number;
        lastDownloadAt?: string;
        ipAddresses?: string[];
    }> {
        const response = await fetch(
            `/api/admin/sessions/${sessionId}/link-stats`,
            {
                method: 'GET',
                headers: {
                    'X-Console-Type': 'ADMIN',
                    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                },
            }
        );

        return response.json();
    }
}

// Singleton instance
export const customerLinkService = new CustomerLinkService(
    process.env.REACT_APP_CUSTOMER_DOWNLOAD_URL || 'https://support.remotex.com'
);
