'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import { connectSocket, disconnectSocket, socket } from './socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (user) {
      connectSocket();
      socket.emit('join_room', { role: user.role, userId: user._id });
    } else {
      disconnectSocket();
    }
  }, [user]);

  async function checkAuth() {
    try {
      const { data } = await api.get('/users/me');
      if (data.success) setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      setUser(data.data.user);
      return data.data.user;
    }
    throw new Error(data.error);
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.success) {
      setUser(data.data.user);
      return data.data.user;
    }
    throw new Error(data.error);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
