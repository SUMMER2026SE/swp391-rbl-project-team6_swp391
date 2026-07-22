import json
import requests
import time
import sys

BASE_URL = "http://localhost:8081"

# Read token
with open("admin_token.txt", "r") as f:
    token = f.read().strip()

headers = {
    "Authorization": f"Bearer {token}"
}

results = {}

def print_test(name, result, details=None):
    print(f"  Result: {result}")
    if details:
        print(f"  Details: {details}")
    results[name] = result

# ==============================================================
# TEST 1: Grammar without document
# ==============================================================
print("\n" + "="*60)
print("TEST 1: Grammar Generation (No Document)")
print("="*60)

try:
    url = f"{BASE_URL}/api/admin/content-library/ai/generate"
    data = {
        "skillType": "GRAMMAR",
        "level": "N5",
        "lessonNumber": 1,
        "count": 3
    }
    
    response = requests.post(
        url,
        headers=headers,
        data={"request": json.dumps(data)},
        timeout=180
    )
    
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        json_resp = response.json()
        print(f"Success: {json_resp.get('success')}")
        print(f"Message: {json_resp.get('message')}")
        
        if json_resp.get("success"):
            draft = json_resp.get("data", {})
            print(f"\nDraft Preview:")
            print(f"  Title: {draft.get('title', 'MISSING')}")
            print(f"  Level: {draft.get('level', 'MISSING')}")
            gp = draft.get("grammarPoints", [])
            print(f"  Grammar Points: {len(gp)} items")
            if gp:
                print(f"    First grammar: {gp[0].get('pattern', 'N/A')[:50]}")
            
            # Validate structure
            valid = bool(draft.get("title") and draft.get("level") and gp)
            print_test("Grammar_NoDoc", "PASS" if valid else "FAIL", f"Valid: {valid}")
            results["Grammar_NoDoc_Draft"] = draft
        else:
            print(f"Error: {json_resp.get('message')}")
            print_test("Grammar_NoDoc", "FAIL", json_resp.get("message"))
    else:
        print(f"Error: {response.text}")
        print_test("Grammar_NoDoc", "FAIL", f"HTTP {response.status_code}")

except Exception as e:
    print(f"EXCEPTION: {e}")
    print_test("Grammar_NoDoc", "FAIL", str(e))

# ==============================================================
# TEST 2: Grammar with TXT document
# ==============================================================
print("\n" + "="*60)
print("TEST 2: Grammar Generation (With TXT Document)")
print("="*60)

try:
    url = f"{BASE_URL}/api/admin/content-library/ai/generate"
    data = {
        "skillType": "GRAMMAR",
        "level": "N5",
        "lessonNumber": 2,
        "count": 3
    }
    
    # Create test TXT content
    txt_content = """Japanese Grammar Notes - N5 Level

1. は (wa) - Topic marker particle
   Used to indicate the topic of a sentence.
   Example: 私は学生です。(Watashi wa gakusei desu.)

2. が (ga) - Subject marker particle
   Used to indicate the subject.
   Example: 猫がいます。(Neko ga imasu.)

3. を (wo) - Object marker particle
   Used to indicate the direct object of a verb.
   Example: ご飯を食べます。(Gohan wo tabemasu.)

4. で (de) - Location/means particle
   Used to indicate location of action or means.
   Example: 学校で行きます。(Gakkou de ikimasu.)

5. に (ni) - Time/destination particle
   Used to indicate time or destination.
   Example: 九時に行きます。(Kuji ni ikimasu.)
"""
    
    files = {
        "request": (None, json.dumps(data), "application/json"),
        "file": ("test_grammar.txt", txt_content, "text/plain")
    }
    
    response = requests.post(
        url,
        headers=headers,
        files=files,
        timeout=180
    )
    
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        json_resp = response.json()
        print(f"Success: {json_resp.get('success')}")
        print(f"Message: {json_resp.get('message')}")
        
        if json_resp.get("success"):
            draft = json_resp.get("data", {})
            print(f"\nDraft Preview:")
            print(f"  Title: {draft.get('title', 'MISSING')}")
            print(f"  Level: {draft.get('level', 'MISSING')}")
            gp = draft.get("grammarPoints", [])
            print(f"  Grammar Points: {len(gp)} items")
            
            valid = bool(draft.get("title") and draft.get("level") and gp)
            print_test("Grammar_WithTxt", "PASS" if valid else "FAIL", f"Valid: {valid}")
            results["Grammar_WithTxt_Draft"] = draft
        else:
            print(f"Error: {json_resp.get('message')}")
            print_test("Grammar_WithTxt", "FAIL", json_resp.get("message"))
    else:
        print(f"Error: {response.text[:500]}")
        print_test("Grammar_WithTxt", "FAIL", f"HTTP {response.status_code}")

except Exception as e:
    print(f"EXCEPTION: {e}")
    print_test("Grammar_WithTxt", "FAIL", str(e))

# ==============================================================
# TEST 3: Reading without document
# ==============================================================
print("\n" + "="*60)
print("TEST 3: Reading Generation (No Document)")
print("="*60)

