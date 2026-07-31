#!/usr/bin/env sh
set -eu

blocked_files="
midori-be/ResetPassword.java
"

for file in $blocked_files; do
  if git diff --cached --name-only --diff-filter=ACMR | grep -Fxq "$file"; then
    echo "ERROR: blocked sensitive file is staged: $file" >&2
    exit 1
  fi
done

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"

if [ -z "$staged_files" ]; then
  exit 0
fi

for file in $staged_files; do
  [ -f "$file" ] || continue

  case "$file" in
    scripts/check-sensitive-files.sh)
      # The checker contains its own secret-detection patterns.
      # Skip self-scanning to prevent false positives.
      continue
      ;;
    *.class)
      echo "ERROR: compiled Java artifact is staged: $file" >&2
      exit 1
      ;;
  esac

  if git show ":$file" 2>/dev/null | grep -Eiq -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY[[:space:]]*[:=][[:space:]]*[^$<{]|DB_PASSWORD[[:space:]]*[:=][[:space:]]*[^$<{]|SMTP_PASSWORD[[:space:]]*[:=][[:space:]]*[^$<{]|GROQ_API_KEY[[:space:]]*[:=][[:space:]]*[^$<{]|jdbc:postgresql://[^[:space:]]+:[^[:space:]]+@'; then
    echo "ERROR: possible hard-coded secret detected in staged file: $file" >&2
    echo "Commit blocked. Move credentials to environment variables." >&2
    exit 1
  fi
done

echo "Sensitive-file check passed."
