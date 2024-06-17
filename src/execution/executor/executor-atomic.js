const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfToken = require("../../types/token.type");
const RuntimeException = require("../exception/runtime.exception");
const Hardware = require("../hardware/hardware");

class AtomicIntermediateRepresentationCompiler {
    static /*#inline*/ complie(expression) {
        if (expression?.type == TypeOfAtomicExpression.LITERAL) {
            const value = expression.body[Reflect.ownKeys(expression.body)[0]];
            
            if (expression?.subtype == TypeOfAtomicExpression.LITERALS.NUMBER) {
                return Number(value.lexem);
            } else if (expression?.subtype == TypeOfAtomicExpression.LITERALS.STRING) {
                return String(value.lexem.slice(1, -1));
            } else if (expression?.subtype == TypeOfAtomicExpression.LITERALS.BOOLEAN) {
                return value.lexem == 'true' ? true : false;
            }

        } else if (expression?.type == TypeOfToken.REGISTER) {
            const hardware = new Hardware();
            return hardware.get_register_by_name(expression.lexem);
        } else {
            throw RuntimeException.exceptMessage('Unsupported literal type');
        }
    }
}

module.exports = AtomicIntermediateRepresentationCompiler;