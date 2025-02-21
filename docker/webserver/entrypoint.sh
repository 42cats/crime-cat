#!/bin/sh

# DuckDNS variables
DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-}"
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-}"
UPDATE_INTERVAL="${UPDATE_INTERVAL:-300}"  # Default update interval: 5 minutes

# Check if required environment variables are set
if [ -z "$DUCKDNS_DOMAIN" ] || [ -z "$DUCKDNS_TOKEN" ]; then
    echo "Error: DUCKDNS_DOMAIN and DUCKDNS_TOKEN must be set."
    exit 1
fi

# Infinite loop to update DuckDNS IP
while true; do
    echo "Updating DuckDNS for domain: $DUCKDNS_DOMAIN"
    
    # Send update request to DuckDNS
    RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=")

    # Log the response
    if [ "$RESPONSE" = "OK" ]; then
        echo "DuckDNS update successful at $(date)"
    else
        echo "DuckDNS update failed at $(date): $RESPONSE"
    fi

    # Wait for the next update
    sleep "$UPDATE_INTERVAL"
done
