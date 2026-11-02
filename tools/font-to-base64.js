import fs from 'fs';
const fontPath = './public/fonts/IRANSansXFaNum-Regular.woff2';
const base64 = fs.readFileSync(fontPath).toString('base64');
console.log('data:font/woff;base64,' + base64);
