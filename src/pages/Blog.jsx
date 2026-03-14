import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { data, Link, useSearchParams } from 'react-router-dom';
import {
  Search, Calendar, Clock, Tag, ChevronLeft, ChevronRight,
  BookOpen, ArrowRight, Loader,
} from 'lucide-react';
import { blogApi } from '../api/blogApi';

const CATEGORY_LABELS = {
  'pdf-tools': 'PDF Tools',
  'image-tools': 'Image Tools',
  'converters': 'Converters',
  'guides': 'Guides',
  'tips': 'Tips & Tricks',
  'updates': 'Updates',
};

const CATEGORY_COLORS = {
  'pdf-tools': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'image-tools': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'converters': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'guides': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'tips': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'updates': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const TOOL_GRADIENTS = {
  '/merge-pdf': 'from-blue-900 to-sky-500',
  '/split-pdf': 'from-fuchsia-400 to-blue-600 to-50%',
  '/delete-pages': 'from-pink-500 to-blue-800',
  '/extract-pages': 'from-teal-300 to-blue-800',
  '/rearrange': 'from-teal-300 to-sky-500 to-50%',
  '/protect-pdf': 'from-blue-800 to-teal-300',
  '/unlock-pdf': 'from-teal-300 to-blue-800',
  '/pdf-to-png': 'from-blue-700 to-teal-300',
  '/png-to-pdf': 'from-teal-300 to-blue-700',
  '/pdf-to-jpg': 'from-blue-700 to-teal-300',
  '/jpg-to-pdf': 'from-teal-300 to-blue-700',
  '/compress-image': 'from-sky-400 to-blue-950',
  '/crop-pdf': 'from-sky-500 to-fuchsia-300 from-50%',
  '/rotate-pdf': 'from-[#0e2063] to-[#8c3c8f] from-40%',
  '/image-to-pdf': 'from-teal-300 to-blue-700',
  '/convert-to-jpg': 'from-teal-300 to-blue-700',
  '/convert-to-png': 'from-teal-300 to-blue-600',
  '/convert-to-webp': 'from-sky-400 to-blue-700',
  '/crop-image': 'from-sky-500 to-fuchsia-300 from-50%',
  '/rotate-image': 'from-cyan-300 to-blue-700',
  '/resize-image': 'from-sky-500 to-blue-600',
  '/extract-pdf-text': 'from-teal-300 to-blue-600',
  '/extract-pdf-images': 'from-blue-700 to-teal-300',
  '/html-to-image': 'from-blue-600 to-sky-500 to-40%',
  '/html-to-pdf': 'from-cyan-950 to-sky-600 to-60%',
};

const getGradient = (tool) => TOOL_GRADIENTS[tool] || 'from-sky-600 via-blue-700 to-indigo-800';

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const currentCategory = searchParams.get('category') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, limit: 12 });
      if (currentCategory) params.append('category', currentCategory);
      if (currentTag) params.append('tag', currentTag);
      if (searchQuery) params.append('search', searchQuery);

      const res = await blogApi.getPublished(params);
      setPosts(res?.data?.data.posts || []);
      setPagination(res.data?.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentTag, currentPage, searchQuery]);

  const fetchMeta = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        blogApi.getCategories(),
        blogApi.getTags(),
      ]);
      setCategories(catRes.data?.data || []);
      setTags(tagRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch meta:', err);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val) newParams.set(key, val);
      else newParams.delete(key);
    });
    if (updates.category !== undefined || updates.tag !== undefined || updates.search !== undefined) {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchQuery });
  };

  const featuredPost = posts.length > 0 && currentPage === 1 && !currentCategory && !currentTag && !searchQuery ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 to-white">
      <div className="w-full pb-8">
        <div className="w-full mx-auto bg-[#091d33] px-6 md:px-10 py-8">
          {/* Advertisement */}
          <div className="mb-8 h-22.5 w-full ad"></div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-relaxed text-white">
              Allypdf Blog
            </h1>
            <p className="text-white font-light text-xl md:text-2xl max-w-3xl mx-auto">
              Guides, tips, and tutorials for getting the most out of your PDF and image tools.
            </p>
          </motion.div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-24 py-3.5 rounded-xl bg-sky-900/70 border border-sky-700 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition text-base"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-sky-400 hover:bg-sky-300 text-white rounded-lg text-sm font-medium transition cursor-pointer">
                Search
              </button>
            </form>
          </div>

          {/* Advertisement */}
          <div className="mt-8 h-22.5 w-full ad"></div>
        </div>
        <div className="w-full mx-auto px-6 md:px-10 pt-16">

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => updateParams({ category: '' })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer border ${!currentCategory ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-gray-900 border-sky-100 hover:border-sky-200 z-20'
                }`}>All Posts</button>
            {categories.map((cat) => (
              <button key={cat.id}
                onClick={() => updateParams({ category: cat.id === currentCategory ? '' : cat.id })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer border ${currentCategory === cat.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-gray-900 border-sky-100 hover:border-sky-200 z-20'
                  }`}>
                {CATEGORY_LABELS[cat.id] || cat.id}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="min-h-screen flex items-center justify-center">
              <Loader strokeWidth={2} className="relative w-8 h-8 sm:w-12 sm:h-12 text-blue-500 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No articles found</p>
              <p className="text-gray-500 text-sm mt-2">Try a different search or category</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col-reverse lg:flex-row items-start gap-10 text-sm mb-1.55">
                {/* Featured Post */}
                {featuredPost && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex-2 z-20">
                    <Link to={`/blog/${featuredPost.slug}`} className="block group">
                      <div className="bg-white rounded-xl overflow-hidden shadow-xl transition-all">
                        <div className="grid">
                          {/* Image / Gradient */}
                          <div className={`aspect-video md:aspect-auto min-h-70 bg-linear-120 ${getGradient(featuredPost.related_tool)} flex items-center justify-center relative overflow-hidden`}>
                            {featuredPost.cover_image ? (
                              <img src={featuredPost.cover_image} alt={featuredPost.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-8">
                                <BookOpen className="w-16 h-16 text-gray-900 mx-auto mb-3" />
                                <span className="text-gray-900 text-sm uppercase tracking-widest">Featured</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[featuredPost.category] || ''}`}>
                                {CATEGORY_LABELS[featuredPost.category] || featuredPost.category}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="px-8 md:px-10 py-5 flex flex-col justify-center">
                            <div className="flex items-center gap-4 text-gray-600 text-xs mb-4">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                                {new Date(featuredPost.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featuredPost.reading_time} min read</span>
                              <span className="flex items-center gap-1">views {featuredPost.views}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl text-gray-900 mb-4 hover:text-gray-800 transition-colors leading-tight">{featuredPost.title}</h2>
                            <p className="text-gray-800 text-base leading-relaxed mb-6">{featuredPost.excerpt}</p>
                            <span className="flex items-center justify-end gap-1 text-sky-400 text-sm font-medium group-hover:gap-2 transition-all">
                              Read More <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Tags Cloud */}
                {tags.length > 0 && (
                  <div className="max-w-4xl mx-auto mb-10 flex-1 z-20">
                    <div className="bg-sky-800 rounded-xl overflow-hidden shadow-2xl">
                      <div className="bg-linear-120 from-sky-800 to-blue-950 px-6 py-4 border-b border-sky-700/50 flex items-center gap-3">
                        <div className="p-2 bg-sky-900/50 rounded-lg border border-white/70">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-white text-lg">Popular Tags</h3>
                      </div>
                      <div className="p-5 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <button key={t.id}
                            onClick={() => updateParams({ tag: t.id === currentTag ? '' : t.id })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${currentTag === t.id ? 'bg-sky-400 text-white border-sky-400' : 'bg-sky-900/50 text-gray-100 border-sky-700 hover:border-sky-500/50'
                              }`}>
                            #{t.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Post Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 w-full">
                {gridPosts.map((post, idx) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Link to={`/blog/${post.slug}`} className="block group h-full">
                      <div className="bg-white rounded-xl overflow-hidden transition-all shadow-md h-full flex flex-col">
                        {/* Card Image / Gradient */}
                        <div className={`aspect-video bg-linear-120 ${getGradient(post.related_tool)} relative overflow-hidden`}>
                          {post.cover_image ? (
                            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-10 h-10 text-gray-900" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${CATEGORY_COLORS[post.category] || ''}`}>
                              {CATEGORY_LABELS[post.category] || post.category}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-center gap-3 text-gray-600 text-xs mb-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time} min</span>
                          </div>
                          <h3 className="text-gray-900 text-lg mb-2 hover:text-gray-800 font-medium transition-colors leading-snug line-clamp-2">{post.title}</h3>
                          <p className="text-gray-800 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{post.excerpt}</p>

                          {post.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-0.5 bg-sky-100 border border-sky-200 rounded text-[10px] text-gray-900">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="flex items-center justify-end pt-3 border-t border-sky-500 gap-1 text-sky-400 text-xs font-medium group-hover:gap-1.5 transition-all">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages === 1 && (
                <div className="flex items-center justify-center gap-3 py-11">
                  <button onClick={() => updateParams({ page: String(currentPage - 1) })} disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-sky-500 rounded-lg text-sky-500 text-md font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-sky-600 transition cursor-pointer">
                    <ChevronLeft className="w-4 h-4" strokeWidth={2} /> Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button key={pageNum} onClick={() => updateParams({ page: String(pageNum) })}
                          className={`px-5 py-2.5 rounded-lg text-md font-medium transition cursor-pointer ${currentPage === pageNum ? 'bg-sky-500 text-white' : 'bg-sky-100 border border-sky-200 text-gray-700 hover:border-sky-500/50 hover:bg-sky-500 hover:text-white'
                            }`}>{pageNum}</button>
                      );
                    })}
                  </div>
                  <button onClick={() => updateParams({ page: String(currentPage + 1) })} disabled={currentPage >= pagination.totalPages}
                    className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-sky-500 rounded-lg text-sky-500 text-md font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-sky-600 transition cursor-pointer">
                    Next <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Blog;