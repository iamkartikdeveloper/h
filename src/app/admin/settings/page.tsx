'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Settings,
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Mail,
} from 'lucide-react';
import { YouTubeIcon, GitHubIcon, LinkedInIcon, TwitterIcon } from '@/components/ui/Icons';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile
  const [profileId, setProfileId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');

  // Social Links
  const [youtube, setYoutube] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [email, setEmail] = useState('');

  // Website Settings
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [youtubeSubs, setYoutubeSubs] = useState('');
  const [totalViews, setTotalViews] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Load Profile
      const { data: profile } = await supabase.from('profiles').select('*').single();
      if (profile) {
        setProfileId(profile.id);
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatar_url || '');
        setSkills((profile.skills || []).join(', '));

        const soc = profile.social_links || {};
        setYoutube(soc.youtube || '');
        setGithub(soc.github || '');
        setLinkedin(soc.linkedin || '');
        setTwitter(soc.twitter || '');
        setEmail(soc.email || '');
      }

      // Load Site Settings
      const { data: siteConfig } = await supabase
        .from('website_settings')
        .select('*')
        .eq('setting_key', 'site_config')
        .single();

      if (siteConfig?.setting_value) {
        const val = siteConfig.setting_value;
        setHeroHeading(val.hero_heading || '');
        setHeroSubheading(val.hero_subheading || '');
        setAnnouncement(val.announcement_banner || '');
        setYoutubeSubs(val.youtube_subscribers || '');
        setTotalViews(val.total_views || '');
      }
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(false);

      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const socialLinks = {
        youtube: youtube.trim() || undefined,
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        twitter: twitter.trim() || undefined,
        email: email.trim() || undefined,
      };

      // 1. Update Profile
      if (profileId) {
        const { error: profErr } = await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl.trim(),
            skills: skillsArray,
            social_links: socialLinks,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);

        if (profErr) throw profErr;
      }

      // 2. Update Website Settings
      const { error: setErr } = await supabase
        .from('website_settings')
        .upsert(
          {
            setting_key: 'site_config',
            setting_value: {
              hero_heading: heroHeading.trim(),
              hero_subheading: heroSubheading.trim(),
              announcement_banner: announcement.trim(),
              youtube_subscribers: youtubeSubs.trim(),
              total_views: totalViews.trim(),
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (setErr) throw setErr;

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portfolio &amp; Website Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update your public developer identity, bio, social presence, and homepage announcements.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Website &amp; profile settings updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Developer Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name *"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Avatar Image URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <Textarea
            label="Professional Biography"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <Input
            label="Technical Skills (Comma separated)"
            placeholder="Android Development, Kotlin, Flutter, Google AdMob, Firebase"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>

        {/* Social Links */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <YouTubeIcon className="w-4 h-4 text-red-500" />
            <span>Social &amp; Contact Links</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="YouTube Channel URL"
              placeholder="https://youtube.com/@..."
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              leftIcon={<YouTubeIcon className="w-4 h-4" />}
            />
            <Input
              label="GitHub Profile URL"
              placeholder="https://github.com/..."
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              leftIcon={<GitHubIcon className="w-4 h-4" />}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              leftIcon={<LinkedInIcon className="w-4 h-4" />}
            />
            <Input
              label="Twitter / X URL"
              placeholder="https://twitter.com/..."
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              leftIcon={<TwitterIcon className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Public Contact Email"
            type="email"
            placeholder="contact@..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        {/* Homepage & Content Config */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Homepage Copy &amp; Verified Stats</span>
          </h2>

          <Input
            label="Announcement Banner Text"
            placeholder="🚀 New Google AdMob & Android Masterclass is live!"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />

          <Input
            label="Hero Heading"
            placeholder="Crafting Scalable Mobile Apps & Educating 100K+ Developers"
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
          />

          <Textarea
            label="Hero Subheading"
            rows={2}
            value={heroSubheading}
            onChange={(e) => setHeroSubheading(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="YouTube Subscribers Stat (e.g. 125,000+)"
              value={youtubeSubs}
              onChange={(e) => setYoutubeSubs(e.target.value)}
            />
            <Input
              label="Total Views Stat (e.g. 4.8M+)"
              value={totalViews}
              onChange={(e) => setTotalViews(e.target.value)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
