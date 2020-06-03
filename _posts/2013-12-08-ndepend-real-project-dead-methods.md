---
layout: post
title: NDepend on a Real Project, Round 1.2&#58; Dead Methods
excerpt: This is the second in a series of blogs about things NDepend told me about a personal project of mine. This time, methods which are apparently never called.
tags: [NDepend]
images_dir: '2013-12-08/'
---

This is the second blog of a series of undetermined length about things NDepend told me about a 
personal project of mine. The first post describing the project (an object-object mapper) and the 
first change I made is [here](ndepend-real-project-dashboard-abstract-class-constructor).

So last time NDepend told me about an abstract class I had which had an internal constructor - cool
:) I next looked at a claimed 40 methods which are never called - this is the screen opened from the 
Dashboard describing the methods:

![NDepend Dead Methods Summary]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_DeadMethods.jpg)

It's the same set up as last time - the Linq query and an explanation of the rule are at the top, 
the results are at the bottom. After clearing out a few methods which sure enough were never called, 
I got to the `Clear()` method:

![NDepend Dead Methods Clear method]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Clear_Method.jpg)

...which the report says is called by two other methods. So why is it included? I turned to ReSharper 
to find where it's called:

![ReSharper Clear method callers]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Clear_Method_Callers.jpg)

...and yep - it's called in two places. Let's look at the NDepend Linq query to see if there's a clue 
there as to why `Clear()` has been included:

![NDepend Dead Methods Linq query]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Clear_Method_Query.jpg)

Ahh, ok - so Dead Methods are not only defined as uncalled methods - they include methods only called 
by _uncalled_ methods! That's rather clever :)

This is where the way I set up the report might have bitten me a bit. I have a project for the mapper 
and a project for the tests, but I didn't include the test project in the analysis because I'm most 
interested in the mapper project. To avoid having to work out what and how to map all the time, the 
mapper does quite a lot of caching - but I want my tests to be isolated, so that's where methods to 
clear the `Cache` come in. In other words the uncalled methods which call `Cache.Clear()` _are_ 
called, but only by the test project, which I didn't tell NDepend about. So nothing to delete there.

Ok, next one:

![NDepend Dead Methods - GetDeferredAssignmentObjects]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Dead_Methods2.jpg)

`GetDeferredAssignmentTargets`. This screenshot also shows NDepend's pop-up info box. Here's the method:

![GetDeferredAssignmentObjects]({{ site.post_images_dir }}{{ page.images_dir }}GetDeferredAssignmentMethods.jpg)

Ahh, ok - I've already told ReSharper not to worry about this one - it's called via reflection. This 
is a perfectly understandable shortcoming of both ReSharper and NDepend, so nothing to delete here 
either - the Linq query will actually ignore methods marked with a particular attribute, so I can 
exclude this one from the analysis. Next one:

![NDepend Dead Methods - unused constructor]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_Dead_Methods3.jpg)

Apparently the constructor of `MappingStepActivityDescription` is never called. Well, it turned out 
that class actually didn't have a constructor, but all its methods were static, so I was able to make 
the class static too:

![MappingStepActivityDescription made static]({{ site.post_images_dir }}{{ page.images_dir }}MappingStepActivityDescription_Static.jpg)

Nice! :)

All the methods in the report fell into those categories - never called, only called from the test 
project, only called via reflection, or classes which could be made static. I got to trim out a 
reasonable amount of unused code, with all my tests passing to let me know I hadn't broken anything. 
Good stuff!

I next looked at the next Critical Rule violation, which was an Exception not named with 'Exception' 
on the end. I'll write about that [next time](ndepend-real-project-exception-naming).