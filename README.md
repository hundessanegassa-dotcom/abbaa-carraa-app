# Abbaa Carraa - Community Prize Platform

A community-driven prize and contribution platform built for fairness, transparency, and empowerment.

## 🚀 Quick Deploy

### 1. Set up Supabase
- Create account at https://supabase.com
- Create new project "abbaa-carraa"
- Run the SQL in `backend/supabase_schema.sql`

### 2. Deploy to Vercel
- Push this code to GitHub
- Import to Vercel (root directory)
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy!

The root `vercel.json` is configured to build from the `frontend` directory automatically.

## Local Development
```bash
cd frontend
npm install
# Copy .env.example to .env.local and add your Supabase credentials
cp .env.example .env.local
npm run dev
```

Visit http://localhost:3000

## Project Structure
- `frontend/` - Next.js frontend application
- `backend/` - Supabase schema and database setup
- `vercel.json` - Deployment configuration (points to frontend)
