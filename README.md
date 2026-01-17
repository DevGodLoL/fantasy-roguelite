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

## GitHub Setup

To push this project to GitHub, see the [GITHUB_SETUP.md](./GITHUB_SETUP.md) guide.

## Current Progress

- **Project Core**: Next.js 16 + Prisma v7 + Better-SQLite3.
- **Roguelite Engine**: Card pack system implemented (open packs, select powerups).
- **Scoring Engine**: Stat-based scoring with powerup multipliers (PLUS_10, PASS_YDS_X15, etc.).
- **UI**: Added a custom home page and league navigation.
- **Health Checks**: Standardized `npm run db:check` for database stability on Windows.

## Prisma on Windows

This project uses **Prisma v7** with a **Better-SQLite3** adapter. To ensure stability and avoid "Generating..." hangs in Prisma Studio on Windows:

1.  **Absolute Paths**: `prisma.config.ts` is configured to resolve the `DATABASE_URL` absolutely.
2.  **CLI Operations**: Always use the standardized npm scripts below.
3.  **Lock Prevention**: Scripts like `seed` and `verify` ensure clean database disconnects to prevent SQLite file locks.

### Standardized Commands

- `npm run db:check`: Full health check (generate -> migrate status -> seed -> verify).
- `npm run prisma:generate`: Regenerate Prisma Client.
- `npm run prisma:migrate`: Sync schema changes with the database.
- `npm run prisma:studio`: Launch Prisma Studio (headless).
- `npm run seed`: Reset and populate demo data.
- `npm run verify`: Run automated powerup scoring validation.

