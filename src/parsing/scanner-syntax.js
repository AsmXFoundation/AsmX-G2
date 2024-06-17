const exceptions = require('llvm.js/exceptions');
const TypeOfAtomicExpression = require('../types/expression.type.js');
const TypeOfInstructionExpression = require('../types/instruction.type');
const TypeOfToken = require('../types/token.type');
const Expression = require('../ast/expression.js');
const SyntaxScannerItem = require('./scanner-item.js');
const SyntaxScannerBaseConstructor = require('./scanner-base.js');

class SyntaxScannerExpression extends SyntaxScannerBaseConstructor {
    static scanImportInstruction(token, ast) {
        function baseCheck(token, ast) {
            if (ast[1] == undefined || ast[1].type != TypeOfAtomicExpression.IDENTIFER) {
                if (ast[1] == undefined) {
                    this.exceptDefaultTracewayException(token, 'Expected "as" keyword');
                }

                if (ast[1].body.identifer.lexem != 'as') {
                    this.exceptDefaultTracewayException(token, 'Expected "as" keyword after string literal or expression');
                }
            }
            
            if (ast[2] == undefined || ast[2].type != TypeOfAtomicExpression.IDENTIFER) {
                this.exceptDefaultTracewayException(token, 'Expected only one identifier after "as"');
            }

            if (ast.length > 3) {
                this.exceptDefaultTracewayException(token, 'Module cannot have more than one identifier or expression');
            }
        }

        this.checkEmptyInstruction(token, ast, 'Module');
        
        if ([TypeOfAtomicExpression.IDENTIFER, TypeOfAtomicExpression.MEMBER].some(type => ast[0].type == type)) {
            if (ast[1] != undefined) {
                baseCheck.call(this, token, ast);
            } else if (ast.length > 1) {
                this.exceptDefaultTracewayException(token, 'Module cannot have more than one identifier or expression');
            }
        } else if ([TypeOfAtomicExpression.LITERALS.STRING, TypeOfAtomicExpression.SUPER_TYPE.STRING].some(type => ast[0].subtype == type)) {
            baseCheck.call(this, token, ast);
        } else {
            this.exceptDefaultTracewayException(token, 'Expected only one identifier or valid expression or string literal in import');
        }
    }

    static scanLeftSideOfExportInstruction(token, previousNode, nextToken) {
        if (previousNode?.type == TypeOfInstructionExpression.INSTRUCTION) {
            if (previousNode.body.id.lexem == '@export' && previousNode.body.ast.length == 0) {
                this.exceptDefaultTracewayException(token, 'Export cannot be nested');
            }
        }

        if (nextToken == undefined) {
            this.exceptDefaultTracewayException(token, 'Export must have an identifier');
        }
    }

    static scanRightSideOfExportInstruction(token, expression) {
        if (
            ![
                TypeOfInstructionExpression.DECLARATION, TypeOfInstructionExpression.OBJECT_ORIENTED_PROGRAMMING,
                TypeOfInstructionExpression.DATA_STRUCTURE
            ]
            .includes(expression.subtype)) 
        {
            this.exceptDefaultTracewayException(token, 'Cannot export a declaration');
        }
    }

    static scanFunctionalInstruction(token, ast, possibleTerms) {
        this.checkEmptyInstruction(token, possibleTerms);

        if (ast.length > 2) {
            this.exceptDefaultTracewayException(token, 'There can be only one body');
        }
        
        // Explain: functional not have arguments
        else if (ast.length == 1) {
            if (ast[0].type == TypeOfAtomicExpression.OBJECT) {
                if (ast[0].body.parentheses[0].lexem != '{') {
                    this.exceptDefaultTracewayException(ast[0].body.parentheses[0], 'Must use curly brackets, if there are no arguments');
                }
            } else {
                this.exceptDefaultTracewayException(possibleTerms[0], 'There is no body, use curly brackets to define it');
            }
        }
        

        // Explain: ordinary functional
        else {
            if (ast[0] == undefined) {
                this.exceptDefaultTracewayException(token, 'There is no body, use curly brackets to define it');
            }

            if (ast[0].type != TypeOfAtomicExpression.CALL) {
                this.exceptDefaultTracewayException(possibleTerms[0], 'Expected name before parenthesis');
            } else {
                if (TypeOfInstructionExpression.extractNameOfInstruction(token) == 'function') {
                    if (ast[0].body.caller.type != TypeOfAtomicExpression.IDENTIFER) {
                        let exceptToken = possibleTerms[0];

                        if (!(ast[0].body.caller instanceof Expression)) {
                            exceptToken = ast[0].body.caller;
                        }

                        this.exceptDefaultTracewayException(exceptToken, 'Name of function must be an identifier');
                    }
                }
            }

            if (ast[1].type != TypeOfAtomicExpression.OBJECT) {
                    this.exceptDefaultTracewayException(possibleTerms[0], 'Body must be wrapped in curly brackets');
            } else {
                
            }
        }
    }

    static scanVariableInstruction(token, nodes, possibleTerms) {
        this.checkEmptyInstruction(token, possibleTerms);

        if (![TypeOfAtomicExpression.ASSIGNMENT, TypeOfAtomicExpression.PROPERTY].includes(nodes[0].type)) {
            this.exceptDefaultTracewayException(token, 'Invalid variable instruction');
        }
    }

