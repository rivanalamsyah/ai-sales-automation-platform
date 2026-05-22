"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.accessToken) {
        localStorage.setItem('whatsaas_token', data.accessToken);
        localStorage.setItem('whatsaas_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        throw new Error('Authentication returned an invalid token structure.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@whatsaas.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px]" />

      <div className="w-full max-w-md bg-neutral-950/80 border border-border/80 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center glow-primary mb-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-sm text-neutral-400 mt-1">Access your WhatsApp AI dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Authentication Error:</span> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-border rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-primary placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-border rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-primary placeholder:text-neutral-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Widget */}
        <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-neutral-300 text-left">
          <div className="font-semibold text-primary mb-1">💡 Sandbox Developer Login</div>
          Use the credentials below to log in immediately with preloaded sandbox mock databases:
          <div className="mt-2 font-mono flex flex-col gap-1 text-white">
            <div>Email: admin@whatsaas.com</div>
            <div>Pass: admin123</div>
          </div>
          <button
            onClick={handleFillDemo}
            className="mt-3 text-[11px] font-bold text-primary hover:underline"
          >
            Auto-fill credentials
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-400">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Register Organisation
          </Link>
        </div>
      </div>
    </div>
  );
}
