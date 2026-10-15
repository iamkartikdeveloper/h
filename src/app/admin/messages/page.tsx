'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ContactMessage } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  Mail,
  CheckCircle2,
  Trash2,
  Clock,
  Send,
  Archive,
  AlertCircle,
} from 'lucide-react';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus as any } : m))
      );
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;

    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Contact Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Private client inquiries and developer collaboration requests submitted via the contact form.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          {['all', 'unread', 'read', 'replied'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-medium uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No messages found.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-6 rounded-2xl bg-slate-900/60 border transition-colors space-y-4 ${
                msg.status === 'unread'
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{msg.name}</span>
                    <Badge
                      variant={
                        msg.status === 'unread'
                          ? 'danger'
                          : msg.status === 'replied'
                          ? 'success'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {msg.status}
                    </Badge>
                  </div>
                  <a
                    href={`mailto:${msg.email}`}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-mono"
                  >
                    {msg.email}
                  </a>
                </div>

                <span className="text-slate-400 text-[11px] font-mono">
                  {formatDate(msg.created_at)}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Subject: {msg.subject}</h4>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <a
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  onClick={() => handleUpdateStatus(msg.id, 'replied')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>

                <div className="flex items-center gap-2">
                  {msg.status === 'unread' ? (
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'read')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Mark as Read
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'unread')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Mark as Unread
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
