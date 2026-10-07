# Restoring the samyak-jain.tech server from GitHub + S3

Everything needed to rebuild the server lives in two places:

| What | Where |
|---|---|
| All source code (backend, 4 frontends, portfolio) | this GitHub repo |
| Secrets (`.env` files), TLS cert, Canva tokens, video/PDF assets, raw server snapshot | private S3 bucket `agentic-ecommerce-code-056225817286` (ap-south-1) |

## One-command restore

1. Launch an **Amazon Linux 2023** instance (t4g.micro/arm64 or t3.micro/x86_64 both work, 1 GB RAM is enough).
2. Attach an instance profile that can read the bucket (the old one was `EC2-S3-Instance-Profile`), or run `aws configure` on the box.
3. Security group: inbound 22, 80, 443.
4. On the instance:

   ```bash
   curl -fsSLO https://raw.githubusercontent.com/SamyakJain2020/Agentic-E-commerce/main/deploy/restore.sh
   bash restore.sh
   ```

   It installs git/python/node, clones this repo into `/opt/app-src`, lays it out under `/opt/app`, pulls secrets and
   assets from S3, creates a Python venv, builds all five frontends, restores the TLS cert, installs the
   `flask_app` systemd unit and smoke-tests every route (prints `RESTORE OK`).
5. Point the `samyak-jain.tech` (+ `www`) **A record** at the new instance's public IP (use an Elastic IP if you
   want it to survive stop/start; note public IPv4 addresses are billed hourly).

## Layout on the server

| Repo dir | Server dir | URL |
|---|---|---|
| `portfolio/` | `/opt/app/portfolio` | `/` |
| `frontend/` | `/opt/app/frontend` | `/aura` |
| `slidecraft-frontend/` | `/opt/app/slidecraft` | `/slidecraft` |
| `aurora/` | `/opt/app/aurora` | `/aurora/` |
| `fluxora/` | `/opt/app/fluxora` | `/fluxora/` |
| `backend/` | `/opt/app/backend` | Flask API (`/api/*`, `/health`) + serves all the built frontends on :80/:443 |

## S3 layout

```
agentic-shop/                      mirror of the repo working tree, PLUS the assets kept out of git:
  aurora/public/hero.mp4
  fluxora/public/hero-loop.mp4
  portfolio/public/Samyak_Jain_Resume.pdf   (contains personal details, deliberately not in the public repo)
secrets/agentic-shop-backend.env   GEMINI / SARVAM / RAZORPAY / CANVA keys (see backend/.env.example)
secrets/agentic-shop-frontend.env  VITE_RAZORPAY_KEY_ID
secrets/server-2026-10-08/         letsencrypt.tar.gz, secrets-opt-app.tar.gz (.env files, Canva tokens, an old ssh keypair)
server-snapshot/2026-10-08/        raw tarball of the server's /opt/app as it was at shutdown + SHA256SUMS,
                                   systemd unit, certbot renewal config, `pip freeze`, runtime versions
```

## TLS certificate

The restored cert (Let's Encrypt, `samyak-jain.tech` + `www`) expires **2026-12-23**. It was issued with the nginx
plugin, which is no longer installed, so auto-renew will not work. To renew/issue a fresh one on a new box, with DNS
already pointing at it:

```bash
sudo systemctl stop flask_app
sudo python3 -m venv /opt/certbot && sudo /opt/certbot/bin/pip install certbot
sudo /opt/certbot/bin/certbot certonly --standalone -d samyak-jain.tech -d www.samyak-jain.tech
sudo systemctl start flask_app      # main.py reads /etc/letsencrypt/live/samyak-jain.tech/*.pem
```

Without a cert the server still starts (HTTP only on :80), but browsers block microphone access (Aura's voice mode)
on plain HTTP.

## Notes

- Canva OAuth tokens are restored from the snapshot; if they have expired, click **Connect Canva** in SlideCraft once.
  The Canva integration must still list `https://samyak-jain.tech/api/slidecraft/auth/callback` as a redirect URI.
- Uploaded documents, generated decks, carts, orders and wallets are **in-memory** by design and are lost on restart.
- `restore.sh` is idempotent; re-running it rebuilds from the latest `main`.
