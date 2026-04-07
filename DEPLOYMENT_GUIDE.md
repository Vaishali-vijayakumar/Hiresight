# HireSight Deployment Guide 🚀

Follow these steps to deploy the backend to **Render** and the frontend to **Vercel**.

---

## 1. Supabase Database & Storage Setup 🔗

This project uses Supabase for the database and resume storage.

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Database Schema**:
    - Open the **SQL Editor** in your Supabase dashboard.
    - Copy the contents of `server/supabase_schema.sql` and run them. This will create the `users` and `resumes` tables.
3.  **Storage Bucket**:
    - Ensure a bucket named `resumes` is created (the SQL script should have done this).
    - Go to **Storage** -> **resumes** -> **Policies**.
    - Ensure the `Public Access` policy is enabled (or create a policy allowing `SELECT` access) so the resume URLs can be accessed by the frontend.
4.  **Credentials**:
    - Go to **Project Settings** -> **API**.
    - Copy the `Project URL` and `anon public` key. You'll need these for the backend.

---

## 2. Backend Deployment (Render) 🤖

1.  **Prepare your Repo**: Push your code (containing the `/server` directory) to **GitHub**.
2.  **Create a Web Service on Render**:
    - Go to [dashboard.render.com](https://dashboard.render.com) and click **New** -> **Web Service**.
    - Connect your GitHub repository.
3.  **Configure Build Settings**:
    - **Name**: `hiresight-backend` (or any unique name).
    - **Environment**: `Node`.
    - **Region**: Choose one closest to your users.
    - **Branch**: `main` (or yours).
    - **Root Directory**: `server` (Important: this isolates the backend).
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
4.  **Add Environment Variables**:
    - Click **Advanced** -> **Add Environment Variable**.
    - `SUPABASE_URL`: Your Supabase Project URL.
    - `SUPABASE_ANON_KEY`: Your Supabase anon key.
    - `PORT`: `10000` (Render's default, though it sets it automatically).
5.  **Deploy**: Click **Create Web Service**.
6.  **Copy the URL**: Once deployed, copy the Render URL (e.g., `https://hiresight-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel) 🎨

1.  **Prepare the Frontend**:
    - Ensure `client/src/index.html` has your Render backend URL:
      ```javascript
      window.API_URL = "https://hiresight-sgfv.onrender.com/api";
      ```
2.  **Connect to Vercel**:
    - Push your changes to GitHub.
    - Import the repository into [Vercel](https://vercel.com).
    - **Important**: Leave the **"Root Directory"** empty (or set to `/`). Vercel will now automatically use the root `vercel.json` I created to build the `client/` folder.
3.  **Configure Build Settings**:
    - **Framework Preset**: Other (or Vercel will auto-detect from `vercel.json`).
    - **Build Command**: `npm run build`
    - **Output Directory**: Leave as default (the `vercel.json` already defines this).
4.  **Deploy**: Click **Deploy**.

---

## 4. Post-Deployment Checks ✅

1.  **CORS**: The backend allows all origins by default. If you have issues, check `server/index.js`.
2.  **Resume Access**: If resumes aren't loading, check that the Supabase storage bucket `resumes` is set to "Public".
3.  **Spin-down**: Free Render services "sleep" after 15 mins of inactivity. The first request after a sleep may take ~30 seconds to wake up the server.

---

### Important URLs
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-app.onrender.com/api`
- **Supabase**: `https://supabase.com/dashboard`

