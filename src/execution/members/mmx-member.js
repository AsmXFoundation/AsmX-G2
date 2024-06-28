const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const Hardware = require("../hardware/hardware");
const HardwareArgument = require("../hardware/hardware-argument");
const HardwareException = require("../hardware/hardware-exception");

class MMXInstructionMember {
    static generalImplementation(expression) {
        if (expression.body.ast[0].type != TypeOfAtomicExpression.ARGUMENTS) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected arguments');
        }

        const tokenInstruction = expression.body.id;
        const args = expression.body.ast[0].body.values;
        const action_t = TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction);

        let valueOfArguments = args.map(arg => {
            return HardwareArgument.fetch_raw(arg, HardwareArgument.fetch_typeid(arg));
        });

        const hardware = new Hardware();

        if (action_t == 'store') {
            if ([args.length > 2, args.length < 2].includes(true)) {
                HardwareException.except(
                    'takes exactly 2 arguments',
                    `But ${args.length} were given instead of 2 arguments`,
                    `Base syntax: store $reg, type[]`
                );
            }

            hardware.mmx_store(...valueOfArguments);
        }
    }
}

module.exports = MMXInstructionMember;