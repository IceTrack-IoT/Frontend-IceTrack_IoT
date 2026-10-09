const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, './src/environments/environment.ts');
const targetProdPath = path.resolve(__dirname, './src/environments/environment.prod.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.googleClientId || '';

const envConfigFile = `export const environment = {
  production: true,
  googleClientId: '${googleClientId}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
if (fs.existsSync(path.dirname(targetProdPath))) {
  fs.writeFileSync(targetProdPath, envConfigFile, { encoding: 'utf8' });
}

console.log(
  'File with generated environment with googleClientId:',
  googleClientId ? 'Correctly Loaded' : 'EMPTY VALUE',
);
