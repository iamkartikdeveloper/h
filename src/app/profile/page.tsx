'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isUserAdminOrOwner } from '@/lib/auth-helpers';
import { Profile } from '@/types/database';
import { MOCK_PROFILE } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  Key,
  Calendar,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  ExternalLink,
  Code2,
  Layers,
  Fingerprint,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  // Verification System state
  const [isVerified, setIsVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Fallback demo state if unauthenticated or Supabase offline
        setProfile(MOCK_PROFILE);
        setUserEmail(MOCK_PROFILE.email || 'contact@kartiksharma.dev');
        setDisplayName(MOCK_PROFILE.display_name);
        setBio(MOCK_PROFILE.bio || '');
        setSkills((MOCK_PROFILE.skills || []).join(', '));
        return;
      }

      setUserEmail(session.user.email || '');

      const isOwnerOrAdmin = isUserAdminOrOwner(session.user.email);
      const emailConfirmed = !!session.user.email_confirmed_at;

      // Fetch user profile from public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch warning:', error.message);
      }

      const verified = isOwnerOrAdmin || emailConfirmed || !!data?.is_verified;
      setIsVerified(verified);

      if (data) {
        const effectiveRole = isOwnerOrAdmin
          ? (data.role === 'admin' ? 'admin' : 'owner')
          : (data.role || 'user');

        const resolvedProfile: Profile = {
          ...data,
          role: effectiveRole,
          is_verified: verified,
        };
        setProfile(resolvedProfile);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setSkills((data.skills || []).join(', '));
      } else {
        // Provision fallback object if trigger was delayed or profile row not created yet
        const effectiveRole = isOwnerOrAdmin ? 'owner' : 'user';
        const fallbackProfile: Profile = {
          id: session.user.id,
          email: session.user.email,
          display_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'Kartik Sharma',
          username: session.user.email?.split('@')[0] || 'kartik',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          role: effectiveRole,
          is_verified: verified,
          bio: 'Passionate developer learning mobile & web engineering.',
          skills: ['Kotlin', 'Android', 'Next.js', 'Supabase'],
          social_links: {},
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setDisplayName(fallbackProfile.display_name);
        setBio(fallbackProfile.bio || '');
        setSkills(fallbackProfile.skills.join(', '));

        // Auto-create their profile row in public.profiles
        try {
          await supabase.from('profiles').upsert(
            {
              id: session.user.id,
              email: session.user.email,
              display_name: fallbackProfile.display_name,
              username: fallbackProfile.username,
              role: effectiveRole,
              is_verified: verified,
              bio: fallbackProfile.bio,
              skills: fallbackProfile.skills,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (insertErr) {
          console.warn('Auto profile provisioning notice:', insertErr);
        }
      }
    } catch (err: any) {
      console.error('Profile loading error:', err);
      setProfile(MOCK_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Update or upsert user's own profile via RLS
        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: session.user.id,
              email: session.user.email,
              display_name: displayName.trim(),
              bio: bio.trim(),
              skills: skillsArray,
              role: profile.role || 'user',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (error) throw error;
      }

      // Update local state
      setProfile({
        ...profile,
        display_name: displayName.trim(),
        bio: bio.trim(),
        skills: skillsArray,
        updated_at: new Date().toISOString(),
      });

      setSuccessMsg('Profile details updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Update error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out error:', err);
      window.location.href = '/';
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!userEmail) return;
    try {
      setSendingVerify(true);
      setErrorMsg(null);
      setVerifyNotice(null);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;
      setVerifyNotice('Verification confirmation email has been dispatched to your inbox!');
    } catch (err: any) {
      console.error('Verification resend error:', err);
      setErrorMsg(err.message || 'Failed to dispatch verification email.');
    } finally {
      setSendingVerify(false);
    }
  };

  const handleInstantVerify = async () => {
    try {
      setSendingVerify(true);
      setErrorMsg(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await supabase
          .from('profiles')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.user.id);

        setIsVerified(true);
        if (profile) {
          setProfile({ ...profile, is_verified: true });
        }
        setVerifyNotice('Account successfully verified! Verified Developer badge is now active.');
      }
    } catch (err: any) {
      console.error('Instant verify error:', err);
      setErrorMsg('Failed to verify account.');
    } finally {
      setSendingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 text-slate-500 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p>Loading your profile details...</p>
      </div>
    );
  }

  const role = profile?.role || 'user';
  const isAdminOrOwner = role === 'admin' || role === 'owner';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
      {/* Top Banner Alert / Message */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle Decorative Ambient Spot */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50/80 via-sky-50/40 to-transparent pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-0.5 shadow-sm shrink-0">
              <img
                src={
                  profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                }
                alt={profile?.display_name || 'Profile Avatar'}
                className="w-full h-full object-cover rounded-[14px] bg-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {profile?.display_name || 'Developer'}
                </h1>

                {/* Role Badge */}
                {role === 'owner' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Platform Owner</span>
                  </span>
                ) : role === 'admin' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Standard Member</span>
                  </span>
                )}

                {/* Verification Status Badge */}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Developer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unverified Account</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-mono flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{userEmail || profile?.email || 'user@example.com'}</span>
              </p>

              {profile?.username && (
                <p className="text-xs text-slate-500 font-mono">
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Admin Callout Banner for Admins/Owners */}
        {isAdminOrOwner && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/50 -mx-8 -mb-8 p-6 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Elevated Access Granted ({role.toUpperCase()})
                </h4>
                <p className="text-xs text-slate-600">
                  You are authorized to manage tutorials, review comments, and configure website settings.
                </p>
              </div>
            </div>

            <Link href="/admin">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Admin Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Main Profile Info / Edit Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Account Attributes */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Account Metadata
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">System Role</span>
                <span className="font-semibold text-slate-900 capitalize font-mono">
                  {role}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">User UUID</span>
                <span className="font-mono text-slate-600 text-[10px] break-all bg-slate-50 p-1.5 rounded-lg border border-slate-200 block">
                  {profile?.id || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Registration Date</span>
                <span className="text-slate-700 font-medium font-mono">
                  {profile?.created_at ? formatDate(profile.created_at) : 'Active Member'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Last Updated</span>
                <span className="text-slate-700 font-medium font-mono">
                  {profile?.updated_at ? formatDate(profile.updated_at) : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Status Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Security &amp; RLS</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Row Level Security (RLS) is active on your profile. Only your authenticated user ID is authorized to update these records.
            </p>
          </div>

          {/* Verification System Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification System</span>
              </h3>
              {isVerified ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  UNVERIFIED
                </span>
              )}
            </div>

            {verifyNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{verifyNotice}</span>
              </div>
            )}

            {isVerified ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Developer Identity Confirmed</span>
                </span>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Your email is confirmed and your profile is verified across the platform. You have full access to developer discussions and tutorials.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your email address is currently unverified. Verify your account to activate your official developer badge and unlock full community privileges.
                </p>

                <div className="space-y-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full"
                    onClick={handleInstantVerify}
                    isLoading={sendingVerify}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Instant Verify Account
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleSendVerificationEmail}
                    disabled={sendingVerify}
                    leftIcon={<Mail className="w-3.5 h-3.5" />}
                  >
                    Resend Email Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Profile Bio & Skills / Edit Form */}
        <div className="md:col-span-2 space-y-6">
          {editing ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Edit Your Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name, bio, and programming skill badges.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Display Name *"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Kartik Sharma"
                  required
                />

                <Textarea
                  label="Biography"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about your engineering background and interests..."
                />

                <Input
                  label="Technical Skills (Comma separated)"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Android Development, Kotlin, Flutter, Google AdMob, Supabase"
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={saving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              {/* Bio section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Biography
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {profile?.bio || 'No biography added yet. Click "Edit Profile" to share details about your development background.'}
                </p>
              </div>

              {/* Skills section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Skills &amp; Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skills listed yet.</span>
                  )}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/tutorials"
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Browse Tutorials
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Explore Kotlin, Flutter &amp; AdMob
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/projects"
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Explore Projects
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Open source code &amp; demos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
