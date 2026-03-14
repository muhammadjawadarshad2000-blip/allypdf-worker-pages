import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar, Clock, Eye, Tag, ArrowLeft, ArrowRight, BookOpen,
  Share2, ChevronRight, Loader,
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
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

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await blogApi.getPost(slug)
        setPost(res.data?.data || null);
        setRelatedPosts(res.data?.data?.relatedPosts || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Post not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  // Memoize SEO content based on the post data
  const seoData = useMemo(() => {
    if (!post) return null;
    return {
      title: post.meta_title || `${post.title} | Allypdf Blog`,
      description: post.meta_description || post.excerpt,
      keywords: post.tags?.length > 0 ? post.tags.join(', ') : 'PDF tools, image conversion, Allypdf tutorials',
      canonical: `https://allypdf.com/blog/${post.slug}`,
      ogImage: post.cover_image,
      ogType: 'article',
      articleData: {
        publishedAt: post.published_at,
        updatedAt: post.updated_at
      }
    };
  }, [post]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  const getGradient = (tool) => TOOL_GRADIENTS[tool] || 'from-sky-600 via-blue-700 to-indigo-800';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader strokeWidth={2} className="relative w-8 h-8 sm:w-12 sm:h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-linear-to-b from-sky-50 to-white py-16 px-4 flex items-center justify-center font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl">
          <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-linear-120 from-blue-300/60 to-orange-300/30 px-6 md:px-10 py-8 flex items-center gap-4">
              <div className="p-3 rounded-lg">
                <BookOpen className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">Post Not Found</h1>
                <p className="text-gray-800 text-sm mt-1">{error || "The article you're looking for doesn't exist."}</p>
              </div>
            </div>
            <div className="p-6 md:p-10 text-center">
              <Link to="/blog" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-800 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-white flex items-center justify-center">
      {/* Dynamic SEO Head */}
      {seoData && <SEOHead {...seoData} />}
      <div className="absolute -left-40 top-100 w-100 h-100 rounded-full bg-transparent border-78 border-sky-700 pointer-events-none" />
      <div className="w-full pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }} className="w-full mx-auto bg-[#091d33] px-6 md:px-10 py-8">
          {/* Advertisement Space */}
          <div className="mb-8 h-22.5 w-full ad"></div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-200 mb-6">
            <Link to="/" className="hover:text-sky-100 transition">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/blog" className="hover:text-sky-100 transition">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-100 truncate">{post.title}</span>
          </nav>

          <div className="overflow-hidden w-full max-w-10/12">
            {/* Header */}
            <div className="">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="flex-1 min-w-0 z-10">
                  {/* Category Badge */}
                  <div className="mb-3">
                    <Link
                      to={`/blog?category=${post.category}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition hover:opacity-80 ${CATEGORY_COLORS[post.category] || 'bg-sky-500/20 text-sky-300 border-sky-500/30'}`}
                    >
                      {CATEGORY_LABELS[post.category] || post.category}
                    </Link>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-relaxed text-white">
                    {post.title}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="mt-8 h-22.5 w-full ad"></div>
        </motion.div>

        <div className="px-2 md:px-10 pt-30">
          <div className="flex flex-col-reverse lg:flex-row items-end gap-10 text-gray-700 text-sm mb-1.55">

            <div className="flex flex-col flex-1 items-start bg-sky-100 rounded-lg p-4 sm:p-10 z-10">
              <p className="text-sm md:text-base mt-2 leading-relaxed">
                {post.excerpt}
              </p>
              {/* Meta Row */}
              <div className="flex flex-col items-start gap-4 text-sm">
                <span className="w-1 h-1 bg-gray-800 rounded-full" />
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-sky-400" />
                  {post.reading_time} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-sky-400" />
                  {post.views} views
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-start gap-1 hover:text-sky-400 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  Share
                </button>
              </div>
            </div>

            {/* Cover Image */}
            <div className="flex flex-2 overflow-hidden rounded-lg z-10">
              {post.cover_image ? (
                <div className={`bg-linear-120 ${getGradient(post.related_tool)} flex items-center justify-center relative overflow-hidden`}>
                  <img src={post.cover_image} alt={post.title} className="w-full h-auto object-contain" />
                </div>
              ) : post.related_tool ? (
                <div className={`h-48 flex items-center justify-center border-b border-sky-700/50`}>
                  <BookOpen className="w-16 h-16 text-white/20" />
                </div>
              ) : null}
            </div>

          </div>

          {/* Content */}
          <div className="px-4 py-15 text-gray-100 space-y-8">
            <div className='md:flex justify-center gap-7'>
              <div className='mx-auto hidden md:flex md:min-w-40 ad' />
              <div
                className="blog-content
                [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-black [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2
                [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-6
                [&_p]:text-base [&_p]:text-gray-800 [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:space-y-2 [&_ul]:text-base [&_ul]:pl-2 [&_ul]:mb-4
                [&_ol]:space-y-2 [&_ol]:text-base [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal
                [&_li]:flex [&_li]:flex-wrap [&_li]:items-start [&_ul]:gap-3 [&_ol]:gap-3 [&_li]:gap-x-3 [&_li]:text-gray-700
                [&_strong]:text-gray-900 [&_strong]:font-semibold
                [&_a]:text-sky-500 [&_a]:hover:text-sky-400 [&_a]:transition-colors [&_a]:font-medium
                [&_code]:bg-sky-900/90 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sky-200 [&_code]:text-sm [&_code]:border [&_code]:border-sky-300
                [&_pre]:bg-sky-900/90 [&_pre]:border [&_pre]:border-sky-300 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6
                [&_blockquote]:border-l-4 [&_blockquote]:border-sky-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:bg-sky-100 [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-lg
              "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              <div className='mx-auto hidden md:flex md:min-w-40 ad' />
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-26 border-t border-sky-700/50">
                <Tag className="w-5 h-5 text-sky-500" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${tag}`}
                    className="px-5 py-2 bg-sky-900/90 border border-sky-700 rounded-md text-sm text-sky-100 hover:text-sky-50 hover:border-sky-500/50 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Related Tool CTA — highlighted section like PrivacyPolicy */}
            {post.related_tool && (
              <section className="bg-sky-900/90 rounded-lg p-6 border border-sky-700">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-sky-400" />
                  Ready to Try It?
                </h2>
                <p className="mb-4 text-sm md:text-base text-gray-100 leading-relaxed">
                  Use this tool for free — right in your browser on <Link to="/" className="text-sky-500 hover:text-sky-400 font-medium transition-colors">Allypdf</Link>. No sign-up required, no files uploaded, complete privacy.
                </p>
                <Link
                  to={post.related_tool}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-300 text-white rounded-lg font-medium transition-all"
                >
                  Open Tool <ArrowRight className="w-4 h-4" />
                </Link>
              </section>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className='py-15'>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.map((rp) => {
                    const rpGradient = TOOL_GRADIENTS[rp.relatedTool] || 'from-sky-600 via-blue-700 to-indigo-800';
                    return (
                      <Link key={rp._id} to={`/blog/${rp.slug}`} className="block group">
                        <div className="bg-sky-50 rounded-lg overflow-hidden transition-all h-full">
                          <div className={`bg-linear-120 ${rpGradient} flex items-center justify-center relative overflow-hidden`}>
                            {rp.coverImage ? (
                              <img src={rp.coverImage} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <BookOpen className="w-8 h-8 text-gray-900" />
                            )}
                          </div>
                          <div className="px-4 py-8 flex flex-col gap-2.5">
                            <div className="flex items-center gap-2 text-gray-800 text-xs">
                              <Calendar className="w-3 h-3" />
                              {new Date(rp.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <span className="ml-auto flex items-center gap-1"><Clock className="w-3 h-3" /> {rp.readingTime} min</span>
                            </div>
                            <h4 className="text-gray-700 text-md font-medium group-hover:text-gray-600 transition-colors line-clamp-2">
                              {rp.title}
                            </h4>
                            <h5 className="text-gray-600 text-sm mt-1 line-clamp-2">{rp.excerpt}</h5>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Back to Blog Link */}
            <div className="text-center pt-6 border-t border-sky-700/50 mt-10">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sky-500 hover:text-sky-400 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Articles
              </Link>
            </div>
          </div>
        </div>

        {/* Advertisement Space */}
        <div className="mt-8 h-22.5 w-full ad"></div>
      </div>
    </div>
  );
};

export default BlogPost;