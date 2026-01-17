# GitHub Repository Setup Guide

To commit this project to GitHub, follow these steps in your terminal:

## 1. Initialize Git
If you haven't already, initialize the repository and add yours files:
```bash
git init
git add .
git commit -m "Initial commit: Fantasy Roguelite MVP"
```

## 2. Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Name your repository `fantasy-roguelite`
3. Click "Create repository"

## 3. Link and Push to GitHub
Copy the commands provided by GitHub, which will look similar to this:
```bash
git remote add origin https://github.com/YOUR_USERNAME/fantasy-roguelite.git
git branch -M main
git push -u origin main
```

## 4. (Optional) Deploy to Vercel
Once pushed to GitHub, you can easily deploy to Vercel:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `fantasy-roguelite` repository
3. Ensure your environment variables (like `DATABASE_URL`) are configured if you use an external database (though this project currently uses a local SQLite `dev.db`, which is ignored by `.gitignore`).

---

### Key Files for Git
- `.gitignore`: Configured to ignore `node_modules`, `.next`, and the local SQLite database (`dev.db`).
- `package.json`: Contains all dependencies and scripts.
- `prisma/`: Contains your schema and seed data.
- `src/`: Contains your application logic and UI.
