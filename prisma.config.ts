import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolve } from "path";

// Prisma 7 Hardening for Windows:
// Studio's Query Engine often hangs on "Generating..." if paths are not absolute.
// We resolve EVERYTHING absolutely using Windows-safe path formats.
const root = process.cwd();

// --- DATABASE PATH UNIFICATION ---
// If no DATABASE_URL is provided, we default to prisma/dev.db
// This ensures consistency between CLI (migrate), Client (app), and Scripts (seed).
const defaultPath = resolve(root, "prisma/dev.db");
const rawUrl = process.env["DATABASE_URL"] || `file:${defaultPath}`;

let url = rawUrl;
if (rawUrl.startsWith("file:")) {
  const pathPart = rawUrl.slice(rawUrl.indexOf(":") + 1);
  // Ensure we resolve relatively to root if it's not already absolute
  const absolutePath = resolve(root, pathPart);
  url = `file:${absolutePath}`;
}

console.log(`[PrismaConfig] Using Database URL: ${url}`);

export default defineConfig({
  // Absolute paths help the Studio sub-process find the files correctly.
  schema: resolve(root, "prisma/schema.prisma"),
  migrations: {
    path: resolve(root, "prisma/migrations"),
  },
  datasource: {
    url,
  },
});
