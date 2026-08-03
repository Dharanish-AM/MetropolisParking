$headers = @{ "Content-Type" = "application/json" }
$body = '{"email":"admin@metropolis.com","password":"AdminPassword123!"}'

for ($i = 1; $i -le 30; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post -Headers $headers -Body $body | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8080/parking-lots" -Method Get | Out-Null
    } catch {
    }
    Start-Sleep -Milliseconds 200
}
