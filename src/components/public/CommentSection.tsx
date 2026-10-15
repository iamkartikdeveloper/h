'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Comment } from '@/types/database';
import { formatDate } from '@/lib/utils/reading-time';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export interface CommentSectionProps {
  tutorialId: string;
}

export function CommentSection({ tutorialId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot

  useEffect(() => {
    fetchComments();
  }, [tutorialId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent discard for bot submission

    if (!name.trim() || !email.trim() || !content.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const { error } = await supabase.from('comments').insert([
        {
          tutorial_id: tutorialId,
          author_name: name.trim(),
          author_email: email.trim(),
          content: content.trim(),
          status: 'pending', // Moderation required
        },
      ]);

      if (error) throw error;

      setSuccessMsg(true);
      setName('');
      setEmail('');
      setContent('');
    } catch (err: any) {
      console.error('Failed to post comment', err);
      setErrorMsg(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-12 pt-8 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">
            Community Comments ({comments.length})
          </h3>
        </div>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h4 className="text-sm font-semibold text-slate-200">Leave a question or comment</h4>
        <p className="text-xs text-slate-400">
          Have an implementation question or found a trick? Share below! Comments are moderated to prevent spam.
        </p>

        {/* Hidden Honeypot for Bot Prevention */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          autoComplete="off"
          tabIndex={-1}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Your Name *"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Your Email * (Kept Private)"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Your Comment *"
          placeholder="Ask a question about this code or share your feedback..."
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        {errorMsg && (
          <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thank you! Your comment has been submitted and will appear once approved by the administrator.</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={submitting} rightIcon={<Send className="w-4 h-4" />}>
            Post Comment
          </Button>
        </div>
      </form>

      {/* Approved Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800/60 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-900/30 border border-slate-800/60 text-slate-400 text-sm">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-xs">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-200">{comment.author_name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(comment.created_at)}</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 pl-9 leading-relaxed">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
