const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, './src/environments/environment.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.googleClientId || '';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.googleMapsApiKey || '';

if (!fs.existsSync(targetPath)) {
  console.error(`Not found the file: ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(
  /googleClientId:\s*['"`].*?['"`]/g,
  `googleClientId: '${googleClientId}'`,
);

content = content.replace(
  /googleMapsApiKey:\s*['"`].*?['"`]/g,
  `googleMapsApiKey: '${googleMapsApiKey}'`,
);

fs.writeFileSync(targetPath, content, 'utf8');

console.log(
  'googleClientId and googleMapsApiKey injected successfully in environment.ts without altering the other variables.',
);
