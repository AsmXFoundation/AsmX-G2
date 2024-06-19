const TypeOfInstructionExpression = require("../../types/instruction.type");
const Hardware = require("../hardware/hardware.js");

class MathematicalMember {
    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        const args = expression.body.values;
        const action_t = TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction);

        const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic.js");
        let valueOfArguments = args.map(AtomicIntermediateRepresentationCompiler.complie);

        valueOfArguments.map(valueOfArgument => {
            if (typeof valueOfArgument != 'number') {
                SyntaxScannerExpression.exceptDefaultTracewayException(parentheses[0], 'Arguments must be number');
            }
        })
        
        const hardware = new Hardware();
        const [$eax, $edx] = hardware.math(action_t, valueOfArguments);

        hardware.set_register_$eax($eax);
        hardware.set_register_$edx($edx);
    }
}

module.exports = MathematicalMember;