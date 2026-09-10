<div align="center">

# 🌌 Aurora — 100% Free AI Chat, Runs in Your Browser

**No API keys. No signups. No servers. No hosting bill. Ever.**

</div>

---

## How it works now

The AI model runs **entirely inside the visitor's browser** using
[WebLLM](https://github.com/mlc-ai/web-llm) + WebGPU. There is no backend,
no server, nothing to deploy except plain static files.

- First visit: browser downloads a small model (~700MB, one time, then cached)
- Every message after that: answered instantly, 100% on-device
- Zero cost for you, zero cost for anyone who visits — it's their device doing the work

This replaces the old server/API-key/hosting approach completely.

---

## Deploy for free — GitHub Pages

1. Push this whole `client/` folder's **built output** to a `gh-pages` branch,
   or use GitHub's built-in Pages workflow:

   ```bash
   cd client
   npm install
   npm run build
   ```
   This creates a `dist/` folder — that's your entire website.

2. In your GitHub repo: **Settings → Pages → Deploy from a branch**, and either:
   - push the contents of `dist/` to a `gh-pages` branch, or
   - use a GitHub Action (recommended) — add `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: cd client && npm install && npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./client/dist
   ```

3. That's it. Your site is live at `https://<username>.github.io/<repo>/`,
   free forever, no server anywhere.

---

## Run locally first (optional)

```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints. Needs a WebGPU-capable browser (recent Chrome/Edge).

---

## Notes

- Requires a browser with WebGPU (Chrome/Edge 113+, most 2023+ browsers). No WebGPU = no chat, since there's no server fallback.
- The model (`Llama-3.2-1B-Instruct`) is small and fast but not as capable as
  large cloud models — that trade-off is what makes it free and serverless.
- To use a bigger/smaller model, change `MODEL` in `client/script.js` to any
  name from the [WebLLM model list](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts).

---

## 👨‍💻 Author

**Anusthan Singh**
- GitHub: https://github.com/anusthan12
- LinkedIn: https://www.linkedin.com/in/anusthan12/

## 📄 License

MIT License © 2023–2026 Anusthan Singh
