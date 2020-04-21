---
layout: post
title: Friendly, Readable Expression Trees
excerpt: Introducing ReadableExpressions, a simple PCL which generates a friendly, readable view of an Expression Tree.
tags: [{{ C# | url_encode }}, {{ Programming Practices | url_encode }}]
---

tl;dr: ReadableExpressions is an extension method which makes a readable string from [Expression 
trees](https://msdn.microsoft.com/en-us/library/bb397951.aspx) that's on 
[NuGet](https://www.nuget.org/packages/AgileObjects.ReadableExpressions) and 
[GitHub](https://github.com/agileobjects/ReadableExpressions). There's a set of Debug Visualizers 
which use it in the [Visual Studio Gallery](https://marketplace.visualstudio.com/items?itemName=vs-publisher-1232914.ReadableExpressionsVisualizers).

We all like ~~playing around with~~ working with 
[Expression Trees](https://msdn.microsoft.com/en-us/library/bb397951.aspx), right? Creating 
type-safe functions at runtime when you don't know the types at compile time gives you great 
performance and is just plain neat. I'm using them in 
[my pet object-object mapper](https://github.com/agileobjects/AgileMapper), and need to look at the
mapping functions it creates. Unfortunately, the default debug view for an Expression Tree looks 
something like this:

![_config.yml](/images/posts/2016-02-29/DebugView.png)

...now maybe you're some coding savant who eats IL for breakfast, but I find that pretty unreadable.

So! To get a nicer look at my Expression Trees, I've written 
[ReadableExpressions](https://github.com/agileobjects/ReadableExpressions), a PCL with a single 
extension method which translates an Expression Tree into something friendlier, like:

![_config.yml](/images/posts/2016-02-29/VisualizerView.png)

...yes, that's the same Expression Tree as the first screenshot :)

Because I needed one, I also added an Expression for comments:

```csharp
var comment = ReadableExpression.Comment("Anyone listening?");
Expression<Action> beep = () => Console.Beep();

var commentedBeep = Expression.Block(comment, beep.Body);

var translated = commentedBeep.ToReadableString();

const string EXPECTED = @"
// Anyone listening?
Console.Beep();";

Assert.AreEqual(EXPECTED.TrimStart(), translated);
```

## Uses and How to Download

The ReadableExpressions [NuGet package](https://www.nuget.org/packages/AgileObjects.ReadableExpressions):

```console
PM> Install-Package AgileObjects.ReadableExpressions
```

...provides the extension method:

```csharp
Expression<Func<string, string, int>> convertStringsToInt = 
    (str1, str2) => int.Parse(str1) + int.Parse(str2);

var translated = convertStringsToInt.ToReadableString();

Assert.AreEqual(
    "(str1, str2) => int.Parse(str1) + int.Parse(str2)", 
    translated);
```

...and I've used it to make Expression [Debug Visualizers](https://msdn.microsoft.com/en-us/library/zayyhzts.aspx)
for Visual Studio 10 to 15. They're in the root of 
[the GitHub repo](https://github.com/agileobjects/ReadableExpressions), or via an installer in the 
[Visual Studio Gallery](https://marketplace.visualstudio.com/items?itemName=vs-publisher-1232914.ReadableExpressionsVisualizers).