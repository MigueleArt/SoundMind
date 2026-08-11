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

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

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

                  placeholder="ej. hola@correo.com"
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

            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Nombre de usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <User size={16} />
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
            )}

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Contraseña</label>
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