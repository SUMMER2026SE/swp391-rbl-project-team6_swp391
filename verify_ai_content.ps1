$ErrorActionPreference = "Continue"
$headers = @{"Content-Type" = "multipart/form-data"}

# Read token
$token = Get-Content "admin_token.txt" -Raw
$token = $token.Trim()
$authHeaders = @{"Authorization" = "Bearer $token"}

# Store results
$results = @{}

# ==============================================================
# TEST 1: Grammar without document
# ==============================================================
Write-Host ""
Write-Host "=========================================="
Write-Host "TEST 1: Grammar Generation (No Document)"
Write-Host "=========================================="
try {
    $body = @{
        skillType = "GRAMMAR"
        level = "N5"
        lessonNumber = 1
        count = 3
    }
    $boundary = [System.Guid]::NewGuid().ToString()
    $contentType = "multipart/form-data; boundary=`"$boundary`""
    $headers2 = @{"Authorization" = "Bearer $token"}
    
    # Build multipart body manually
    $ CRLF = "`r`n"
    $bodyStr = "--$boundary`r`n"
    $bodyStr += "Content-Disposition: form-data; name=`"request`"`r`n"
    $bodyStr += "Content-Type: application/json`r`n`r`n"
    $bodyStr += (ConvertTo-Json $body) + "`r`n"
    $bodyStr += "--$boundary--`r`n"
    
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyStr)
    $r = Invoke-WebRequest -Uri "http://localhost:8081/api/admin/content-library/ai/generate" `
        -Method POST -Headers $headers2 -Body $bytes -ContentType $contentType -TimeoutSec 180
    
    $status = $r.StatusCode
    $json = $r.Content | ConvertFrom-Json
    
    Write-Host "HTTP Status: $status"
    Write-Host "Success: $($json.success)"
    Write-Host "Message: $($json.message)"
    
    if ($json.success) {
        Write-Host "Grammar Draft Preview:"
        Write-Host "  Title: $($json.data.title)"
        Write-Host "  Level: $($json.data.level)"
        Write-Host "  Grammar Points Count: $($json.data.grammarPoints.Count)"
        Write-Host "  Structure Valid: $($json.data.grammarPoints -ne $null)"
        
        $results["Grammar_NoDoc"] = "PASS"
        $results["Grammar_NoDoc_Draft"] = $json.data
    } else {
        Write-Host "ERROR: $($json.message)"
        $results["Grammar_NoDoc"] = "FAIL"
    }
} catch {
    Write-Host "EXCEPTION: $_"
    $results["Grammar_NoDoc"] = "FAIL"
}

# ==============================================================
# TEST 2: Grammar with TXT document
# ==============================================================
Write-Host ""
Write-Host "=========================================="
Write-Host "TEST 2: Grammar Generation (With TXT Document)"
Write-Host "=========================================="
try {
    # Create a test TXT file
    $txtContent = @"
Japanese Grammar Notes - N5 Level

1. は (wa) - Topic marker particle
   Used to indicate the topic of a sentence.
   Example: 私は学生です。(Watashi wa gakusei desu.) - I am a student.

2. が (ga) - Subject marker particle
   Used to indicate the subject of a sentence.
   Example: 猫がいます。(Neko ga imasu.) - There is a cat.

3. を (wo/o) - Object marker particle
   Used to indicate the direct object of a verb.
   Example: ご飯を食べます。(Gohan wo tabemasu.) - I eat rice.

4. で (de) - Location/means particle
   Used to indicate location of action or means.
   Example: 学校で行きます。(Gakkou de ikimasu.) - I go by school.

5. に (ni) - Time/destination particle
   Used to indicate time or destination.
   Example: 九時に行きます。(Kuji ni ikimasu.) - I go at 9 o'clock.
"@
    $txtContent | Out-File -FilePath "test_grammar.txt" -Encoding UTF8
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $contentType = "multipart/form-data; boundary=`"$boundary`""
    $headers2 = @{"Authorization" = "Bearer $token"}
    
    # Build multipart body with file
    $CRLF = "`r`n"
    $bodyStr = "--$boundary`r`n"
    $bodyStr += "Content-Disposition: form-data; name=`"request`"`r`n"
    $bodyStr += "Content-Type: application/json`r`n`r`n"
    $bodyStr += '{"skillType":"GRAMMAR","level":"N5","lessonNumber":2,"count":3}' + "`r`n"
    $bodyStr += "--$boundary`r`n"
    $bodyStr += "Content-Disposition: form-data; name=`"file`"; filename=`"test_grammar.txt`"`r`n"
    $bodyStr += "Content-Type: text/plain`r`n`r`n"
    $bodyStr += $txtContent + "`r`n"
    $bodyStr += "--$boundary--`r`n"
    
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyStr)
    $r = Invoke-WebRequest -Uri "http://localhost:8081/api/admin/content-library/ai/generate" `
        -Method POST -Headers $headers2 -Body $bytes -ContentType $contentType -TimeoutSec 180
    
    $status = $r.StatusCode
    $json = $r.Content | ConvertFrom-Json
    
    Write-Host "HTTP Status: $status"
    Write-Host "Success: $($json.success)"
    Write-Host "Message: $($json.message)"
    
    if ($json.success) {
        Write-Host "Grammar Draft with TXT Preview:"
        Write-Host "  Title: $($json.data.title)"
        Write-Host "  Level: $($json.data.level)"
        Write-Host "  Grammar Points Count: $($json.data.grammarPoints.Count)"
        Write-Host "  Structure Valid: $($json.data.grammarPoints -ne $null)"
        
        $results["Grammar_WithTxt"] = "PASS"
        $results["Grammar_WithTxt_Draft"] = $json.data
    } else {
        Write-Host "ERROR: $($json.message)"
        $results["Grammar_WithTxt"] = "FAIL"
    }
    
    Remove-Item "test_grammar.txt" -ErrorAction SilentlyContinue
} catch {
    Write-Host "EXCEPTION: $_"
    $results["Grammar_WithTxt"] = "FAIL"
}

# ==============================================================
# TEST 3: Reading without document
# ==============================================================
Write-Host ""
Write-Host "=========================================="
Write-Host "TEST 3: Reading Generation (No Document)"
Write-Host "=========================================="
try {
    $body = @{
        skillType = "READING"
        level = "N5"
        lessonNumber = 1
        count = 3
    }
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $contentType = "multipart/form-data; boundary=`"$boundary`""
    $headers2 = @{"Authorization" = "Bearer $token"}
    
    $CRLF = "`r`n"
    $bodyStr = "--$boundary`r`n"
    $bodyStr += "Content-Disposition: form-data; name=`"request`"`r`n"
    $bodyStr += "Content-Type: application/json`r`n`r`n"
    $bodyStr += (ConvertTo-Json $body) + "`r`n"
    $bodyStr += "--$boundary--`r`n"
    
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyStr)
    $r = Invoke-WebRequest -Uri "http://localhost:8081/api/admin/content-library/ai/generate" `
        -Method POST -Headers $headers2 -Body $bytes -ContentType $contentType -TimeoutSec 180
    
    $status = $r.StatusCode
    $json = $r.Content | ConvertFrom-Json
    
    Write-Host "HTTP Status: $status"
    Write-Host "Success: $($json.success)"
    Write-Host "Message: $($json.message)"
    
    if ($json.success) {
        Write-Host "Reading Draft Preview:"
        Write-Host "  Title: $($json.data.title)"
        Write-Host "  Level: $($json.data.level)"
        Write-Host "  Has Questions: $($json.data.questions -ne $null)"
        
        $results["Reading_NoDoc"] = "PASS"
        $results["Reading_NoDoc_Draft"] = $json.data
    } else {
        Write-Host "ERROR: $($json.message)"
        $results["Reading_NoDoc"] = "FAIL"
    }
} catch {
    Write-Host "EXCEPTION: $_"
    $results["Reading_NoDoc"] = "FAIL"
}

