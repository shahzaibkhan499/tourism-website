#!/bin/bash
# ============================================================
# Digital Khandaan — Sandbox / Fresh Environment Setup
# Installs PostgreSQL (if needed), creates DB, migrates, seeds
# Run from project root: bash scripts/setup-sandbox.sh
# ============================================================
set -e

cd "$(dirname "$0")/.."
echo "🌳 Digital Khandaan — Environment Setup"

# --- 1. PostgreSQL ---
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "📦 Installing PostgreSQL..."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

echo "🚀 Starting PostgreSQL..."
sudo service postgresql start 2>/dev/null || sudo pg_ctlcluster 17 main start || sudo pg_ctlcluster 16 main start || true
sleep 2

# --- 2. Database & user ---
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='khandaan'" | grep -q 1; then
  echo "👤 Creating user 'khandaan'..."
  sudo -u postgres psql -c "CREATE USER khandaan WITH PASSWORD 'khandaan' CREATEDB;" 
  sudo -u postgres psql -c "ALTER USER khandaan WITH SUPERUSER;"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='khandaan'" | grep -q 1; then
  echo "🗄️  Creating database 'khandaan'..."
  sudo -u postgres psql -c "CREATE DATABASE khandaan OWNER khandaan;"
fi

# --- 3. Prisma: generate, migrate, seed ---
echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "🗃️  Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Setup complete! Run: npm run dev"
echo "   Admin:  admin@digitalkhandaan.pk / Admin@12345"
echo "   Demo:   demo@digitalkhandaan.pk  / Demo@12345"
