#!/usr/bin/env bash
set -e

# Volunteer Hub Deployment Script
# Automatically deploys the application to the provisioned EC2 instance

KEY_FILE="volunteer-hub-key.pem"
INSTANCE_IP="${1:-}"

if [ -z "$INSTANCE_IP" ]; then
    if [ -f "instance_ip.txt" ]; then
        INSTANCE_IP=$(cat instance_ip.txt | tr -d ' \r\n')
    fi
fi

if [ -z "$INSTANCE_IP" ]; then
    echo "[-] Error: Instance IP address not provided and instance_ip.txt not found."
    echo "Usage: ./deploy.sh <EC2_PUBLIC_IP>"
    exit 1
fi

echo "=========================================================="
echo "🚀 Deploying Volunteer Hub to EC2: $INSTANCE_IP"
echo "=========================================================="

if [ ! -f "$KEY_FILE" ]; then
    echo "[-] Key file $KEY_FILE not found in current directory!"
    exit 1
fi

# Ensure proper key permissions
chmod 400 "$KEY_FILE" 2>/dev/null || true

# Test SSH connection with retries
echo "[*] Waiting for SSH to become available on $INSTANCE_IP..."
SSH_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $KEY_FILE ubuntu@$INSTANCE_IP"

for i in {1..30}; do
    if $SSH_CMD "echo SSH connected successfully" 2>/dev/null; then
        echo "[+] SSH connection established!"
        break
    fi
    echo "[-] Waiting for instance SSH to initialize (attempt $i/30)..."
    sleep 3
done

echo "[*] Installing Docker and Docker Compose on remote instance..."
$SSH_CMD "sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose-v2 rsync && sudo usermod -aG docker ubuntu"

echo "[*] Creating remote deployment directory..."
$SSH_CMD "mkdir -p /home/ubuntu/volunteer-hub"

echo "[*] Transferring project files to remote instance..."
# Rsync or tarball over SSH
tar --exclude='.git' \
    --exclude='*.pem' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='node_modules' \
    --exclude='instance_ip.txt' \
    -czf - . | $SSH_CMD "tar -xzf - -C /home/ubuntu/volunteer-hub"

echo "[*] Generating production .env file on remote instance..."
# Read AWS credentials from local .env.aws if available
AWS_KEY=""
AWS_SEC=""
AWS_REG="eu-north-1"
S3_BUCKET="volunteer-hub-media-andriidv"

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
GOOGLE_CLIENT_ID=921149802430-77d460raj6hhtomlqq7sosfvcgsergtt.apps.googleusercontent.com
EOF"

echo "[*] Building and starting Docker containers..."
$SSH_CMD "cd /home/ubuntu/volunteer-hub && sudo docker compose down --remove-orphans 2>/dev/null || true && sudo docker compose up -d --build"

echo "[*] Verifying running containers..."
$SSH_CMD "cd /home/ubuntu/volunteer-hub && sudo docker compose ps"

echo ""
echo "=========================================================="
echo "✅ Volunteer Hub Deployed Successfully!"
echo "Public IP: $INSTANCE_IP"
echo "HTTP URL:  http://$INSTANCE_IP"
echo "API Docs:  http://$INSTANCE_IP/docs"
echo "=========================================================="
echo ""
echo "🔒 HTTPS ENABLING INSTRUCTIONS (once DuckDNS is pointed to $INSTANCE_IP):"
echo "1. Log into your DuckDNS dashboard (https://www.duckdns.org)."
echo "2. Update the record 'volunteer-hub' to point to IP: $INSTANCE_IP"
echo "3. Run the following command on the server to obtain and install SSL certificate:"
echo "   ssh -i $KEY_FILE ubuntu@$INSTANCE_IP"
echo "   sudo apt-get install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d volunteer-hub.duckdns.org --non-interactive --agree-tos -m andriy.dvib@gmail.com"
echo "=========================================================="
