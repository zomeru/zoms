# Blog Feature - Visual Summary

## 🎨 User Interface Components

### 1. Home Page - Blog Section

**Location**: Bottom of main portfolio page (before Footer)

**Features**:

- Shows latest 3 blog posts
- Each post displays:
  - Publication date
  - 🤖 icon for AI-generated posts
  - Title (clickable link)
  - Summary/description
- "Go to blog page →" link at the bottom
- Matches portfolio design with hover effects
- Responsive grid layout

**Navigation**: Added "Blog" item to the main navigation menu

---

### 2. Blog Listing Page (`/blog`)

**URL**: https://your-domain.com/blog

**Features**:

- "← Back to home" link at top
- Header with title and description
- **Load More** button at top (when more posts exist)
- Grid of blog post cards showing:
  - Publication date
  - AI-generated badge (🤖)
  - Post title (opens in new tab)
  - Summary
  - Tags as colored badges
- **Load More** button at bottom (when more posts exist)
- Shows "X of Y posts" counter
- Default: 25 posts per page
- Responsive card layout with hover effects

---

### 3. Blog Post Detail Page (`/blog/[slug]`)

**URL**: https://your-domain.com/blog/[post-slug]

**Features**:

- "← Back to blog" link at top
- Article header with:
  - Large title
  - Publication date and update date
  - AI-generated badge (if applicable)
  - Tags as colored badges
  - Summary/description
- Full blog content with rich formatting:
  - **Headings**: H1, H2, H3, H4 with proper hierarchy
  - **Paragraphs**: Well-spaced, readable text
  - **Lists**: Bullet and numbered lists
  - **Links**: Styled links that open in new tabs
  - **Inline code**: Highlighted `code snippets`
  - **Code blocks**: Full syntax highlighting with:
    - Optional filename display
    - Line numbers
    - Dark theme (matches portfolio)
    - Support for 14+ languages
  - **Blockquotes**: Styled with left border
- Footer with "← Back to all posts" link
- Full SEO metadata (see below)

---

## 🔍 SEO Implementation

### Meta Tags (All Blog Pages)

Each blog post includes:

```html
<!-- Basic Meta -->
<title>Post Title | Zomer Gregorio</title>
<meta name="description" content="Post summary (max 160 chars)" />
<meta name="keywords" content="tag1, tag2, tag3" />

<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:title" content="Post Title" />
<meta property="og:description" content="Post summary" />
<meta property="og:url" content="https://your-domain.com/blog/slug" />
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2024-01-01T00:00:00Z" />
<meta property="article:modified_time" content="2024-01-02T00:00:00Z" />
<meta property="article:author" content="Zomer Gregorio" />
<meta property="article:tag" content="tag1" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Post Title" />
<meta name="twitter:description" content="Post summary" />

<!-- Canonical URL -->
<link rel="canonical" href="https://your-domain.com/blog/slug" />
```

---

## 🤖 AI Content Generation

### Automated Blog Creation Flow

1. **Trigger**: Vercel Cron Job (Every Monday at 10 AM UTC)
2. **Process**:
   - Fetch trending topics (Next.js, TypeScript, web dev)
   - Select random topic
   - Call Gemini AI with structured prompt
   - Generate:
     - Title (SEO-friendly, max 100 chars)
     - Summary (max 160 chars)
     - Full markdown content (800-1200 words)
     - 3-5 relevant tags
   - Convert markdown to Sanity block content
   - Create slug from title
   - Save to Sanity with metadata:
     - `source: "automated/gemini"`
     - `generated: true`
     - `publishedAt: current timestamp`

3. **Content Quality**:
   - Professional, engaging tone
   - Code examples included
   - Practical insights
   - Best practices
   - Structured with headings
   - Targets intermediate-advanced developers

### Manual Trigger

```bash
curl -X POST https://your-domain.com/api/blog/generate \
  -H "Authorization: Bearer YOUR_SECRET"
```

---

## 📱 Responsive Design

### Mobile (< 640px)

- Stacked layout
- Full-width cards
- Simplified date display
- Touch-friendly buttons
- Readable font sizes

### Tablet (640px - 1024px)

- Two-column grid where appropriate
- Balanced spacing
- Optimized for touch and mouse

### Desktop (> 1024px)

- Full two-column layout (matches portfolio)
- Hover effects enabled
- Optimal reading width (800px max for posts)
- Enhanced interactions

