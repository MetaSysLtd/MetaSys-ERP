#!/bin/bash

# Clear any existing cookies
rm -f cookies.txt

# Login and save cookies
echo "Logging in..."
curl -c cookies.txt -v -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:5000/api/auth/login

# Get current user info
echo -e "\n\nGetting user info..."
curl -b cookies.txt http://localhost:5000/api/auth/me

# Get leads using the session cookie
echo -e "\n\nGetting leads..."
curl -b cookies.txt http://localhost:5000/api/crm/leads

# Logout
echo -e "\n\nLogging out..."
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/logout