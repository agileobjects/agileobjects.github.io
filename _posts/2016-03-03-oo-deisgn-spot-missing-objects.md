---
layout: post
title: Spotting a Missing Object
excerpt: There are various tell-tale signs when a system is missing an object, and I spotted some of them recently while writing the ReadableExpressions library. Here's how.
tags: [Programming Practices]
---

There are various tell-tale signs when a system is missing an object, and I spotted some of them 
recently while writing the [ReadableExpressions](/readable-expression-trees-debug-visualizer) 
library. ReadableExpressions parses an Expression tree using translator objects, each of which deals 
with one or more [ExpressionType](https://msdn.microsoft.com/en-us/library/bb361179(v=vs.110).aspx)s.
Various types of expressions have zero-or-more expressions nested within them, namely:

- Lambdas
- Loops
- Conditional statements (if / else or ternary)
- Switch case statements
- Try / catch / finally statements

...and in each of those cases you may or may not want the statement(s) enclosed in braces, or want 
a single-line statement to end with a semi-colon.

My first approach to translating blocks of statements used the following signature:

```csharp
string TranslateExpressionBody(
    Expression body,
    Type returnType,
    bool encloseSingleStatementsInBrackets = true)
```

There's a red flag there already - [the boolean parameter](https://www.informit.com/articles/article.aspx?p=1392524) - 
but at that point I was only using it to translate Lambdas, Loops and very simple Conditionals, so 
it worked ok.

As the test cases for `ConditionalExpression`s got more complex, the problems started. 
`TranslateExpressionBody` returned a string which its callers were having to examine to see if it 
contained newlines, and having to indent or wrap with braces, or both, or neither. The extra work 
which was being done (and duplicated) on the results of the translation was a sign of a missing 
object.

So! Enter `CodeBlock`:

```csharp
class CodeBlock
{
     public bool IsASingleStatement;

     public string AsExpressionBody();

     public CodeBlock Indented(); 

     public string WithoutBrackets();

     public string WithBrackets();
}
```

...which as you can see, encapsulates the various things you might want to do or know about a block 
of code. Eventually `TranslateExpressionBody` became:

```csharp
CodeBlock TranslateExpressionBody(Expression body)
```

Much better!

So, to sum up - you may be missing an object if you find yourself:

- Undoing or second-guessing work done in one place somewhere else
- Performing further operations on the result of a method
- Using boolean parameters to obtain slightly different results from a method
- Duplicating code

In these cases, you may benefit from moar objects :)