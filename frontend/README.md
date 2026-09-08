# Job Tracker frontend

React/Vite client for the Job Tracker AI Career Workspace.

See the repository [root README](../README.md) for the complete feature list, local setup, environment variables, deployment notes, and Chrome extension instructions.

```bash
npm install
npm run dev
npm run lint
npm run build
```

When `VITE_API_URL` is not set, the Vite development server proxies `/api` to `http://127.0.0.1:5000`. Set `VITE_API_URL` to the full Render API URL (including `/api`) in Vercel.
