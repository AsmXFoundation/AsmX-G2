const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const HardwareArgument = require("../hardware/hardware-argument.js");
const Hardware = require("../hardware/hardware.js");

class MovementMember {
    static __mov__expr__(expression) {
        if (expression.body.ast[0].type != TypeOfAtomicExpression.ARGUMENTS) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected arguments');
        }

        const args = expression.body.ast[0].body.values;

        if (args.length > 2) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected 2 arguments');
        }

        const hardware = new Hardware();

        const args_raw = args.map(arg => {
            return HardwareArgument.fetch_raw(arg, HardwareArgument.fetch_typeid(arg));
        });

        hardware.mov(...args_raw);
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        const mov_t = TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction);

        const functions = Reflect.ownKeys(MovementMember).filter(func => func.endsWith('__expr__'));

        if (functions.includes(`__${mov_t}__expr__`)) {
            MovementMember[`__${mov_t}__expr__`](expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Undefined movement instruction');
        }
    }
}

module.exports = MovementMember;