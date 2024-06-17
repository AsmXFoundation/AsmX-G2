const fs = require('fs');
const path = require('path');

// Get the npm directory path
const npmDir = path.join(process.env.APPDATA, 'npm');

// Define the source file paths
const source1Path = path.join(__dirname, 'asmx');
const source2Path = path.join(__dirname, 'asmx.cmd');

// Define the destination file paths
const dest1Path = path.join(npmDir, 'asmx');
const dest2Path = path.join(npmDir, 'asmx.cmd');

// Read the source files
const source1Content = fs.readFileSync(source1Path);
const source2Content = fs.readFileSync(source2Path);

// Write the source files to the npm directory
fs.writeFileSync(dest1Path, source1Content);
fs.writeFileSync(dest2Path, source2Content);

console.log('Successfully installed the AsmX G2!');
