---
layout: post
title: AgileMapper v1.8 Released
excerpt: AgileMapper 1.8 is now on NuGet with refinements, fixes, and a new option for configuring data sources.
tags: [AgileMapper]
---

_AgileMapper is a powerful and unopinionated object mapper for .NET 3.5+ and .NET Standard 1.0+. It 
flattens, unflattens, deep clones, merges, updates and projects queries. It works without configuration, 
but if needed, is highly and easily configurable._

AgileMapper 1.8 is now available [on NuGet]({{ site.am_nuget }}) with refinements, fixes, and a new
option for 
[configuring data sources]({{ site.am_docs }}/configuration/Member-Values#applying-data-sources-with-a-matcher).

## Configuring Matcher Data Sources

AgileMapper has long supported 
[ignoring target members]({{ site.am_docs }}/configuration/Ignoring-Target-Members#target-member-filtering)
(and [source members]({{ site.am_docs }}/configuration/Ignoring-Source-Members#source-member-filtering))
using filters - `Func`s which match members based on their types, names, paths, attributes, etc. The 
same filters can now be used to configure source values to matched target members.

For example, say you have a set of source models with `bool` properties which map to target model 
`string` members, which expect "1" or "0" instead of true or false. By marking your target members 
with `YesOrNoAttribute`s, this can be configured like so:

```csharp
// Configure bool -> string mappings to map 'Yes' or 'No'
// if the target string member has a YesOrNoAttribute:
Mapper.WhenMapping
	.From<bool>().To<string>()
	.IfTargetMemberMatches(m => m.HasAttribute<YesOrNoAttribute>())
	.Map((bl, str) => bl ? "Yes" : "No") // <- 'bl' is the source bool value
	.ToTarget(); // <- ToTarget() applies the source value to any matching target string member
```

[This DotNetFiddle](https://dotnetfiddle.net/LVTd2z){:target="_blank"} shows a live example.

## Ignoring Unusual Base Class Library Classes

AgileMapper now ignores BCL classes which aren't commonly used in models. Previously, if a model had
a `PropertyInfo` member (for example), AgileMapper would try to figure out how to map it, find that 
it couldn't, and move on. It now skips BCL types except those usually found in models - Lists, 
Dictionaries, etc. This makes for faster mapper creation.

## NET Standard 2.0 Target

As a downstream consequence of a .NET Standard 2.0 target being added to 
[ReadableExpressions]({{ site.re_github }}), AgileMapper now has an additional .NET Standard 2.0
target. This makes it more easily consumable from packages or apps which target .NET Standard 2.0.
With support going all the way back to .NET Framework 3.5, AgileMapper is an option for a very wide
range of projects!

Please report any issues or suggestions [on GibHub]({{ site.am_github }}/issues). Happy mapping!