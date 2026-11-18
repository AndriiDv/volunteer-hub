#!/usr/bin/env bash
set -e

# Volunteer Hub Automated Production Deployment Script
# Target: EC2 Ubuntu 24.04 LTS (eu-north-1)
# Domain: https://volunteer-hub.duckdns.org

KEY_FILE="volunteer-hub-key.pem"
INSTANCE_IP="${1:-}"

# Check for key in current directory or parent
if [ ! -f "$KEY_FILE" ]; then
    if [ -f "../$KEY_FILE" ]; then
        KEY_FILE="../$KEY_FILE"
    fi
fi

if [ -z "$INSTANCE_IP" ]; then
    if [ -f "instance_ip.txt" ]; then
        INSTANCE_IP=$(cat instance_ip.txt | tr -d ' \r\n')
    elif [ -f "../instance_ip.txt" ]; then
        INSTANCE_IP=$(cat ../instance_ip.txt | tr -d ' \r\n')
    else
        INSTANCE_IP="13.60.170.196"
    fi
fi

echo "=========================================================="
echo "🚀 Deploying Volunteer Hub to EC2: $INSTANCE_IP"
echo "=========================================================="

if [ ! -f "$KEY_FILE" ]; then
    echo "[-] Error: SSH Key file '$KEY_FILE' not found!"
    exit 1
fi

chmod 400 "$KEY_FILE" 2>/dev/null || true

SSH_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $KEY_FILE ubuntu@$INSTANCE_IP"

echo "[*] Testing SSH connectivity to $INSTANCE_IP..."
for i in {1..10}; do
    if $SSH_CMD "echo SSH connection established" 2>/dev/null; then
        break
    fi
    echo "[-] Waiting for SSH... ($i/10)"
    sleep 3
done

echo "[*] Ensuring Docker, Docker Compose, and Certbot are installed on EC2..."
$SSH_CMD "sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose-v2 certbot rsync && sudo usermod -aG docker ubuntu && sudo systemctl enable --now docker"

echo "[*] Preparing remote project directories..."
$SSH_CMD "mkdir -p /home/ubuntu/volunteer-hub"

echo "[*] Packaging and transferring project files..."
cd "$(dirname "$0")/.."
tar --exclude='.git' \
    --exclude='*.pem' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='instance_ip.txt' \
    -czf - . | $SSH_CMD "tar -xzf - -C /home/ubuntu/volunteer-hub"

echo "[*] Writing production .env on EC2..."
AWS_KEY=""
AWS_SEC=""
AWS_REG="eu-north-1"
S3_BUCKET="volunteer-hub-media-andriidv"
GOOGLE_CLIENT_ID="921149802430-77d460raj6hhtomlqq7sosfvcgsergtt.apps.googleusercontent.com"

if [ -f ".env.aws" ]; then
    AWS_KEY=$(grep '^AWS_ACCESS_KEY_ID=' .env.aws | cut -d '=' -f2- | tr -d ' \r\n')
    AWS_SEC=$(grep '^AWS_SECRET_ACCESS_KEY=' .env.aws | cut -d '=' -f2- | tr -d ' \r\n')
    AWS_REG=$(grep '^AWS_DEFAULT_REGION=' .env.aws | cut -d '=' -f2- | tr -d ' \r\n')
fi

$SSH_CMD "cat << 'EOF' > /home/ubuntu/volunteer-hub/.env
POSTGRES_PASSWORD=volunteer_prod_secret_2026
JWT_SECRET=super-production-secret-key-volunteer-hub-2026-secure
AWS_ACCESS_KEY_ID=$AWS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SEC
AWS_DEFAULT_REGION=$AWS_REG
S3_BUCKET_NAME=$S3_BUCKET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
EOF"

echo "[*] Building React frontend production bundle on EC2 (node:20-slim container)..."
$SSH_CMD "sudo docker run --rm -v /home/ubuntu/volunteer-hub/frontend:/app -w /app node:20-slim sh -c 'npm install && npm run build' && sudo chmod -R a+rX /home/ubuntu/volunteer-hub/frontend/dist"

echo "[*] Ensuring Let's Encrypt certificates exist..."
$SSH_CMD "if [ ! -d /etc/letsencrypt/live/volunteer-hub.duckdns.org ]; then
    echo '[*] Obtaining SSL certificate via Certbot standalone...'
    sudo certbot certonly --standalone -d volunteer-hub.duckdns.org --agree-tos -m andriy.dvib@gmail.com --non-interactive
fi
sudo chmod -R a+rX /etc/letsencrypt"

echo "[*] Starting Docker Compose services (backend, postgres, nginx)..."
$SSH_CMD "cd /home/ubuntu/volunteer-hub && sudo docker compose -f infra/docker-compose.yml down --remove-orphans 2>/dev/null || true && sudo docker compose -f infra/docker-compose.yml up -d --build"

echo "[*] Verifying service health..."
sleep 5
$SSH_CMD "curl -sI https://volunteer-hub.duckdns.org/api/health"

echo ""
echo "=========================================================="
echo "✅ Volunteer Hub Deployment Complete!"
echo "Web URL:   https://volunteer-hub.duckdns.org"
echo "API Docs:  https://volunteer-hub.duckdns.org/docs"
echo "API Route: https://volunteer-hub.duckdns.org/api/needs"
echo "=========================================================="
