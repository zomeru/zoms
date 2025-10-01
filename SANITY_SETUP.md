# Sanity CMS Integration

This portfolio uses [Sanity CMS](https://www.sanity.io/) to manage the Experience section dynamically. This allows you to update your work experience without modifying the source code.

## 🚀 Getting Started

### 1. Create a Sanity Project

1. Go to [sanity.io](https://www.sanity.io/) and sign up/login
2. Create a new project in the Sanity dashboard
3. Note down your **Project ID** and **Dataset name** (usually `production`)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your Sanity credentials:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
```

You can find these values in your Sanity project dashboard at https://www.sanity.io/manage

### 3. (Optional) Seed Initial Data

If you want to populate Sanity with your existing experience data:

1. Get a write token from your Sanity project:
   - Go to https://www.sanity.io/manage
   - Select your project
   - Navigate to API → Tokens
   - Create a new token with "Editor" role
2. Add the token to your `.env.local`:

   ```env
   SANITY_API_TOKEN=your_write_token_here
   ```

3. Run the seed script:
   ```bash
   pnpm sanity:seed
   ```

This will import all experience entries from `src/constants/experience.ts` into Sanity.

### 4. Run Sanity Studio

Start the Sanity Studio locally to manage your content:

```bash
pnpm studio:dev
```

This will start the Sanity Studio at http://localhost:3333

### 5. Add Your Experience Data

1. Open http://localhost:3333 in your browser
2. Sign in with your Sanity account
3. Click on "Experience" in the sidebar
4. Click "Create new document"
5. Fill in the experience details:
   - **Job Title**: Your position (e.g., "Software Engineer")
   - **Company Name**: The company you worked for
   - **Location**: Work location (e.g., "Remote" or "City, Country")
   - **Duration**: Date range (e.g., "Jan. 2024 - Present")
   - **Responsibilities**: Array of your duties and achievements
   - **Order**: Number to control the display order (lower numbers appear first)
6. Click "Publish"

## 📝 Managing Content

### Adding New Experience

1. Run `pnpm studio:dev`
2. Navigate to http://localhost:3333
3. Click "Experience" → "Create new document"
4. Fill in all required fields
5. Set the "Order" field to control where it appears (e.g., 0 for most recent, 1 for next, etc.)
6. Click "Publish"

### Editing Existing Experience

1. Run `pnpm studio:dev`
2. Navigate to http://localhost:3333
3. Click on the experience entry you want to edit
4. Make your changes
5. Click "Publish"

### Deleting Experience

1. Run `pnpm studio:dev`
2. Navigate to http://localhost:3333
3. Click on the experience entry you want to delete
4. Click the three dots menu (⋮) → "Delete"
5. Confirm deletion

### Reordering Experience

To change the order in which experience entries appear:

1. Edit each experience entry
2. Update the "Order" field (lower numbers appear first)
3. Click "Publish"

## 🌐 Deploying Sanity Studio

You can deploy your Sanity Studio to make it accessible from anywhere:

```bash
pnpm studio:deploy
```

This will deploy your studio to `https://your-project-name.sanity.studio`

## 🔄 Data Fetching & Caching

- The portfolio fetches data from Sanity at **build time** and uses **Incremental Static Regeneration (ISR)**
- Data is revalidated every **60 seconds**, so changes in Sanity will appear on your site within a minute
- If Sanity is unavailable, the site will fall back to hardcoded data from `src/constants/experience.ts`

## 🛡️ Fallback Mechanism

The integration includes a robust fallback system:

- If Sanity is unreachable, the site uses the hardcoded experience data
- If no experience entries exist in Sanity, it falls back to the hardcoded data
- This ensures your site always displays content, even if there are CMS issues

## 📊 Schema Definition

The Experience schema includes:

- `title` (string, required): Job title
- `company` (string, required): Company name
- `location` (string, required): Work location
- `range` (string, required): Duration/date range
- `duties` (array of text): List of responsibilities
- `order` (number, required): Display order

## 🔧 Troubleshooting

### Studio won't start

- Make sure you have the correct `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local`
- Verify your Sanity account has access to the project

### Changes not appearing on the website

- Wait 60 seconds for the revalidation period
- If in development, restart the dev server: `pnpm dev`
- For production, rebuild and redeploy: `pnpm build`

### "Dataset not found" error

- Check that your dataset name in `.env.local` matches the one in your Sanity project
- Common dataset names are `production`, `development`, or `staging`

## 📚 Additional Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Next.js + Sanity Guide](https://www.sanity.io/plugins/next-sanity)
- [Sanity Schema Types](https://www.sanity.io/docs/schema-types)
