# AsmX G2

# Installation
To install AsmX G2, run the following command:
```bash
cd src && npm install
cd ../
```

# Usage
To run AsmX G2, run the following command:
```bash
# Windows
asmx /examples/hello.asmx

# Linux
asmx //examples/hello.asmx
```

# Architecture
The AsmX architecture includes a main stack, two cores, a unique numeric representation, and a memory architecture. The first kernel is responsible for calling the compiler, which then compiles the source code into an intermediate representation. The second core is responsible for assembling and executing the code. This design ensures efficient code execution and optimization.

AsmX supports the use of registers, instructions, functions and object-oriented programming. Its memory architecture is also tailored to provide flexibility and optimization capabilities.

AsmX can be thought of as a compiler in that it takes high-level source code and transforms it into a lower-level representation that can be executed. This process includes parsing, intermediate representation creation, code optimization, and target code generation.

Essentially, AsmX is a programming language implemented in Node.js that compiles source code into an intermediate representation. Its architecture includes a main stack, two cores, a unique number representation system, and its own memory architecture. AsmX supports the use of registers, instructions, functions and object-oriented programming.

AsmX can also be thought of as an intermediate representation compiler (IRC) because it compiles source code into an intermediate representation, allowing further optimization and execution on a virtual machine or simulated architecture. It is important to note that AsmX is not an interpreter because it does not directly execute source code line by line. Instead, the first kernel calls the compiler, which then compiles the source code into an intermediate representation, and the second kernel assembles and executes the code.
