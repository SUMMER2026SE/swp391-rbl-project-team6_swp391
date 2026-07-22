import json
import requests

BASE_URL = "http://localhost:8081"

# Read token
with open("admin_token.txt", "r") as f:
    token = f.read().strip()

headers = {"Authorization": f"Bearer {token}"}

# Test 1: Grammar without document
print("="*60)
print("TEST 1: Grammar Generation (No Document)")
print("="*60)

data = {
    "skillType": "GRAMMAR",
    "level": "N5",
    "lessonNumber": 1,
    "count": 2
}

# Use files parameter for multipart - request as JSON part, no file
files = {
    "request": ("request.json", json.dumps(data), "application/json")
}

resp = requests.post(
    f"{BASE_URL}/api/admin/content-library/ai/generate",
    headers=headers,
    files=files,
    timeout=180
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:1000]}")
