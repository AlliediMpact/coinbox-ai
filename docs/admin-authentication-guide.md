# CoinBox Authentication Management - Administrator Guide

This guide provides detailed information for administrators on managing user authentication, monitoring security events, and handling authentication-related issues in the CoinBox platform.

## Table of Contents

1. [Authentication Management Dashboard](#authentication-management-dashboard)
2. [User Management](#user-management)
3. [Security Event Monitoring](#security-event-monitoring)
4. [Authentication Logs](#authentication-logs)
5. [Multi-Factor Authentication](#multi-factor-authentication)
6. [Rate Limiting Controls](#rate-limiting-controls)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Authentication Management Dashboard

The Authentication Management Dashboard is accessible at `/dashboard/auth-management` for users with admin privileges.

### Features Overview

The dashboard provides:

- User management with filtering and pagination
- Security event monitoring in real-time
- Authentication log review and analysis
- User account status controls (disable/enable/flag)
- MFA enrollment status tracking

### Access Controls

Only users with the following roles can access the authentication management features:
- Super Admin
- Security Admin
- Support Admin (view-only access)

## User Management

### Viewing User Accounts

1. Navigate to the Authentication Management dashboard
2. The "Users" tab displays all registered users
3. Use the search bar to filter by email, name, or user ID
4. Sort by creation date, last login, or account status

### User Account Actions

For each user, you can perform the following actions:

- **View Details**: See comprehensive account information
- **Disable Account**: Temporarily block access
- **Enable Account**: Restore access for disabled accounts
- **Flag Account**: Mark for review (e.g., suspicious activity)
- **Reset Password**: Send a password reset link
- **Force Sign Out**: Invalidate all active sessions

### Bulk User Management

For multiple users:

1. Use checkboxes to select users
2. Click "Bulk Actions" dropdown
3. Choose the desired action
4. Confirm the action

## Security Event Monitoring

### Types of Security Events

The system logs the following security-related events:

- Failed login attempts
- Password reset requests
- MFA enrollment/unenrollment
- User account lockouts
- Suspicious activity flags
- Administrative actions

### Real-time Monitoring

The Security Events tab shows:

1. Timeline of recent security events
2. Filtering by event type, user, or time range
3. Severity indicators (Low, Medium, High, Critical)
4. Ability to export events for further analysis

### Setting Up Alerts

Configure alerts for specific security events:

1. Click "Configure Alerts" in the Security Events tab
2. Select event types to monitor
3. Set threshold conditions (e.g., 5 failed logins in 10 minutes)
4. Choose notification method (email, SMS, dashboard)
5. Save alert configuration

## Authentication Logs

### Log Review

The Authentication Logs tab provides:

1. Complete history of authentication activities
2. User-specific filtering
3. Time-based filtering
4. Event type filtering
5. Export functionality

### Log Analysis

To identify patterns or issues:

1. Use the "Analytics" view in the Auth Logs tab
2. View visual representations of authentication trends
3. Identify peak usage times or anomalies
4. Export reports for compliance purposes

## Multi-Factor Authentication

### MFA Status Management

1. View MFA enrollment status for all users
2. Filter users by MFA status (enabled/disabled)
3. See MFA method (e.g., SMS)

### Administrator Controls

As an administrator, you can:

1. Require MFA for specific user roles
2. Reset MFA for users who lost access to their devices
3. Disable MFA temporarily for troubleshooting
4. View MFA verification success/failure rates

### MFA Implementation

The platform currently supports:
- SMS-based verification
- Future support planned for:
  - Authenticator apps
  - WebAuthn/FIDO2 security keys
  - Email verification

## Rate Limiting Controls

### Current Rate Limiting Implementation

The system employs IP-based and account-based rate limiting:

- Failed login attempts: 5 attempts per 10 minutes
- Password reset requests: 3 requests per 24 hours
- API authentication: 100 attempts per hour

### Adjusting Rate Limits

To modify rate limiting parameters:

1. Go to "Security Settings" in the admin panel
2. Select "Rate Limiting" tab
3. Update the desired parameters
4. Save changes

### Monitoring Rate Limit Triggers

To monitor rate limiting effectiveness:

1. Check "Rate Limiting" section in Security Events
2. Review triggered limits by IP address or user account
3. Analyze patterns for potential attacks

## Security Best Practices

### Recommended Admin Procedures

1. **Regular Audits**:
   - Review authentication logs weekly
   - Check for unusual patterns
   - Verify admin account usage

2. **User Education**:
   - Encourage MFA enrollment
   - Promote strong password practices
   - Provide security awareness training

3. **Account Management**:
   - Regularly review inactive accounts
   - Implement principle of least privilege
   - Promptly disable accounts of departed users

### Compliance Requirements

Ensure the following for regulatory compliance:

1. Maintain authentication logs for required retention periods
2. Enable necessary security controls based on data sensitivity
3. Generate compliance reports from the "Compliance" section

## Troubleshooting

### Common Issues and Solutions

#### Users Cannot Login

1. Check account status (disabled/enabled)
2. Verify if rate limiting is active
3. Check for MFA configuration issues
4. Reset password if necessary

#### MFA Problems

1. Verify phone number is correct
2. Check if SMS delivery is working
3. Reset MFA if user lost access to device
4. Temporarily disable MFA if necessary for troubleshooting

#### Excessive Failed Login Attempts

1. Check Security Events for the source IP
2. Temporarily block IP if suspicious
3. Contact user to verify if attempts were legitimate
4. Reset password and recommend MFA

### Getting Support

For additional administrator support:

1. Internal documentation: `/admin/docs`
2. Support tickets: support@coinbox.ai
3. Security team: security@coinbox.ai

---

*Last updated: May 20, 2025*
