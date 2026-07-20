# KANJIDIC2.xml Setup Guide

This document explains how to obtain and configure the `KANJIDIC2.xml` file required for the MIDORI Japanese dictionary application.

---

## 1. Purpose of KANJIDIC2.xml

`KANJIDIC2.xml` is a comprehensive dictionary file containing information about Japanese Kanji characters (Hanzi/Hanja). It includes:

- **Character readings**: Kun'yomi (Chinese-derived readings), On'yomi (Japanese-native readings)
- **Meanings**: English translations of Kanji meanings
- **Stroke counts**: Number of strokes for each character
- **Radical information**: Traditional radical classification
- **Stroke order codes**: References to stroke order data
- **JLPT levels**: Japanese Language Proficiency Test classification
- **Grade levels**: School grade in which each Kanji is taught

This file is essential for:
- Kanji lookup and display in the dictionary
- Stroke order animation
- Kanji filtering by JLPT level or grade
- Reading pronunciation support

---

## 2. Why This File Is Not on GitHub

| Reason | Explanation |
|--------|-------------|
| **File Size** | KANJIDIC2.xml is approximately 15-20 MB (uncompressed XML), which would significantly bloat the repository |
| **Third-Party Data** | This is licensed data from the Electronic Dictionary Research and Development Group (EDRDG) |
| **Not Source Code** | It is runtime data, not project source code that needs version control |
| **Frequent Updates** | EDRDG releases updates periodically; teams should download the latest version independently |
| **License Requirements** | The file comes with its own license that requires attribution |

---

## 3. File Location

After downloading, place the file at:

```
midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml
```

Expected full path:
```
D:\swp1\swp391-rbl-project-team6_swp391\midori-be\src\main\resources\dictionary\sudachi\KANJIDIC2.xml
```

> **Note**: The `sudachi` folder contains Japanese linguistic resources used by the dictionary system.

---

## 4. Downloading KANJIDIC2.xml

### Official Source

The file is maintained by the **Electronic Dictionary Research and Development Group (EDRDG)**:

**Download URL**: https://www.edrdg.org/wiki/index.php/KANJIDIC2

### Direct Download Link

You can download the file directly from:
```
https://www.edrdg.org/kanjidict/kanjiapi/2024/kanjidic2.xml
```

Or the compressed version:
```
https://www.edrdg.org/kanjidict/kanjiapi/2024/kanjidic2.xml.gz
```

### File Format

- **Format**: XML (UTF-8 encoded)
- **Encoding**: UTF-8
- **Compression**: Available as `.xml` or `.xml.gz` (gzip compressed)

---

## 5. Setup Steps After Cloning

Follow these steps when you first clone the repository:

### Step 1: Ensure the dictionary directory exists

```powershell
# Navigate to the backend resources directory
cd midori-be/src/main/resources

# Create the sudachi directory if it doesn't exist
New-Item -ItemType Directory -Path "dictionary/sudachi" -Force
```

### Step 2: Download the file

**Option A: Direct download with PowerShell**

```powershell
# Download the XML file
Invoke-WebRequest -Uri "https://www.edrdg.org/kanjidict/kanjiapi/2024/kanjidic2.xml" `
    -OutFile "midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml"
```

**Option B: Download and extract the compressed version**

```powershell
# Download the compressed file
Invoke-WebRequest -Uri "https://www.edrdg.org/kanjidict/kanjiapi/2024/kanjidic2.xml.gz" `
    -OutFile "$env:TEMP\kanjidic2.xml.gz"

# Extract using .NET
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory(
    "$env:TEMP\kanjidic2.xml.gz",
    "midori-be/src/main/resources/dictionary/sudachi"
)

# Rename if needed
Rename-Item "midori-be/src/main/resources/dictionary/sudachi/kanjidic2.xml" "KANJIDIC2.xml" -ErrorAction SilentlyContinue

# Cleanup
Remove-Item "$env:TEMP\kanjidic2.xml.gz" -ErrorAction SilentlyContinue
```

