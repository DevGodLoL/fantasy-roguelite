import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolve } from "path";

// Prisma 7 Hardening for Windows:
// Studio's Query Engine often hangs on "Generating..." if paths are not absolute.
// We resolve EVERYTHING absolutely using Windows-safe path formats.
const root = process.cwd();
const rawUrl = process.env["DATABASE_URL"] || "file:./dev.db";

let url = rawUrl;
if (rawUrl.startsWith("file:")) {
  const relativePath = rawUrl.slice(rawUrl.indexOf(":") + 1);
  // Ensure the absolute path is correctly formed for Windows (file:C:\...)
  // Avoid pathToFileURL as the Rust engines (v7) on Windows can fail with os error 161.
  url = `file:${resolve(root, relativePath)}`;
}

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
