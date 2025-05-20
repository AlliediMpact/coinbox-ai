// Helper functions for API routes

import { NextResponse } from 'next/server';

// Safe wrapper for NextResponse.json that handles test environment issues
export function safeNextResponseJson(data: any, options: any = {}) {
  try {
    return NextResponse.json(data, options);
  } catch (error) {
    // Create a standard response if NextResponse.json fails
    const response = new Response(JSON.stringify(data), {
      status: options?.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    
    // Add a status property to match NextResponse behavior
    Object.defineProperty(response, 'status', {
      get() { return options?.status || 200; }
    });
    
    return response;
  }
}

/**
 * Standard API error types
 */
export enum ApiErrorType {
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  BAD_REQUEST = 'bad_request',
  CONFLICT = 'conflict',
  RATE_LIMITED = 'rate_limited',
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  VALIDATION_ERROR = 'validation_error',
  AUTH_EMAIL_NOT_VERIFIED = 'auth_email_not_verified',
  AUTH_INVALID_CREDENTIALS = 'auth_invalid_credentials',
  AUTH_ACCOUNT_DISABLED = 'auth_account_disabled',
  PAYMENT_REQUIRED = 'payment_required',
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: {
    type: ApiErrorType;
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Create a consistent error response
 */
export function createErrorResponse(
  type: ApiErrorType, 
  message: string, 
  code?: string,
  details?: any,
  status?: number
): Response {
  // Map error types to appropriate status codes if not specified
  if (!status) {
    status = getStatusCodeForErrorType(type);
  }
  
  return safeNextResponseJson(
    { 
      error: { 
        type, 
        message,
        ...(code ? { code } : {}),
        ...(details ? { details } : {})
      } 
    }, 
    { status }
  );
}

/**
 * Get the appropriate HTTP status code for an error type
 */
function getStatusCodeForErrorType(type: ApiErrorType): number {
  switch (type) {
    case ApiErrorType.UNAUTHORIZED:
      return 401;
    case ApiErrorType.FORBIDDEN:
      return 403;
    case ApiErrorType.NOT_FOUND:
      return 404;
    case ApiErrorType.BAD_REQUEST:
      return 400;
    case ApiErrorType.CONFLICT:
      return 409;
    case ApiErrorType.RATE_LIMITED:
      return 429;
    case ApiErrorType.PAYMENT_REQUIRED:
      return 402;
    case ApiErrorType.SERVICE_UNAVAILABLE:
      return 503;
    case ApiErrorType.AUTH_EMAIL_NOT_VERIFIED:
    case ApiErrorType.AUTH_INVALID_CREDENTIALS:
    case ApiErrorType.AUTH_ACCOUNT_DISABLED:
      return 401;
    case ApiErrorType.VALIDATION_ERROR:
      return 422;
    case ApiErrorType.INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Authentication error handling
 */
export const AuthErrors = {
  unauthorized: (message = 'Authentication required') => 
    createErrorResponse(ApiErrorType.UNAUTHORIZED, message),
    
  invalidCredentials: (message = 'Invalid email or password') => 
    createErrorResponse(ApiErrorType.AUTH_INVALID_CREDENTIALS, message),
    
  emailNotVerified: (message = 'Email address not verified') => 
    createErrorResponse(ApiErrorType.AUTH_EMAIL_NOT_VERIFIED, message),
    
  accountDisabled: (message = 'Account has been disabled') => 
    createErrorResponse(ApiErrorType.AUTH_ACCOUNT_DISABLED, message),
    
  insufficientPermissions: (message = 'You do not have permission to access this resource') => 
    createErrorResponse(ApiErrorType.FORBIDDEN, message),
    
  rateLimited: (message = 'Too many requests, please try again later', retryAfter?: number) => {
    const response = createErrorResponse(ApiErrorType.RATE_LIMITED, message);
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
    return response;
  },
};

/**
 * Validation error handling
 */
export function validationError(errors: Record<string, string[]>) {
  return createErrorResponse(
    ApiErrorType.VALIDATION_ERROR, 
    'Validation error', 
    undefined, 
    { errors }
  );
}

/**
 * Not found error
 */
export function notFoundError(resource = 'Resource') {
  return createErrorResponse(
    ApiErrorType.NOT_FOUND,
    `${resource} not found`
  );
}

/**
 * Internal server error
 */
export function internalError(error: Error) {
  console.error('[API Error]', error);
  
  // In production, don't expose error details to client
  const isDev = process.env.NODE_ENV === 'development';
  
  return createErrorResponse(
    ApiErrorType.INTERNAL_ERROR,
    'An internal server error occurred',
    undefined,
    isDev ? {
      message: error.message,
      stack: error.stack
    } : undefined
  );
}
