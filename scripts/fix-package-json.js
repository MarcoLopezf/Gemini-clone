const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');

try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    console.log('Original content length:', content.length);

    // Try to parse
    const pkg = JSON.parse(content);
    console.log('JSON parsed successfully.');

    // Re-write stringified
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('package.json re-written successfully.');

} catch (e) {
    console.error('Error parsing JSON:', e.message);
    console.error('At position:', e.message.match(/position (\d+)/)?.[1]);
    process.exit(1);
}
