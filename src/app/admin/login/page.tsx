'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, Mail, AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Check if user is an authorized admin in public.admin_users
        const { data: adminRecord, error: adminErr } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('user_id', data.user.id)
          .single();

        if (adminErr || !adminRecord) {
          // If not in admin_users, let the user know they need the admin role
          setErrorMsg(
            'Your account is authenticated with Supabase, but is not yet registered in the "admin_users" table. Please insert your user ID into admin_users in Supabase SQL editor.'
          );
          await supabase.auth.signOut();
          return;
        }

        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Website</span>
        </Link>

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin Portal</h2>
          <p className="text-xs text-slate-400">
            Sign in with your authorized administrator credentials
          </p>
        </div>

        <div className="mt-8">
          <form
            onSubmit={handleLogin}
            className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 backdrop-blur-xl shadow-2xl"
          >
            <Input
              label="Admin Email *"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password *"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={loading}
              className="w-full font-semibold"
            >
              Sign In to Dashboard
            </Button>

            {/* Bootstrap Instructions Accordion */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>First Time Admin Setup:</span>
              </div>
              <p className="leading-relaxed">
                1. Create a user in Supabase Auth (Dashboard &gt; Authentication &gt; Users).
              </p>
              <p className="leading-relaxed">
                2. Execute in SQL Editor:
                <code className="block mt-1 p-2 rounded bg-slate-950 font-mono text-[10px] text-indigo-300 border border-slate-800 overflow-x-auto">
                  INSERT INTO admin_users (user_id) VALUES ('YOUR-AUTH-USER-ID');
                </code>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
