#!/usr/bin/env node

/**
 * Script to check OAuth environment configuration
 * Run this locally to ensure your .env file has all required variables
 */

const requiredVars = {
  // Critical for OAuth
  'GOOGLE_CLIENT_ID': 'Your Google OAuth Client ID from Google Cloud Console',
  'GOOGLE_CLIENT_SECRET': 'Your Google OAuth Client Secret from Google Cloud Console',
  'AUTH_SECRET': 'A random secret string (generate with: openssl rand -base64 32)',
  'NEXTAUTH_URL': 'Should be https://me.databayt.org in production',

  // Database
  'DATABASE_URL': 'PostgreSQL connection string',

  // Application
  'NEXT_PUBLIC_APP_URL': 'Should be https://me.databayt.org',
  'STRIPE_API_KEY': 'Your Stripe API key',
};

const optionalVars = {
  'FACEBOOK_CLIENT_ID': 'Optional: Facebook OAuth Client ID',
  'FACEBOOK_CLIENT_SECRET': 'Optional: Facebook OAuth Client Secret',
  'RESEND_API_KEY': 'Optional: For email functionality',
};

console.log('🔍 Checking OAuth Environment Configuration\n');
console.log('=' .repeat(50));

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Create one by copying .env.example:');
  console.log('   cp .env.example .env.local');
  console.log('');
}

// Check required variables
console.log('\n📋 REQUIRED VARIABLES:');
console.log('-'.repeat(50));

let hasErrors = false;
Object.entries(requiredVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value || value === `your-${key.toLowerCase().replace(/_/g, '-')}`) {
    console.error(`❌ ${key}: NOT SET`);
    console.log(`   ↳ ${description}`);
    hasErrors = true;
  } else {
    const displayValue = key.includes('SECRET') || key.includes('KEY')
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

// Check optional variables
console.log('\n📋 OPTIONAL VARIABLES:');
console.log('-'.repeat(50));

Object.entries(optionalVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value || value === `your-${key.toLowerCase().replace(/_/g, '-')}`) {
    console.log(`⚠️  ${key}: Not configured`);
    console.log(`   ↳ ${description}`);
  } else {
    const displayValue = key.includes('SECRET') || key.includes('KEY')
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

// OAuth URLs
console.log('\n🔗 OAUTH CONFIGURATION:');
console.log('-'.repeat(50));

const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
console.log(`NextAuth URL: ${nextAuthUrl}`);
console.log(`Google Callback URL: ${nextAuthUrl}/api/auth/callback/google`);

if (process.env.GOOGLE_CLIENT_ID) {
  console.log(`\n📝 Make sure this callback URL is added to your Google OAuth app:`);
  console.log(`   ${nextAuthUrl}/api/auth/callback/google`);
}

// Generate AUTH_SECRET if needed
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'your-auth-secret-here') {
  console.log('\n🔑 Generate AUTH_SECRET with this command:');
  console.log('   openssl rand -base64 32');
  console.log('   OR');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n⚠️  Please set all required environment variables in .env.local');
  console.log('📚 Documentation: https://next-auth.js.org/configuration/options');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('🚀 Your OAuth configuration should work correctly.');
}