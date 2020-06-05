---
layout: post
title: NDepend on a Real Project, Round 1.1&#58; the Dashboard and a Non-Protected Abstract Class Constructor
excerpt: The other day I got an email from Patrick Smacchia, generously offering me an NDepend licence on the grounds that if I find it useful I can write about it on my blog. NDepend allows you to write Linq queries against an assembly or a code base to interrogate it for quality issues and see various metrics and reports. I have a personal project underway which I've been working on for some time, so I figured I'd give it a go and see what it can tell me. This is the first of the results.
tags: [NDepend]
images_dir: '2013-12-07/'
---

The other day I got an email from [Patrick Smacchia](https://codebetter.com/patricksmacchia), generously 
offering me an [NDepend](https://www.ndepend.com) licence on the grounds that if I find it useful I 
can write about it on my blog. NDepend allows you to 
[write Linq queries](https://www.ndepend.com/DefaultRules/webframe.html) against an assembly or a 
code base to interrogate it for quality issues and see various metrics and reports. I have a personal 
project underway which I've been working on for some time, so I figured I'd give it a go and see what 
it can tell me. I've gone through one 'round' of changes from its initial report, so I'm going to write 
a series of blogs covering them - this is the first.

My project is an object-object mapper (y'know, like [AutoMapper](https://automapper.org)) which can 
deep clone, merge and update objects, as well as telling you up-front how it will do any of those 
operations for a pair of types. It's my second attempt and I've been working on it on and off for 
about 7 months. It has one project for the mapper, and one for tests. I'm using 
[ReSharper 8](https://www.jetbrains.com/resharper) which tends to stop me from doing anything too 
silly, so I was interested to see what NDepend would pick up.

After installing it into Visual Studio 2013 I ran an analysis and was presented with the NDepend 
Dashboard for my project:

![NDepend Dashboard]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Dashboard.jpg)

...the first thing I noticed of course, was that I have 4 Critical Rules Violated - which sounded 
to me like A Bad Thing - but looking over the rest of the report there's lots of other useful info. 
There'd be even more if I had test coverage data I could feed into it, but I don't have that right 
now, so I'll check that out at a later date.

Ok, let me see what Critical Rules I've violated

![NDepend Critical Rule Violations]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_CriticalRule_Violations.jpg)

So, I've got circular dependencies between namespaces, 40 methods which look like they aren't called,
an abstract class with a non-protected constructor and an Exception type which doesn't end with the 
word 'Exception'. I decided to check out the abstract class first because I thought ReSharper would 
have let me know I had one of those, like this:

![ReSharper Non-Protected Abstract Class Constructor Warning]({{ site.post_images_dir }}{{ page.images_dir }}Resharper_Ctor_Warning.jpg)

This is what NDepend showed me when I clicked the abstract class constructor rule:

![NDepend Non-Protected Abstract Class Constructor]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Ctor_Error.jpg)

This is how all rule violations are reported - at the top you have an explanation of the rule and 
the Linq query used to run it, and at the bottom you have the results. It's picked up the `Member` 
class, which is the base class for a series of classes which represent fields, properties or methods 
on a Type. Let's take a look...

![Non-Protected Abstract Class Constructor]({{ site.post_images_dir }}{{ page.images_dir }}Non_Protected_Abstract_Ctor.jpg)

Well how about that - yep, it's an abstract class with an internal constructor. Turns out ReSharper 
doesn't mind if the constructor is internal. So I fixed that and moved onto the dead methods, which 
I'll write about [next time](ndepend-real-project-dead-methods).