import urllib.request
import json
import uuid

base_url = "http://13.60.170.196/api"

def run_tests():
    print("[*] Logging in as volunteer (serhiy@volunteers.ua)...")
    data = json.dumps({"email": "serhiy@volunteers.ua", "password": "Volunteer2026!"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/auth/login", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        vol_token = json.loads(resp.read().decode("utf-8"))["access_token"]

    print("[*] Logging in as military unit (magura47@military.ua)...")
    data = json.dumps({"email": "magura47@military.ua", "password": "Volunteer2026!"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/auth/login", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        mil_token = json.loads(resp.read().decode("utf-8"))["access_token"]

    print("[*] 1. Creating Friendly Jar for Need #1...")
    jar_data = json.dumps({
        "jar_url": "https://send.monobank.ua/jar/liveTestDemoJar",
        "goal_amount": 35000.0,
        "current_amount": 35000.0
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/needs/1/fundraisers",
        data=jar_data,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {vol_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        created_jar = json.loads(resp.read().decode("utf-8"))
        jar_id = created_jar["id"]
        print(f"[+] Created Friendly Jar #{jar_id}: goal={created_jar['goal_amount']}, status={created_jar['status']}")

    print("[*] 2. Uploading proof receipt image to Amazon S3...")
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"receipt_test.png\"\r\n"
        f"Content-Type: image/png\r\n\r\n"
        f"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82\r\n"
        f"--{boundary}--\r\n"
    ).encode("latin-1")

    req = urllib.request.Request(
        f"{base_url}/fundraisers/{jar_id}/proof",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Authorization": f"Bearer {vol_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        proof_res = json.loads(resp.read().decode("utf-8"))
        print(f"[+] Proof uploaded to S3: {proof_res['proof_image_url']}")
        print(f"[+] Fundraiser status updated to: {proof_res['status']}")

    print("[*] 3. Military confirms receipt of funds / delivery...")
    req = urllib.request.Request(
        f"{base_url}/fundraisers/{jar_id}/verify",
        data=b"",
        headers={"Authorization": f"Bearer {mil_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        verify_res = json.loads(resp.read().decode("utf-8"))
        print(f"[+] Verification completed! Awarded points: {verify_res['awarded_points']}")
        print(f"[+] Total verified amount for Need #1: {verify_res['total_verified_amount']} / {verify_res['target_amount']}")
        print(f"[+] Need #1 status: {verify_res['need_status']}")

    print("\n[+] ALL LIVE ENDPOINTS TESTED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
