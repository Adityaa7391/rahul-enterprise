#!/bin/bash

echo ""
echo "======================================"
echo "  Rahul Enterprise - Full Stack Setup"
echo "======================================"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend installed"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "✅ Frontend installed"

# Seed database
echo ""
echo "🌱 Seeding database with sample data..."
cd ../backend && npm run seed

echo ""
echo "======================================"
echo "  Starting servers..."
echo "======================================"
echo ""
echo "Backend → http://localhost:5000"
echo "Frontend → http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment then start frontend
sleep 2
cd ../frontend && npm start &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
