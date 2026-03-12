import React, { useEffect } from 'react';

const SEOHead = React.memo(({
  title,
  description,
  keywords,
  canonical,
  robots = 'index, follow',
  ogImage = 'https://allypdf.com/og-image.png',
  ogType = 'website',
  articleData = null
}) => {
  useEffect(() => {
    // Update document title
    document.title = title || 'Allypdf - Free Online PDF & Image Tools';

    // Function to create or update meta tags
    const updateMetaTag = (name, content, property = null) => {
      let selector;
      
      if (property) {
        selector = `meta[property="${property}"]`;
      } else {
        selector = `meta[name="${name}"]`;
      }
      
      let metaTag = document.querySelector(selector);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };

    // Update meta tags
    updateMetaTag('description', description || 'Free online PDF tools to merge, split, convert, and edit PDF files');
    updateMetaTag('keywords', keywords || 'PDF tools, merge PDF, split PDF, convert PDF, image converter');
    updateMetaTag('robots', robots);

    // Open Graph tags
    updateMetaTag(null, ogType, 'og:type');
    updateMetaTag(null, title || 'Allypdf - Free Online PDF & Image Tools', 'og:title');
    updateMetaTag(null, description || 'Free online PDF tools to merge, split, convert, and edit PDF files', 'og:description');
    updateMetaTag(null, canonical || window.location.href, 'og:url');
    updateMetaTag(null, 'Allypdf', 'og:site_name');
    updateMetaTag(null, ogImage, 'og:image');

    // Canonical link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonical || window.location.href;

    // Structured data - remove existing and create new
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    let structuredData;

    if (articleData) {
      // Article Schema for Blog Posts
      structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "image": ogImage,
        "author": {
          "@type": "Organization",
          "name": "Allypdf"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Allypdf",
          "logo": {
            "@type": "ImageObject",
            "url": "https://allypdf.com/logo.png"
          }
        },
        "datePublished": articleData.publishedAt,
        "dateModified": articleData.updatedAt || articleData.publishedAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical || window.location.href
        }
      };
    } else {
      // WebApplication Schema for Tools/Home
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": title || "Allypdf - Free Online PDF & Image Tools",
        "description": description || "Free online PDF tools to merge, split, convert, and edit PDF files",
        "url": canonical || window.location.href,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };
    }
    
    const scriptStructured = document.createElement('script');
    scriptStructured.type = 'application/ld+json';
    scriptStructured.textContent = JSON.stringify(structuredData);
    document.head.appendChild(scriptStructured);

  }, [title, description, keywords, canonical, ogImage, robots, ogType]);

  return null;
});

SEOHead.displayName = 'SEOHead';

export default SEOHead;