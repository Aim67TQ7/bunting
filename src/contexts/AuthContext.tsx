
import { createContext, useContext, ReactNode } from 'react';

// Define a minimal auth context interface
interface AuthContextType {
  user: null;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false
});

// Provider component that wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Since we've removed auth, we'll just return a simple provider with null user
  return (
    <AuthContext.Provider value={{ user: null, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for components to get auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
