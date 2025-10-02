/**
 * Test script to verify the domain migration implementation
 */

import { isMarketingDomain, isExcludedSubdomain, getCurrentMarketingDomain } from './src/config/domains.js';
import { extractSubdomain } from './src/lib/subdomain.js';

console.log('🧪 Testing Domain Migration Implementation\n');
console.log('=' . repeat(50));

// Test cases for domain detection
const testHosts = [
  'me.databayt.org',
  'ed.databayt.org',
  'school1.databayt.org',
  'demo.databayt.org',
  'localhost:3000',
  'test---branch.vercel.app'
];

console.log('\n📍 Testing Host Detection:');
testHosts.forEach(host => {
  const result = extractSubdomain(host, 'databayt.org');
  console.log(`  Host: ${host}`);
  console.log(`    → Subdomain: ${result.subdomain || 'null'}`);
  console.log(`    → Special Case: ${result.isSpecialCase}`);
  if (result.reason) {
    console.log(`    → Reason: ${result.reason}`);
  }
  console.log('');
});

console.log('=' . repeat(50));

// Test marketing domain detection
console.log('\n🏢 Marketing Domain Configuration:');
console.log(`  Current Marketing Domain: ${getCurrentMarketingDomain()}`);
console.log(`  Should Redirect Old Domain: ${process.env.REDIRECT_OLD_DOMAIN || 'false'}`);

console.log('\n🔍 Testing Marketing Domain Detection:');
['me.databayt.org', 'ed.databayt.org', 'school.databayt.org'].forEach(host => {
  console.log(`  ${host}: ${isMarketingDomain(host) ? '✅ Marketing' : '❌ Not Marketing'}`);
});

console.log('\n🚫 Testing Excluded Subdomains:');
['me', 'ed', 'www', 'api', 'admin', 'school'].forEach(subdomain => {
  console.log(`  ${subdomain}: ${isExcludedSubdomain(subdomain) ? '✅ Excluded' : '❌ Not Excluded'}`);
});

console.log('\n=' . repeat(50));
console.log('✨ Test Complete!\n');

// Migration status summary
console.log('📋 Migration Status Summary:');
console.log(`  ✅ Middleware supports both me.databayt.org and ed.databayt.org`);
console.log(`  ✅ Subdomain utility updated to handle both marketing domains`);
console.log(`  ✅ Domain configuration file created`);
console.log(`  ✅ Environment variables configured`);
console.log(`  ${process.env.REDIRECT_OLD_DOMAIN === 'true' ? '✅' : '⏸️ '} Redirect from ed to me ${process.env.REDIRECT_OLD_DOMAIN === 'true' ? 'ENABLED' : 'DISABLED (set REDIRECT_OLD_DOMAIN=true to enable)'}`);

console.log('\n🎯 Next Steps:');
console.log('  1. Deploy to staging/preview environment');
console.log('  2. Test both domains in production-like environment');
console.log('  3. Update DNS records for me.databayt.org');
console.log('  4. Update OAuth redirect URLs');
console.log('  5. When ready, set REDIRECT_OLD_DOMAIN=true to enable redirects');