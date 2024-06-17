const Core = require("./core.js");
const Server = require("./server/server.js");

let argv = process.argv;
argv.shift();
argv.shift();

console.log('Welcome, AsmX G2 (AsmX Generation 2)'); // Display a welcome message

Server.journal.info(`architecture: ${process.config.variables.host_arch}`);

if (argv.length == 0) {
    Server.journal.error('Insufficient number of arguments');
    helper();
}

if (argv.length == 1) {
    if (!['.asmx', 'asmx', '.asmX', 'asmX', '.🚀', '🚀'].map(filetype => argv[0].endsWith(filetype)).some(Boolean)) {
        argv[0] += '.asmx';
    }
    
    callAsmXG2(argv[0]);
}

function helper() {
    Server.journal.log('Usage: asmx [file] [options]');
    Server.journal.log('Example: asmx hello.asmx');
    Server.journal.log('Options:');
    Server.journal.log('  -h, --help  Display this help message');
    Server.journal.log('  -v, --version  Display the version number');
    Server.journal.log('  -l, --license  Display the license information');
    Server.journal.log('  -a, --about  Display the project information');
    Server.journal.log('  -r, --readme  Display the readme information');
    Server.journal.log('  -c, --compiler  Display the compiler information');
    Server.journal.log('  -d, --debug  Display the debug information');
    Server.journal.log('  -t, --test  Run the test suite');
    Server.journal.log('  -o  --obj compilation option');
    Server.journal.log('Example:');
    Server.journal.log('  asmx hello.asmx -o hello.o');

}

function callAsmXG2(path) {
    new Core().run(path);
}
