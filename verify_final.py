import json
import requests
import sys
import io

# Fix stdout encoding for Vietnamese characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8080"

# Read token
with open("admin_token.txt", "r") as f:
    token = f.read().strip()

headers = {"Authorization": f"Bearer {token}"}

results = {}

def test(name, data, has_file=False, file_content=None, file_name=None, file_type=None):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print("="*60)
    
    try:
        if has_file:
            files = {
                "request": ("request.json", json.dumps(data, ensure_ascii=False), "application/json"),
                "file": (file_name, file_content, file_type)
            }
        else:
            files = {
                "request": ("request.json", json.dumps(data, ensure_ascii=False), "application/json")
            }
        
        resp = requests.post(
            f"{BASE_URL}/api/admin/content-library/ai/generate",
            headers=headers,
            files=files,
            timeout=180
        )
        
        print(f"HTTP Status: {resp.status_code}")
        
        try:
            json_resp = resp.json()
        except:
            print(f"Raw response (first 200 chars): {resp.text[:200]}")
            results[name] = "FAIL"
            return
        
        success = json_resp.get("success")
        message = json_resp.get("message", "")
        
        if resp.status_code == 200 and success:
            data_resp = json_resp.get("data", {})
            print(f"Success: True")
            print(f"Message: {message}")
            print(f"\nResponse Data Structure:")
            print(f"  skillType: {data_resp.get('skillType', 'MISSING')}")
            print(f"  level: {data_resp.get('level', 'MISSING')}")
            print(f"  vocabularyDraft: {'OK' if data_resp.get('vocabularyDraft') else 'null'}")
            print(f"  grammarDraft: {'OK' if data_resp.get('grammarDraft') else 'null'}")
            print(f"  readingDraft: {'OK' if data_resp.get('readingDraft') else 'null'}")
            
            # Validate based on skillType
            skill_type = data.get("skillType")
            valid = False
            
            if skill_type == "GRAMMAR":
                gp = data_resp.get("grammarDraft")
                if gp:
                    print(f"\nGrammar Draft Detail:")
                    title = gp.get('title', '')
                    desc = gp.get('description', '')
                    print(f"  title: [{title}]")
                    print(f"  description: [{desc[:80] if desc else 'none'}...]")
                    items = gp.get("items", [])
                    print(f"  items: {len(items)} items")
                    if items:
                        first = items[0]
                        gp_text = first.get('grammarPoint', 'MISSING')
                        print(f"  First item grammarPoint: [{gp_text[:50]}...]")
                    valid = bool(title and items)
                    results[f"{name}_draft"] = gp
                    results[f"{name}_raw"] = json.dumps(gp, ensure_ascii=False)
            elif skill_type == "READING":
                rd = data_resp.get("readingDraft")
                if rd:
                    print(f"\nReading Draft Detail:")
                    title = rd.get('title', '')
                    desc = rd.get('description', '')
                    print(f"  title: [{title}]")
                    print(f"  description: [{desc[:80] if desc else 'none'}...]")
                    passages = rd.get("passages", [])
                    print(f"  passages: {len(passages)} items")
                    if passages:
                        first = passages[0]
                        ptitle = first.get('title', 'MISSING')
                        pcontent = first.get('content', 'MISSING')
                        print(f"  First passage title: [{ptitle[:50]}...]")
                        qs = first.get("questions", [])
                        print(f"  First passage questions: {len(qs)} items")
                        if qs:
                            qtext = qs[0].get('questionText', 'MISSING')
                            print(f"  First question text: [{qtext[:50]}...]")
                    valid = bool(title and passages)
                    results[f"{name}_draft"] = rd
                    results[f"{name}_raw"] = json.dumps(rd, ensure_ascii=False)
            
            results[name] = "PASS" if valid else "FAIL"
            print(f"\nResult: {results[name]}")
        else:
            print(f"Success: {success}")
            print(f"Message: {message}")
            results[name] = "FAIL"
            print(f"Result: FAIL")
        
    except Exception as e:
        import traceback
        print(f"EXCEPTION: {e}")
        traceback.print_exc()
        results[name] = "FAIL"
        print(f"Result: FAIL")

# ==============================================================
# TEST 1: Grammar without document
# ==============================================================
data = {
    "skillType": "GRAMMAR",
    "level": "N5",
    "lessonNumber": 1,
    "lessonTitle": "Greetings",
    "topic": "Daily Greeting",
    "itemCount": 2
}
test("Grammar_NoDoc", data)

