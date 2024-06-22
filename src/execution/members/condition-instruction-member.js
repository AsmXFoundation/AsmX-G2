const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const Hardware = require("../hardware/hardware.js");

class ConditionInstructionMember {
    static __cmp__expr__(expression) {
        if (expression.body.ast[0].type != TypeOfAtomicExpression.ARGUMENTS) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected arguments');
        }

        const args = expression.body.ast[0].body.values;

        if ([args.length < 2, args.length > 2].some(Boolean)) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected 2 arguments');
        }

        const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic.js");
        let valueOfArguments = args.map(AtomicIntermediateRepresentationCompiler.complie);

        valueOfArguments = valueOfArguments.map(valueOfArgument => {
            if (
                [
                    valueOfArgument instanceof Uint8Array, valueOfArgument instanceof Uint16Array,
                    valueOfArgument instanceof Uint32Array, valueOfArgument instanceof BigUint64Array
                ].includes(true)
            ) {
                if (valueOfArgument.length > 1) {
                    SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Array does not support this operation');
                }

                return valueOfArgument[0];
            }

            if(typeof valueOfArgument != 'number') {
                SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Arguments must be number');
            }

            return valueOfArgument;
        });

        const hardware = new Hardware();
        hardware.cmp(valueOfArguments[0], valueOfArguments[1]);
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        const mov_t = TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction);

        const functions = Reflect.ownKeys(this).filter(func => func.endsWith('__expr__'));

        if (functions.includes(`__${mov_t}__expr__`)) {
            this[`__${mov_t}__expr__`](expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Undefined instruction');
        }
    }
}

module.exports = ConditionInstructionMember;