---

## ♿ Accessibility Features

### Semantic HTML

```html
<main>
  - Main content wrapper
  <article>
    - Individual blog posts
    <header>
      - Post headers
      <time datetime="...">
        - Dates
        <nav>- Navigation elements</nav></time
      >
    </header>
  </article>
</main>
```

### Keyboard Navigation

- All links and buttons are keyboard accessible
- Tab order follows logical flow
- Focus states visible
- Enter/Space triggers actions

### ARIA Labels

- Links have descriptive text
- Buttons have clear purposes
- "Opens in new tab" context provided
- Time elements properly formatted

### Color Contrast

- All text meets WCAG AA standards
- Primary color: #ad5aff (purple)
- Text on dark background
- Sufficient contrast ratios

---

## 🎨 Design System Adherence

### Colors (from portfolio)

- **Background**: #0e0e0e (primary), #1a1a1a (secondary)
- **Primary**: #ad5aff (purple accent)
- **Secondary**: #ffb2de (pink accent)
- **Text**: #f2f2f2 (primary), #919191 (secondary)

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, hierarchical sizing
- **Body**: Readable, well-spaced
- **Code**: Monospace with syntax highlighting

### Interactions

- Smooth hover transitions
- Card hover effects (subtle purple glow)
- Link underline animations
- Button states (hover, active, disabled)
- Loading states for async operations

### Spacing

- Consistent padding/margin
- Section spacing matches portfolio
- Responsive adjustments
- Visual rhythm maintained

---

## 📊 API Endpoints Summary

### GET `/api/blog`

**Purpose**: List blog posts with pagination  
**Query Params**:

- `limit` (default: 25, max: 100)
- `offset` (default: 0)

**Response**:

```json
{
  "posts": [...],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 50,
    "hasMore": true
  }
}
```

### GET `/api/blog/[slug]`

**Purpose**: Get single blog post  
**Response**:

```json
{
  "post": {
    "_id": "...",
    "title": "...",
    "slug": { "current": "..." },
    "summary": "...",
    "publishedAt": "...",
    "modifiedAt": "...",
    "body": [...],
    "tags": [...],
    "source": "...",
    "generated": true
  }
}
```

### POST `/api/blog/generate`

**Purpose**: Generate new blog post (protected)  
**Auth**: Bearer token or Vercel Cron secret  
**Response**:

```json
{
  "success": true,
  "post": {
    "_id": "...",
    "title": "...",
    "slug": { "current": "..." },
    "summary": "..."
  }
}
```

---

## 🚀 Deployment Checklist

Before deploying to production:

1. **Sanity Setup**
   - [ ] Create Sanity project
   - [ ] Deploy schemas to Sanity Studio
   - [ ] Get project ID and dataset name
   - [ ] Create write token for API access

2. **Gemini AI Setup**
   - [ ] Get API key from Google AI Studio
   - [ ] Test API key works

3. **Vercel Environment Variables**
   - [ ] Set `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - [ ] Set `NEXT_PUBLIC_SANITY_DATASET`
   - [ ] Set `SANITY_API_TOKEN`
   - [ ] Set `GEMINI_API_KEY`

4. **Verify Deployment**
   - [ ] Blog section shows on home page
   - [ ] `/blog` page loads correctly
   - [ ] Blog posts can be viewed
   - [ ] SEO tags are present
   - [ ] Syntax highlighting works
   - [ ] Mobile responsive works
   - [ ] Cron job is scheduled

5. **Test Blog Generation**
   - [ ] Manually trigger generation endpoint
   - [ ] Check Sanity for new post
   - [ ] Verify post appears on site
   - [ ] Wait for scheduled cron (Monday 10 AM UTC)

---

## 📈 Performance Considerations

### ISR (Incremental Static Regeneration)

- Blog posts revalidate every 60 seconds
- First request serves cached data
- Background revalidation on cache hit
- Optimal balance of freshness and speed

### Client-Side Optimizations

- Lazy loading of blog content
- Pagination reduces initial load
- Code splitting for syntax highlighter
- Efficient React components

### Build Optimizations

- Static generation where possible
- Dynamic imports for heavy libraries
- Font optimization (next/font)
- Image optimization ready (if images added)

---

This implementation provides a production-ready blog system that seamlessly integrates with the existing portfolio while maintaining design consistency and providing powerful features like AI-generated content and comprehensive SEO support.
