---
layout: post
title: NDepend on a Real Project (Again)&#58; Version 6's New Stuff
excerpt: There's a new version of NDepend out in the wild, so I thought I'd give it a whirl on my pet object-object mapper project. Here's a quick overview of some of the new features.
tags: [NDepend]
---

There's a [new version of NDepend](https://www.ndepend.com/ndepend-v6) (the uber-comprehensive 
project analysis tool) out in the wild, and the lovely folks over there updated my licence so I thought 
I'd give it a whirl on the latest incarnation of my pet [object-object mapper project]({{ site.am_github }}).
Yes, I've been playing with that project on and off for ages - I'm using it as a kind of extended 
programming haiku - but I do think I've nailed the approach this time. Seriously.

NDepend v6 integrates with Visual Studio 2015 and various CI tools, a new, colourised metrics view,
and includes bug fixes and other polish. The CI tool integration allows you to fail builds if code 
quality metrics are violated, which is pretty awesome. It retains its easy-to-use interface and 
ability to customise queries, and spits out an informative dashboard displaying analysis results. 
Like this one:

![Dashboard1]({{ site.post_images_dir }}2016-02-09/Dashboard1.png)

...which is what I got for my first round of analysis. NDepend does not calculate code coverage, 
but can use coverage results from various coverage tools - these were from 
[dotCover](https://www.jetbrains.com/dotcover). Incidentally getting hold of a set of dotCover 
results to import was a non-trivial task, but that's just getting different tools to play nicely 
with each other I guess.

The new colourised metrics view gives you a visual representation of pairs of metrics using the 
size of an element for one and a 'heatmap' colouration for the other. For example, because I have 
code coverage data I'm able to look at types in my project which have less than 100% coverage 
(metric 1) against the percentage coverage they have (metric 2). This trivially makes it clear 
where more coverage may be required, and looks a little something like this:

![ColouredMetrics]({{ site.post_images_dir }}2016-02-09/ColouredMetrics.png)

I've selected the `NullMappingStep` class here, which has brought up a summary of the metric data
(inside the area I've highlighted with a red outline) as well as a help box (at the bottom) 
explaining what the view represents. This is typical of NDepend - it eagerly provides explanations 
and help, which is a Very Good Thing because the underlying metrics and principles can be 
sophisticated and otherwise difficult to understand (for me, at least).

The eagle-eyed reader will have noticed on the dashboard that NDepend found 
[critical](/ndepend-critical-errors-real-project) and [non-critical](/ndepend-non-critical-errors-real-project)
issues in my project, and I'll be going through those in a near-future blog. I think the general 
headline though is that a very useful tool is now even more useful :)