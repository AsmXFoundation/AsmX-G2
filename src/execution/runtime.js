class Runtime {
    static TYPE_OF_ENVIROMENTS = { MAIN: 'main', MODULE: 'module', GLOBAL: 'global', LOCAL: 'local' };
    static MAIN_FUNCTION_NAME = 'main';
    /** - main or module */
    static  IMPORT_ENVIROMENT_MODE = Runtime.TYPE_OF_ENVIROMENTS.MAIN;
    /** - global or local */
    static TYPE_OF_ENVIROMENT = Runtime.TYPE_OF_ENVIROMENTS.GLOBAL;
    
    /** - It is used to keep track of whether a main function exists in the program. */
    static HAS_MAIN_FUNCTION = false;
}

Runtime.aggregates = require('./storage/aggregates.js');

module.exports = Runtime;