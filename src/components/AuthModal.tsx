/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, User as UserIcon, Mail, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthTokens, User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tokens: AuthTokens, user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de retroalimentación
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function resetForm() {
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  }

  function handleModeSwitch(newMode: AuthMode) {
    setMode(newMode);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validaciones locales según la vista actual
    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Por favor, ingresa tu correo electrónico.');
        return;
      }
    } else if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setError('Por favor, ingresa tu correo y contraseña.');
        return;
      }
    } else if (mode === 'register') {
      if (!email.trim() || !username.trim() || !fullName.trim() || !password.trim()) {
        setError('Por favor, completa todos los campos.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      let endpoint = '/api/auth/login';
      let payload: Record<string, any> = {};

      if (mode === 'register') {
        endpoint = '/api/auth/register';
        payload = { email, username, fullName, password };
      } else if (mode === 'login') {
        endpoint = '/api/auth/login';
        payload = { email, password };
      } else if (mode === 'forgot') {
        endpoint = '/api/auth/forgot-password';
        payload = { email };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal. Por favor, intenta de nuevo.');
      }

      if (mode === 'forgot') {
        setSuccessMessage('Se han enviado las instrucciones de recuperación a tu correo electrónico.');
      } else {
        // Estructuración de tokens para la sesión
        const tokens: AuthTokens = data.tokens || {
          token: data.token,
          refreshToken: data.refreshToken,
        };

        onSuccess(tokens, data.user);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-black/60 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {mode === 'register' && 'Crear Cuenta'}
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field (Usado en todas las vistas) */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Campos adicionales para Registro */}
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Nombre Completo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <UserCheck size={16} />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ej. Oscar Yael Hernández"
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Nombre de Usuario</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <UserIcon size={16} />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ej. melomano99"
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Contraseña (Usado en Login y Registro) */}
            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 font-medium">Contraseña</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Confirmar Contraseña (Registro) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Confirmar Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 active:scale-95 py-3 text-sm font-semibold text-white shadow-lg transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Cargando...</span>
                </div>
              ) : mode === 'register' ? (
                'Crear mi cuenta'
              ) : mode === 'login' ? (
                'Iniciar Sesión'
              ) : (
                'Enviar correo de recuperación'
              )}
            </button>
          </form>

          {/* Toggle Register/Login/Forgot */}
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-white/10 pt-4">
            {mode === 'register' && (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={() => handleModeSwitch('login')}
                  className="text-purple-400 hover:text-purple-300 font-semibold hover:underline cursor-pointer"
                >
                  Inicia Sesión aquí
                </button>
              </p>
            )}

            {mode === 'login' && (
              <p>
                ¿Aún no tienes cuenta?{' '}
                <button
                  onClick={() => handleModeSwitch('register')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p>
                ¿Recordaste tu contraseña?{' '}
                <button
                  onClick={() => handleModeSwitch('login')}
                  className="text-purple-400 hover:text-purple-300 font-semibold hover:underline cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}