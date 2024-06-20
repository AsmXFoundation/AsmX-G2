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

## Table of Contents
- [Chapter 1: Introduction to AsmX G2](#chapter-1-introduction-to-asmx-g2)
- [Chapter 2: Setting Up the Development Environment](#chapter-2-setting-up-the-development-environment)
- [Chapter 3: Basic Syntax and Structure](#chapter-3-basic-syntax-and-structure)


## Chapter 1: Introduction to AsmX G2
AsmX G2 is a powerful, low-level programming language designed for efficient and precise control over system resources. It combines the speed and flexibility of assembly language with modern programming constructs, making it an ideal choice for system-level programming, embedded systems, and performance-critical applications.

In this comprehensive guide, we will explore the intricacies of AsmX G2, starting from the basics and gradually progressing to advanced topics. Whether you are a beginner or an experienced programmer, this book will provide you with the knowledge and skills necessary to master AsmX G2 programming.

## Chapter 2: Setting Up the Development Environment
Before diving into the world of AsmX G2 programming, it is essential to set up a proper development environment. In this chapter, we will guide you through the process of installing and configuring the necessary tools and dependencies.

### Prerequisites
To begin programming in AsmX G2, you will need the following:
- NodeJS (v18.16.1 or higher)
- Git Bash
- A text editor or Integrated Development Environment (IDE) such as VSCode

### Installation Steps
1. Download and install NodeJS from the official website (https://nodejs.org). Make sure to select the appropriate version for your operating system.
2. Download and install Git Bash from the official website (https://git-scm.com).
3. Download and install VSCode or your preferred text editor/IDE.

### Cloning the AsmX G2 Repository
To access the AsmX G2 source code and examples, you need to clone the official repository from GitHub. Open Git Bash and execute the following command:
```
git clone https://github.com/lang-AsmX/AsmX-G2.git
```

Once the repository is successfully cloned, navigate to the `src` directory and install the necessary dependencies by running the following commands:
```
cd src && npm install
cd ../
```

Congratulations! You have now set up your AsmX G2 development environment and are ready to start programming.

## Chapter 3: Basic Syntax and Structure
In this chapter, we will explore the fundamental syntax and structure of AsmX G2 programs. Understanding these concepts is crucial for writing well-organized and efficient code.

### The Main Function
Every AsmX G2 program must have a `main` function, which serves as the entry point of the program. The `main` function is defined using the `@function` keyword followed by the function name and a pair of parentheses. Here's an example:
```
@function main() {
  # Your code goes here
}
```

It is important to note that AsmX G2 executes the `main` function only when it encounters its definition. Re-declaring the `main` function will result in an error.

### Comments
Comments in AsmX G2 are denoted by the `#` symbol. Any text following the `#` symbol on a line is considered a comment and is ignored by the compiler. Comments are useful for adding explanatory notes and improving code readability. For example:
```
# This is a single-line comment
```

### Hello, World! Program
Let's write our first AsmX G2 program, the classic "Hello, World!" example. Open your text editor or IDE and create a new file with the following code:
```
@function main() {
  @push "Hello, World!";
  @system 4;
}
```

Let's break down the code:
- The `@push` instruction takes a single argument, which in this case is a string literal. It pushes a pointer to the string onto the stack.
- The `@system` instruction takes a single argument of type `number`. It allows you to make system calls. In this example, the argument `4` indicates that we want to perform a standard output (stdout) operation.

Before printing, the `@system` instruction retrieves the last element from the stack, which is a 16-bit pointer, and uses it to read from memory. The stack exclusively stores 16-bit pointers.

To run the program, save the file and execute the following command in Git Bash:
```
asmx your_file_name.asmx
```

Congratulations! You have just written and executed your first AsmX G2 program.

# Architecture
The AsmX architecture includes a main stack, two cores, a unique numeric representation, and a memory architecture. The first kernel is responsible for calling the compiler, which then compiles the source code into an intermediate representation. The second core is responsible for assembling and executing the code. This design ensures efficient code execution and optimization.

AsmX supports the use of registers, instructions, functions and object-oriented programming. Its memory architecture is also tailored to provide flexibility and optimization capabilities.

AsmX can be thought of as a compiler in that it takes high-level source code and transforms it into a lower-level representation that can be executed. This process includes parsing, intermediate representation creation, code optimization, and target code generation.

Essentially, AsmX is a programming language implemented in Node.js that compiles source code into an intermediate representation. Its architecture includes a main stack, two cores, a unique number representation system, and its own memory architecture. AsmX supports the use of registers, instructions, functions and object-oriented programming.

AsmX can also be thought of as an intermediate representation compiler (IRC) because it compiles source code into an intermediate representation, allowing further optimization and execution on a virtual machine or simulated architecture. It is important to note that AsmX is not an interpreter because it does not directly execute source code line by line. Instead, the first kernel calls the compiler, which then compiles the source code into an intermediate representation, and the second kernel assembles and executes the code.
