const fs = require('fs');
const path = require('path');
console.log('Test script started');
try {
    fs.writeFileSync(path.join(__dirname, 'test_output.txt'), 'Test success');
    console.log('File written successfully');
} catch (e) {
    console.error('File write failed:', e);
}
