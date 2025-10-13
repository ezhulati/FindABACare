/**
 * Test script to diagnose auth cookie flow
 * Run with: npx tsx scripts/test-auth-flow.ts
 */

// Extract and parse the sb-auth-token cookie from the logs
const sampleCookieHeader = `_clck=1m8fa40%5E2%5Eg04%5E1%5E2070; sb-auth-token=%7B%22access_token%22%3A%22eyJhbGciOiJIUzI1NiIsImtpZCI6IkhTZGFOWnRCWTMra09VU2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2d2Zmt5Znp1a3duam9ta3N1dmFxLnN1`;

console.log('=== Testing Auth Cookie Parsing ===\n');

// Test 1: Extract the cookie
const authTokenMatch = sampleCookieHeader.match(/sb-auth-token=([^;]+)/);
if (!authTokenMatch) {
  console.error('❌ Failed to match sb-auth-token cookie');
  process.exit(1);
}

console.log('✅ Found sb-auth-token cookie');
console.log('Raw cookie value (first 100 chars):', authTokenMatch[1].substring(0, 100));

// Test 2: Decode the cookie
let decodedToken: string;
try {
  decodedToken = decodeURIComponent(authTokenMatch[1]);
  console.log('\n✅ Successfully decoded cookie');
  console.log('Decoded value (first 200 chars):', decodedToken.substring(0, 200));
} catch (error) {
  console.error('❌ Failed to decode cookie:', error);
  process.exit(1);
}

// Test 3: Parse as JSON
let session: any;
try {
  session = JSON.parse(decodedToken);
  console.log('\n✅ Successfully parsed JSON');
  console.log('Session keys:', Object.keys(session));
} catch (error) {
  console.error('❌ Failed to parse JSON:', error);
  console.error('Attempted to parse:', decodedToken);
  process.exit(1);
}

// Test 4: Extract tokens
if (session.access_token) {
  console.log('\n✅ Found access_token');
  console.log('Access token (first 50 chars):', session.access_token.substring(0, 50));
} else {
  console.error('❌ No access_token in session object');
  console.error('Session object:', session);
  process.exit(1);
}

if (session.refresh_token) {
  console.log('✅ Found refresh_token');
  console.log('Refresh token (first 50 chars):', session.refresh_token.substring(0, 50));
} else {
  console.log('⚠️  No refresh_token in session object (might be optional)');
}

// Test 5: Check if cookie is truncated
if (sampleCookieHeader.includes('...') || !sampleCookieHeader.endsWith(';') && sampleCookieHeader.split('sb-auth-token=')[1].length < 500) {
  console.log('\n⚠️  WARNING: Cookie appears to be truncated in logs!');
  console.log('This is just a logging issue - the actual cookie should be complete');
}

console.log('\n=== Cookie Structure Analysis ===');
console.log('Expected by @supabase/ssr:');
console.log('  - Separate cookies: sb-access-token and sb-refresh-token');
console.log('\nActual structure from client:');
console.log('  - Single cookie: sb-auth-token containing full session JSON');
console.log('\nThis explains why authentication is failing!');
console.log('The server is extracting tokens correctly but the session object');
console.log('might be incomplete or the cookie is being truncated.');

console.log('\n=== Next Steps ===');
console.log('1. Check browser DevTools → Application → Cookies');
console.log('2. Verify sb-auth-token cookie contains complete session JSON');
console.log('3. Check cookie size (browsers limit to ~4KB per cookie)');
console.log('4. If cookie is too large, we need to split into multiple cookies');
