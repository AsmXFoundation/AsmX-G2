const TypeOfAtomicExpression = require("../../types/expression.type");
const RuntimeException = require("../exception/runtime.exception");
const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic");
const Hardware = require("../hardware/hardware");
const MemberBaseConstructor = require("./member-base");

class StackMember extends MemberBaseConstructor {
    static __push__expr__(expression) {
        if (expression.body.ast[0].type == TypeOfAtomicExpression.ARGUMENTS) {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only one argument');
        }

        const valueOfArgument = AtomicIntermediateRepresentationCompiler.complie(expression.body.ast[0]);
        const hardware = new Hardware();
        hardware.stack_push(valueOfArgument);
    }

    static __pop__expr__(expression) {
        const hardware = new Hardware();
        hardware.stack_pop();
    }
}

module.exports = StackMember;