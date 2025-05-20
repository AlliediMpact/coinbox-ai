# Role-Based Access Control (RBAC)

This document outlines the implementation and usage of Role-Based Access Control (RBAC) in Coinbox AI.

## Overview

Coinbox AI implements a role-based access control system using Firebase Authentication custom claims combined with a Firestore fallback mechanism.

### Roles

The system defines three primary roles:

1. **Admin** - Full access to all features and administrative capabilities
2. **Support** - View-only access to most administrative features, specifically for customer support staff
3. **User** - Standard user access (default)

## Client-Side Role Protection

Client-side routes can be protected based on user roles using:

1. **RoleProtectedRoute Component** - A wrapper component that redirects users without proper permissions
2. **useRoleAccess Hook** - A custom hook for granular role-based access control in components

### Using RoleProtectedRoute Component

```tsx
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';

export default function AdminPage() {
  return (
    <RoleProtectedRoute requiredRole="admin" redirectTo="/dashboard">
      <div>Admin-only content</div>
    </RoleProtectedRoute>
  );
}
```

### Using useRoleAccess Hook

```tsx
import { useRoleAccess } from '@/hooks/use-role-access';

export default function AnalyticsComponent() {
  const { hasAccess, isLoading, isReadOnly } = useRoleAccess({
    requiredRole: 'admin',
    allowSupport: true // Allow support staff to view but not modify
  });

  if (isLoading) return <div>Loading...</div>;
  if (!hasAccess) return null;

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      {!isReadOnly ? (
        <button>Edit Settings</button>
      ) : (
        <div>View-only mode (Support staff)</div>
      )}
    </div>
  );
}

## Implementation Details

### Role Storage

Roles are stored in two places:

1. **Firebase Auth Custom Claims** (primary) - Stored in the user's JWT token
   - Fast access on both client and server
   - Automatically available after authentication
   - Limited to 1000 bytes per user

2. **Firestore User Documents** (fallback) - Stored in Firestore under `users/{userId}`
   - Used as fallback if custom claims are not set
   - Used during migration to custom claims
   - Allows for additional role metadata if needed

### Role Check Utility Functions

Located in `src/lib/auth-utils.ts`:

```typescript
// Check if user has admin or support access
async function hasAdminAccess(userId: string, requireFullAccess: boolean = false): Promise<boolean>

// Get a user's role (admin, support, or user)
async function getUserRole(userId: string): Promise<string>
```

### Role Setting

Admins can set roles through:

1. The Admin Panel's Role Management tab
2. The `/api/admin/set-role` API endpoint (admin-only)

When a role is set:
- A custom claim `{ role: 'admin|support|user' }` is added to the user's Firebase Auth profile
- The role is also written to the user's Firestore document for consistency

### Client-Side Role Access

The role and related permissions are accessible in React components via the AuthContext:

```typescript
const { userClaims } = useAuth();
const isAdmin = userClaims?.role === 'admin';
const isSupport = userClaims?.role === 'support';
const canModify = isAdmin; // Support role can only view
```

### Server-Side Role Check

API endpoints check roles using the utility functions:

```typescript
// For endpoints needing admin or support access (e.g. view data)
await hasAdminAccess(userId)

// For endpoints needing full admin access (e.g. modify data)
await hasAdminAccess(userId, true)
```

## Testing

Unit tests for the role-checking functionality are available in `src/lib/auth-utils.test.ts`.
