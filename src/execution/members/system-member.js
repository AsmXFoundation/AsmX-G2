const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const RuntimeException = require("../exception/runtime.exception");
const Hardware = require("../hardware/hardware");
const BuiltinHardwareFunctions = require("../hardware/hardware-functions");
const Runtime = require("../runtime");

class SystemMember {
    static implementationSystem(expression) {
        if (expression.body.ast[0].type == TypeOfAtomicExpression.ARGUMENTS) {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only one argument');
        }

        const AtomicIntermediateRepresentationCompiler = require("../executor/executor-atomic.js");
        const valueOfArgument = AtomicIntermediateRepresentationCompiler.complie(expression.body.ast[0]);
        const hardware = new Hardware();
        
        if (typeof valueOfArgument != 'number') {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'takes only number');
        }

        if (valueOfArgument == 4) {
            hardware.ostream_stdout();
        } else {
            RuntimeException.exceptDefaultTracewayException(expression.body.id, 'Undefined system call');
        }
    }

    static implementationCall(expression) {
        const BUFFER_TYPE_OF_ENVIROMENT = Runtime.TYPE_OF_ENVIROMENT;
        Runtime.TYPE_OF_ENVIROMENT = Runtime.TYPE_OF_ENVIROMENTS.LOCAL;

        const caller = expression.body.caller;
        let tokenOfName, name, parentheses;
        let args = [];

        if (caller.type == TypeOfAtomicExpression.IDENTIFER) {
            tokenOfName = caller.body.identifer;
            name = tokenOfName.lexem;
            
            if (expression.body.hasOwnProperty('arguments')) {
                args = expression.body.arguments;
            }

            parentheses = expression.body.parentheses;
        } else if (caller.type == TypeOfAtomicExpression.CALL) {
            tokenOfName = caller.body.caller;
            args = caller.body.arguments;

            if (tokenOfName.type == TypeOfAtomicExpression.IDENTIFER) {
                name = tokenOfName.body.identifer.lexem;
            } else if (tokenOfName.type == TypeOfAtomicExpression.MEMBER) {
                name = tokenOfName;
                tokenOfName = tokenOfName.body.firstToken;
            }

            parentheses = caller.body.parentheses;
        }

        const functions = Reflect.ownKeys(BuiltinHardwareFunctions).filter(func => func.endsWith('__expr__'));
        let return_;
        
        if (functions.includes(`__${name}__expr__`)) {
            return_ = BuiltinHardwareFunctions[`__${name}__expr__`](args, parentheses);
        } else {
            RuntimeException.exceptDefaultTracewayException(caller.body.parentheses[0], 'Undefined function');
        }

        Runtime.TYPE_OF_ENVIROMENT = BUFFER_TYPE_OF_ENVIROMENT;
        return return_;
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;
        
        if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'system') {
            this.implementationSystem(expression);
        } else if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'call') {
            this.implementationCall(expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Expected "system" or "call" keyword');
        }
    }
}

module.exports = SystemMember;