'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  BookOpen,
  Mail,
  Shield,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function AdminVerificationPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'tutorials'>('users');
  const [loading, setLoading] = useState(true);

  // Users state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Tutorials state
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [tutSearch, setTutSearch] = useState('');
  const [updatingTutId, setUpdatingTutId] = useState<string | null>(null);

  // Manual verify email form
  const [manualEmail, setManualEmail] = useState('');
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch profiles
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setProfiles(profs || []);

      // 2. Fetch tutorials
      const { data: tuts } = await supabase
        .from('tutorials')
        .select('id, title, slug, status, difficulty, is_verified, created_at')
        .order('created_at', { ascending: false });

      setTutorials(tuts || []);
    } catch (err) {
      console.error('Error loading verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user verification
  const handleToggleUserVerify = async (profile: any) => {
    try {
      setUpdatingUserId(profile.id);
      const newStatus = !profile.is_verified;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified: newStatus,
          verified_at: newStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...p, is_verified: newStatus, verified_at: newStatus ? new Date().toISOString() : null }
            : p
        )
      );
    } catch (err: any) {
      alert(`Failed to update verification status: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Toggle tutorial verification
  const handleToggleTutVerify = async (tutorial: any) => {
    try {
      setUpdatingTutId(tutorial.id);
      const newStatus = !tutorial.is_verified;

      const { error } = await supabase
        .from('tutorials')
        .update({
          is_verified: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tutorial.id);

      if (error) throw error;

      setTutorials((prev) =>
        prev.map((t) => (t.id === tutorial.id ? { ...t, is_verified: newStatus } : t))
      );
    } catch (err: any) {
      alert(`Failed to update tutorial verification: ${err.message}`);
    } finally {
      setUpdatingTutId(null);
    }
  };

  // Manual verify by email
  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    try {
      setManualSuccess(null);
      setManualError(null);

      const targetEmail = manualEmail.trim().toLowerCase();

      // Find profile by email
      const { data: matchedProfile, error: findErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', targetEmail)
        .maybeSingle();

      if (matchedProfile) {
        await supabase
          .from('profiles')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchedProfile.id);

        setProfiles((prev) =>
          prev.map((p) =>
            p.id === matchedProfile.id
              ? { ...p, is_verified: true, verified_at: new Date().toISOString() }
              : p
          )
        );

        setManualSuccess(`Account for ${targetEmail} marked as verified!`);
      } else {
        // If not in profiles table yet, upsert a verified record
        const { error: upsertErr } = await supabase.from('profiles').upsert(
          {
            email: targetEmail,
            display_name: targetEmail.split('@')[0],
            username: targetEmail.split('@')[0],
            is_verified: true,
            verified_at: new Date().toISOString(),
            role: 'user',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

        if (upsertErr) throw upsertErr;
        setManualSuccess(`Verified profile created for ${targetEmail}!`);
        loadData();
      }

      setManualEmail('');
    } catch (err: any) {
      setManualError(err.message || 'Failed to verify email.');
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTutorials = tutorials.filter((t) =>
    t.title.toLowerCase().includes(tutSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verification Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage developer trust badges, authenticated email credentials, and tutorial quality assurance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Developer Accounts ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tutorials'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Verified Tutorials ({tutorials.length})</span>
          </button>
        </div>
      </div>

      {/* Manual Quick Verification Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Quick Manual Account Verification</span>
        </h2>
        <p className="text-xs text-slate-500">
          Instantly authorize and grant verified badge to any developer or team member by email address.
        </p>

        {manualSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{manualSuccess}</span>
          </div>
        )}

        {manualError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{manualError}</span>
          </div>
        )}

        <form onSubmit={handleManualVerify} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="developer@example.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" variant="primary" leftIcon={<ShieldCheck className="w-4 h-4" />}>
            Grant Verified Badge
          </Button>
        </form>
      </div>

      {/* 1. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or handle..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredProfiles.length} developers
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User / Developer</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                        No registered profiles found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isOwner = p.role === 'owner';
                      const isVerified = isOwner || p.is_verified;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {p.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                                  <span>{p.display_name || 'Anonymous User'}</span>
                                  {isVerified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {p.email || 'No email attached'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                p.role === 'owner'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : p.role === 'admin'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {p.role?.toUpperCase() || 'USER'}
                            </span>
                          </td>

                          <td className="p-4">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified Member</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unverified</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-slate-500 font-mono text-[11px]">
                            {p.created_at ? formatDate(p.created_at) : 'Active'}
                          </td>

                          <td className="p-4 text-right">
                            {isOwner ? (
                              <span className="text-[11px] font-mono text-slate-400">Owner Locked</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={p.is_verified ? 'outline' : 'primary'}
                                onClick={() => handleToggleUserVerify(p)}
                                isLoading={updatingUserId === p.id}
                              >
                                {p.is_verified ? 'Revoke Badge' : 'Verify Account'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TUTORIALS TAB */}
      {activeTab === 'tutorials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={tutSearch}
                onChange={(e) => setTutSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredTutorials.length} tutorials
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Tutorial Title</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Verification Quality Badge</th>
                    <th className="p-4 text-right">Toggle Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTutorials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                        No tutorials found.
                      </td>
                    </tr>
                  ) : (
                    filteredTutorials.map((tut) => {
                      const isTutVerified = tut.is_verified !== false;

                      return (
                        <tr key={tut.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-semibold text-slate-900">
                            <Link
                              href={`/tutorials/${tut.slug}`}
                              target="_blank"
                              className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>{tut.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          </td>

                          <td className="p-4 font-mono">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                tut.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {tut.status?.toUpperCase() || 'DRAFT'}
                            </span>
                          </td>

                          <td className="p-4">
                            {isTutVerified ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified &amp; Tested on SDK</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Unverified Draft</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant={isTutVerified ? 'outline' : 'primary'}
                              onClick={() => handleToggleTutVerify(tut)}
                              isLoading={updatingTutId === tut.id}
                            >
                              {isTutVerified ? 'Remove Quality Badge' : 'Mark as Verified'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
