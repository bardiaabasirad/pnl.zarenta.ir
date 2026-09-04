import fs from 'fs';
const fontPath = './public/assets/fonts/iransans/Woff/IRANSansXFaNum-Regular.woff';
const base64 = fs.readFileSync(fontPath).toString('base64');
console.log('data:font/woff;base64,' + base64);
