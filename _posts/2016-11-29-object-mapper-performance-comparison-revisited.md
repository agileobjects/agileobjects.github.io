---
layout: post
title: Mapper vs Mapper&#58; Performance Revisited
excerpt: I recently wrote a blog on the performance of various object-object mappers, but it turns out my tests weren't quite fair and equal at that point. Having updated the relevant mapper classes and re-measured, here are my results.
tags: [AgileMapper, AutoMapper, Performance]
---

<span class="updated">
Update: I have [more up-to-date results](/object-mapper-performance-comparison-allowpartiallytrustedcallers) 
than these, including updated versions of AgileMapper, AutoMapper and Mapster.
</span>

<span class="first">
I recently wrote a blog on the performance of various object-object mappers, but it turns out my 
tests weren't quite fair and equal at that point. Specifically:
</span>

#### Creating Empty Collections vs... Not

[ExpressMapper](https://www.expressmapper.org), [Mapster](https://github.com/eswann/Mapster) and 
[ValueInjecter](https://github.com/omuleanu/ValueInjecter) were leaving target collections as null 
if their source value was null, which means [AgileMapper](https://agilemapper.readthedocs.io/),
[AutoMapper](https://www.automapper.org) and the manual mappers I wrote were creating millions (and 
millions) of collection objects the other three mappers weren't. No fair!

#### Mapping Objects vs Copying Object References

In some instances, Mapster and ValueInjecter were copying references to the source objects instead 
of mapping the objects themselves. The ValueInjecter usage was more my mistake than anything (its 
`Mapper.Map(source)` [doesn't perform a deep clone](https://stackoverflow.com/questions/8249891/omu-valueinjecter-deep-clone-unlike-types/10842907#10842907)
by default), but I [raised a bug](https://github.com/eswann/Mapster/issues/89) for the behaviour in 
Mapster, and it's going to be fixed in an upcoming release.

## The Updated Results

So I've updated the relevant mapper classes and re-measured. As before, these are the total number 
of seconds to perform one million mappings:

|                         | Constructor | Complex     | Flattening | Unflattening | Deep       |
|-------------------------|-------------|-------------|------------|--------------|------------|
| Manual                  |     0.00890 |   1.76716   |    0.05548 |      0.05300 |  0.50052   |
| AgileMapper 0.8         |     0.17826 |   4.33683   |    0.38902 |      0.57726 |  1.15797   |
| AutoMapper 5.1.1        |     0.15132 |   7.28190   |    0.36671 |            - |  0.95540   |
| ExpressMapper 1.8.3     |     0.21580 |  15.48691 ^ |    0.52166 |            - |  6.56550 ^ |
| Mapster 2.5.0           |     0.12014 |   2.50889 * |    0.29629 |            - |  1.69947   |
| ValueInjecter 3.1.1.3   |     0.47637 | 101.70602 ^ |   12.67350 |     13.71370 | 28.05925   |

I've marked the major changes with a ^, and put a * next to Mapster's deep cloning result, because 
some of the objects in that test are having their reference copied instead of being cloned; it's 
likely to be significantly slower if that were not the case.

## Points to Note

- Mapster is still the fastest at churning out simple objects - it just gets slower when mapping 
  nested object members

- ValueInjecter's reflection-heavy approach is very costly, but as I understand it that is how it's 
  intended to be used - as before, I'm happy to be corrected

- I'm pleased to have improved AgileMapper's performance on every test - the complex type / 
  deep-cloning is nearly 20% faster than in v0.6 :)

<span class="updated">
Update: I have [more up-to-date results](/object-mapper-performance-comparison-allowpartiallytrustedcallers) 
than these, including updated versions of AgileMapper, AutoMapper and Mapster.
</span>