class TypeNamespace {};

TypeNamespace.i128 = require("./integer");
TypeNamespace.char = require("./char");
TypeNamespace.array = require("./array");

module.exports = TypeNamespace;