    static scanDataStructureInstruction(token, nodes) {
        this.checkEmptyInstruction(token, nodes, 'Data structure');
    }
    
    static scanStartCommaExpression(token, previousNodes, nextToken) {
        if (nextToken == undefined) {
            this.exceptDefaultTracewayException(token, 'Expression must have an argument after comma');
        }

        if (previousNodes.length == 0) {
            this.exceptDefaultTracewayException(token, 'Unexpected comma, argument expected before comma');
        }
        
        if (nextToken.type == TypeOfToken.COMMA) {
            this.exceptDefaultTracewayException(token, 'Duplicate comma in expression, only one comma is allowed');
        }
        
        if (nextToken.type == TypeOfToken.INSTRUCTION) {
            if (token.line < nextToken.line) {
                this.exceptDefaultTracewayException(token, 'Unexpected instruction, argument expected after comma');
            } else if (token.line == nextToken.line) {
                this.exceptDefaultTracewayException(token, 'Instruction cannot be on the same line');
            }
        }
    }

    static scanCallInstruction(token, nodes) {
        this.checkEmptyInstruction(token, nodes, 'Call');

        if (TypeOfInstructionExpression.extractNameOfInstruction(token) == 'call') {
            if ([nodes.length > 1, nodes[0].type == TypeOfAtomicExpression.ARGUMENTS].some(Boolean)) {
                this.exceptDefaultTracewayException(token, 'Call instruction cannot have more than one argument');
            }

            if (nodes[0].type != TypeOfAtomicExpression.CALL) {
                this.exceptDefaultTracewayException(token, 'Invalid call instruction');
            }
        }
    }

    static scanStackInstruction(token, ast) {
        if (ast.length > 1) {
            this.exceptDefaultTracewayException(token, `${token.lexem} instruction cannot have more than one argument`);
        }

        if (TypeOfInstructionExpression.extractNameOfInstruction(token) == 'push') {
            this.checkEmptyInstruction(token, ast, 'push');
        } else {
            if (ast.length == 1) {
                this.exceptDefaultTracewayException(token, `${token.lexem} instruction cannot have no argument`);
            }
        }
    }

    static scanReturnInstruction(token, ast) {
        this.checkEmptyInstruction(token, ast, 'Return');

        if (ast.length > 1) {
            this.exceptDefaultTracewayException(token, `${token.lexem} instruction cannot have more than one argument`);
        }
    }

    static scanStartMemberExpression(token, lastItemOfAST, nextToken) {
        if (lastItemOfAST == undefined || nextToken == undefined) {
            this.exceptDefaultTracewayException(token, 'Unexpected member expression');
        }

        if ([lastItemOfAST.subtype == TypeOfAtomicExpression.LITERALS.STRING, nextToken.type == TypeOfToken.STRING].some(Boolean)) {
            if (token.type != TypeOfToken.DOT) {
                this.exceptDefaultTracewayException(token, 'String literal must be followed by a dot');
            }
        }

        if ([TypeOfAtomicExpression.LITERALS.NUMBER, TypeOfAtomicExpression.LITERALS.BOOLEAN].includes(lastItemOfAST.subtype)) {
            this.exceptDefaultTracewayException(token, 'Number or boolean literal cannot be followed by member expression');
        }

        if (nextToken.type == TypeOfToken.IDENTIFER && TypeOfToken.isBoolean(nextToken)) {
            this.exceptDefaultTracewayException(token, 'Boolean literal cannot be followed by member expression');
        }
    }

    static scanDynamicallyItemExpression(token) {
        if (token.type == TypeOfToken.INSTRUCTION) {
            this.exceptDefaultTracewayException(token, 'Unexpected instruction in item');
        }

        if (token.type == TypeOfToken.SEMICOLON) {
            SyntaxScannerExpression.exceptDefaultTracewayException(token, 'Unexpected semicolon in item');
        }
    }

    static scanGroupingExpression(previousNode) {
        const extractToken = () => previousNode.body[Reflect.ownKeys(previousNode.body)[0]];

        if (previousNode && previousNode.type == TypeOfAtomicExpression.LITERAL) {
            this.exceptDefaultTracewayException(extractToken(), 'caller cannot be a literal');
        } else if (previousNode && previousNode.type == TypeOfAtomicExpression.OBJECT) {
            this.exceptDefaultTracewayException(previousNode.body.parentheses[0], 'caller cannot be an object');
        }
    }

    static scanCorrectOrderInstruction(token, nextToken) {
        if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.MODULE) {
            if (TypeOfInstructionExpression.extractNameOfInstruction(token) == 'export') return;
        }

        if ([token, nextToken].every(token => token.type == TypeOfToken.INSTRUCTION)) {
            if (token.line == nextToken.line) {
                this.exceptDefaultTracewayException(token, 'Instruction cannot be on the same line');
            }
        }
    }

    static checkEmptyInstruction(token, ast, fisrtWord = 'Expression') {
        if (ast.length == 0) {
            this.exceptDefaultTracewayException(token, `${fisrtWord} cannot be empty`);
        }
    }

    static exceptMessage(message) {
        new exceptions.TracewayException(`${message}\x1b[0m`, null, 'SyntaxException');
    }
}

SyntaxScannerExpression.Item = SyntaxScannerItem;

module.exports = SyntaxScannerExpression;