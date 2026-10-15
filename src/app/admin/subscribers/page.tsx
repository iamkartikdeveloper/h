'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NewsletterSubscriber } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/reading-time';
import { Users, Download, Trash2, Mail, CheckCircle2 } from 'lucide-react';

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!subscribers.length) return;
    const header = 'email,status,created_at\n';
    const rows = subscribers
      .map((s) => `"${s.email}","${s.status}","${s.created_at}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Unsubscribe "${email}"?`)) return;

    try {
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
      if (error) throw error;
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Newsletter Subscribers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered developers subscribed to tutorials, updates, and open source releases.
          </p>
        </div>

        <Button
          size="md"
          variant="secondary"
          onClick={handleExportCSV}
          disabled={!subscribers.length}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV ({subscribers.length})
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Email Address</th>
              <th className="p-4">Status</th>
              <th className="p-4">Subscribed Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  Loading subscribers...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-mono font-medium text-white flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sub.email}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-emerald-400 font-medium capitalize bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">
                    {formatDate(sub.created_at)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(sub.id, sub.email)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove subscriber"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