**Option C: Manual download**

1. Visit https://www.edrdg.org/wiki/index.php/KANJIDIC2
2. Click the download link for the XML file
3. Save as `KANJIDIC2.xml`
4. Place in `midori-be/src/main/resources/dictionary/sudachi/`

### Step 3: Verify the file

```powershell
# Check if file exists
Test-Path "midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml"

# Check file size (should be several MB)
Get-Item "midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml" | Select-Object Name, Length

# Verify it's valid XML (first 10 lines)
Get-Content "midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml" -TotalCount 10
```

Expected first line:
```xml
<?xml version="1.0" encoding="UTF-8"?>
```

---

## 6. Verifying the Application Recognizes the File

### Check Application Logs

When the application starts with `--import-kanji` flag, look for:

```
Using default KANJIC2 file path: .../KANJIDIC2.xml
```

Or if using classpath:
```
Using classpath resource for KANJIDIC2.xml
```

### Test Kanji Lookup

1. Start the backend
2. Search for a known Kanji (e.g., "食" or "飲")
3. Check if stroke count and readings are displayed

### Run Dictionary Import (Optional)

To explicitly import Kanji data:

```powershell
cd midori-be
mvn spring-boot:run -Dspring-boot.run.arguments="--import-kanji"
```

---

## 7. Common Errors and Solutions

### Error: "Could not find KANJIDIC2.xml in default file path or classpath resources!"

**Cause**: The file is missing from the expected location.

**Solution**:
1. Verify the file exists at `midori-be/src/main/resources/dictionary/sudachi/KANJIDIC2.xml`
2. Download the file following Section 5 above
3. Restart the application

### Error: "File not found" or "Access denied"

**Cause**: Incorrect file path or permission issues.

**Solution**:
1. Check that the `dictionary/sudachi/` folder exists
2. Verify the file name is exactly `KANJIDIC2.xml` (case-sensitive on some systems)
3. Ensure the file is not empty or corrupted
4. Try running PowerShell as Administrator if permission issues persist

### Error: XML parsing error

**Cause**: The file may be corrupted or not a valid XML file.

**Solution**:
1. Re-download the file from the official source
2. Verify the file starts with `<?xml version="1.0" encoding="UTF-8"?>`
3. Try the compressed version which is less likely to be corrupted during download

### Application starts but Kanji data is missing

**Cause**: The import step may have failed silently.

**Solution**:
1. Check application logs for any errors during `--import-kanji`
2. Verify database contains `kanji` table entries
3. Manually run the import command

---

## 8. License and Attribution

KANJIDIC2 is provided by the **Electronic Dictionary Research and Development Group (EDRDG)**.

When using this file, you should include the following attribution:

> "Kanji dictionary data is from the KANJIDIC2 file created by Jim Breen and made available by the Electronic Dictionary Research and Development Group (EDRDG)."

For more information about the license and usage terms, visit:
- **KANJIDIC2 Project Page**: https://www.edrdg.org/wiki/index.php/KANJIDIC2
- **License Information**: https://www.edrdg.org/edrdg/licence.html

---

## 9. Related Files

The dictionary system also uses these files in `src/main/resources/dictionary/`:

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `JMdict.xml` | Main Japanese-English dictionary | Yes (smaller file) |
| `KANJIDIC2.xml` | Kanji character information | **No** (download separately) |
| `grammar/*.json` | Grammar pattern data | Yes |
| `kanjivg/*.svg` | Kanji stroke order SVGs | Yes |

---

## 10. Need Help?

If you encounter issues not covered here:

1. Check the [LOCAL_SETUP.md](../LOCAL_SETUP.md) for general setup help
2. Ask your team leader or post in the team channel
3. Verify your internet connection when downloading
4. Check if your antivirus is blocking the download

---

*Last updated: July 2026*
