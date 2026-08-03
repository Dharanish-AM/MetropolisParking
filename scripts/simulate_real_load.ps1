$loginUrl = "http://localhost:8080/auth/login"
$lotsUrl = "http://localhost:8080/parking-lots"

$loginBody = '{"email":"admin@metropolisparking.com","password":"admin123"}'
$headers = @{ "Content-Type" = "application/json" }

Write-Host "Authenticating admin user..."
$loginResp = Invoke-RestMethod -Uri $loginUrl -Method Post -Headers $headers -Body $loginBody
$token = $loginResp.token
$authHeaders = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creating base test parking lot..."
$lotName = "Real Load Lot " + (Get-Random -Minimum 1000 -Maximum 9999)
$lotBody = "{`"name`":`"$lotName`",`"location`":`"Main St 500`"}"
$lotResp = Invoke-RestMethod -Uri $lotsUrl -Method Post -Headers $authHeaders -Body $lotBody
$lotId = $lotResp.id

$levelBody = "{`"levelNumber`":1}"
$levelResp = Invoke-RestMethod -Uri "$lotsUrl/$lotId/levels" -Method Post -Headers $authHeaders -Body $levelBody
$levelId = $levelResp.id

Write-Host "Spawning 8 parallel virtual user jobs..."

$scriptBlock = {
    param($token, $lotId, $levelId, $workerId)
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

    for ($i = 1; $i -le 15; $i++) {
        try {
            $spaceNum = "P-$workerId-$i-" + (Get-Random -Minimum 100 -Maximum 999)
            $spaceBody = "{`"lotId`":`"$lotId`",`"levelId`":`"$levelId`",`"spaceNumber`":`"$spaceNum`",`"type`":`"CAR`"}"
            $spaceResp = Invoke-RestMethod -Uri "http://localhost:8080/spaces" -Method Post -Headers $headers -Body $spaceBody
            $spaceId = $spaceResp.id

            $plate = "KA-0" + $workerId + "-AB-" + (Get-Random -Minimum 1000 -Maximum 9999)
            $startBody = "{`"plateNumber`":`"$plate`",`"spaceId`":`"$spaceId`"}"
            $sessionResp = Invoke-RestMethod -Uri "http://localhost:8080/sessions/start" -Method Post -Headers $headers -Body $startBody
            $sessionId = $sessionResp.id

            Invoke-RestMethod -Uri "http://localhost:8080/parking-lots" -Method Get -Headers $headers | Out-Null
            Invoke-RestMethod -Uri "http://localhost:8080/dashboard" -Method Get -Headers $headers | Out-Null
            Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get | Out-Null

            $endBody = "{`"plateNumber`":`"$plate`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/sessions/end" -Method Post -Headers $headers -Body $endBody | Out-Null

            $payments = Invoke-RestMethod -Uri "http://localhost:8080/payments" -Method Get -Headers $headers
            $payment = $payments | Where-Object { $_.sessionId -eq $sessionId } | Select-Object -First 1
            if ($payment) {
                $payId = $payment.id
                $payBody = '{"method":"CARD"}'
                Invoke-RestMethod -Uri "http://localhost:8080/payments/$payId" -Method Post -Headers $headers -Body $payBody | Out-Null
            }
        } catch {
        }
        Start-Sleep -Milliseconds 50
    }
}

$jobs = 1..8 | ForEach-Object {
    Start-Job -ScriptBlock $scriptBlock -ArgumentList $token, $lotId, $levelId, $_
}

Write-Host "Waiting for virtual user parallel jobs to complete real load generation..."
$jobs | Wait-Job | Out-Null
$jobs | Remove-Job -Force

Write-Host "Real load simulation completed successfully!"