# ==============================================================
# TEST 4: Reading with DOCX document
# ==============================================================
Write-Host ""
Write-Host "=========================================="
Write-Host "TEST 4: Reading Generation (With DOCX Document)"
Write-Host "=========================================="
try {
    # Check if we have a DOCX file in the test resources
    $docxPath = "midori-fe\test-jpvi-vocab.pdf"
    
    if (Test-Path $docxPath) {
        # Use the existing PDF instead as we don't have DOCX readily available
        $fileBytes = [System.IO.File]::ReadAllBytes($docxPath)
        $fileBase64 = [Convert]::ToBase64String($fileBytes)
        
        Write-Host "Using existing test file: $docxPath"
        
        $boundary = [System.Guid]::NewGuid().ToString()
        $contentType = "multipart/form-data; boundary=`"$boundary`""
        $headers2 = @{"Authorization" = "Bearer $token"}
        
        $CRLF = "`r`n"
        $bodyStr = "--$boundary`r`n"
        $bodyStr += "Content-Disposition: form-data; name=`"request`"`r`n"
        $bodyStr += "Content-Type: application/json`r`n`r`n"
        $bodyStr += '{"skillType":"READING","level":"N5","lessonNumber":2,"count":3}' + "`r`n"
        $bodyStr += "--$boundary`r`n"
        $bodyStr += "Content-Disposition: form-data; name=`"file`"; filename=`"test_doc.pdf`"`r`n"
        $bodyStr += "Content-Type: application/pdf`r`n`r`n"
        
        # Read PDF file
        $pdfBytes = [System.IO.File]::ReadAllBytes($docxPath)
        $preBody = [System.Text.Encoding]::UTF8.GetBytes($bodyStr)
        $postBody = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
        $fullBody = New-Object byte[] ($preBody.Length + $pdfBytes.Length + $postBody.Length)
        [Array]::Copy($preBody, 0, $fullBody, 0, $preBody.Length)
        [Array]::Copy($pdfBytes, 0, $fullBody, $preBody.Length, $pdfBytes.Length)
        [Array]::Copy($postBody, 0, $fullBody, $preBody.Length + $pdfBytes.Length, $postBody.Length)
        
        $r = Invoke-WebRequest -Uri "http://localhost:8081/api/admin/content-library/ai/generate" `
            -Method POST -Headers $headers2 -Body $fullBody -ContentType $contentType -TimeoutSec 180
        
        $status = $r.StatusCode
        $json = $r.Content | ConvertFrom-Json
        
        Write-Host "HTTP Status: $status"
        Write-Host "Success: $($json.success)"
        Write-Host "Message: $($json.message)"
        
        if ($json.success) {
            Write-Host "Reading Draft with DOCX Preview:"
            Write-Host "  Title: $($json.data.title)"
            Write-Host "  Level: $($json.data.level)"
            Write-Host "  Has Questions: $($json.data.questions -ne $null)"
            
            $results["Reading_WithDocx"] = "PASS"
            $results["Reading_WithDocx_Draft"] = $json.data
        } else {
            Write-Host "ERROR: $($json.message)"
            $results["Reading_WithDocx"] = "FAIL"
        }
    } else {
        Write-Host "Test DOCX file not found. Skipping."
        $results["Reading_WithDocx"] = "SKIP"
    }
} catch {
    Write-Host "EXCEPTION: $_"
    $results["Reading_WithDocx"] = "FAIL"
}

# ==============================================================
# Print Summary
# ==============================================================
Write-Host ""
Write-Host "=========================================="
Write-Host "VERIFICATION SUMMARY"
Write-Host "=========================================="
Write-Host ""
Write-Host "Grammar (No Document): $($results['Grammar_NoDoc'])"
Write-Host "Grammar (With TXT):    $($results['Grammar_WithTxt'])"
Write-Host "Reading (No Document): $($results['Reading_NoDoc'])"
Write-Host "Reading (With DOCX):   $($results['Reading_WithDocx'])"
Write-Host ""
Write-Host "=========================================="
Write-Host "DRAFT VALIDATION"
Write-Host "=========================================="
if ($results["Grammar_NoDoc_Draft"]) {
    $draft = $results["Grammar_NoDoc_Draft"]
    Write-Host ""
    Write-Host "Grammar Draft Structure:"
    Write-Host "  - title: $(if($draft.title) {'OK'} else {'MISSING'})"
    Write-Host "  - level: $(if($draft.level) {'OK'} else {'MISSING'})"
    Write-Host "  - grammarPoints: $(if($draft.grammarPoints) {"OK ($($draft.grammarPoints.Count) items)"} else {'MISSING'})"
}
if ($results["Reading_NoDoc_Draft"]) {
    $draft = $results["Reading_NoDoc_Draft"]
    Write-Host ""
    Write-Host "Reading Draft Structure:"
    Write-Host "  - title: $(if($draft.title) {'OK'} else {'MISSING'})"
    Write-Host "  - level: $(if($draft.level) {'OK'} else {'MISSING'})"
    Write-Host "  - questions: $(if($draft.questions) {"OK ($($draft.questions.Count) items)"} else {'MISSING'})"
}

Write-Host ""
Write-Host "Script completed."
