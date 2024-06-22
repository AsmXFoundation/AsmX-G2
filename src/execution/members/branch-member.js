const SyntaxScannerExpression = require("../../parsing/scanner-syntax");
const TypeOfAtomicExpression = require("../../types/expression.type");
const TypeOfInstructionExpression = require("../../types/instruction.type");
const Enviroment = require("../storage/enviroment");

class Branchmember {
    static __label__expr__(expression) {
        if (expression.body.name.type != TypeOfAtomicExpression.IDENTIFER) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected identifer');
        }
        
        delete expression.body.id;
        const environment = new Enviroment();
        environment.setLabel(expression.body.name.body.identifer.lexem, expression.body);
    }

    static __goto__expr__(expression) {
        if (expression.body.ast.length > 1) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected 1 argument');
        }

        if (expression.body.ast[0].type != TypeOfAtomicExpression.IDENTIFER) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Expected identifer');
        }

        const environment = new Enviroment();
        const label = expression.body.ast[0].body.identifer.lexem;
        const labelToGo = environment.getLabel(label);

        if (labelToGo == undefined) {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'Undefined label');
        } else {
            const IntermediateRepresentationCompiler = require('../executor/executor.js');
            new IntermediateRepresentationCompiler(labelToGo.body.body.body);
        }
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

module.exports = Branchmember;