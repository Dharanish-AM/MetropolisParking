---
name: powershell-gotchas
description: Critical PowerShell behavioral differences that affect common dev tasks — command chaining, dollar-sign escaping in psql, and running tools via Docker pipes.
---

# PowerShell Gotchas Cheatsheet

## Command Chaining

PowerShell does NOT support `&&` as a statement separator. Use `;` instead.

**Correct:**
```powershell
git add .; git commit -m "feat: my change"; git push origin develop
```

**Wrong (will throw a parser error):**
```powershell
git add . && git commit -m "feat: my change"
```

## Dollar-Sign Escaping in psql via PowerShell

When running `docker exec ... psql -c "..."` in PowerShell, any `$` inside the double-quoted string is treated as a PowerShell variable and expands to empty string.

This is especially dangerous with BCrypt hashes which contain multiple `$` characters.

**Symptom**: BCrypt hash stored in DB becomes truncated/empty, login fails with 401.

**Fix — backtick-escape every `$`:**
```powershell
docker exec metropolis-db psql -U postgres -d metropolis_parking -c `
  "UPDATE users SET password_hash='`$2a`$10`$lM5RrT7xN7WIK0xSFvGz9.Ti.mEya.AJjVpTPlXhAkz0IYvSdI9jy' WHERE email='admin@metropolisparking.com'"
```

**Preferred fix — pipe SQL via stdin:**
```powershell
"UPDATE users SET password_hash='...' WHERE email='admin@...';" | docker exec -i metropolis-db psql -U postgres -d metropolis_parking
```

## Running k6 Without a Local Install

```powershell
Get-Content .\scripts\k6-load-test.js | docker run --rm -i --net=host -e BASE_URL="http://localhost:8080" grafana/k6 run -
```
