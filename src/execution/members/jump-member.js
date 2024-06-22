const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const Hardware = require("../hardware/hardware");

class JumpMember {
    static __jnz__expr__(expression) {
        const hardware = new Hardware();

        if (hardware.get_flag_$zf() == 0) {
            const Branchmember = require("./branch-member.js");
            Branchmember.__goto__expr__(expression);
        }
    }
    
    static __jle__expr__(expression) {
        const hardware = new Hardware();

        if (hardware.get_flag_$zf() == 1) {
            const Branchmember = require("./branch-member.js");
            Branchmember.__goto__expr__(expression);
        }
    }

    static __jmp__expr__(expression) {
        const Branchmember = require("./branch-member.js");
        Branchmember.__goto__expr__(expression);
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

module.exports = JumpMember;