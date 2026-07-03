const fs = require('fs');
const file = 'app/medical-library/generatedConditions.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/("name":\s*"Approach[^"]*",[\s\S]*?"type":\s*)"([^"]+)"/g, '$1"Approach"');
fs.writeFileSync(file, content);
console.log('Successfully updated generatedConditions.ts');
