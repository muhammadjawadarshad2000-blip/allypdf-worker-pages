import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Edit3, Trash2, Eye, Search, Filter, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, X, Save,
  Send, BarChart3, BookOpen,
} from 'lucide-react';
import { blogApi } from '../api/blogApi';

const STATUS_BADGES = {
  draft: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  published: 'bg-green-900/50 text-green-300 border-green-700',
  archived: 'bg-gray-800/50 text-gray-400 border-gray-600',
};

const CATEGORY_OPTIONS = [
  { value: 'pdf-tools', label: 'PDF Tools' },
  { value: 'image-tools', label: 'Image Tools' },
  { value: 'converters', label: 'Converters' },
  { value: 'guides', label: 'Guides' },
  { value: 'tips', label: 'Tips & Tricks' },
  { value: 'updates', label: 'Updates' },
];

const EMPTY_POST = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '',
  category: 'pdf-tools', tags: '', status: 'draft',
  metaTitle: '', metaDescription: '', relatedTool: '',
};

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(EMPTY_POST);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await blogApi.getAllAdmin(params);
      console.log(res.data.data)
      setPosts(res.data?.data || []);
      setPagination({ 
        currentPage: page, 
        totalPages: Math.ceil(posts.length / 20) || 1, 
        totalItems: posts.length 
      });
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await blogApi.getStats();
      setStats(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch blog stats:', err);
    }
  }, []);

  useEffect(() => { fetchPosts(); fetchStats(); }, [fetchPosts, fetchStats]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingPost(null);
    setFormData(EMPTY_POST);
    setShowEditor(true);
  };

  const openEditForm = async (id) => {
    try {
      const res = await blogApi.getByIdAdmin(id);
      const post = res.data?.data;
      console.log("post", post)
      if (post) {
        setEditingPost(post);
        setFormData({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          coverImage: post.cover_image || '',
          category: post.category || 'pdf-tools',
          tags: (post.tags || []).join(', '),
          status: post.status || 'draft',
          metaTitle: post.meta_title || '',
          metaDescription: post.meta_description || '',
          relatedTool: post.related_tool || '',
        });
        setShowEditor(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch post');
    }
  };

  const handleSave = async (publishImmediately = false) => {
    if (!formData.title || !formData.excerpt || !formData.content || !formData.category || !formData.category || !formData.metaTitle || !formData.metaDescription || !formData.relatedTool) {
      setError('Title, excerpt, content, and category are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const generatedSlug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const payload = {
        ...formData,
        slug: generatedSlug,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: publishImmediately ? 'published' : formData.status,
      };

      if (editingPost) {
        await blogApi.update(editingPost.id, payload);
        setSuccess('Post updated successfully!');
      } else {
        await blogApi.create(payload);
        setSuccess('Post created successfully!');
      }

      // ... (rest of cleanup)
    } catch (err) {
      // res.data?.errors contains the specific Zod validation errors
      const detailMsg = err.details?.[0]?.message || err.message;
      setError(`Save failed: ${detailMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await blogApi.delete(id);
      setSuccess('Post deleted!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPosts(pagination.currentPage);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchPosts(1); };

  return (
    <div className="relative min-h-screen">
      <div className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3">Blog Management</h1>
            <p className="text-white font-light text-xl md:text-2xl">Create, edit, and manage blog posts</p>
          </motion.div>

          {/* Alerts */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto mb-4 flex items-center gap-2 bg-green-900/50 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm"
              >
                <CheckCircle className="w-5 h-5 shrink-0" />{success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto mb-4 flex items-center gap-2 bg-red-900/50 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />{error}
                <button onClick={() => setError('')} className="ml-auto cursor-pointer"><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 max-w-5xl mx-auto">
            {[
              { key: 'posts', label: 'Posts', icon: FileText },
              { key: 'stats', label: 'Stats', icon: BarChart3 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === tab.key ? 'bg-teal-500 text-white' : 'bg-sky-800/50 border border-sky-700 text-gray-300 hover:border-teal-400/60'
                    }`}
                >
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Posts', value: stats.total || 0, color: 'text-white' },
                  { label: 'Published', value: stats.byStatus?.published || 0, color: 'text-green-400' },
                  { label: 'Drafts', value: stats.byStatus?.draft || 0, color: 'text-yellow-400' },
                  { label: 'Total Views', value: stats.totalViews || 0, color: 'text-teal-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-sky-800/50 border border-sky-700 rounded-xl p-5 text-center">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {stats.byCategory?.length > 0 && (
                <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-white" /><h3 className="text-white text-lg">Posts by Category</h3></div>
                  </div>
                  <div className="p-6 space-y-3">
                    {stats.byCategory.map(cat => {
                      const max = Math.max(...stats.byCategory.map(c => c.count), 1);
                      const pct = Math.max((cat.count / max) * 100, 5);
                      return (
                        <div key={cat.id} className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm w-24 shrink-0 capitalize">{cat.id.replace('-', ' ')}</span>
                          <div className="flex-1 bg-sky-900 rounded-full h-3">
                            <div className="bg-teal-400 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-200 text-sm w-8 text-right">{cat.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && !showEditor && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
              {/* Toolbar */}
              <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Filter className="w-5 h-5 text-white" /><h3 className="text-white text-lg">Blog Posts</h3>
                      <span className="text-gray-300 text-sm">({pagination.totalItems})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => fetchPosts(1)} className="flex items-center gap-1 text-teal-300 hover:text-teal-200 text-sm cursor-pointer">
                        <RefreshCw className="w-4 h-4" /> Refresh
                      </button>
                      <button onClick={openCreateForm}
                        className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> New Post
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex flex-col sm:flex-row gap-3">
                  <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition text-sm" />
                  </form>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto" /></div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-sky-800/50 border border-sky-700 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No posts found</p>
                  </div>
                ) : posts.map((post) => (
                  <div key={post.id} className="bg-sky-800/50 border border-sky-700 rounded-xl p-4 flex items-start gap-4 hover:border-sky-600 transition">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-sky-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-sky-500/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white text-sm font-medium truncate">{post.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${STATUS_BADGES[post.status]}`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs truncate mb-1">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                        <span className="capitalize">{post.category?.replace('-', ' ')}</span>
                        <span>{post.author?.name || 'Unknown'}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.views}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {post.status === 'published' && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-teal-300 transition cursor-pointer" title="View">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => openEditForm(post.id)}
                        className="p-2 text-gray-400 hover:text-teal-300 transition cursor-pointer" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition cursor-pointer" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => fetchPosts(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 bg-sky-800 border border-sky-700 rounded-lg text-gray-300 text-sm disabled:opacity-40 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-gray-300 text-sm">{pagination.currentPage} / {pagination.totalPages}</span>
                  <button onClick={() => fetchPosts(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-2 bg-sky-800 border border-sky-700 rounded-lg text-gray-300 text-sm disabled:opacity-40 cursor-pointer">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Editor */}
          {activeTab === 'posts' && showEditor && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
              <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Edit3 className="w-5 h-5 text-white" />
                      <h3 className="text-white text-lg">{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
                    </div>
                    <button onClick={() => { setShowEditor(false); setEditingPost(null); setFormData(EMPTY_POST); }}
                      className="text-gray-300 hover:text-white transition cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-gray-200 text-sm mb-1.5">Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter post title..."
                      className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition" />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-gray-200 text-sm mb-1.5">Excerpt *</label>
                    <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} placeholder="Brief summary..."
                      className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition resize-none" />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-gray-200 text-sm mb-1.5">Content (HTML) *</label>
                    <textarea name="content" value={formData.content} onChange={handleChange} rows={15} placeholder="<h2>Your content here...</h2><p>Write your blog post using HTML tags...</p>"
                      className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition resize-y font-mono text-sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Category */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Category *</label>
                      <select name="category" value={formData.category} onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Status</label>
                      <select name="status" value={formData.status} onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Tags (comma-separated)</label>
                      <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="pdf, merge, tools"
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition" />
                    </div>

                    {/* Cover Image URL */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Cover Image URL</label>
                      <input type="text" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition" />
                    </div>

                    {/* Related Tool Path */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Related Tool Path</label>
                      <input type="text" name="relatedTool" value={formData.relatedTool} onChange={handleChange} placeholder="/merge-pdf"
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition" />
                    </div>

                    {/* Meta Title */}
                    <div>
                      <label className="block text-gray-200 text-sm mb-1.5">Meta Title</label>
                      <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} placeholder="SEO title (max 70 chars)"
                        className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition" />
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-gray-200 text-sm mb-1.5">Meta Description</label>
                    <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} placeholder="SEO description (max 160 chars)"
                      className="w-full px-4 py-2.5 rounded-lg bg-sky-900 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition resize-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-sky-700">
                    <button onClick={() => handleSave(false)} disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${saving ? 'bg-sky-700 text-gray-400 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-500 cursor-pointer'
                        }`}
                    >
                      <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => handleSave(true)} disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${saving ? 'bg-teal-700 text-gray-300 cursor-not-allowed' : 'bg-teal-500 text-white hover:bg-teal-400 cursor-pointer'
                        }`}
                    >
                      <Send className="w-4 h-4" /> {saving ? 'Publishing...' : 'Save & Publish'}
                    </button>
                    <button onClick={() => { setShowEditor(false); setEditingPost(null); setFormData(EMPTY_POST); }}
                      className="px-5 py-2.5 rounded-lg text-sm text-gray-300 border border-sky-700 hover:border-gray-500 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;