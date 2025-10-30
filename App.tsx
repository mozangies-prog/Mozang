
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import * as storage from './services/storageService';
import { User } from './types';
import AuthPage from './components/AuthPage';
import ResidentDashboard from './components/ResidentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ThemeToggle } from './components/common/ThemeToggle';
import { useStorageListener } from './hooks/useStorageListener';

// --- Theme Context ---
type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// --- Auth Context ---
type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUserContext: (user: User) => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(storage.getLoggedInUser());

  useEffect(() => {
    storage.setLoggedInUser(user);
  }, [user]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'mcp_loggedInUser') {
      try {
        if (event.newValue) {
          setUser(JSON.parse(event.newValue));
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to parse user from storage", e);
        setUser(null);
      }
    }
  }, []);

  useStorageListener(handleStorageChange);

  const login = (user: User) => {
    setUser(user);
  };
  
  const logout = () => {
    setUser(null);
    storage.setLoggedInUser(null);
  };

  const updateUserContext = (user: User) => {
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute: React.FC<{ allowedRoles: User['role'][], children?: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role if they land somewhere they shouldn't be
    if (user.role === 'resident') return <Navigate to="/resident" replace />;
    if (user.role === 'admin' || user.role === 'department') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('mcp_theme') as Theme) || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mcp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthProvider>
        <div className="min-h-screen font-sans antialiased transition-colors duration-300 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <HashRouter>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route element={<ProtectedRoute allowedRoles={['resident']} />}>
                <Route path="/resident" element={<ResidentDashboard />} />
              </Route>
               <Route element={<ProtectedRoute allowedRoles={['admin', 'department']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </HashRouter>
        </div>
      </AuthProvider>
    </ThemeContext.Provider>
  );
};

export default App;