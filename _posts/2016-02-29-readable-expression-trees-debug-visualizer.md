---
layout: post
title: Friendly, Readable Expression Trees
excerpt: Introducing ReadableExpressions, a simple PCL which generates a friendly, readable view of an Expression Tree.
tags: [C&#35;, Expression Trees, Programming Practices]
---

tl;dr: ReadableExpressions is an extension method which makes a readable string from [Expression 
trees](https://msdn.microsoft.com/en-us/library/bb397951.aspx) that's on 
[NuGet]({{ site.re_nuget }}) and [GitHub]({{ site.re_github }}). There's a set of Debug Visualizers which 
use it in the [Visual Studio Marketplace]({{ site.re_viz }}).

We all like ~~playing around with~~ working with 
[Expression Trees](https://msdn.microsoft.com/en-us/library/bb397951.aspx), right? Creating 
type-safe functions at runtime when you don't know the types at compile time gives you great 
performance and is just plain neat. I'm using them in 
[my pet object-object mapper]({{ site.am_nuget }}), and need to look at the mapping functions it 
creates. Unfortunately, the default debug view for an Expression Tree looks something like this:

![Debug view]({{ site.post_images_dir }}2016-02-29/DebugView.png)

...now maybe you're some coding savant who eats IL for breakfast, but I find that pretty unreadable.

So! To get a nicer look at my Expression Trees, I've written [ReadableExpressions]({{ site.re_nuget }}),
a PCL with a single extension method which translates an Expression Tree into something friendlier, like:

![Visualizer view]({{ site.post_images_dir }}2016-02-29/VisualizerView.png)

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

The ReadableExpressions [NuGet package]({{ site.re_nuget }}):

```shell
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
for Visual Studio 10 to 15. They're in the root of [the GitHub repo]({{ site.re_github }}), or via the
installer in the [Visual Studio Marketplace]({{ site.re_viz }}).