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
        // Check if user has 'admin' or 'owner' role in public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        let isAuthorized = profile?.role === 'admin' || profile?.role === 'owner';

        if (!isAuthorized) {
          // Fallback check on admin_users table
          const { data: adminRecord } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();
          if (adminRecord) isAuthorized = true;
        }

        if (!isAuthorized) {
          setErrorMsg(
            'Access denied: Your account role is set to "user". Only users with the "admin" or "owner" role are permitted to access the admin portal.'
          );
          await supabase.auth.signOut();
          router.push('/');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-100/60 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Website</span>
        </Link>

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h2>
          <p className="text-xs text-slate-500">
            Sign in with your authorized administrator credentials
          </p>
        </div>

        <div className="mt-8">
          <form
            onSubmit={handleLogin}
            className="p-8 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs"
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
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
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
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                <span>First Time Admin Setup:</span>
              </div>
              <p className="leading-relaxed">
                1. Create a user in Supabase Auth (Dashboard &gt; Authentication &gt; Users).
              </p>
              <p className="leading-relaxed">
                2. Execute in SQL Editor:
                <code className="block mt-1 p-2 rounded bg-slate-100 font-mono text-[10px] text-indigo-700 border border-slate-200 overflow-x-auto">
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
