class HardwareException {
    static except(...messages) {
        process.stdout.write(`Could not execute the program \n`);
        process.stdout.write(`Compiler returned: 1 \n`);
        process.stdout.write(`Compiler stderr \n`);
        process.stdout.write(`${messages.join('\n')}\n`);
        process.exit();
    }
}

module.exports = HardwareException;