// Re-export from the main AuthProvider to avoid duplicates
import { AuthProvider as Provider, useAuth } from '@/components/AuthProvider';

export const AuthProvider = Provider;
export { useAuth };
// This file now just re-exports from the main AuthProvider component