# ==============================================================
# TEST 2: Grammar with TXT document
# ==============================================================
txt_content = """Japanese Grammar Notes - N5 Level

1. wa particle - Topic marker
   Example: watashi wa gakusei desu (I am a student)
"""

data = {
    "skillType": "GRAMMAR",
    "level": "N5",
    "lessonNumber": 2,
    "lessonTitle": "Topic Marker",
    "topic": "Wa Particle",
    "itemCount": 2
}
test("Grammar_WithTxt", data, has_file=True, 
     file_content=txt_content.encode('utf-8'), 
     file_name="grammar_notes.txt", 
     file_type="text/plain")

# ==============================================================
# TEST 3: Reading without document
# ==============================================================
data = {
    "skillType": "READING",
    "level": "N5",
    "lessonNumber": 1,
    "lessonTitle": "My Daily Life",
    "topic": "Daily Routine",
    "passageCount": 1,
    "questionsPerPassage": 2
}
test("Reading_NoDoc", data)

# ==============================================================
# TEST 4: Reading with PDF document
# ==============================================================
try:
    with open("midori-fe/test-jpvi-vocab.pdf", "rb") as f:
        pdf_content = f.read()
    
    data = {
        "skillType": "READING",
        "level": "N5",
        "lessonNumber": 2,
        "lessonTitle": "Vocab Practice",
        "topic": "Vocabulary comprehension",
        "passageCount": 1,
        "questionsPerPassage": 2
    }
    test("Reading_WithPdf", data, has_file=True,
         file_content=pdf_content,
         file_name="test_doc.pdf",
         file_type="application/pdf")
except FileNotFoundError:
    print(f"\n{'='*60}")
    print("TEST: Reading_WithPdf")
    print("="*60)
    print("SKIP: Test PDF file not found")
    results["Reading_WithPdf"] = "SKIP"

# ==============================================================
# Print Summary
# ==============================================================
print(f"\n{'='*60}")
print("VERIFICATION SUMMARY")
print("="*60)
print(f"Grammar (No Document): {results.get('Grammar_NoDoc', 'N/A')}")
print(f"Grammar (With TXT):    {results.get('Grammar_WithTxt', 'N/A')}")
print(f"Reading (No Document): {results.get('Reading_NoDoc', 'N/A')}")
print(f"Reading (With PDF):    {results.get('Reading_WithPdf', 'N/A')}")

# Draft structure validation
print(f"\n{'='*60}")
print("DRAFT STRUCTURE VALIDATION")
print("="*60)
for name in ["Grammar_NoDoc", "Grammar_WithTxt", "Reading_NoDoc", "Reading_WithPdf"]:
    draft_key = f"{name}_draft"
    raw_key = f"{name}_raw"
    if draft_key in results:
        draft = results[draft_key]
        title_ok = bool(draft.get('title'))
        if "items" in draft:
            items_ok = len(draft.get("items", [])) > 0
        elif "passages" in draft:
            passages = draft.get("passages", [])
            items_ok = len(passages) > 0
        else:
            items_ok = False
        print(f"\n{name}:")
        print(f"  title: {'OK' if title_ok else 'MISSING'}")
        print(f"  items/passages: {'OK' if items_ok else 'MISSING'}")

# Content samples
print(f"\n{'='*60}")
print("DRAFT CONTENT SAMPLES")
print("="*60)
for name in ["Grammar_NoDoc", "Reading_NoDoc"]:
    raw_key = f"{name}_raw"
    if raw_key in results:
        print(f"\n{name} raw JSON (first 800 chars):")
        raw = results[raw_key]
        print(raw[:800])

# Final verdict
passed = sum(1 for v in [results.get(k) for k in ["Grammar_NoDoc", "Grammar_WithTxt", "Reading_NoDoc", "Reading_WithPdf"]] if v == "PASS")
failed = sum(1 for v in [results.get(k) for k in ["Grammar_NoDoc", "Grammar_WithTxt", "Reading_NoDoc", "Reading_WithPdf"]] if v == "FAIL")
skipped = sum(1 for v in [results.get(k) for k in ["Grammar_NoDoc", "Grammar_WithTxt", "Reading_NoDoc", "Reading_WithPdf"]] if v == "SKIP")

print(f"\n{'='*60}")
print(f"FINAL RESULT: {passed} PASS, {failed} FAIL, {skipped} SKIP")
print("="*60)
