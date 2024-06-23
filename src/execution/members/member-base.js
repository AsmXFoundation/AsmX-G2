const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfInstructionExpression = require("../../types/instruction.type");

class MemberBaseConstructor {
    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        const nameOfInstruction = TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction);

        const functions = Reflect.ownKeys(this).filter(func => func.endsWith('__expr__'));

        if (functions.includes(`__${nameOfInstruction}__expr__`)) {
            this[`__${nameOfInstruction}__expr__`](expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Undefined instruction');
        }
    }
}

module.exports = MemberBaseConstructor;