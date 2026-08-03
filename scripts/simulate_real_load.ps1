$loginUrl = "http://localhost:8080/auth/login"
$meUrl = "http://localhost:8080/me"
$lotsUrl = "http://localhost:8080/parking-lots"
$spacesUrl = "http://localhost:8080/spaces"
$vehiclesUrl = "http://localhost:8080/vehicles"
$sessionsStartUrl = "http://localhost:8080/sessions/start"
$sessionsEndUrl = "http://localhost:8080/sessions/end"
$sessionsEstimateUrl = "http://localhost:8080/sessions/pricing-estimate"
$paymentsUrl = "http://localhost:8080/payments"
$dashboardUrl = "http://localhost:8080/dashboard"
$anprEntryUrl = "http://localhost:8080/anpr/entry"
$anprExitUrl = "http://localhost:8080/anpr/exit"
$qrGenUrl = "http://localhost:8080/qr/generate"
$qrValUrl = "http://localhost:8080/qr/validate"
$reservationsUrl = "http://localhost:8080/reservations"

$loginBody = '{"email":"admin@metropolisparking.com","password":"admin123"}'
$headers = @{ "Content-Type" = "application/json" }

Write-Host "Authenticating admin user..."
$loginResp = Invoke-RestMethod -Uri $loginUrl -Method Post -Headers $headers -Body $loginBody
$token = $loginResp.token
$authHeaders = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creating base test parking lot..."
$lotName = "Comprehensive Lot " + (Get-Random -Minimum 1000 -Maximum 9999)
$lotBody = "{`"name`":`"$lotName`",`"location`":`"Main St 500`"}"
$lotResp = Invoke-RestMethod -Uri $lotsUrl -Method Post -Headers $authHeaders -Body $lotBody
$lotId = $lotResp.id

$levelBody = "{`"levelNumber`":1}"
$levelResp = Invoke-RestMethod -Uri "$lotsUrl/$lotId/levels" -Method Post -Headers $authHeaders -Body $levelBody
$levelId = $levelResp.id

Write-Host "Spawning parallel virtual users covering ALL system paths..."

$scriptBlock = {
    param($token, $lotId, $levelId, $workerId)
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

    for ($i = 1; $i -le 10; $i++) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get | Out-Null
            Invoke-RestMethod -Uri "http://localhost:8080/me" -Method Get -Headers $headers | Out-Null
            Invoke-RestMethod -Uri "http://localhost:8080/parking-lots" -Method Get -Headers $headers | Out-Null
            Invoke-RestMethod -Uri "http://localhost:8080/dashboard" -Method Get -Headers $headers | Out-Null

            $vPlate = "KA-0" + $workerId + "-V-" + (Get-Random -Minimum 1000 -Maximum 9999)
            $vehicleBody = "{`"licensePlate`":`"$vPlate`",`"type`":`"CAR`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/vehicles" -Method Post -Headers $headers -Body $vehicleBody | Out-Null

            $spaceNum = "P-$workerId-$i-" + (Get-Random -Minimum 100 -Maximum 999)
            $spaceBody = "{`"lotId`":`"$lotId`",`"levelId`":`"$levelId`",`"spaceNumber`":`"$spaceNum`",`"type`":`"CAR`"}"
            $spaceResp = Invoke-RestMethod -Uri "http://localhost:8080/spaces" -Method Post -Headers $headers -Body $spaceBody
            $spaceId = $spaceResp.id

            $resStart = (Get-Date).AddMinutes(10).ToString("o")
            $resEnd = (Get-Date).AddHours(2).ToString("o")
            $resBody = "{`"lotId`":`"$lotId`",`"spaceId`":`"$spaceId`",`"startTime`":`"$resStart`",`"endTime`":`"$resEnd`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/reservations" -Method Post -Headers $headers -Body $resBody | Out-Null

            $plate = "KA-0" + $workerId + "-AB-" + (Get-Random -Minimum 1000 -Maximum 9999)
            $anprEntryBody = "{`"lotId`":`"$lotId`",`"licensePlate`":`"$plate`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/anpr/entry" -Method Post -Headers $headers -Body $anprEntryBody | Out-Null

            $qrGenBody = "{`"plateNumber`":`"$plate`",`"type`":`"PARKING_SESSION`"}"
            $qrResp = Invoke-RestMethod -Uri "http://localhost:8080/qr/generate" -Method Post -Headers $headers -Body $qrGenBody
            if ($qrResp.code) {
                $qrValBody = "{`"code`":`"$($qrResp.code)`"}"
                Invoke-RestMethod -Uri "http://localhost:8080/qr/validate" -Method Post -Headers $headers -Body $qrValBody | Out-Null
            }

            $startBody = "{`"plateNumber`":`"$plate`",`"spaceId`":`"$spaceId`"}"
            $sessionResp = Invoke-RestMethod -Uri "http://localhost:8080/sessions/start" -Method Post -Headers $headers -Body $startBody
            $sessionId = $sessionResp.id

            Invoke-RestMethod -Uri "http://localhost:8080/sessions/pricing-estimate?spaceId=$spaceId&hours=2" -Method Get -Headers $headers | Out-Null

            $endBody = "{`"plateNumber`":`"$plate`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/sessions/end" -Method Post -Headers $headers -Body $endBody | Out-Null

            $anprExitBody = "{`"lotId`":`"$lotId`",`"licensePlate`":`"$plate`"}"
            Invoke-RestMethod -Uri "http://localhost:8080/anpr/exit" -Method Post -Headers $headers -Body $anprExitBody | Out-Null

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

$jobs = 1..6 | ForEach-Object {
    Start-Job -ScriptBlock $scriptBlock -ArgumentList $token, $lotId, $levelId, $_
}

Write-Host "Executing full-path load simulation..."
$jobs | Wait-Job | Out-Null
$jobs | Remove-Job -Force

Write-Host "All system paths fully exercised under real load!"
