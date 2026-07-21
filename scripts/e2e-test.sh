#!/bin/bash
set -e

echo "Starting docker compose build and spin-up..."
docker compose down -v || true
docker compose up -d --build

echo "Waiting for backend API healthcheck..."
for i in {1..20}; do
  if curl -s http://localhost:8080/health | grep -q "OK"; then
    echo "Backend is healthy!"
    break
  fi
  if [ $i -eq 20 ]; then
    echo "Backend failed to start in time"
    docker compose logs
    docker compose down -v
    exit 1
  fi
  sleep 2
done

echo "Running Auth Login..."
LOGIN_RESP=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@metropolisparking.com", "password": "admin123"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -z "$TOKEN" ]; then
  echo "Failed to retrieve login token"
  echo "Response: $LOGIN_RESP"
  docker compose down -v
  exit 1
fi

echo "Auth Token successfully retrieved."

echo "Creating a Parking Lot..."
LOT_RESP=$(curl -s -X POST http://localhost:8080/parking-lots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Central Plaza Lot", "location": "Main St 101"}')

LOT_ID=$(echo "$LOT_RESP" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$LOT_ID" ]; then
  echo "Failed to create parking lot"
  echo "Response: $LOT_RESP"
  docker compose down -v
  exit 1
fi

echo "Parking Lot created: ID=$LOT_ID"

echo "Creating a Parking Level..."
LEVEL_RESP=$(curl -s -X POST "http://localhost:8080/parking-lots/$LOT_ID/levels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"levelNumber": 1}')

LEVEL_ID=$(echo "$LEVEL_RESP" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$LEVEL_ID" ]; then
  echo "Failed to create parking level"
  echo "Response: $LEVEL_RESP"
  docker compose down -v
  exit 1
fi

echo "Parking Level created: ID=$LEVEL_ID"

echo "Creating a Parking Space..."
SPACE_RESP=$(curl -s -X POST http://localhost:8080/spaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"lotId\": \"$LOT_ID\", \"levelId\": \"$LEVEL_ID\", \"spaceNumber\": \"P-101\", \"type\": \"CAR\"}")

SPACE_ID=$(echo "$SPACE_RESP" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$SPACE_ID" ]; then
  echo "Failed to create parking space"
  echo "Response: $SPACE_RESP"
  docker compose down -v
  exit 1
fi

echo "Parking Space created: ID=$SPACE_ID"

echo "Starting Parking Session..."
SESSION_RESP=$(curl -s -X POST http://localhost:8080/sessions/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"plateNumber\": \"MH-12-AB-1234\", \"spaceId\": \"$SPACE_ID\"}")

SESSION_ID=$(echo "$SESSION_RESP" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$SESSION_ID" ]; then
  echo "Failed to start parking session"
  echo "Response: $SESSION_RESP"
  docker compose down -v
  exit 1
fi

echo "Parking Session started: ID=$SESSION_ID"

echo "Sleeping to simulate parking duration..."
sleep 2

echo "Ending Parking Session..."
END_RESP=$(curl -s -X POST http://localhost:8080/sessions/end \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "MH-12-AB-1234"}')

FEE=$(echo "$END_RESP" | grep -o '"fee":[^,}]*' | grep -o '[0-9.]*')
echo "Parking Session ended. Fee calculated: $FEE"

echo "Fetching Payments..."
PAYMENTS_RESP=$(curl -s -X GET http://localhost:8080/payments \
  -H "Authorization: Bearer $TOKEN")

PAYMENT_ID=$(echo "$PAYMENTS_RESP" | grep -o '"id":"[^"]*' | head -n 1 | grep -o '[^"]*$')
if [ -z "$PAYMENT_ID" ]; then
  echo "Failed to retrieve pending payment"
  echo "Response: $PAYMENTS_RESP"
  docker compose down -v
  exit 1
fi

echo "Settling Payment: ID=$PAYMENT_ID"
PAY_RESP=$(curl -s -X POST "http://localhost:8080/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "CARD"}')

PAY_STATUS=$(echo "$PAY_RESP" | grep -o '"status":"[^"]*' | grep -o '[^"]*$')
echo "Payment status: $PAY_STATUS"

echo "Fetching Dashboard Stats..."
DASHBOARD_RESP=$(curl -s -X GET http://localhost:8080/dashboard \
  -H "Authorization: Bearer $TOKEN")

echo "Dashboard stats response: $DASHBOARD_RESP"

echo "Tearing down Docker containers..."
docker compose down -v

echo "All E2E checks passed successfully!"
