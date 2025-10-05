# Blog Generation UI Feature

## Overview

Added an interactive UI feature that allows users to manually generate blog posts using AI directly from the blog listing page.

## Components Added

### 1. Generate Blog Button

**Location**: Top of `/blog` page, above the "Load More" buttons

**Design**:

- Pink/secondary background color (#ffb2de)
- 🤖 Robot emoji icon
- Text: "Generate Blog with AI"
- Stands out from other buttons with distinct color

### 2. Generate Blog Modal

**Triggered by**: Clicking the "Generate Blog with AI" button

**Features**:

- Dark themed modal matching portfolio design
- Password-protected input field for Sanity API token
- Clear labeling and instructions
- Cancel and Generate buttons
- Disable state during generation
- Error display within modal
- Cannot close during generation

**Fields**:

- Title: "Generate Blog with AI"
- Description: "Enter your Sanity API token to generate a new blog post using AI."
- Input: Password field with placeholder "Enter your token"
- Actions: Cancel (secondary) and Generate (primary purple button)

### 3. Toast Notifications

**Library**: react-hot-toast@2.6.0

**Notification Types**:

1. **Loading State**
   - Message: "Generating blog post with AI..."
   - Shows spinner icon
   - Persists until generation completes

2. **Success State**
   - Message: "Blog post generated successfully!"
   - Purple checkmark icon (matches brand color)
   - Auto-dismisses after 4 seconds
   - List automatically refreshes

3. **Error State**
   - Message: Specific error from API (e.g., "Unauthorized", "Failed to generate blog post")
   - Red X icon
   - Auto-dismisses after 4 seconds
   - Modal stays open for retry

**Toast Styling**:

- Background: #1a1a1a (backgroundSecondary)
- Text: #f2f2f2 (textPrimary)
- Border: rgba(145, 145, 145, 0.2)
- Position: top-center
- Duration: 4 seconds

## User Flow

### Happy Path

```
1. User clicks "Generate Blog with AI" button
   ↓
2. Modal opens with token input field
   ↓
3. User enters Sanity API token
   ↓
4. User clicks "Generate" button
   ↓
5. Modal disables inputs (shows "Generating...")
   ↓
6. Toast shows: "Generating blog post with AI..."
   ↓
7. API call to /api/blog/generate with Authorization header
   ↓
8. Success response received
   ↓
9. Toast updates: "Blog post generated successfully!" ✓
   ↓
10. Modal closes
    ↓
11. Blog list automatically refreshes
    ↓
12. New AI-generated post appears at the top with 🤖 badge
```

### Error Path

```
1. User clicks "Generate Blog with AI" button
   ↓
2. Modal opens with token input field
   ↓
3. User enters invalid/empty token OR network error occurs
   ↓
4. User clicks "Generate" button
   ↓
5. API call fails
   ↓
6. Toast shows error: "Unauthorized" or specific error message
   ↓
7. Modal stays open with error message displayed
   ↓
8. User can try again or click Cancel
```

## Technical Implementation

### API Integration

```typescript
// POST /api/blog/generate
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### Token Validation

- Token is sent as Bearer token in Authorization header
- Backend validates against `SANITY_API_TOKEN` environment variable
- Also accepts `x-vercel-cron-secret` for cron jobs

### State Management

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [posts, setPosts] = useState(initialPosts);
const [total, setTotal] = useState(initialTotal);
```

### List Refresh Logic

After successful generation:

1. Fetch fresh list from `/api/blog?limit=25&offset=0`
2. Update `posts` state with new data
3. Update `total` count
4. Reset `offset` to match new list length
5. New post appears at the top (latest-first sort)

## Accessibility Features

### Modal

- Focus trap within modal when open
- ESC key closes modal (when not generating)
- Click outside overlay closes modal (when not generating)
- Proper ARIA labels on inputs
- Disabled state prevents interaction during generation

### Button

- Semantic `<button>` element
- Clear label text
- Visual icon for recognition
- Keyboard accessible (Tab + Enter)

### Toast

- Screen reader announcements for toast messages
- Non-intrusive positioning (top-center)
- Auto-dismiss for non-critical messages
- Clear success/error states

## Error Handling

### Input Validation

- Empty token: "Please enter a Sanity API token"
- Displayed within modal below input field
- Red background with border

### API Errors

- 401 Unauthorized: "Unauthorized" (invalid token)
- 500 Server Error: "Failed to generate blog post"
- Network errors: "Failed to generate blog post"
- Specific error messages from API when available

### Edge Cases

- Modal cannot be closed during generation
- Button disabled during modal interaction
- Retry available after error
- Token input cleared on successful generation

## Styling Consistency

### Colors

- Button: `bg-secondary` (#ffb2de) - Pink accent color
- Modal background: `bg-backgroundSecondary` (#1a1a1a)
- Modal overlay: `bg-black bg-opacity-75`
- Primary button: `bg-primary` (#ad5aff) - Purple
- Error: Red tones matching existing error styling

### Typography

- Consistent with portfolio (Inter font)
- Modal title: `text-2xl font-bold`
- Descriptions: `text-textSecondary text-sm`
- Button text: `font-medium`

### Animations

- Toast slide-in from top
- Modal fade-in with overlay
- Button hover transitions
- Loading spinner in toast

## Code Quality

### TypeScript

- Fully typed components and props
- Type-safe state management
- Proper error typing

### ESLint

- All rules passing
- Proper eslint-disable comments where needed
- No unused variables

### React Best Practices

- Proper use of hooks (useState)
- Async error handling with try-catch
- Component composition (Modal + Client wrapper)
- Clean separation of concerns

## Files Modified/Created

### Created

1. `src/app/blog/GenerateBlogModal.tsx` - Modal component
2. Package: `react-hot-toast@2.6.0` - Toast library

### Modified

1. `src/app/blog/BlogListClient.tsx`
   - Added Toaster component
   - Added GenerateBlogModal component
   - Added "Generate Blog with AI" button
   - Added handleGenerateBlog function
   - Added state for modal visibility
   - Updated total state to be mutable

2. `package.json` - Added react-hot-toast dependency
3. `pnpm-lock.yaml` - Updated lock file

## Testing Checklist

- [x] Button renders on blog page
- [x] Button click opens modal
- [x] Modal has proper styling
- [x] Token input works
- [x] Empty token shows validation error
- [x] Cancel button closes modal
- [x] Generate button triggers API call
- [x] Loading toast appears during generation
- [x] Success toast appears on success
- [x] Error toast appears on failure
- [x] Modal closes on success
- [x] Modal stays open on error
- [x] Blog list refreshes after success
- [x] New post appears in list
- [x] All TypeScript types correct
- [x] ESLint passes
- [x] Prettier formatting passes
- [x] No console errors
- [x] Responsive design works
- [x] Keyboard navigation works
- [x] Accessibility features work

## Future Enhancements (Optional)

1. **Remember token** - Use localStorage to remember (encrypted) token for convenience
2. **Topic selection** - Allow user to specify topic/keywords for generation
3. **Preview mode** - Show preview of generated content before saving
4. **Edit before publish** - Allow editing of AI-generated content in modal
5. **Batch generation** - Generate multiple posts at once
6. **Scheduling** - Schedule when to publish generated post
7. **Draft mode** - Save as draft instead of publishing immediately
8. **Generation history** - Show history of generated posts
9. **Token validation** - Pre-validate token before attempting generation
10. **Progress tracking** - Show more detailed progress during generation
