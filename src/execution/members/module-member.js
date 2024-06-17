const fs = require('fs');
const path = require('path');
const llvm = require("llvm.js/llvm");
const exceptions = require("llvm.js/exceptions");
const TypeOfInstructionExpression = require("../../types/instruction.type.js");
const PerformerOfAtomicExpression = require("../perfer.js");
const Router = require("../router.js");
const RecursiveDescentParser = require('../../parsing/parser.js');
const Transformer = require('../../parsing/transformer.js');
const Runtime = require('../runtime.js');
const TypeOfExpression = require('../../types/expression.type.js');
const SyntaxScannerExpression = require('../../parsing/scanner-syntax.js');

class ModuleMember {
    static implementationImport(expression) {
        const data = expression.body.ast;
        let pathOfModule;

        if (data.hasOwnProperty('module')) {
            pathOfModule = PerformerOfAtomicExpression.getValueByExpression(data.module);
            const fullPath = path.join(Router.ROUTE_IMPORT_DIRECTORY, pathOfModule);

            if (Router.TRACEWAY_FILES.includes(fullPath)) {
                return;
            }

            if (!['.asmx', '.asmX', '.🚀'].map(filetype => fullPath.endsWith(filetype)).some(Boolean)) {
                SyntaxScannerExpression.exceptDefaultTracewayException(TypeOfExpression.extractTokenOfExpression(expression.body.ast.module), 'File extension must be .asmx, .asmX or .🚀');
            }

            if (fs.existsSync(fullPath)) {
                const BUFFER_IMPORT_ENVIROMENT_MODE = Runtime.IMPORT_ENVIROMENT_MODE;
                Runtime.IMPORT_ENVIROMENT_MODE = Runtime.TYPE_OF_ENVIROMENTS.MODULE;
                
                const fileContent = fs.readFileSync(fullPath).toString('utf8');
                let tokens = new llvm.Lexer().lexer(fileContent.split('\n'));
                tokens = tokens.filter(token => !['WHITESPACE', 'COMMENT', 'COMMENT_BODY', 'SPACE'].includes(token.type));    
                tokens = Transformer.transform(tokens);
                
                const bufferImportDirectory = path.dirname(Router.ROUTE_IMPORT_DIRECTORY);

                Router.addTraceWayException({ token: expression.body.id, filepath: Router.TRACEWAY_FILES.last(), reason: 'Exception in the implementation of module import' });
                Router.addTracewayFile(fullPath);
                Router.setRouteImportDirectory(path.dirname(fullPath));

                const ast = new RecursiveDescentParser().parser(tokens);

                const IntermediateRepresentationCompiler = require('../executor/executor.js');
                new IntermediateRepresentationCompiler(ast);

                Router.removeTraceWayException();
                Router.removeTracewayFile();
                Router.setRouteImportDirectory(bufferImportDirectory);

                Runtime.IMPORT_ENVIROMENT_MODE = BUFFER_IMPORT_ENVIROMENT_MODE;
            } else {
                SyntaxScannerExpression.exceptDefaultTracewayException(TypeOfExpression.extractTokenOfExpression(expression.body.ast.module), 'Module does not exist');
            }
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(expression.body.id, 'An exception in the implementation of module import');
        }
    }

    static implementationExport(expression) {
        
    }

    static generalImplementation(expression) {
        const tokenInstruction = expression.body.id;

        if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'import') {
            ModuleMember.implementationImport(expression);
        } else if (TypeOfInstructionExpression.extractNameOfInstruction(tokenInstruction) == 'export') {
            ModuleMember.implementationExport(expression);
        } else {
            SyntaxScannerExpression.exceptDefaultTracewayException(tokenInstruction, 'Expected "import" or "export" keyword');
        }
    }
}

module.exports = ModuleMember;