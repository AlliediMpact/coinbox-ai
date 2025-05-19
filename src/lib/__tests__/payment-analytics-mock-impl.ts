// Mock NextResponse module for testing
// This is a separate file to avoid circular references in the original

import { NextResponse, NextRequest } from "next/server";

// Create a fixed response mock for API tests
export function createMockResponse(data: any, status = 200) {
  const mockResponse = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
  
  return mockResponse;
}

// Wrapper for the original NextResponse.json
export function safeNextResponseJson(data: any, options: any = {}) {
  try {
    return NextResponse.json(data, options);
  } catch (error) {
    const status = options?.status || 200;
    return createMockResponse(data, status);
  }
}
