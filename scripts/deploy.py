import os
import sys
import subprocess
import tarfile
import tempfile
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def run_ssh(cmd, ip, key_path):
    full_cmd = [
        "ssh",
        "-i", key_path,
        "-o", "StrictHostKeyChecking=no",
        f"ubuntu@{ip}",
        cmd
    ]
    print(f"[*] Running remote command: {cmd[:80]}...")
    res = subprocess.run(full_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(f"[-] Command failed: {res.stderr}")
        raise RuntimeError(f"SSH command failed with exit code {res.returncode}")
    print(res.stdout)
    return res.stdout

def deploy():
    key_path = "volunteer-hub-key.pem"
    if not os.path.exists("instance_ip.txt"):
        print("[-] instance_ip.txt not found")
        sys.exit(1)
    with open("instance_ip.txt") as f:
        ip = f.read().strip()
    
    print(f"[*] Deploying to {ip}...")

    # Create destination dir
    run_ssh("mkdir -p /home/ubuntu/volunteer-hub", ip, key_path)

    # Create tarball of current project excluding secrets, pem, git
    print("[*] Creating archive of project files...")
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp_tar:
        tar_path = tmp_tar.name

    def filter_func(tarinfo):
        exclude_prefixes = [
            ".git", ".venv", "venv", "__pycache__", "node_modules",
            "volunteer-hub-key.pem", ".env.aws", "instance_ip.txt"
        ]
        for ex in exclude_prefixes:
            if tarinfo.name == ex or tarinfo.name.startswith(ex + "/") or tarinfo.name.startswith(ex + "\\") or ("\\" + ex in tarinfo.name) or ("/" + ex in tarinfo.name):
                return None
            if tarinfo.name.endswith(".pem"):
                return None
        return tarinfo

    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(".", arcname=".", filter=filter_func)

    print(f"[*] Uploading tarball ({os.path.getsize(tar_path)} bytes) via SCP...")
    scp_cmd = [
        "scp",
        "-i", key_path,
        "-o", "StrictHostKeyChecking=no",
        tar_path,
        f"ubuntu@{ip}:/home/ubuntu/project.tar.gz"
    ]
    subprocess.run(scp_cmd, check=True)
    os.remove(tar_path)

    print("[*] Extracting project on EC2...")
    run_ssh("tar -xzf /home/ubuntu/project.tar.gz -C /home/ubuntu/volunteer-hub && rm /home/ubuntu/project.tar.gz", ip, key_path)

    # Write remote .env with AWS credentials
    print("[*] Writing production .env on EC2...")
    aws_id = ""
    aws_secret = ""
    aws_region = "eu-north-1"
    if os.path.exists(".env.aws"):
        with open(".env.aws") as f:
            for line in f:
                line = line.strip()
                if line.startswith("AWS_ACCESS_KEY_ID="):
                    aws_id = line.split("=", 1)[1].strip()
                elif line.startswith("AWS_SECRET_ACCESS_KEY="):
                    aws_secret = line.split("=", 1)[1].strip()
                elif line.startswith("AWS_DEFAULT_REGION="):
                    aws_region = line.split("=", 1)[1].strip()

    env_content = f"""POSTGRES_PASSWORD=volunteer_prod_secret_2026
JWT_SECRET=super-production-secret-key-volunteer-hub-2026-secure
AWS_ACCESS_KEY_ID={aws_id}
AWS_SECRET_ACCESS_KEY={aws_secret}
AWS_DEFAULT_REGION={aws_region}
S3_BUCKET_NAME=volunteer-hub-media-andriidv
"""
    write_env_cmd = f"cat << 'EOF' > /home/ubuntu/volunteer-hub/.env\n{env_content}EOF"
    run_ssh(write_env_cmd, ip, key_path)

    # Docker compose build & restart
    print("[*] Rebuilding and starting Docker Compose containers on EC2...")
    compose_cmd = "cd /home/ubuntu/volunteer-hub && sudo docker compose down --remove-orphans 2>/dev/null || true && sudo docker compose build backend && sudo docker compose up -d"
    run_ssh(compose_cmd, ip, key_path)

    # Wait for backend to be healthy
    print("[*] Waiting for services to come up...")
    time.sleep(10)
    health_check_cmd = "curl -i http://localhost/api/health"
    run_ssh(health_check_cmd, ip, key_path)

    # Test needs endpoint
    needs_check_cmd = "curl -s http://localhost/api/needs | head -c 300"
    run_ssh(needs_check_cmd, ip, key_path)

    print(f"\n==========================================")
    print(f"DEPLOYMENT SUCCESSFUL!")
    print(f"EC2 Public IP: {ip}")
    print(f"Landing Page:  http://{ip}")
    print(f"API Docs:      http://{ip}/docs")
    print(f"API Needs:     http://{ip}/api/needs")
    print(f"==========================================\n")

if __name__ == "__main__":
    deploy()
