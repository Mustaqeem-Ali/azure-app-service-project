# Gemini Chatbot (React + Express) for Azure App Service

A small, production-conscious chatbot. React (Vite) frontend, Express backend, Gemini via the official `@google/genai` SDK. Express serves the built React app, so everything deploys to **one Azure Linux App Service**.

## 1. Project structure

```
gemini-chatbot/
├── .github/workflows/deploy.yml   # CI/CD (OIDC login to Azure)
├── client/                        # React frontend (never sees secrets)
│   ├── index.html
│   └── src/
│       ├── App.jsx, main.jsx, api.js, styles.css
│       └── components/            # Header, MessageList, Message, ChatInput, ...
├── server/                        # Express backend
│   ├── index.js                   # entry point (listens on process.env.PORT)
│   ├── app.js                     # middleware + routing
│   ├── config.js                  # reads process.env
│   ├── routes/                    # chat.js, config.js, health.js
│   ├── services/gemini.js         # all Gemini logic
│   ├── middleware/errorHandler.js
│   └── utils/                     # sanitizeHtml.js, HttpError.js
├── test/                          # node:test suites
├── vite.config.js
├── package.json / package-lock.json
├── .env.example
└── .gitignore
```

## 2. Install dependencies

Requires Node.js 20+.

```bash
npm ci
```

## 3. Run locally

Two terminals (hot reload for both):

```bash
npm run dev:server   # Express on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173 (proxies /api to Express)
```

Open http://localhost:5173.

Or run it exactly like production:

```bash
npm run build && npm start   # everything on http://localhost:3000
```

Run tests with `npm test`.

## 4. Configure local environment variables

```bash
cp .env.example .env
```

Edit `.env` (it is git-ignored):

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Secret. Backend only. |
| `GEMINI_MODEL` | Model name, e.g. `gemini-2.5-flash` |
| `RANDOM_KEY` | Public display value shown in the UI. **Not** an auth mechanism. |
| `PORT` | Local port (Azure sets this automatically) |
| `CORS_ORIGIN` | Leave empty (same-origin). Set only for cross-origin setups. |
| `GEMINI_TIMEOUT_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | Optional tuning |

## 5. Create a Gemini API key

1. Go to https://aistudio.google.com/apikey and sign in.
2. Click **Create API key** and pick (or create) a Google Cloud project.
3. Copy the key into `.env` locally, and into Azure Key Vault for deployment (below). Never commit it.

## 6. Azure Key Vault references

1. Create a Key Vault (**Azure portal → Key Vaults → Create**). Use the **Azure role-based access control** permission model.
2. Add secrets: `gemini-api-key` (your key) and, optionally, `random-key`.
3. Give your App Service identity read access (step 7): on the vault, **Access control (IAM) → Add role assignment → Key Vault Secrets User** → assign to the App Service's managed identity.
4. In the App Service: **Settings → Environment variables → App settings**, add:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | `@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/gemini-api-key/)` |
   | `RANDOM_KEY` | `@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/random-key/)` (or a plain value) |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (the pipeline ships a pre-built package) |

5. Save and restart. A green check next to each Key Vault reference means it resolved. The app just reads `process.env`; it contains no Azure SDK code.

If the vault uses a firewall, allow the App Service's outbound access (VNet integration or trusted services).

## 7. Enable Managed Identity

App Service → **Settings → Identity → System assigned → On → Save**. Use that identity in the Key Vault role assignment from step 6.3.

## 8. Deploy with GitHub Actions (OIDC)

1. Create the App Service: **Linux**, **Node 20 LTS** runtime, in a plan of your choice. Set **Settings → Configuration → Startup Command** to `npm start`.
2. Create a Microsoft Entra app registration (or user-assigned managed identity) for GitHub:
   - **Certificates & secrets → Federated credentials → Add → GitHub Actions deploying Azure resources**
   - Organization/repository: yours; entity type **Environment**, name `production` (matches the workflow); or **Branch** `main` if you remove the `environment:` line.
3. Grant that identity **Website Contributor** (or Contributor) on the App Service/resource group via IAM.
4. In GitHub: **Settings → Secrets and variables → Actions**
   - Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
   - Variable: `AZURE_WEBAPP_NAME` (your App Service name)
5. Push to `main`. The workflow runs `npm ci`, builds the frontend, runs tests, prunes dev dependencies, packages the app, logs in via OIDC and deploys.

## 9. Test the deployed app

```bash
curl https://<app-name>.azurewebsites.net/api/health          # {"status":"ok"}
curl https://<app-name>.azurewebsites.net/api/config          # {"randomKey":"..."}
curl -X POST https://<app-name>.azurewebsites.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Give me 3 tips for learning Azure","history":[]}'
```

Then open the site in a browser: the RANDOM_KEY panel should show your value and chat should answer. In the Azure portal, set **Monitoring → Health check** path to `/api/health`. If something fails, check **Log stream**.

## 10. Configure autoscaling

App Service → **Settings → Scale out (App Service plan)** (requires Standard tier or higher):

1. Choose **Rules based** (or **Automatic** on Premium).
2. Set minimum 2, maximum e.g. 5 instances.
3. Add a scale-out rule: CPU % > 70 for 10 min → +1 instance; scale-in rule: CPU % < 30 for 10 min → −1.
4. Save.

The app is stateless: conversation history lives in the browser and is sent with each request, so any instance can answer any request.

**Known limitation:** the rate limiter is in-memory, so each instance counts separately (effective limit is up to *instances × RATE_LIMIT_MAX*). For a strict global limit, add a shared store such as Azure Cache for Redis or limit at Azure Front Door / API Management.

## Security notes

- The Gemini key exists only in backend `process.env`; it is never logged or returned.
- Model output is sanitized server-side with a strict tag allowlist and **no attributes**.
- Provider errors are mapped to generic messages.
- Body size limit 32 KB, rate limiting, Helmet headers, request timeouts, CORS off by default.
