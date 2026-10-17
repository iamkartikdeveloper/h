'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, User, AlertCircle, ArrowLeft, UserPlus, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-mono">
          Loading registration portal...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/profile';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Sign up with Supabase Auth
      // The on_auth_user_created trigger will automatically provision public.profiles with role = 'user'
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            display_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      if (data?.session) {
        // Auto-logged in: navigate with cookies preserved
        window.location.href = redirectUrl;
        return;
      } else if (data?.user) {
        // If user already exists, Supabase returns empty identities array
        if (data.user.identities && data.user.identities.length === 0) {
          setErrorMsg(
            'An account with this email already exists. Please sign in below with your credentials.'
          );
          return;
        }

        // Confirmation email required or user created
        setSuccessMsg(
          'Your account has been registered! If confirmation is required, please check your inbox. Redirecting to login...'
        );
        setTimeout(() => {
          router.push(`/login?registered=true${redirectUrl !== '/profile' ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('An account with this email already exists. Please sign in below.');
      } else if (msg.toLowerCase().includes('gateway timeout')) {
        setErrorMsg(
          'Supabase email confirmation service timed out. If you already registered before, please sign in directly.'
        );
      } else {
        setErrorMsg(msg || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-100/60 to-emerald-100/50 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Heading */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
            Join the developer platform to access source code, track tutorials, and participate in discussions.
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full Name *"
                type="text"
                placeholder="Kartik Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password *"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm Password *"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="text-[11px] text-slate-500 leading-normal">
                By signing up, your profile is created with standard member permissions (<span className="font-semibold text-slate-700">role: 'user'</span>).
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                href={`/login${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
