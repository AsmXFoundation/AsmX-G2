const TypeOfAtomicExpression = require("../types/expression.type.js");
const Expression = require("../ast/expression.js");
const exceptions = require('llvm.js/exceptions');
const TypeOfInstructionExpression = require("../types/instruction.type.js");
const SyntaxScannerExpression = require("./scanner-syntax.js");
const BuilderExpression = require("../ast/builder.instruction.js");
const TypeOfToken = require("../types/token.type.js");
const SyntaxScannerItem = require("./scanner-item.js");
const BuilderAtomicExpression = require("../ast/builder.atomic.js");

class RecursiveDescentParser {
    parser(source, bufferAST = null) {
        this.tokens = source;
        this.sizeof = source.length;
        this.index = 0;
        this.ast = [];
        this.bufferAST = bufferAST;

        if (this.bufferAST) {
            this.ast = this.bufferAST;
        }

        while (this.isNext()) {
            const token = this.peek();

            // @instruction ArgumentsExpression?
            if (token.type == TypeOfToken.INSTRUCTION) {
                // recursive parser, grammar: @instruction expression | term ;?
                let possibleTerms = [];
                this.index++;

                const previousNode = this.getLastItemAST();
                this.trackerTokens = [];

                if (TypeOfInstructionExpression.has(token.lexem, 'export')) {
                    SyntaxScannerExpression.scanLeftSideOfExportInstruction(token, previousNode, this.getNextToken());
                }

                possibleTerms = this.collectTokens((peek) => 
                    ![TypeOfToken.SEMICOLON, TypeOfToken.INSTRUCTION, TypeOfToken.EOF].some(type => type == peek.type)
                );
                
                if (this.peek() == undefined) {}

                else if (this.peek().type == TypeOfToken.SEMICOLON) {
                    this.trackerTokens = [];
                } else if (this.peek().type == TypeOfToken.INSTRUCTION) {
                    SyntaxScannerExpression.scanCorrectOrderInstruction(token, this.peek());
                    this.trackerTokens.push(token);
                }

                const ast = [];

                if (
                    [
                        TypeOfInstructionExpression.DATA_STRUCTURE, TypeOfInstructionExpression.BRANCH_BLOCK
                    ]
                    .includes(TypeOfInstructionExpression.classification(token))
                ) {
                    let leftPossibleTerms = [];

                    leftPossibleTerms = this.localCollectTokens(possibleTerms, peek => 
                        ![TypeOfToken.OPEN_CURLY_BRACKET].some(type => type == peek.type)
                    );

                    possibleTerms = possibleTerms.slice(leftPossibleTerms.length);
                    leftPossibleTerms = this.getNodes(leftPossibleTerms);

                    ast.push(...leftPossibleTerms);
                    ast.push(...this.getNodes(possibleTerms));
                    this.index++;
                }

                else if (
                    [
                        TypeOfInstructionExpression.DECLARATION, TypeOfInstructionExpression.OBJECT_ORIENTED_PROGRAMMING
                    ]
                    .includes(TypeOfInstructionExpression.classification(token))
                ) {
                    let leftPossibleTerms = [];

                    leftPossibleTerms = this.localCollectTokens(possibleTerms, peek => 
                        ![TypeOfToken.OPEN_PAREN, TypeOfToken.OPEN_CURLY_BRACKET].some(type => type == peek.type)
                    );

                    possibleTerms = possibleTerms.slice(leftPossibleTerms.length);
                    leftPossibleTerms = this.getNodes(leftPossibleTerms);

                    ast.push(...leftPossibleTerms);

                    if (possibleTerms[0].type == TypeOfToken.OPEN_PAREN) {
                        SyntaxScannerItem.mode = SyntaxScannerItem.MODES.signature;

                        let signature = this.localCollectTokens(possibleTerms, peek => peek.type != TypeOfToken.CLOSE_PAREN, true);
                        possibleTerms = possibleTerms.slice(signature.length);

                        signature.unshift(leftPossibleTerms[leftPossibleTerms.length - 1]);
                        ast.pop();

                        signature = this.getNodes(signature);
                        ast.push(...signature);

                        SyntaxScannerItem.mode = SyntaxScannerItem.MODES.item;
                    }

                    ast.push(...this.getNodes(possibleTerms));
                    this.index += 2;
                } else {
                    const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
                    const nodes = this.parser(possibleTerms);
                    this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);
                    ast.push(...nodes);
                }
              
                // Common expression for all instructions
                const commonExpression = new Expression(TypeOfInstructionExpression.INSTRUCTION, { id: token, ast });

                if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.VARIABLE) {
                    SyntaxScannerExpression.scanVariableInstruction(token, ast, possibleTerms);
                    commonExpression.delete('ast');
                    commonExpression.upgradeBody(BuilderExpression.buildVariableExpression(ast));
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.MATHEMATICAL) {
                    commonExpression.delete('ast');
                    commonExpression.upgradeBody(BuilderExpression.buildMathInstruction(ast));
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.BRANCH_BLOCK) {
                    commonExpression.delete('ast');
                    const attributes = BuilderExpression.getAttributes(ast);
                    SyntaxScannerExpression.scanBranchBlockInstruction(token, ast, possibleTerms);
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    commonExpression.upgradeBody(BuilderExpression.buildBranchBlockInstruction(ast, attributes));
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.DECLARATION) {
                    commonExpression.delete('ast');
                    const attributes = BuilderExpression.getAttributes(ast);
                    SyntaxScannerExpression.scanFunctionalInstruction(token, ast, possibleTerms);
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    commonExpression.upgradeBody(BuilderExpression.buildFunctionalInstruction(ast, attributes));
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

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.STACK) {
                    SyntaxScannerExpression.scanStackInstruction(token, ast);
                }

                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.DATA_STRUCTURE) {
                    SyntaxScannerExpression.scanDataStructureInstruction(token, ast);
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                }
                
