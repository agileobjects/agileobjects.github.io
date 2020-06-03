---
layout: post
title: Mapper vs Mapper&#58; The Performance Plot Thickens
excerpt: The last mapper performance blog (for a while, at least), including updated versions of AgileMapper, AutoMapper and Mapster, and discussion of some performance nuances.
tags: [AgileMapper, AutoMapper, Performance]
---

Ok, first of all, I'm definitely going to write about something other than mapper performance soon.
This is my third blog on the subject and I want to talk a bit about some unique AgileMapper features!
But we've got new versions of [AgileMapper]({{ site.am_nuget }}),
[AutoMapper](https://www.nuget.org/packages/AutoMapper) and 
[Mapster](https://www.nuget.org/packages/mapster) - the latter including a fix for 
[the bug](https://github.com/eswann/Mapster/issues/89) I found writing 
[my last blog](/object-mapper-performance-comparison-revisited) on this subject - and 
some nuances to talk about.

As this is my third update on this subject - and as it's Christmas time - here's the mappers and tests we're talking about, so you don't have to visit the previous blogs. You're welcome! :)

## The Mappers

The mappers I'll be comparing are:

#### AgileMapper

[My mapper project]({{ site.am_nuget }}), now on version 0.9. AgileMapper focuses on ease of use, 
flexibility and transparency.

#### AutoMapper

You all already know about AutoMapper - it's AutoMapper! I'm now testing version 5.2.0, as well as 
[version 4.2.1](https://www.nuget.org/packages/AutoMapper/4.2.1), as requested by a reader.

#### ExpressMapper

[ExpressMapper](https://www.nuget.org/packages/Expressmapper) is a 'lightweight' mapper, first 
written as a faster alternative to the AutoMapper 4.x.x series.

#### Mapster

[Mapster](https://www.nuget.org/packages/Mapster) is another 'lightweight' mapper, written to be 
"kind of like AutoMapper, just simpler and way, way faster" (quoted from their NuGet page). Now on 
version 2.6.1, and the author [has optimised]({{ site.am_github }}/pull/4) 
its use in my tests.

#### ValueInjecter

[ValueInjecter](https://www.nuget.org/packages/ValueInjecter) is written for flexibility, and 
supports unflattening as well as flattening.

## The Tests

[The performance test project]({{ site.am_github }}/tree/master/AgileMapper.PerformanceTester) is a 
console project based on [the AutoMapper benchmark](https://github.com/AutoMapper/AutoMapper/tree/master/src/Benchmark)
which performs each of the following, for each mapper, 1 million times:

- Constructor mapping - creating a POCO with a single constructor parameter from a POCO with a 
  matching property

- Complex mapping - deep cloning a Foo POCO with various kinds of value type properties, 
  multiply-recursive `Foo`, `List<Foo>` and `Foo[]` properties, and `IEnumerable<int>` and 
  `int[]` properties

- Flattening - mapping from a POCO with nested POCO properties to a POCO with all value type (and 
  string) properties

- Unflattening - mapping from a POCO with all value type (and string) properties to an object with 
  nested POCO properties - only AgileMapper and ValueInjecter support this at the time of writing

- Deep mapping - mapping a POCO with nested POCO and POCO collection properties onto a 
  differently-typed POCO with corresponding properties

## The Nuances

I had [a pull request]({{ site.am_github }}/pull/5) to add the 
[`AllowPartiallyTrustedCallers`](https://msdn.microsoft.com/en-us/library/system.security.allowpartiallytrustedcallersattribute%28v=vs.110%29.aspx)
attribute to the test project. As explained [in this StackOverflow question](https://stackoverflow.com/questions/5053032/performance-of-compiled-to-delegate-expression/5160513),
Funcs compiled from Expression trees are hosted in dynamically-created, partially-trusted 
assemblies; subsequent executions of these Funcs incur a security overhead. Applying 
`AllowPartiallyTrustedCallers` to the *calling* assembly causes part of the security checks to 
be skipped, which speeds things up.

As you'd expect, that's not the whole story, though - assemblies marked with `AllowPartiallyTrustedCallers`
can only call assemblies with compatible security settings. Applying it to the test project means 
it can't call ExpressMapper, Mapster, ValueInjecter *or* AutoMapper 4.2.1. So you can't just go 
around slapping `AllowPartiallyTrustedCallers` on everything then kick back to think what you'll
do with all the execution time you've saved :)

## Results Time!

Here's the updated results - as mentioned, the numbers are the total seconds required to perform 1 
million iterations of each test. 'w/ APTC' is the time with `AllowPartiallyTrustedCallers` applied.

|                         | Constructor | Complex   | Flattening | Unflattening | Deep     |
|-------------------------|-------------|-----------|------------|--------------|----------|
| Manual                  |     0.00880 |   1.56607 |    0.05303 |      0.05021 |  0.47373 |
| AgileMapper 0.9         |     0.15377 |   3.49969 |    0.33809 |      0.50427 |  1.09299 |
| AgileMapper 0.9 w/ APTC |     0.13513 |   2.00515 |    0.21154 |      0.38073 |  0.57013 |
| AutoMapper 5.2          |     0.16253 |   7.60686 |    0.38347 |            - |  0.97259 |
| AutoMapper 5.2 w/ APTC  |     0.15512 |   6.22497 |    0.23118 |            - |  0.57299 |
| AutoMapper 4.2.1        |     1.16314 | 118.58244 |    3.47239 |            - | 23.18986 |
| ExpressMapper 1.8.3     |     0.21227 |  14.15144 |    0.51291 |            - |  6.25267 |
| Mapster 2.6.1           |     0.03146 |   3.23346 |    0.20822 |            - |  0.73005 |
| ValueInjecter 3.1.1.3   |     0.44900 |  98.57722 |   12.67822 |     13.59581 | 27.74575 |

## Points to Note

- Mapster is still the fastest at churning out simple mappings - look at that constructor test time!

- AgileMapper with `AllowPartiallyTrustedCallers` applied is the fastest at performing non-simple
  mappings - quite pleased with that! :)

- As mentioned previously, the performance improvements in AutoMapper 5 were huge

Ok, that's it - no more Mapper performance talk... for a while. Stay tuned for some blogs on some 
unique things AgileMapper can do for you :)
