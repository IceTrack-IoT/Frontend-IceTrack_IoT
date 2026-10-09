const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, './src/environments/environment.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.googleClientId || '';

if (!fs.existsSync(targetPath)) {
  console.error(`Not found the file: ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(
  /googleClientId:\s*['"`].*?['"`]/g,
  `googleClientId: '${googleClientId}'`,
);

fs.writeFileSync(targetPath, content, 'utf8');

console.log(
  'googleClientId injected successfully in environment.ts without altering the other variables.',
);