try:
    url = f"{BASE_URL}/api/admin/content-library/ai/generate"
    data = {
        "skillType": "READING",
        "level": "N5",
        "lessonNumber": 1,
        "count": 3
    }
    
    response = requests.post(
        url,
        headers=headers,
        data={"request": json.dumps(data)},
        timeout=180
    )
    
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        json_resp = response.json()
        print(f"Success: {json_resp.get('success')}")
        print(f"Message: {json_resp.get('message')}")
        
        if json_resp.get("success"):
            draft = json_resp.get("data", {})
            print(f"\nDraft Preview:")
            print(f"  Title: {draft.get('title', 'MISSING')}")
            print(f"  Level: {draft.get('level', 'MISSING')}")
            qs = draft.get("questions", [])
            print(f"  Questions: {len(qs)} items")
            if qs:
                print(f"    First question: {str(qs[0])[:100]}")
            
            valid = bool(draft.get("title") and draft.get("level"))
            print_test("Reading_NoDoc", "PASS" if valid else "FAIL", f"Valid: {valid}")
            results["Reading_NoDoc_Draft"] = draft
        else:
            print(f"Error: {json_resp.get('message')}")
            print_test("Reading_NoDoc", "FAIL", json_resp.get("message"))
    else:
        print(f"Error: {response.text[:500]}")
        print_test("Reading_NoDoc", "FAIL", f"HTTP {response.status_code}")

except Exception as e:
    print(f"EXCEPTION: {e}")
    print_test("Reading_NoDoc", "FAIL", str(e))

# ==============================================================
# TEST 4: Reading with PDF document
# ==============================================================
print("\n" + "="*60)
print("TEST 4: Reading Generation (With PDF Document)")
print("="*60)

try:
    url = f"{BASE_URL}/api/admin/content-library/ai/generate"
    data = {
        "skillType": "READING",
        "level": "N5",
        "lessonNumber": 2,
        "count": 3
    }
    
    # Use existing test PDF
    pdf_path = "midori-fe/test-jpvi-vocab.pdf"
    
    with open(pdf_path, "rb") as f:
        pdf_content = f.read()
    
    files = {
        "request": (None, json.dumps(data), "application/json"),
        "file": ("test_reading.pdf", pdf_content, "application/pdf")
    }
    
    response = requests.post(
        url,
        headers=headers,
        files=files,
        timeout=180
    )
    
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        json_resp = response.json()
        print(f"Success: {json_resp.get('success')}")
        print(f"Message: {json_resp.get('message')}")
        
        if json_resp.get("success"):
            draft = json_resp.get("data", {})
            print(f"\nDraft Preview:")
            print(f"  Title: {draft.get('title', 'MISSING')}")
            print(f"  Level: {draft.get('level', 'MISSING')}")
            qs = draft.get("questions", [])
            print(f"  Questions: {len(qs)} items")
            
            valid = bool(draft.get("title") and draft.get("level"))
            print_test("Reading_WithPdf", "PASS" if valid else "FAIL", f"Valid: {valid}")
            results["Reading_WithPdf_Draft"] = draft
        else:
            print(f"Error: {json_resp.get('message')}")
            print_test("Reading_WithPdf", "FAIL", json_resp.get("message"))
    else:
        print(f"Error: {response.text[:500]}")
        print_test("Reading_WithPdf", "FAIL", f"HTTP {response.status_code}")

except FileNotFoundError:
    print(f"PDF file not found: {pdf_path}")
    print_test("Reading_WithPdf", "SKIP", "PDF not found")
except Exception as e:
    print(f"EXCEPTION: {e}")
    print_test("Reading_WithPdf", "FAIL", str(e))

# ==============================================================
# Print Summary
# ==============================================================
print("\n" + "="*60)
print("VERIFICATION SUMMARY")
print("="*60)
print(f"\nGrammar (No Document): {results.get('Grammar_NoDoc', 'N/A')}")
print(f"Grammar (With TXT):    {results.get('Grammar_WithTxt', 'N/A')}")
print(f"Reading (No Document): {results.get('Reading_NoDoc', 'N/A')}")
print(f"Reading (With PDF):    {results.get('Reading_WithPdf', 'N/A')}")

print("\n" + "="*60)
print("DRAFT STRUCTURE VALIDATION")
print("="*60)

for key in ["Grammar_NoDoc_Draft", "Grammar_WithTxt_Draft", "Reading_NoDoc_Draft", "Reading_WithPdf_Draft"]:
    if key in results:
        draft = results[key]
        print(f"\n{key}:")
        print(f"  title: {'OK' if draft.get('title') else 'MISSING'}")
        print(f"  level: {'OK' if draft.get('level') else 'MISSING'}")
        if "grammarPoints" in draft:
            gp = draft.get("grammarPoints", [])
            print(f"  grammarPoints: OK ({len(gp)} items)")
        if "questions" in draft:
            qs = draft.get("questions", [])
            print(f"  questions: OK ({len(qs)} items)")

print("\n" + "="*60)
print("DRAFT CONTENT SAMPLES")
print("="*60)

for key in ["Grammar_NoDoc_Draft", "Reading_NoDoc_Draft"]:
    if key in results:
        draft = results[key]
        print(f"\n{key} - First 500 chars:")
        print(json.dumps(draft, indent=2, ensure_ascii=False)[:500])

# ==============================================================
# Final verdict
# ==============================================================
passed = sum(1 for v in results.values() if v == "PASS")
failed = sum(1 for v in results.values() if v == "FAIL")
skipped = sum(1 for v in results.values() if v == "SKIP")

print("\n" + "="*60)
print(f"FINAL: {passed} PASS, {failed} FAIL, {skipped} SKIP")
print("="*60)
