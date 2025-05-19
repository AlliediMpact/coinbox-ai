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
