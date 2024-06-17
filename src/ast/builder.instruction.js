const TypeOfAtomicExpression = require("../types/expression.type");

class BuilderExpression {
    // builder import
    static buildImportInstruction(ast) {
        const node = { module: ast[0] };

        if (ast.length > 1) {
            node.alias = ast[2];
        }

        return node;
    }

    static buildExportInstruction(ast) {
        const node = { module: ast[0] };
        return node;
    }

    static buildFunctionalInstruction(nodes, attributes = []) {
        if (nodes.length == 1) {
            return { name: attributes[attributes.length - 1], body: nodes[0], attributes: attributes.slice(0, -1) };
        }

        const node = { name: nodes[0], body: nodes[1], attributes };
        return node;
    }

    static buildCallInstruction(ast) {
        return ast[0];
    }

    static buildReturnInstruction(ast) {
        return ast[0];
    }

    static buildVariableExpression(nodes) {
        let node = nodes[0];
        
        if (node.type == TypeOfAtomicExpression.ASSIGNMENT) {
            return node.body;
        } else if (node.type == TypeOfAtomicExpression.PROPERTY) {
            node = node.body;
            return { name: node.property, value: node.value };
        }

        return {};
    }

    static buildMathInstruction(nodes) {
        let node = nodes[0];
 
        if (node && node.type == TypeOfAtomicExpression.ARGUMENTS) {
            return node.body;
        } else {
            return { values: nodes };
        }
    }

    static getAttributes(ast) {
        const attributes = [];

        if (ast.length > 1) {
            let localIndex = 0;
            const peek = (i) => ast[i];

            while (localIndex < ast.length) {
                if (peek(localIndex).type == TypeOfAtomicExpression.CALL || peek(localIndex).type == TypeOfAtomicExpression.OBJECT) {
                    break;
                } else {
                    attributes.push(peek(localIndex));
                    ast.shift();
                }
            }
        }

        if (attributes.length > 0) {
            return attributes;
        }
    }
}

module.exports = BuilderExpression;