import json
import requests

BASE_URL = "http://localhost:8081"

# Login
login_data = {
    "email": "admin@midori.local",
    "password": "MidoriAdmin2026!"
}

print("Logging in as admin...")
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=30)
print(f"Login status: {response.status_code}")

if response.status_code == 200:
    json_resp = response.json()
    print(f"Success: {json_resp.get('success')}")
    if json_resp.get("success"):
        token = json_resp["data"]["accessToken"]
        print(f"Token: {token[:50]}...")
        # Save token
        with open("admin_token.txt", "w") as f:
            f.write(token)
        print("Token saved to admin_token.txt")
        
        # Test the generate endpoint
        print("\nTesting generate endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "skillType": "GRAMMAR",
            "level": "N5",
            "lessonNumber": 1,
            "count": 2
        }
        resp = requests.post(
            f"{BASE_URL}/api/admin/content-library/ai/generate",
            headers=headers,
            data={"request": json.dumps(data)},
            timeout=180
        )
        print(f"Generate status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
    else:
        print(f"Login failed: {json_resp.get('message')}")
else:
    print(f"Login failed: {response.text}")
