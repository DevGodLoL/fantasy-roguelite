import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * SETUP SCRIPT: The "Ideal" way to onboard.
 * Handles .env creation, DB migration, and Seeding in one go.
 */
function run() {
    console.log("🚀 Starting Fantasy Roguelite Setup...");

    const root = process.cwd();
    const envPath = path.join(root, ".env");
    const envExamplePath = path.join(root, ".env.example");

    // 1. Handle .env
    if (!fs.existsSync(envPath)) {
        console.log("📂 Creating .env from template...");
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            console.log("✅ .env created.");
        } else {
            console.log("⚠️ .env.example not found! Creating default .env...");
            fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
        }
    } else {
        console.log("ℹ️ .env already exists, skipping copy.");
    }

    // 2. Install Dependencies (optional check, better for user to do npm install themselves)
    // We assume they already ran npm install if they are running this via tsx.

    // 3. Database Initialization
    console.log("🏗️ Initializing Database...");
    try {
        console.log("  > Generating Prisma Client...");
        execSync("npx prisma generate", { stdio: "inherit" });

        console.log("  > Running Migrations...");
        execSync("npx prisma migrate dev --name init", { stdio: "inherit" });

        console.log("  > Seeding Database (Personalities & World)...");
        execSync("npm run seed", { stdio: "inherit" });

        console.log("  > Expanding Player Pool...");
        execSync("npx tsx scripts/seed-expanded-players.ts", { stdio: "inherit" });

        console.log("\n✨ SETUP COMPLETE! ✨");
        console.log("Run 'npm run dev' to start the battle.");
    } catch (error) {
        console.error("\n❌ Setup failed during database initialization.");
        console.error("Make sure your DATABASE_URL in .env is correct.");
        process.exit(1);
    }
}

run();
