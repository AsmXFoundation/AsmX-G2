const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const RuntimeException = require("../exception/runtime.exception");
const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic");
const Hardware = require("../hardware/hardware");

class SystemMember {
    static implementationSystem(expression) {
        if (expression.body.ast[0].type == TypeOfAtomicExpression.ARGUMENTS) {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only one argument');
        }

        const valueOfArgument = AtomicIntermediateRepresentationCompiler.complie(expression.body.ast[0]);
        const hardware = new Hardware();
        
        if (typeof valueOfArgument != 'number') {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only number');
        }

        const value_ptr = hardware.stack_pop();
        const bytes = hardware.memory_dump(value_ptr);

        console.log(bytes.map(b => String.fromCharCode(b)).join(''));
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        
        if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'system') {
            this.implementationSystem(expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Expected "system" keyword');
        }
    }
}

module.exports = SystemMember;