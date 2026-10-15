'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export interface FeedbackVoteProps {
  tutorialId: string;
}

export function FeedbackVote({ tutorialId }: FeedbackVoteProps) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    if (voted || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await supabase.from('tutorial_feedback').insert([
        {
          tutorial_id: tutorialId,
          is_helpful: isHelpful,
        },
      ]);
      setVoted(isHelpful ? 'yes' : 'no');
    } catch (err) {
      console.error('Failed to submit feedback', err);
      // Still show thanks locally
      setVoted(isHelpful ? 'yes' : 'no');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (voted) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <span>Thank you for your feedback! It helps keep these tutorials top-notch.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
      <div>
        <h4 className="text-sm font-semibold text-white">Was this tutorial helpful?</h4>
        <p className="text-xs text-slate-400">Let me know if you found this guide clear and useful.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Yes, it helped!</span>
        </button>

        <button
          onClick={() => handleVote(false)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
        >
          <ThumbsDown className="w-4 h-4" />
          <span>Needs improvement</span>
        </button>
      </div>
    </div>
  );
}
