#!/usr/bin/env bash
# Rebuild the samyak-jain.tech server from GitHub + S3 only.
#
# Target: a fresh Amazon Linux 2023 instance (arm64 or x86_64), run as ec2-user (needs sudo).
# Needs:  outbound internet, and AWS credentials that can read the S3 bucket
#         (attach an instance profile with s3:GetObject/ListBucket on $BUCKET, or run `aws configure`).
#
#   curl -fsSLO https://raw.githubusercontent.com/SamyakJain2020/Agentic-E-commerce/main/deploy/restore.sh
#   bash restore.sh
#
# Idempotent: safe to re-run. Overridable env vars: REPO_URL, BUCKET, REGION, NODE_VERSION, RESTORE_TLS.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/SamyakJain2020/Agentic-E-commerce.git}"
BUCKET="${BUCKET:-agentic-ecommerce-code-056225817286}"
REGION="${REGION:-ap-south-1}"
NODE_VERSION="${NODE_VERSION:-22.23.3}"
RESTORE_TLS="${RESTORE_TLS:-1}"
APP_ROOT=/opt/app
SRC=/opt/app-src
SNAP_PREFIX="server-2026-10-08"   # secrets snapshot taken from the live server before shutdown

USER="${USER:-$(id -un)}"   # unset when run from cloud-init/systemd instead of an SSH login
log() { printf '\n== %s ==\n' "$*"; }
s3get() { aws s3 cp "s3://$BUCKET/$1" "$2" --region "$REGION" --only-show-errors; }

log "1/9 system packages"
sudo dnf install -y git python3 python3-pip tar gzip >/dev/null

log "2/9 node via nvm ($NODE_VERSION)"
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
set +eu   # nvm.sh is not safe under `set -e` / `set -u`
# shellcheck disable=SC1091
. "$HOME/.nvm/nvm.sh"
nvm install "$NODE_VERSION" >/dev/null 2>&1 || nvm install 22 >/dev/null 2>&1
nvm use "$NODE_VERSION" >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1
set -eu
node -v

log "3/9 code from GitHub"
sudo mkdir -p "$APP_ROOT" "$SRC"
sudo chown "$USER":"$USER" "$APP_ROOT" "$SRC"
if [ -d "$SRC/.git" ]; then git -C "$SRC" pull --ff-only; else git clone "$REPO_URL" "$SRC"; fi

log "4/9 lay out /opt/app"
# repo dir -> /opt/app dir (main.py serves each app's dist/ from these paths)
for pair in backend:backend frontend:frontend slidecraft-frontend:slidecraft portfolio:portfolio aurora:aurora fluxora:fluxora; do
  repo_dir="${pair%%:*}"; app_dir="${pair##*:}"
  mkdir -p "$APP_ROOT/$app_dir"
  cp -a "$SRC/$repo_dir/." "$APP_ROOT/$app_dir/"
done

log "5/9 secrets + binary assets from S3"
install -m 600 /dev/null "$APP_ROOT/backend/.env"
s3get "secrets/agentic-shop-backend.env"  "$APP_ROOT/backend/.env"
s3get "secrets/agentic-shop-frontend.env" "$APP_ROOT/frontend/.env"
chmod 600 "$APP_ROOT/backend/.env" "$APP_ROOT/frontend/.env"
# assets that are deliberately not in git (large video / personal PDF); S3 mirrors the repo layout
s3get "agentic-shop/aurora/public/hero.mp4"                      "$APP_ROOT/aurora/public/hero.mp4"
s3get "agentic-shop/fluxora/public/hero-loop.mp4"                "$APP_ROOT/fluxora/public/hero-loop.mp4"
s3get "agentic-shop/portfolio/public/Samyak_Jain_Resume.pdf"     "$APP_ROOT/portfolio/public/Samyak_Jain_Resume.pdf"
# Canva OAuth tokens (optional; if expired just click "Connect Canva" again in SlideCraft)
if s3get "secrets/$SNAP_PREFIX/secrets-opt-app.tar.gz" /tmp/secrets-opt-app.tar.gz 2>/dev/null; then
  tar xzf /tmp/secrets-opt-app.tar.gz -C /tmp app/backend/.canva_tokens.json 2>/dev/null \
    && sudo install -m 600 -o root -g root /tmp/app/backend/.canva_tokens.json "$APP_ROOT/backend/.canva_tokens.json" || true
  rm -rf /tmp/secrets-opt-app.tar.gz /tmp/app
fi

log "6/9 python venv + backend deps"
python3 -m venv "$APP_ROOT/venv"
"$APP_ROOT/venv/bin/pip" install --quiet --upgrade pip wheel
"$APP_ROOT/venv/bin/pip" install --quiet -r "$APP_ROOT/backend/requirements.txt"

log "7/9 build the five frontends"
for d in frontend slidecraft portfolio aurora fluxora; do
  echo "-- building $d"
  ( cd "$APP_ROOT/$d" && npm ci --no-audit --no-fund >/dev/null && npm run build >/dev/null )
done

if [ "$RESTORE_TLS" = "1" ]; then
  log "8/9 TLS certificate for samyak-jain.tech (from S3 snapshot)"
  if s3get "secrets/$SNAP_PREFIX/letsencrypt.tar.gz" /tmp/letsencrypt.tar.gz 2>/dev/null; then
    sudo tar xzf /tmp/letsencrypt.tar.gz -C /etc
    rm -f /tmp/letsencrypt.tar.gz
  else
    echo "no TLS snapshot found; server will serve HTTP only until you issue a cert (see deploy/README.md)"
  fi
else
  log "8/9 TLS restore skipped (RESTORE_TLS=0)"
fi

log "9/9 systemd service"
sudo cp "$SRC/deploy/flask_app.service" /etc/systemd/system/flask_app.service
sudo systemctl daemon-reload
sudo systemctl enable flask_app >/dev/null 2>&1
sudo systemctl restart flask_app
sleep 4

log "smoke test (http://127.0.0.1)"
fail=0
for p in /health / /aura /aura/shop /slidecraft /aurora/ /fluxora/ /api/products /api/slidecraft/auth/status \
         /aurora/hero.mp4 /fluxora/hero-loop.mp4 /Samyak_Jain_Resume.pdf; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1$p")
  printf '%-34s %s\n' "$p" "$code"
  [ "$code" = "200" ] || fail=1
done
curl -s http://127.0.0.1/health; echo
[ "$fail" = "0" ] && echo "RESTORE OK" || { echo "RESTORE FINISHED WITH FAILURES (see above)"; exit 1; }