                else if (TypeOfInstructionExpression.classification(token) == TypeOfInstructionExpression.RETURN) {
                    SyntaxScannerExpression.scanReturnInstruction(token, ast);
                    commonExpression.delete('ast');
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    commonExpression.upgradeBody({ return: BuilderExpression.buildReturnInstruction(ast) });
                } // language constructions

                if (previousNode?.type == TypeOfInstructionExpression.INSTRUCTION) {
                    if (TypeOfInstructionExpression.has(previousNode.body.id.lexem, 'export')) {
                        SyntaxScannerExpression.scanRightSideOfExportInstruction(token, commonExpression, possibleTerms);
                    } else {
                        commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    }

                    this.push(commonExpression);
                } else {
                    commonExpression.extends({ subtype: TypeOfInstructionExpression.classification(token) });
                    this.push(commonExpression);
                }
            }

            else if ([TypeOfToken.CUSTOM.SCOPE, TypeOfToken.CUSTOM.ARROW, TypeOfToken.DOT].includes(token.type)) {
                let lastItemOfAST = this.getLastItemAST();
                SyntaxScannerExpression.scanStartMemberExpression(token, lastItemOfAST, this.getNextToken());

                const commonExpression = new Expression(TypeOfAtomicExpression.MEMBER, {
                    point: lastItemOfAST,
                    typeRoute: token,
                    link: this.getNextToken()
                });

                if (lastItemOfAST instanceof Expression && lastItemOfAST.type == TypeOfAtomicExpression.MEMBER) {
                    commonExpression.upgradeBody({ firstToken: lastItemOfAST.body.firstToken });
                } else {
                    commonExpression.upgradeBody({ firstToken: lastItemOfAST });
                }

                this.ast.pop();
                this.index++;

                this.push(commonExpression);
            }

            else if (this.isOpenPair(token)) {
                this.recursiveParse(token);
            }

            else if (token.type == TypeOfToken.PIPE) {
                new exceptions.WarningExpressionException('Variants is not supported yet', token, 'Warning');
                return;
            }

            else if ([TypeOfToken.STRING, TypeOfToken.APOSTROPHE_STRING].includes(token.type)) {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    string: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.STRING });

                if (this.getNextToken() && this.getNextToken().type == TypeOfToken.DOT) {
                    this.index++;
                    
                    if (this.getNextToken() && this.getNextToken().type == TypeOfToken.IDENTIFER) {
                        const extension = this.getNextToken();
                        this.index++;
                        
                        if (this.getNextToken() && this.isOpenPair(this.getNextToken())) {
                            this.index -= 2;
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

            else if (token.type == TypeOfToken.NUMBER) {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    number: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.NUMBER });
                this.push(commonExpression);
            }

            else if (token.type == TypeOfToken.IDENTIFER && ['true', 'false'].includes(token.lexem)) {
                const commonExpression = new Expression(TypeOfAtomicExpression.LITERAL, {
                    boolean: token
                });

                commonExpression.extends({ subtype: TypeOfAtomicExpression.LITERALS.BOOLEAN });
                this.push(commonExpression);
            }

            else if (token.type == TypeOfToken.IDENTIFER) {
                const commonExpression = new Expression(TypeOfAtomicExpression.IDENTIFER, {
                    identifer: token
                });

                this.push(commonExpression);
            }

            else if (token.type == TypeOfToken.COMMA) {
                const commonExpression = new Expression(TypeOfAtomicExpression.ARGUMENTS, { });  
                let previousNodes = this.ast.slice(0, this.index);

                SyntaxScannerExpression.scanStartCommaExpression(token, previousNodes, this.getNextToken());

                if (SyntaxScannerItem.mode == SyntaxScannerItem.MODES.signature) {
                    SyntaxScannerExpression.Item.signature(token, previousNodes, 'Signature item', false);
                    previousNodes = [BuilderAtomicExpression[TypeOfAtomicExpression.TYPE_OF_ARGUMENT](previousNodes)];
                } else {
                    SyntaxScannerExpression.Item.item(token, previousNodes, 'Item', false);
                }

                const possibleTerms = [];
                let bufferTerms = [];
                this.index++;

                while (this.isNext()) {
                    SyntaxScannerExpression.scanDynamicallyItemExpression(this.peek());
                    
                    if (this.getNextToken() == undefined) {
                        bufferTerms.push(this.peek());
                        possibleTerms.push(bufferTerms);
                        this.index++;
                        break;
                    } else if (this.peek().type == TypeOfToken.COMMA) {
                        possibleTerms.push(bufferTerms);
                        bufferTerms = [];
                        this.index++;
                    } else {
                        if (this.isOpenPair(this.peek())) {
                            bufferTerms.push(...this.walkToClosePair(this.peek()));

                            if (!this.isNext()) {
                                possibleTerms.push(bufferTerms);
                                break;
                            }
                        } else {
                            bufferTerms.push(this.peek());
                            this.index++;
                        }
                    }
                }

                const body = previousNodes;

                for (const subExpression of possibleTerms) {
                    const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
                    const nodes = this.parser(subExpression);
                    this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);


                    if (SyntaxScannerItem.mode == SyntaxScannerItem.MODES.signature) {
                        SyntaxScannerExpression.Item.signature(token, nodes, 'Signature item', false);
                        body.push(BuilderAtomicExpression[TypeOfAtomicExpression.TYPE_OF_ARGUMENT](nodes));
                    } else {
                        SyntaxScannerExpression.Item.item(token, nodes, 'Item', false);
                        body.push(...nodes);
                    }
                    
                    this.index++;
                }

                commonExpression.upgradeBody({ values: body });
                commonExpression.extends({ subtype: TypeOfAtomicExpression.ARGUMENTS });

                return [commonExpression];
            }

            else if (token.type == TypeOfToken.COLON) {
                const commonExpression = new Expression(TypeOfAtomicExpression.PROPERTY, { });  
                const previousNodes = this.ast.slice(0, this.index);
                this.index++;
                let possibleTerms = this.tokens.slice(this.index);

                let value = this.localCollectTokens(possibleTerms, (peek) => {
                    return ![
                        peek != undefined, peek.type != TypeOfToken.COMMA, peek.type != TypeOfToken.SEMICOLON,
                        TypeOfToken.classification(peek) != TypeOfToken.CLASSIFICATION.ASSIGNMENT
                    ].includes(false);
                });

                this.index += value.length;
                value = this.getNodes(value);

                SyntaxScannerExpression.Item.item(token, previousNodes, 'Property definition');
                SyntaxScannerExpression.Item.item(token, value, 'Value definition');
                commonExpression.upgradeBody({ property: previousNodes[0], value: value[0] });

                this.ast.pop(); // remove value

                this.push(commonExpression);
            }

            else if (TypeOfToken.classification(token) == TypeOfToken.CLASSIFICATION.ASSIGNMENT) {
                const commonExpression = new Expression(TypeOfAtomicExpression.ASSIGNMENT, { });  
                const previousNodes = this.ast.slice(0, this.index);
                this.index++;
                let possibleTerms = this.tokens.slice(this.index);

                let value = this.localCollectTokens(possibleTerms, (peek) => {
                    return ![
                        peek != undefined, peek.type != TypeOfToken.COMMA, peek.type != TypeOfToken.SEMICOLON
                    ].includes(false);
                });

                this.index += value.length;
                value = this.getNodes(value);

                SyntaxScannerExpression.Item.item(token, previousNodes, 'Name definition');
                SyntaxScannerExpression.Item.item(token, value, 'Value definition');
                
                this.ast.pop(); // remove previous node of AST
                const previousNode = previousNodes[0];

                if (previousNode.type == TypeOfAtomicExpression.PROPERTY) {
                    const propertyExpression = previousNode.body;
                    commonExpression.upgradeBody({ name: propertyExpression.property, type: propertyExpression.value });
                } else {
                    commonExpression.upgradeBody({ name: previousNode });
                }

                commonExpression.upgradeBody({ value: value[0] });
                this.push(commonExpression);
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

        const isSquareBracket = token.type == TypeOfToken.OPEN_SQUARE_BRACKET;

        while (this.isNext()) {
            const peek = this.peek();

            if (isSquareBracket) {
                SyntaxScannerExpression.Item.tokenOfItem(peek);
            }

            if (peek.type == saveOpenPair) counter.open++;
            else if (peek.type == possibleClosePair) counter.close++;

            if (counter.open == counter.close) {
                possibleTerms.push(peek);
                this.index++;
                break;
            }

            possibleTerms.push(peek);
            this.index++;
        }

        return possibleTerms;
    }


    recursiveParse(token) {
        let possibleTerms = this.walkToClosePair(token);
        let close = possibleTerms[possibleTerms.length - 1];

        // Note: this is not necessary because the parser will not allow multiple close pairs
        possibleTerms.shift();
        possibleTerms.pop();

        const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
        const nodes = this.parser(possibleTerms);
        this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);

        const previousNode = this.getLastItemAST();

        SyntaxScannerExpression.scanGroupingExpression(token, previousNode);
        const commonExpression = new Expression(TypeOfAtomicExpression.PARENTHESIS, { parentheses: [token, close], body: nodes }); 

        if (token.type == TypeOfToken.OPEN_PAREN) {
            if (SyntaxScannerItem.mode == SyntaxScannerItem.MODES.signature) {
                if (nodes[0] && nodes[0].type != TypeOfAtomicExpression.ARGUMENTS) {
                    SyntaxScannerExpression.Item.signature(token, nodes, 'Item', false);

                    nodes.push(BuilderAtomicExpression[TypeOfAtomicExpression.TYPE_OF_ARGUMENT](nodes));
                    nodes.splice(0, nodes.length - 1);
                }
            } else {
                SyntaxScannerExpression.Item.item(token, nodes, 'Item', false);
            }

            if (previousNode) {
                let args = nodes;

                if (nodes[0]?.type == TypeOfAtomicExpression.ARGUMENTS) {
                    args = nodes[0].body.values;
                }

                commonExpression.upgradeType(TypeOfAtomicExpression.CALL);
                commonExpression.upgradeBody({ caller: previousNode, arguments: args });
                commonExpression.delete('body');
                this.ast.pop();
            }
        }

        else if (token.type == TypeOfToken.OPEN_SQUARE_BRACKET) {
            // Explain: this is empty array or type of array
            if (nodes.length == 0) {
                const lastItemOfAST = this.getLastItemAST();

                if (lastItemOfAST) {
                    commonExpression.upgradeType(TypeOfAtomicExpression.TYPE_OF_ARRAY);
                    commonExpression.upgradeBody({ type: lastItemOfAST });
                    this.ast.pop();
                } else {
                    commonExpression.upgradeType(TypeOfAtomicExpression.ARRAY);
                }

                commonExpression.upgradeBody({ values: nodes });
                commonExpression.delete('body');
            } 
            
            // Explain: this array with elements
            else if (nodes[0].type == TypeOfAtomicExpression.ARGUMENTS) {
                commonExpression.upgradeType(TypeOfAtomicExpression.ARRAY);
                commonExpression.upgradeBody({ values: nodes[0].body.values });
                commonExpression.delete('body');
            } 
            
            // Explain: this is not array because it has other expression
            else if (nodes.length > 1) {
                SyntaxScannerExpression.Item.item(token, nodes);
            }
            
            // Explain: this `object[key]` expression or array with one element
            else {
                const lastItemOfAST = this.getLastItemAST();

                if (lastItemOfAST) {
                    commonExpression.upgradeType(TypeOfAtomicExpression.MEMBER);
                    commonExpression.upgradeBody({ point: this.getLastItemAST(), link: nodes[0], isArrayForm: true });
                } else {
                    commonExpression.upgradeType(TypeOfAtomicExpression.ARRAY);
                    commonExpression.upgradeBody({ values: nodes[0] });
                }
                
                commonExpression.delete('body');
                this.ast.pop();
            }
        }

        else if (token.type == TypeOfToken.LESS) {
            new exceptions.WarningExpressionException('Generics is not supported yet', token, 'Warning');
            return;
        }

        else if (token.type == TypeOfToken.OPEN_CURLY_BRACKET) {
            const lastItemOfAST = this.getLastItemAST();

            if (lastItemOfAST && [TypeOfAtomicExpression.IDENTIFER, TypeOfAtomicExpression.MEMBER].includes(lastItemOfAST.type)) {
                commonExpression.upgradeType(TypeOfAtomicExpression.INIZIALIZER);
                let values = nodes;

                if (nodes[0] && nodes[0].type == TypeOfAtomicExpression.ARGUMENTS) {
                    values = nodes[0].body.values;
                }

                SyntaxScannerExpression.Item.item(token, nodes, 'inizializer item', false);
                commonExpression.upgradeBody({ inizializer: lastItemOfAST, values });
                commonExpression.delete('body');
                this.ast.pop();
            } else {
                commonExpression.upgradeType(TypeOfAtomicExpression.OBJECT);
                this.ast.pop();
            }
        }

        this.push(commonExpression);
    }

    collectTokens(cb, nestCondition = false) {
        let possibleTerms = [];

        while (this.isNext() && cb(this.peek())) {
            const peek = this.peek();

            if (this.isOpenPair(peek)) {
                possibleTerms.push(...this.walkToClosePair(peek));

                if (nestCondition && !cb(this.getPreviousToken())) {
                    break;
                }
            } else {
                possibleTerms.push(peek);
                this.index++;
            }
        }

        return possibleTerms;
    }

    localCollectTokens(tokens, cb, nestCondition = false) {
        const [bufferAST, bufferIndex, bufferSizeTokens, bufferTokens] = [this.ast, this.index, this.tokens.length, this.tokens];
        this.tokens = tokens;
        this.index = 0;
        this.ast = [];
        this.sizeof = tokens.length;
        const nodes = this.collectTokens(cb, nestCondition);
        this.tokens = bufferTokens;
        this.index = bufferIndex;
        this.ast = bufferAST;
        this.sizeof = bufferSizeTokens;
        return nodes;
    }

    getNodes(possibleTerms) {
        const { bufferAST, bufferIndex, bufferSizeTokens, bufferTokens } = this.startRecursive();
        const nodes = this.parser(possibleTerms);
        this.endRecursive(bufferAST, bufferIndex, bufferSizeTokens, bufferTokens);
        return nodes;
    }

    getNextNode() {
       const node = this.parser(this.tokens.slcie(this.index + 1), this.ast, { return: true });
       return node;
    }

    isOpenPair(token) {
        return [TypeOfToken.OPEN_PAREN, TypeOfToken.OPEN_SQUARE_BRACKET, TypeOfToken.OPEN_CURLY_BRACKET, TypeOfToken.LESS].includes(token.type);
    }

    isClosePair(token) {
        return [TypeOfToken.CLOSE_PAREN, TypeOfToken.CLOSE_SQUARE_BRACKET, TypeOfToken.CLOSE_CURLY_BRACKET, TypeOfToken.GREATER].includes(token.type);
    }

    matchClosePair(token) {
        return {
            [TypeOfToken.OPEN_PAREN]: TypeOfToken.CLOSE_PAREN,
            [TypeOfToken.OPEN_SQUARE_BRACKET]: TypeOfToken.CLOSE_SQUARE_BRACKET,
            [TypeOfToken.OPEN_CURLY_BRACKET]: TypeOfToken.CLOSE_CURLY_BRACKET,
            [TypeOfToken.LESS]: TypeOfToken.GREATER
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
        this.peek().type == TypeOfToken.EOF;
    }
}

module.exports = RecursiveDescentParser;