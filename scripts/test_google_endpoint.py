import urllib.request
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://volunteer-hub.duckdns.org/api/auth/google"
data = json.dumps({"id_token": "dummy.invalid.token", "role": "volunteer"}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        print("Success:", resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"HTTP Status: {e.code}")
    print(f"Response Body: {e.read().decode('utf-8')}")
