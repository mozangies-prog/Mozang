import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as storage from '../services/storageService';
import { useAuth } from '../App';
import { User } from '../types';
import AdminPinModal from './AdminPinModal';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      const newUser: User = { email, password, displayName, phoneNumber, role: 'resident' };
      const success = storage.addUser(newUser);
      if (success) {
        const { password, ...userToLogin } = newUser;
        login(userToLogin);
        navigate('/resident');
      } else {
        setError('User with this email already exists.');
      }
    } else { // login
      const users = storage.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password, ...userToLogin } = user;
        login(userToLogin);
        if (user.role === 'resident') {
            navigate('/resident');
        } else {
            navigate('/admin');
        }
      } else {
        setError('Invalid email or password.');
      }
    }
  };

  const handleAdminAccessClick = () => {
      setIsPinModalOpen(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
       <AdminPinModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} />
       <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-primary dark:text-primary-light">
            🧭 Mozang Community Portal
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Welcome! Please sign in or create an account.
          </p>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setMode('login')} 
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => setMode('signup')} 
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Sign Up
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
             {mode === 'signup' && (
              <div>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Display Name"
                />
              </div>
            )}
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 ${mode === 'login' ? 'rounded-t-md' : ''} focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="Email address"
              />
            </div>
             {mode === 'signup' && (
              <div>
                <input
                  id="phone-number"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Phone Number"
                />
              </div>
            )}
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 ${mode === 'login' ? 'rounded-b-md' : ''} focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="Password"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Confirm Password"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary transition-colors"
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <button onClick={handleAdminAccessClick} className="font-medium text-secondary hover:text-secondary-dark dark:hover:text-secondary-light transition-colors">
            Admin Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;