
console.log("\n========================================================");
console.log("   GOOGLE CLOUD CONSOLE CONFIGURATION FOR HIEVLY.COM   ");
console.log("========================================================\n");

console.log("ERROR REASON: The 'Dangerous Site' or 'Access Denied' error happens because");
console.log("Google does not recognize 'hievly.com' as an authorized origin.\n");

console.log("ACTION: Copy and paste these EXACT values into your Google Cloud Console.");
console.log("URL: https://console.cloud.google.com/apis/credentials\n");

console.log("--------------------------------------------------------");
console.log("1. Authorized JavaScript Origins (Add BOTH):");
console.log("--------------------------------------------------------");
console.log("https://hievly.com");
console.log("https://www.hievly.com");

console.log("\n--------------------------------------------------------");
console.log("2. Authorized Redirect URIs (Add BOTH):");
console.log("--------------------------------------------------------");
console.log("https://hievly.com/api/auth/callback/google");
console.log("https://www.hievly.com/api/auth/callback/google");

console.log("\n========================================================");
console.log("IMPORTANT VERCEL SETTING:");
console.log("Ensure your Vercel Environment Variable 'NEXTAUTH_URL' is set to:");
console.log("https://hievly.com");
console.log("========================================================\n");
