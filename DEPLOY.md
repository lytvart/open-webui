# STELLAR.AI — production deploy runbook

Fork of Open WebUI 0.13.0 (`https://github.com/lytvart/open-webui.git`).
The fork contains backend changes (user-level MCP + OAuth), so the official
image cannot run it — always build the image from this repo.

## 0. Prerequisites

- Docker + compose plugin on the server:
  `curl -fsSL https://get.docker.com | sh`
- The fork is public → HTTPS clone/pull needs **no keys or tokens**.
- ~4 GB free RAM for the frontend build stage. Small server? Build on the
  Mac with `docker buildx build --platform linux/amd64 --push` against GHCR
  and have the server only pull.

## 1. First deploy

```bash
git clone https://github.com/lytvart/open-webui.git ~/stellar-ai
cd ~/stellar-ai

# first build 10–20 min; later builds reuse layers
docker build -t stellar-ai:latest \
  --build-arg BUILD_HASH=$(git rev-parse --short HEAD) \
  --build-arg BUILD_CHANNEL=prod .
```

## 2. Secrets (once)

```bash
mkdir -p ~/stellar
echo "WEBUI_SECRET_KEY=$(openssl rand -base64 32)" > ~/stellar/.env
echo "WEBUI_URL=https://your-domain.com" >> ~/stellar/.env
chmod 600 ~/stellar/.env
```

Hard rules:

- `WEBUI_SECRET_KEY` must **never change** after first boot — it signs all
  sessions/JWTs. Back it up.
- `WEBUI_URL` must be byte-exact with what users type; it is also the base
  for the Asana OAuth redirect URI.

## 3. Run

```bash
docker run -d --name stellar-ai --restart unless-stopped \
  -p 127.0.0.1:3080:8080 \
  -v stellar-data:/app/backend/data \
  --env-file ~/stellar/.env \
  stellar-ai:latest
```

- Bind to `127.0.0.1` only — TLS is the reverse proxy's job (Caddy/nginx/
  Traefik → proxy to `:3080`, buffering off / long timeouts for SSE).
- Check: `docker logs -f stellar-ai`, then `curl http://127.0.0.1:3080/health`.
- Migrating from an official open-webui container: stop it and reuse **the
  same volume** at `/app/backend/data` — chats/users come right along.

## 4. First boot + Asana OAuth

1. Register the first account immediately — the first user becomes admin.
2. In the Asana developer console, add the redirect URI shown after clicking
   Connect in the sidebar (derived from `WEBUI_URL`).
3. If Asana rejects the `mcp:` colon in the callback path, switch to the
   colon-free `mcp-<id>` variant (small backend change, see fork notes).

## 5. Updates (the routine)

```bash
cd ~/stellar-ai
git pull
docker build -t stellar-ai:latest \
  --build-arg BUILD_HASH=$(git rev-parse --short HEAD) \
  --build-arg BUILD_CHANNEL=prod .
docker rm -f stellar-ai
# then repeat the docker run command from step 3
```

Data survives in the `stellar-data` volume; only the image changes.

---

# ⬛⬛⬛  PULL UPDATES  ⬛⬛⬛

> **You pushed a fix/feature to the fork from your dev machine.
> Now log into the prod server and run exactly this — nothing else:**

```bash
# ═══════════════════════  PULL UPDATES  ═══════════════════════

cd ~/stellar-ai

# 1. get the new commits (public repo: no auth, no prompts)
git pull

# 2. rebuild the image (incremental: untouched layers are cached;
#    frontend-only change ≈ 2–5 min, backend-only change reuses Node)
docker build -t stellar-ai:latest \
  --build-arg BUILD_HASH=$(git rev-parse --short HEAD) \
  --build-arg BUILD_CHANNEL=prod .

# 3. swap the container (~2 s downtime; users/chats/MCP live in the
#    stellar-data volume and are NOT touched)
docker rm -f stellar-ai
docker run -d --name stellar-ai --restart unless-stopped \
  -p 127.0.0.1:3080:8080 \
  -v stellar-data:/app/backend/data \
  --env-file ~/stellar/.env \
  stellar-ai:latest

# 4. verify
docker logs -f stellar-ai        # wait for startup, Ctrl-C to exit
curl http://127.0.0.1:3080/health

# ═══════════════════════════════════════════════════════════════
```

**Rollback if a deploy is broken** (same volume, old code):

```bash
cd ~/stellar-ai
git checkout <previous-good-commit>
docker build -t stellar-ai:rollback .
docker rm -f stellar-ai
docker run -d --name stellar-ai --restart unless-stopped \
  -p 127.0.0.1:3080:8080 \
  -v stellar-data:/app/backend/data \
  --env-file ~/stellar/.env \
  stellar-ai:rollback
```

**Speed-ups once stable (optional):**

- **Compose on the server** → update = one command (file lives outside the
  repo at `~/stellar/docker-compose.yaml`, see fork file
  `stellar-server/docker-compose.yaml`):

  ```bash
  cd ~/stellar && git -C ~/stellar-ai pull && docker compose up -d --build
  ```

## 6. Upstream rebases (from the dev machine)

```bash
git fetch upstream
git rebase upstream/main    # the 5 fork commits replay on top
git push --force-with-lease origin main
```

Then run step 5 on the server.

## If the fork ever goes private

`git clone`/`git pull` will demand credentials: create a fine-grained PAT
with read-only repo access and store it on the server
(`git config credential.helper store`), or use a deploy key.
