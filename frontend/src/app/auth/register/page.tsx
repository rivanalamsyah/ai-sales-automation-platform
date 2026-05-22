"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, User, Building, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName,
        }),
      });

      if (data.accessToken) {
        localStorage.setItem('whatsaas_token', data.accessToken);
        localStorage.setItem('whatsaas_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        throw new Error('Registration succeeded but token signing was invalid.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px]" />

      <div className="w-full max-w-md bg-neutral-950/80 border border-border/80 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center glow-primary mb-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create SaaS Account</h1>
          <p className="text-sm text-neutral-400 mt-1">Provision a new organization dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Registration Failure:</span> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tony Stark"
                className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-border rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-primary placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Organization Name</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Stark Industries"
                className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-border rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-primary placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ceo@stark.com"
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
                placeholder="Min 6 characters"
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
                Create Account & Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-400 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
