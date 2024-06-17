const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const RuntimeException = require("../exception/runtime.exception");
const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic");
const Hardware = require("../hardware/hardware");

class StackMember {
    static implementationPush(expression) {
        if (expression.body.ast[0].type == TypeOfAtomicExpression.ARGUMENTS) {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only one argument');
        }

        const valueOfArgument = AtomicIntermediateRepresentationCompiler.complie(expression.body.ast[0]);
        const hardware = new Hardware();
        hardware.stack_push(valueOfArgument);
    }

    static implementationPop(expression) {
        const hardware = new Hardware();
        hardware.stack_pop();
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        
        if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'push') {
            this.implementationPush(expression);
        } else if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'pop') {
            this.implementationPop(expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Expected "push" keyword');
        }
    }
}

module.exports = StackMember;