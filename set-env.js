const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, './src/environments/environment.prod.ts');
const targetPath = path.resolve(__dirname, './src/environments/environment.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.googleClientId || '';

// Lee el archivo original con todas sus variables intactas
let content = fs.readFileSync(filePath, 'utf8');

// Reemplaza el valor de googleClientId por el que viene de las variables de entorno de Vercel
content = content.replace(
  /googleClientId:\s*['"`].*?['"`]/g,
  `googleClientId: '${googleClientId}'`,
);

fs.writeFileSync(filePath, content, 'utf8');
fs.writeFileSync(targetPath, content, 'utf8');

console.log('googleClientId injected');
