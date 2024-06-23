const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the npm directory path 
let npmDir;

if (os.platform() === 'win32') {
    npmDir = path.join(process.env.APPDATA, 'npm');
} else {
    const homeDir = os.homedir();
    npmDir = path.join(homeDir, '.npm-global/bin');
}

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
