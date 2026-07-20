# Dictionary Setup

These files are **not committed to Git** because they are large third-party resources.
Download them manually before running the Dictionary Importer.

## Required files

### 1. JMdict

- Official source: https://www.edrdg.org/jmdict/j_jmdict.html
- Download: `JMdict_e.xml` (or the latest Unicode UTF-8 version)
- Rename to: `JMdict.xml`
- Place at: `midori-be/src/main/resources/dictionary/JMdict.xml`

### 2. KANJIDIC2

- Official source: https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- Download: `kanjidic2.xml`
- Rename to: `KANJIDIC2.xml`
- Place at: `midori-be/src/main/resources/dictionary/KANJIDIC2.xml`

## Expected folder structure

```text
midori-be/src/main/resources/dictionary/
├── JMdict.xml
└── KANJIDIC2.xml
```

## Validation

The app validates these resources on startup using `DictionaryResourceValidator`.
If a file is missing, startup fails fast with a clear error and download link.
