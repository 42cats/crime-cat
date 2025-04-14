
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  hasRole: () => false,
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const login = async (username?: string, password?: string) => {
    try {
      // For demo purposes, we'll use these credentials to simulate different roles
      let role: UserRole = 'visitor';
      let mockCode = "mock_discord_code";

      if (username === 'admin' && password === 'admin') {
        role = 'admin';
        mockCode = "admin_code";
      } else if (username === 'superuser' && password === 'superuser') {
        role = 'super';
        mockCode = "super_code";
      } else if (username === 'user' && password === 'user') {
        role = 'regular';
        mockCode = "regular_code";
      }

      const loggedInUser = await authService.login(mockCode, role);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        toast({
          title: "Login successful",
          description: `You are now signed in as ${loggedInUser.role}`,
        });
      } else {
        throw new Error("Login failed");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Super users have access to everything except admin-only features
    if (user.role === 'super' && Array.isArray(role) && !role.includes('admin')) {
      return true;
    }
    
    if (user.role === 'super' && role !== 'admin') {
      return true;
    }
    
    // Check if the user's role matches the required role(s)
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
