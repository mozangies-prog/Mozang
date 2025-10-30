import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import * as storage from '../services/storageService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PIN = '0420';

const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      const adminUser = storage.getUsers().find(u => u.role === 'admin');
      if (adminUser) {
        const { password, ...userToLogin } = adminUser;
        login(userToLogin);
        navigate('/admin');
      } else {
        setError('Admin user not found. Please configure one.');
      }
    } else {
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm relative transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-light/20 dark:bg-primary-dark/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Admin Access</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your PIN to continue.</p>
        </div>
        <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
            className="w-full px-4 py-3 text-center text-2xl tracking-[1em] bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary transition"
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary dark:focus:ring-offset-slate-800 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminPinModal;