const Expression = require("../../ast/expression.js");
const TypeOfInstructionExpression = require("../../types/instruction.type.js");
const TypeOfToken = require("../../types/token.type.js");
const TypeOfAtomicExpression = require("../../types/expression.type.js");
const SyntaxScannerExpression = require("../../parsing/scanner-syntax.js");
const Runtime = require("../runtime.js");
const RuntimeException = require("../exception/runtime.exception.js");

const FunctionalMember = require("../members/functional-member.js");
const ModuleMember = require("../members/module-member.js");
const StackMember = require("../members/stack-member.js");
const SystemMember = require("../members/system-member.js");
const MathematicalMember = require("../members/mathematical-member.js");


class IntermediateRepresentationCompiler {
    constructor(ast) {
        for (const expression of ast) {
            if (expression.type == TypeOfToken.EOF) break;
            
            if (expression.type == TypeOfInstructionExpression.INSTRUCTION) {
                if (Runtime.TYPE_OF_ENVIROMENT == Runtime.TYPE_OF_ENVIROMENTS.GLOBAL) {
                    const allowedTypeOfInstructions = [
                        TypeOfInstructionExpression.MODULE,
                        TypeOfInstructionExpression.VARIABLE,
                        TypeOfInstructionExpression.DECLARATION,
                        TypeOfInstructionExpression.OBJECT_ORIENTED_PROGRAMMING,
                        TypeOfInstructionExpression.DATA_STRUCTURE,
                    ];

                    if (!TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, ...allowedTypeOfInstructions)) {
                        SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, `The instruction ${expression.body.id.lexem} is not allowed in the global environment`);
                    }
                }


                if (TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, TypeOfInstructionExpression.MODULE)) {
                    ModuleMember.generalImplementation(expression);
                }

                else if (TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, TypeOfInstructionExpression.DECLARATION)) {
                    FunctionalMember.generalImplementation(expression);
                }

                else if (TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, TypeOfInstructionExpression.STACK)) {
                    StackMember.generalImplementation(expression);
                }

                else if (TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, TypeOfInstructionExpression.SYSTEM)) {
                    SystemMember.generalImplementation(expression);
                }

                else if (TypeOfInstructionExpression.existNameOfInstruction(expression.subtype, TypeOfInstructionExpression.MATHEMATICAL)) {
                    MathematicalMember.generalImplementation(expression);
                }
                
            } else {
                if (expression.type == TypeOfAtomicExpression.LITERAL) {
                    const token = expression.body[Reflect.ownKeys(expression.body)[0]];
                    new excveptions.ExpressionException('The expression must start with an instruction', token);
                } else {
                    let pass = expression;

                    if (expression instanceof Expression) {
                        if (expression.type == TypeOfAtomicExpression.PARENTHESIS) {
                            pass = expression.body.parentheses[0];
                        } else if (expression.type == TypeOfAtomicExpression.IDENTIFER) {
                            pass = expression.body.identifer;
                        } else {
                            pass = expression.id;
                        }
                    }

                    if (pass) {
                        SyntaxScannerExpression.exceptDefaultTracewayException(pass, 'The expression must start with an instruction');
                    } else {
                        SyntaxScannerExpression.exceptDefaultTracewayException(
                            { type: TypeOfToken.EOF, lexem: '', current: 0, line: 1, code: ' ' },
                            'The expression must start with an instruction'
                        );
                    }
                }
            }
        }

        if (
            Runtime.IMPORT_ENVIROMENT_MODE == Runtime.TYPE_OF_ENVIROMENTS.MAIN 
            && Runtime.TYPE_OF_ENVIROMENT == Runtime.TYPE_OF_ENVIROMENTS.GLOBAL
        ) {
            if (!Runtime.HAS_MAIN_FUNCTION) {
                RuntimeException.exceptMessage('The main function is not defined');
            }
        }
    }
}

module.exports = IntermediateRepresentationCompiler;