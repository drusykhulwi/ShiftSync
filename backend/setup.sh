#!/bin/bash
# backend/setup.sh

echo "🚀 Setting up ShiftSync Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database..."
npm run prisma:seed

# Test the connection
echo "🧪 Testing database connection..."
npm run prisma:test

echo "✅ Setup complete! You can now run: npm run start:dev"