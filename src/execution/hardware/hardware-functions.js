const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic");
const Hardware = require("./hardware");

class BuiltinHardwareFunctions {
    static __malloc__expr__(args, parentheses) {
        if (args.length != 1 | args.length > 1) {
            SyntaxScannerExpression.exceptDefaultTracewayException(parentheses[0], 'Arguments must be one');
        }

        let valueOfArgument = AtomicIntermediateRepresentationCompiler.complie(args[0]);

        if (typeof valueOfArgument != 'number') {
            SyntaxScannerExpression.exceptDefaultTracewayException(parentheses[0], 'Arguments must be number');
        }

        const hardware = new Hardware();
        const ptr_uint16 = hardware.malloc(valueOfArgument);
        
        hardware.set_register_$ax(ptr_uint16);
        return ptr_uint16;
    }
}

module.exports = BuiltinHardwareFunctions;