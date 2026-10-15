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
      <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
        <span>Thank you for your feedback! It helps keep these tutorials top-notch.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Was this tutorial helpful?</h4>
        <p className="text-xs text-slate-500">Let me know if you found this guide clear and useful.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <ThumbsUp className="w-4 h-4 text-emerald-600" />
          <span>Yes, it helped!</span>
        </button>

        <button
          onClick={() => handleVote(false)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <ThumbsDown className="w-4 h-4 text-rose-500" />
          <span>Needs improvement</span>
        </button>
      </div>
    </div>
  );
}
