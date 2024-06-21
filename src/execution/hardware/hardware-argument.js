const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfToken = require("../../types/token.type");
const RuntimeException = require("../exception/runtime.exception");
const Hardware = require("./hardware");
const HardwareException = require("./hardware-exception");

class HardwareArgument {
    static fetch_typeid(token) {
        const hardware = new Hardware();

        if (token.type == TypeOfToken.REGISTER) {
            return hardware.types_movement.reg;
        } else if (token.subtype == TypeOfAtomicExpression.LITERALS.NUMBER || token.subtype == TypeOfAtomicExpression.LITERALS.BOOLEAN) {
            return hardware.types_movement.imm;
        }  else if (token.type == TypeOfAtomicExpression.ARRAY) {
            return hardware.types_movement.mem;
        }
    }

    static fetch_raw(token, type) {
        const hardware = new Hardware();

        if (type == hardware.types_movement.reg) {
            return { type, name: token.lexem };
        } else if (type == hardware.types_movement.imm) {
            let value = 0x00;

            if (token.subtype == TypeOfAtomicExpression.LITERALS.NUMBER) {
                value = Number(token.body[Reflect.ownKeys(token.body)[0]].lexem);
            } else if (token.subtype == TypeOfAtomicExpression.LITERALS.BOOLEAN) {
                value = token.body[Reflect.ownKeys(token.body)[0]].lexem == 'true' ? 0x01 : 0x00;
            }

            return { type, value };
        } else if (type == hardware.types_movement.mem) {
            if (token.body.values.length > 1) {
                HardwareException.except(`Unsupported memory argument`);
            }

            const type = HardwareArgument.fetch_typeid(token.body.values);

            if (type == hardware.types_movement.reg) {
                return { type: hardware.types_movement.mem, ptr_t: hardware.types_movement.reg, ptr: token.body.values.lexem };
            } else if (type == hardware.types_movement.imm) {
                let tokenOfImm = token.body.values.body.number;
                return { type: hardware.types_movement.mem, ptr_t: hardware.types_movement.imm, ptr: parseInt(tokenOfImm.lexem).toString(16) };
            }

            RuntimeException.exceptDefaultTracewayException(token.body.parentheses[0], 'Unsupported memory argument');
        }
    }
}

module.exports = HardwareArgument;