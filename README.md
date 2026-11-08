This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin editor

A hidden, password-protected editor lives at `/admin` (not linked anywhere and `noindex`). It edits books, the about-me text and photos, experience, and blog posts. There's no database: content stays in the repo as JSON/MDX/images.

| Content | File |
| --- | --- |
| Books | `src/lib/data/books.json` |
| About summary, paragraphs, photos | `src/lib/data/about.json` |
| Experience | `src/lib/data/work.json` |
| Blog posts | `content/blog/*.mdx` |
| Uploaded images | `public/uploads/<section>/` |

Environment variables:

```bash
ADMIN_PASSWORD=...            # required; /admin returns 404 without it. Use a long random value.
AUTH_SECRET=...               # already required for Auth.js; also signs the admin session cookie

# Production (Vercel): saves are committed to GitHub, which triggers a redeploy.
ADMIN_GITHUB_TOKEN=...        # fine-grained PAT, this repo only, "Contents: Read and write"
ADMIN_GITHUB_REPO=owner/repo
ADMIN_GITHUB_BRANCH=master    # optional, defaults to master
```

- **Local dev without a GitHub token**: saves write straight to the working tree. Commit and push them yourself.
- **Production without a GitHub token**: editing is disabled, because Vercel's filesystem doesn't persist writes.
- Changing `ADMIN_PASSWORD` or `AUTH_SECRET` signs out every session. Sessions last 12 hours.
