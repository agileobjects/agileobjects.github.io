---
layout: post
title: NDepend on a Real Project (Again)&#58; My Non-Critical Errors
excerpt: Following on from last time, here's a look at some of the non-critical errors NDepend 6 told me about on my project.
tags: [C&#35;, NDepend, Patterns, Programming Practices]
---

Following on from [last time](/ndepend-v6-new-features-on-real-project), let's take a look at some 
of the non-critical errors [NDepend 6](https://www.ndepend.com/ndepend-v6) told me about on 
[my project]({{ site.am_github }}). There were 29 rules violated, and 712 total violations - sounds 
like a lot but there's 274 rules being checked in this version, so I've broken about 10.5% of them.

Rule violations are viewed in the Queries and Rules Explorer, which looks like this:

![RulesExplorer1]({{ site.post_images_dir }}2016-02-10/RulesExplorer1.png)

Every category with a warning symbol in the pane on the left has one or more violated rules. In the
Object Oriented Design category, I've violated rules relating to sealing classes, leaving stateless
classes and methods non-static, and using [Singletons](https://en.wikipedia.org/wiki/Singleton_pattern).

Clicking the query title displays a window with more information about my 62 unsealed classes:

![SealedClasses]({{ site.post_images_dir }}2016-02-10/SealedClasses.png)

The first pane contains the query used to check the rule, a description of why the rule exists, and
how to fix violations; the second pane lists offending classes. It's important to keep in mind that
all NDepend does is offer recommendations - it's a tool, not Gandalf. Especially with non-critical 
rules, you have to decide for yourself how serious the problems it finds are. You can do that by 
reviewing the explanation for a rule, and deciding if:

- You agree

- You think the cost of fixing it is worth the improvement

In this case, the description mentions a slight performance gain (of which there is at least [some 
doubt](https://stackoverflow.com/questions/2134/do-sealed-classes-really-offer-performance-benefits)),
but emphasises that sealing a class expresses the intention that it shouldn't be used as a base 
type. The thing is, nearly all the classes listed are internal, and I'm the only developer on the 
project, so I have to ask myself - expresses that intention to whom? I think in this case I'll 
ignore this rule, which I can do by deselecting it in the Queries and Rules Explorer.

Another highly-violated category is Naming Conventions:

![NamingConventions]({{ site.post_images_dir }}2016-02-10/NamingConventions.png)

...but as I don't prefix instance fields with 'm_' or static fields with 's_', these don't apply. 
Fortunately, the rules are easy to modify:

![NamingUpdate]({{ site.post_images_dir }}2016-02-10/NamingUpdate.png)

As 'm_' and 's_' aren't the Visual Studio or ReSharper defaults - nor a commonly-used convention as
far as I know - it strikes me as a curious default rule. Never mind - just a minor quibble and easy
to change.

A good-size chunk of the other non-critical errors relate to method visibility:

![Visibility]({{ site.post_images_dir }}2016-02-10/Visibility.png)

Both rules - 'Methods that could have a lower visibility' and 'Avoid public methods not publically 
visible' - have picked out a large number of public methods in internal classes, on the basis that 
the method could be made internal to match the class. The description of the second rule 
acknowledges [disagreement](https://ericlippert.com/2014/09/15/internal-or-public) as to whether 
this is good practice, which I'm not personally convinced it is. I therefore switched off the 
second rule and amended the first one to ignore public methods in internal or private classes.

The .NET Framework Usage > System category contains a rule violation because my assembly has no
`ComVisible` attribute, but the project is a [PCL](https://msdn.microsoft.com/library/gg597391(v=vs.100).aspx)
and its set of targets means the `ComVisible` attribute isn't available, so that's another one to
switch off.

I'm conscious that so far I've just been saying 'so I ignored that' over and over again, but I did 
use the results to make several updates 
([here's the commit]({{ site.am_github }}/commit/1d643f1237e4494feb8a25d3ddccc9a76ff948d5) to prove 
it) around:

- Removing uncalled methods

- Making methods and types static where appropriate (it's interesting to note NDepend brought up 
  items ReSharper didn't mention)

- Declaring the assembly's CLS compliance

Re-running the analysis gives me this dashboard:

![Dashboard2]({{ site.post_images_dir }}2016-02-10/Dashboard2.png)

51.5% fewer non-critical violations - significantly better. I'll go over the critical violations 
[next time](/ndepend-critical-errors-real-project).