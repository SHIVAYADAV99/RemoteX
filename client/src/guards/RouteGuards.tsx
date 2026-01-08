/**
 * Frontend Route Guards
 * 
 * Implements role-based access control for React routes.
 * Enforces console separation at the UI routing level.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { AdminUser } from '../types/api-contracts';

// ============================================
// Authentication Context (Example)
// ============================================

interface AuthContextType {
    user: AdminUser | null;
    isAuthenticated: boolean;
    consoleType: 'ADMIN' | 'CUSTOMER' | 'UNDEFINED';
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// ============================================
// Admin Route Guard
// ============================================

interface AdminRouteProps {
    children: React.ReactNode;
    requiredRole?: AdminUser['role'];
}

/**
 * Protects admin-only routes
 * 
 * Usage:
 * <Route path="/admin/dashboard" element={
 *   <AdminRoute>
 *     <AdminDashboard />
 *   </AdminRoute>
 * } />
 */
export function AdminRoute({ children, requiredRole }: AdminRouteProps) {
    const { user, isAuthenticated, consoleType } = useAuth();

    // ============================================
    // SECURITY CHECKS
    // ============================================

    // 1. Check console type
    if (consoleType === 'CUSTOMER') {
        console.error('[RemoteX Security] Customer console cannot access admin routes');
        return <Navigate to="/unauthorized" replace />;
    }

    // 2. Check authentication
    if (!isAuthenticated || !user) {
        console.warn('[RemoteX Security] Unauthenticated access to admin route');
        return <Navigate to="/login" replace />;
    }

    // 3. Check role if specified
    if (requiredRole && user.role !== requiredRole) {
        console.error(
            `[RemoteX Security] Insufficient role. Required: ${requiredRole}, Has: ${user.role}`
        );
        return <Navigate to="/forbidden" replace />;
    }

    // 4. All checks passed
    return <>{children}</>;
}

// ============================================
// Customer Route Guard
// ============================================

interface CustomerRouteProps {
    children: React.ReactNode;
}

/**
 * Protects customer-only routes
 * Prevents admins from accidentally accessing customer flow
 * 
 * Usage:
 * <Route path="/support" element={
 *   <CustomerRoute>
 *     <CustomerSupportView />
 *   </CustomerRoute>
 * } />
 */
export function CustomerRoute({ children }: CustomerRouteProps) {
    const { consoleType, isAuthenticated } = useAuth();

    // ============================================
    // SECURITY CHECKS
    // ============================================

    // 1. Block admin users
    if (consoleType === 'ADMIN' && isAuthenticated) {
        console.error(
            '[RemoteX Security] Admin console cannot access customer routes'
        );
        return <Navigate to="/admin/dashboard" replace />;
    }

    // 2. All checks passed (no authentication required for customers)
    return <>{children}</>;
}

// ============================================
// Console Type Guard
// ============================================

interface ConsoleGuardProps {
    children: React.ReactNode;
    allowedConsole: 'ADMIN' | 'CUSTOMER';
}

/**
 * Generic console type guard
 * 
 * Usage:
 * <ConsoleGuard allowedConsole="ADMIN">
 *   <AdminFeature />
 * </ConsoleGuard>
 */
export function ConsoleGuard({ children, allowedConsole }: ConsoleGuardProps) {
    const { consoleType } = useAuth();

    if (consoleType !== allowedConsole && consoleType !== 'UNDEFINED') {
        console.error(
            `[RemoteX Security] Console type mismatch. Required: ${allowedConsole}, Current: ${consoleType}`
        );
        return null; // Don't render anything
    }

    return <>{children}</>;
}

// ============================================
// Permission-Based Guard
// ============================================

interface PermissionGuardProps {
    children: React.ReactNode;
    requiredPermission: keyof AdminUser['permissions'];
    fallback?: React.ReactNode;
}

/**
 * Guards based on granular permissions
 * 
 * Usage:
 * <PermissionGuard requiredPermission="executeCommands">
 *   <RemoteTerminal />
 * </PermissionGuard>
 */
export function PermissionGuard({
    children,
    requiredPermission,
    fallback,
}: PermissionGuardProps) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated || !user) {
        return fallback ? <>{fallback}</> : null;
    }

    if (!user.permissions[requiredPermission]) {
        console.warn(
            `[RemoteX Security] User lacks permission: ${requiredPermission}`
        );
        return fallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Check if current user has specific permission
 */
export function usePermission(permission: keyof AdminUser['permissions']): boolean {
    const { user } = useAuth();
    return user?.permissions[permission] ?? false;
}

/**
 * Check if current console type matches
 */
export function useConsoleType(): 'ADMIN' | 'CUSTOMER' | 'UNDEFINED' {
    const { consoleType } = useAuth();
    return consoleType;
}

/**
 * Block access if admin is authenticated
 * Useful for customer-facing pages
 */
export function useBlockAdmin(): boolean {
    const { consoleType, isAuthenticated } = useAuth();
    return consoleType === 'ADMIN' && isAuthenticated;
}
