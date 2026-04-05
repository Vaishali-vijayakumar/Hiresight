# HireSight Deployment Guide 🚀

Follow these steps to deploy the backend to Replit and the frontend to Vercel.

---

## 1. Backend Deployment (Replit) 🤖

1.  **Create a New Repl**: Choose **Node.js** as the template.
2.  **Upload Files**: Upload all files from the `/server` directory to the Repl.
3.  **Environment Variables (`Secrets`)**:
    Add the following keys in the "Secrets" tab (lock icon):
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_ANON_KEY`: Your Supabase anonymous key.
    - `PORT`: `3000` (Replit default).
4.  **Install & Run**:
    - Replit will automatically run `npm install`.
    - Click the **Run** button (it will use `npm start` from `package.json`).
5.  **Copy the URL**: Copy the public URL of your Replit backend (e.g., `https://hiresight-backend.repl.co`).

---

## 2. Frontend Deployment (Vercel) 🎨

1.  **Prepare the Frontend**:
    - Go to your `/client` directory.
    - Open `src/index.html`.
    - Update the `window.API_URL` line:
      ```javascript
      window.API_URL = "https://your-replit-url.repl.co/api";
      ```
2.  **Connect to Vercel**:
    - Push your `/client` code to a **GitHub/GitLab** repository.
    - Import the repository into **Vercel**.
3.  **Configure Project**:
    - **Framework Preset**: Angular.
    - **Build Command**: `npm run build`.
    - **Output Directory**: `dist/client/browser` (or `dist/client` if prompted).
4.  **Environment Variables** (Optional):
    If you want to use different URLs per environment, you can manage them in Vercel.
5.  **Deploy**: Click **Deploy**.

---

## 3. Post-Deployment Checks ✅

1.  **CORS**: Ensure your Replit backend is running. If you see CORS errors in the browser console, double-check that `server/index.js` has the correct `cors` configuration (currently set to `*` for maximum compatibility).
2.  **Supabase Access**: Ensure your Supabase database has Row Level Security (RLS) configured to allow the backend's IP if necessary, though the service key should bypass most limits.

---

### Important URLs to Remember
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-repl.repl.co/api`
