---
layout: post
title: Mapper vs Mapper&#58; Performance
excerpt: The first in a series of posts comparing a subset of the available mappers. This blog is on that favourite thing we're not supposed to obsess too much about (in programming) - performance.
tags: [AgileMapper, AutoMapper, Performance]
---

<span class="updated">
Update: the set of test results in this blog didn't turn out to all be based on fair comparisons - 
I've [updated them and re-measured](/object-mapper-performance-comparison-revisited).
I'm leaving this blog in place as it describes the tests.
</span>

<span class="first">
This is the first in a series of posts comparing a subset of the available mappers. I'm going to 
compare performance, features and ease of use, and I'll turn those words into links as I write the 
blogs. This blog is on that favourite thing 
[we're not supposed to obsess too much about](https://wiki.c2.com/?PrematureOptimization) (in programming) -
performance.
</span>

## The Mappers

#### AgileMapper

My mapper project which I first published last month. AgileMapper focuses on ease of use, flexibility and transparency.

#### AutoMapper

343 thousand downloads of [the latest version](https://www.nuget.org/packages/AutoMapper); pretty 
safe to say you all already know about AutoMapper, right? Not much else to say, then :)

#### ExpressMapper

[ExpressMapper](https://www.nuget.org/packages/Expressmapper) is a 'lightweight' mapper, first 
written as a faster alternative to the AutoMapper 4.x.x series.

#### Mapster

[Mapster](https://www.nuget.org/packages/Mapster) is another 'lightweight' mapper, written to be 
"kind of like AutoMapper, just simpler and way, way faster" (quoted from their NuGet page).

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

#### An aside about Unflattening

As it turned out, it was only AgileMapper and ValueInjecter that supported the unflattening 
scenario. AutoMapper [has limited configurable support](https://stackoverflow.com/questions/3145062/using-automapper-to-unflatten-a-dto)
for unflattening, but can't - or at least I couldn't figure out how it could - map to two different 
nested POCO properties of the same type. Not a knock against AutoMapper - it's just not what it's 
made for.

## The Results!

I bet at least some of you skipped to this bit :) That's ok! :) Here's the results I got - the numbers are the total elapsed seconds for 1 million mappings of each type. I used the latest versions of each mapper.

|                         | Constructor | Complex   | Flattening | Unflattening | Deep     |
|-------------------------|-------------|-----------|------------|--------------|----------|
| Manual                  |     0.00909 |   1.74734 |    0.05565 |      0.05247 |  0.50256 |
| AgileMapper 0.6         |     0.19113 |   5.13823 |    0.38389 |      0.58581 |  1.17215 |
| AutoMapper 5.1.1        |     0.15574 |   6.24280 |    0.36955 |            - |  0.95390 |
| AutoMapper 4.2.1        |     1.16314 | 118.58244 |    3.47239 |            - | 23.18986 |
| ExpressMapper 1.8.3     |     0.20984 |   5.11046 |    0.52418 |            - |  1.58197 |
| Mapster 2.5.0           |     0.12274 |   2.10094 |    0.29612 |            - |  0.85356 |
| ValueInjecter 3.1.1.3   |     0.47094 |   8.94618 |   12.86222 |     13.94930 | 27.99192 |

## Points to Note

- Mapster is the fastest!
 
- At this point I'd say AgileMapper's performance is 'comparable' - faster than some, slower than 
  others. I'm pretty happy with that having worked on it as a pet project over the last 6ish months

- The performance improvements in AutoMapper 5 were *huge*; benchmarks you may find against the 
  much-slower version 4 are pretty much irrelevant

- Obviously some of the ValueInjecter numbers look like outliers - the test classes can be viewed 
  [here](https://www.github.com/agileobjects/AgileMapper/tree/master/AgileMapper.PerformanceTester/ConcreteMappers/ValueInjecter);
  if there's a better way I could have set them up please do let me know and I'll be happy to say 
  so!

I'll continue making performance tweaks as I continue with AgileMapper - in the meantime stay tuned for comparisons of features and ease of use.

<span class="updated">
Update: the set of test results in this blog didn't turn out to all be based on fair comparisons - 
I've [updated them and re-measured](/object-mapper-performance-comparison-revisited).
I'm leaving this blog in place as it describes the tests.
</span>