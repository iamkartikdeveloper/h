'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Project } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { slugify } from '@/lib/utils/slugify';
import {
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { GitHubIcon } from '@/components/ui/Icons';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setErrorMsg('Title and slug are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const techArray = technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            content: content.trim() || null,
            thumbnail_url: thumbnailUrl.trim() || null,
            technologies: techArray,
            github_url: githubUrl.trim() || null,
            demo_url: demoUrl.trim() || null,
            is_featured: isFeatured,
            status: 'published',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setContent('');
    setThumbnailUrl('');
    setTechnologies('');
    setGithubUrl('');
    setDemoUrl('');
    setIsFeatured(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portfolio Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage case studies, GitHub repositories, and live demo showcases.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Project
        </Button>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No projects added yet. Click "Add Project" to add your first work!
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <img
                  src={
                    proj.thumbnail_url ||
                    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600'
                  }
                  alt={proj.title}
                  className="w-full aspect-video rounded-xl object-cover bg-slate-950"
                />
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base line-clamp-1">{proj.title}</h3>
                  {proj.is_featured && <Badge variant="gradient" size="sm">Featured</Badge>}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1">
                  {proj.technologies?.map((tech, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Live Demo"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="GitHub"
                    >
                      <GitHubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(proj.id, proj.title)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create New Project</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <Input
                label="Project Title *"
                placeholder="e.g. PulseStream Analytics"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(slugify(e.target.value));
                }}
                required
              />

              <Input
                label="SEO Slug *"
                placeholder="e.g. pulsestream-analytics"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                required
              />

              <Textarea
                label="Short Description"
                placeholder="Summary for cards and preview..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Input
                label="Technologies (Comma separated)"
                placeholder="Android, Kotlin, Flutter, Firebase, Supabase"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Repository URL"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <Input
                  label="Live Demo URL"
                  placeholder="https://..."
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>

              <Input
                label="Thumbnail Image URL"
                placeholder="https://images.unsplash.com/..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />

              <Textarea
                label="Full Case Study / Architecture (Markdown)"
                placeholder="Detailed breakdown of how the project was built..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredProject"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600"
                />
                <label htmlFor="featuredProject" className="text-xs text-slate-300 font-medium">
                  Feature prominently on homepage
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
