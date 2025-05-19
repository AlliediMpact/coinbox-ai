import { createMockResponse, safeNextResponseJson } from './payment-analytics-mock-impl';
import { NextResponse } from 'next/server';

describe('Payment Analytics Mock', () => {
  describe('createMockResponse', () => {
    test('creates a response with correct data and status', () => {
      const testData = { test: 'data' };
      const response = createMockResponse(testData, 200);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
    
    test('creates a response with custom status code', () => {
      const testData = { error: 'Not found' };
      const response = createMockResponse(testData, 404);
      
      expect(response.status).toBe(404);
    });
  });

  describe('safeNextResponseJson', () => {
    test('uses NextResponse.json when it works', () => {
      const originalNextResponseJson = NextResponse.json;
      
      // Mock NextResponse.json to work properly
      NextResponse.json = jest.fn().mockImplementation((data, options) => {
        return new Response(JSON.stringify(data), {
          status: options?.status || 200,
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
          }
        });
      });
      
      const testData = { success: true };
      const response = safeNextResponseJson(testData, { status: 201 });
      
      expect(NextResponse.json).toHaveBeenCalledWith(testData, { status: 201 });
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
      
      // Restore original implementation
      NextResponse.json = originalNextResponseJson;
    });
    
    test('falls back to createMockResponse when NextResponse.json fails', () => {
      const originalNextResponseJson = NextResponse.json;
      
      // Mock NextResponse.json to throw an error
      NextResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('NextResponse.json failed');
      });
      
      const testData = { error: 'Something went wrong' };
      const response = safeNextResponseJson(testData, { status: 500 });
      
      expect(NextResponse.json).toHaveBeenCalled();
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      
      // Restore original implementation
      NextResponse.json = originalNextResponseJson;
    });
  });
});
