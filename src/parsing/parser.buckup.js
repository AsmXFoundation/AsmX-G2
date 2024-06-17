const TypeOfAtomicExpression = require("../types/expr.type");
const Expression = require("../ast/expression.js");
const exceptions = require('llvm.js/exceptions');
const TypeOfInstructionExpression = require("../types/instruction.type");
const SyntaxScannerExpression = require("./scanner-syntax");
const BuilderExpression = require("../ast/builder.ast.js");
const TypeOfToken = require("../types/token.type");

class Parser {
    parser(source, bufferAST = null) {
        this.tokens = source;
        this.sizeof = source.length;
        this.index = 0;
        this.ast = [];
        this.bufferAST = bufferAST;

        // this is for recursive parser,
        // if bufferAST is not null, it will be used as a buffer for recursive parser
        if (this.bufferAST) {
            this.ast = this.bufferAST;
        }

        while (this.isNext()) {
            const token = this.peek();
            // console.log(11111111, 'Token: ', token);

            // @instruction ArgumentsExpression?
            if (token.type == TypeOfToken.INSTRUCTION) {
                // recursive parser, grammar: @instruction expression | term ;?
                let possibleTerms = [];
                this.index++;

                if (this.signature) {
                    this.signature = false;
                }
                else if ([TypeOfInstructionExpression.DECLARATION, TypeOfInstructionExpression.OBJECT_ORIENTED_PROGRAMMING].includes(TypeOfInstructionExpression.classification(token))) {
                    this.signature = true;
                }
                
                const previousNode = this.ast.at(-1);
                this.trackerTokens = [];

                if (TypeOfInstructionExpression.has(token.lexem, 'export')) {
                    SyntaxScannerExpression.scanLeftPositionExportInstruction(token, previousNode, this.getNextToken());
                }

                // this.peek().type ->  this.getNextToken()?.type
                while (this.isNext() && !['SEMICOLON', 'INSTRUCTION', 'EOF'].map(type => type != this.peek().type).includes(false)) {
                    if (this.isOpenPair(this.peek())) {
                        possibleTerms.push(...this.walkToClosePair(this.peek()));
                    } else {
                        possibleTerms.push(this.peek());
                        this.index++;
                    }
                }

                // console.log('peek: ', this.peek(),  token);
                // console.log(`Tracker tokens (${this.trackerTokens.length}): `, this.trackerTokens);
                // console.log(this.peek());

                if (this.peek() == undefined) {
                    return;
                }

                if (this.peek().type == TypeOfToken.SEMICOLON) {
                    this.trackerTokens = [];
                } else if (this.peek().type == TypeOfToken.INSTRUCTION) {
                    SyntaxScannerExpression.scanCorrectOrderInstruction(token, this.peek());
                    this.trackerTokens.push(token);
                }

                console.log(possibleTerms);

                const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
                const ast = this.parser(possibleTerms); 
                this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);


                // Common expression for all instructions
                const commonExpression = new Expression(TypeOfInstructionExpression.INSTRUCTION, { id: token, ast });

                if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.DECLARATION) {
                    const attributes = BuilderExpression.getAttributes(ast);
                    SyntaxScannerExpression.scanFunctionalInstruction(token, ast, possibleTerms);
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    commonExpression.upgradeBody({ ast: BuilderExpression.buildFunctionalInstruction(ast, attributes) });
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.MODULE) {
                    if (TypeOfInstructionExpression.has(token.lexem, 'import')) {
                        SyntaxScannerExpression.scanImportInstruction(token, ast);
                        commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                        commonExpression.upgradeBody({ ast: BuilderExpression.buildImportInstruction(ast) });
                    }
                } 
                
                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.SYSTEM) {
                    if (TypeOfInstructionExpression.has(token.lexem, 'call')) {
                        SyntaxScannerExpression.scanCallInstruction(token, ast);
                        commonExpression.delete('ast');
                        commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                        commonExpression.upgradeBody({ caller: BuilderExpression.buildCallInstruction(ast) });
                    }
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.SYSTEM) {
                    SyntaxScannerExpression.scanStackInstruction(token, ast);
                }
                
                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.RETURN) {
                    SyntaxScannerExpression.scanReturnInstruction(token, ast);
                    commonExpression.delete('ast');
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    commonExpression.upgradeBody({ return: BuilderExpression.buildReturnInstruction(ast) });
                } // language constructions

                // console.log(previousNode);

                if (previousNode?.type == TypeOfInstructionExpression.INSTRUCTION) {
                    // console.log(TypeOfInstructionExpression.has(previousNode.body.id.lexem, 'export'));

                    // if (previousNode.body.id.lexem == '@export') {
                    if (TypeOfInstructionExpression.has(previousNode.body.id.lexem, 'export')) {
                        this.ast.pop();

                        // console.log(commonExpression);
                        SyntaxScannerExpression.scanRightPositionExportInstruction(token, commonExpression, possibleTerms);

                        commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token), point: previousNode });
                        commonExpression.upgradeBody({ ast: BuilderExpression.buildExportInstruction(ast) });
                    } else {
                        commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                        // this.push(commonExpression); // v1
                    }

                    // console.log(commonExpression);
                    this.push(commonExpression);
                } else {
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    this.push(commonExpression);
                }
            }

            else if (['scope', 'arrow', 'DOT'].includes(token.type)) {
                // console.log('Token router: ', token);

                if (this.getLastItemAST() instanceof Expression && this.getLastItemAST().type == TypeOfAtomicExpression.MEMBER) {
                    const bufferPoint = this.getLastItemAST();
                    this.ast.pop();

                    // ScopeExpression: (node | expr)(:: | . | ->)(node | expr)
                    this.push(new Expression(TypeOfAtomicExpression.MEMBER, {
                        firstToken: bufferPoint.body.firstToken,
                        point: bufferPoint,
                        typeRoute: token,
                        link: this.getNextToken() // Note: rewrite this line, need will be refactored and release this.getNextNode()
                    }));

                    this.index++;
                } else if (this.isBetweenTokens(TypeOfToken.IDENTIFER)) {
                    this.ast.pop();

                    // ScopeExpression: (node | expr)(:: | . | ->)(node | expr)
                    this.push(new Expression(TypeOfAtomicExpression.MEMBER, {
                        firstToken: this.getPreviousToken(),
                        point: this.getPreviousToken(),
                        typeRoute: token,
                        link: this.getNextToken()
                    }));

                    this.index++;
                } else {
                    // one token
                    this.push(token);
                }

                // console.log(this.ast);
            }

            else if (this.isOpenPair(token)) {
                this.recursiveParse(token);
            }

            // else if (token.type == 'LESS') { } // generic type, template

            // node | node
            // node | node | node
            // else if (token.type == 'PIPE') { } // variants

            else if (['STRING', 'APOSTROPHE_STRING'].includes(token.type)) {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    string: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.STRING });

                if (this.getPreviousToken() && this.getPreviousToken().type == 'IDENTIFER') {
                    const format = this.getPreviousToken();
                    
                    if (format.current + format.lexem.length == token.current) {
                        this.ast.pop();
                        commonExpression.upgradeBody({ format });
                        commonExpression.extends({ subtype: TypeOfAtomicExpression.SUPER_TYPE.STRING });
                    }
                }

                if (this.getNextToken() && this.getNextToken().type == 'DOT') {
                    this.index++;
                    
                    if (this.getNextToken() && this.getNextToken().type == 'IDENTIFER') {
                        const extension = this.getNextToken();
                        this.index++;
                        
                        if (this.getNextToken() && this.isOpenPair(this.getNextToken())) {
                            // this.index--;
                            this.index -= 2;
                            // console.log('peek: ', this.peek());
                        } else {
                            commonExpression.extends({ subtype: TypeOfAtomicExpression.SUPER_TYPE.STRING });
                            commonExpression.upgradeBody({ extension });
                            this.push(commonExpression);
                        }
                    } else {
                        this.index--;
                    }
                }

                this.push(commonExpression);
            }

            else if (token.type == 'NUMBER') {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    number: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.NUMBER });
                this.push(commonExpression);
            }

            else if (token.type == 'IDENTIFER' && ['true', 'false'].includes(token.lexem)) {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    boolean: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.BOOLEAN });
                this.push(commonExpression);
            }

            else if (token.type == 'COMMA') {
                const commonExpression = new Expression(TypeOfInstructionExpression.INSTRUCTION, { id: token });  
                const previousNodes = this.ast.slice(0, this.index);

                SyntaxScannerExpression.scanStartCommaExpression(token, previousNodes, this.getNextToken(), this.signature);

                const possibleTerms = [];
                let bufferTerms = [];
                this.index++;

                // console.log('peek: ', this.peek());
                // if (previousNodes[previousNodes.length - 1].type == TypeOfAtomicExpression.ARGUMENTS) {}

                while (this.isNext()) {
                    if (this.getNextToken() == undefined) {
                        bufferTerms.push(this.peek());
                        possibleTerms.push(bufferTerms);
                        break;
                    } else if (this.peek().type == TypeOfToken.COMMA) {
                        possibleTerms.push(bufferTerms);
                        bufferTerms = [];
                        this.index++;
                    } else {
                        if (this.isOpenPair(this.peek())) {
                            bufferTerms.push(...this.walkToClosePair(this.peek()));
                        } else {
                            bufferTerms.push(this.peek());
                            this.index++;
                        }
                    }
                }

                // console.log('possibleTerms: ', possibleTerms);
                // console.log('nextNodes: ', nextNodes);
                // console.log('previousNodes: ', previousNodes);

                // const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
                // const ast = this.parser(possibleTerms);
                // this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);

                // for (const subExpression of possibleTerms) {
                //     const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
                //     const ast = this.parser(subExpression);
                //     this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);
                // }

                // console.log('ast: ', ast);

                this.signature = false;
                // this.push(commonExpression);
            }

            else {
                if (token.type == TypeOfToken.SEMICOLON) { 
                    if (this.getNextToken() && this.getNextToken().type == TypeOfToken.SEMICOLON) {
                        SyntaxScannerExpression.exceptDefaultTracewayException(this.getNextToken(), 'Unexpected semicolon');
                    }
                } else {
                    this.push(token);
                }
            }

            this.index++;
        }

        return this.ast;
    }


    walkToClosePair(token) {
        const saveOpenPair = token.type;
        const possibleClosePair = this.matchClosePair(token);

        // recursive parser, grammar: ( (expression | term)* )
        let possibleTerms = [token];
        const counter = { open: 1, close: 0 };
        this.index++;

        while (this.isNext()) {
            if (this.peek().type == saveOpenPair) counter.open++;
            else if (this.peek().type == possibleClosePair) counter.close++;

            // else if (counter.open == counter.close) break;
            if (counter.open == counter.close) {
                possibleTerms.push(this.peek());
                this.index++;
                break;
            }

            possibleTerms.push(this.peek());
            this.index++;
        }

        return possibleTerms;
    }


    recursiveParse(token) {
        const saveOpenPair = token.type;
        const possibleClosePair = this.matchClosePair(token);

        let possibleTerms = this.walkToClosePair(token);
        let close = possibleTerms[possibleTerms.length - 1];

        // Note: this is not necessary because the parser will not allow multiple close pairs
        possibleTerms.shift();
        possibleTerms.pop();

        // console.log(possibleTerms);

        const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
        const ast = this.parser(possibleTerms);
        this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);

        // console.log(this.ast, ast);
        const previousNode = this.ast.at(-1);
        // console.log('Last node of ast: ', previousNode);

        SyntaxScannerExpression.scanGroupingExpression(token, previousNode);
        // let typeExpression;

        // const GroupExpressions = {
        //     [TypeOfToken.IDENTIFER]: TypeOfAtomicExpression.CALL,
        //     [TypeOfAtomicExpression.MEMBER]: TypeOfAtomicExpression.CALL
        // };

        // // CallExpression: (identifer | MemberExpression | CallExpression | ArrayExpression) ( )
        // // ArrayExpression: (identifer | MemberExpression | CallExpression | ArrayExpression)* [ ]
        // // ObjectExpression: (identifer | MemberExpression | CallExpression | ArrayExpression)* { }

        // /**
        //  * caller()() caller[]()
        //  * caller([])* caller(())*
        //  */
        
        // const defaultCase = TypeOfAtomicExpression.PARENTHESIS;

        // if (previousNode) {
        //     typeExpression = GroupExpressions[previousNode.type] || defaultCase;
        // }

        // // this.index++;

        // const obj = { parentheses: [token, close], ast };

        // // console.log(this.ast.at(-1));

        // if (typeExpression == TypeOfAtomicExpression.CALL) {
        //     obj.caller = previousNode;
        //     this.ast.pop();
        // } else if (typeExpression == undefined) {
        //     typeExpression = defaultCase;
        // }

        // this.push(new Expression(typeExpression, obj));
        // console.log(this.ast[1]);
        
        const commonExpression = new Expression(TypeOfAtomicExpression.PARENTHESIS, { parentheses: [token, close], body: ast }); 

        // console.log(commonExpression);

        if (token.type == TypeOfToken.OPEN_PAREN) {
            commonExpression.upgradeType(TypeOfAtomicExpression.CALL);
            commonExpression.upgradeBody({ caller: previousNode });
            this.ast.pop();
        } 

        else if (token.type == TypeOfToken.OPEN_SQUARE_BRACKET) {
            console.log(ast, token, this.ast, this.signature);

            if(this.getPreviousToken() == undefined) {
                commonExpression.upgradeType(TypeOfAtomicExpression.ARRAY);
            }

            else if (ast.length == 0) {
                // type of array or empty array
                commonExpression.upgradeType(TypeOfAtomicExpression.TYPE_OF_ARRAY);
                commonExpression.delete('ast');
            } 
            
            else if (ast.length > 1) {
                commonExpression.upgradeType(TypeOfAtomicExpression.ARRAY);
            } 
            
            else if (ast.length == 1) {
                // array one element or MemberExpression
            }
        }

        else if (token.type == TypeOfToken.OPEN_CURLY_BRACKET) {
            commonExpression.upgradeType(TypeOfAtomicExpression.OBJECT);
        }

        console.log(commonExpression);

        this.push(commonExpression);
    }

    isOpenPair(token) {
        return ['OPEN_PAREN', 'OPEN_SQUARE_BRACKET', 'OPEN_CURLY_BRACKET'].includes(token.type);
    }

    isClosePair(token) {
        return ['CLOSE_PAREN', 'CLOSE_SQUARE_BRACKET', 'CLOSE_CURLY_BRACKET'].includes(token.type);
    }

    matchClosePair(token) {
        return { 
            'OPEN_PAREN': 'CLOSE_PAREN',
            'OPEN_SQUARE_BRACKET': 'CLOSE_SQUARE_BRACKET',
            'OPEN_CURLY_BRACKET': 'CLOSE_CURLY_BRACKET'
        }[token.type];
    }

    peek() {
        return this.tokens[this.index];
    }

    push(expression) {
        this.ast.push(expression);
    }

    startRecursive() {
        const [bufferAST, bufferIndex, bufferSizeTokens, bufferTokens] = [this.ast, this.index - 1, this.tokens.length, this.tokens];
        return { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens };
    }

    endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens) {
        this.ast = bufferAST;
        this.index = bufferIndex;
        this.sizeof = bufferSizeTokens;
        this.tokens = bufferTokens;
    } 

    isBetweenTokens(type) {
        if (this.getNextToken() == undefined || this.getPreviousToken() == undefined) return;
        return [this.getPreviousToken().type == type, this.getNextToken().type == type].every(condition => condition == true);
    }

    getToken() {
        return this.tokens[this.index];
    }

    getNextToken() {
        return this.tokens[this.index + 1];
    }
    
    getPreviousToken() {
        return this.tokens[this.index - 1];
    }

    isNext() {
        return this.index <= this.sizeof - 1;
    }

    restartAST() {
        this.ast = [];
    }

    getLastItemAST() {
        return this.ast.at(-1);
    }

    isEOF() {
        this.getToken().type == TypeOfToken.EOF;
    }
}

module.exports = Parser;