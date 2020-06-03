---
layout: post
title: NDepend on a Real Project, Round 1.3&#58; An Exception by Any Other Name...
excerpt: This is the third in a series of blogs looking at things NDepend told me about a personal project of mine - this time a curious problem with Exception naming.
tags: [NDepend]
images_dir: '2013-12-14/'
---

This is the third in a series of blogs looking at things NDepend told me about a personal project 
of mine. The previous posts are:

- A description of the project (an object-object mapper) and the first change I made regarding [an 
  abstract class](ndepend-real-project-dashboard-abstract-class-constructor), and
- A look at various methods NDepend said were [never called](ndepend-real-project-dead-methods)

The third of the Critical Rule Violations I looked at was a class derived from Exception which didn't
have a name which ended with 'Exception'. I'm pretty strong on conventions, so it surprised me to see 
that one. Let's see which one it was:

![NDepend Exception naming report]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_ExceptionNaming.jpg)

Hmm - the `UnconvertibleConfiguredValueException` - that looks like it ends with the word 'Exception' 
to me. Clicking into the class:

![UnconvertibleConfiguredValueException]({{ site.post_images_dir }}{{ page.images_dir }}UnconvertibleConfiguredValueException.jpg)

Ahh, ok - it has generic parameters. If you look again at NDepend's Linq query to see how it's 
deciding what type names end with 'Exception', it's using a `NameLike()` method to check the name 
of each type. Awesomely, if you mouse over `NameLike` in the query, you get documentation, like this:

![NDepend NameLike documentation]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_NameLike.jpg)

...so out of the box it's checking type names against the regular expressions 'Exception$' and 
'ExceptionBase$' - so anything ending in 'Exception' or 'ExceptionBase'. Generic type names are 
suffixed with a backtick and the number of type parameters they take ([like this](https://dotnetfiddle.net/F93iLC)),
so `UnconvertibleConfiguredValueException` would be named `UnconvertibleConfiguredValueException\`2`, 
which explains is why it comes up on the report. I can edit the query to accommodate this:

![NDepend Exception query edit 1]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_NameLike_Edit1.jpg)

So there we go, I've added another condition - don't match Exception types which have a name ending 
in 'Exception', followed by a back tick, followed by one or more digits. Hang on, it hasn't worked - 
NDepend recompiles and re-runs the query as you edit, and `UnconvertibleConfiguredValueException` 
is still in the report. Ok, let's edit it again to see what NDepend is getting for the type name:

![NDepend Exception query edit 2]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_NameLike_Edit2.jpg)

...ahh, there we go - it uses a friendly version of the name. Ok then, I can change my regular expression 
like this:

![NDepend Exception query edit 3]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_NameLike_Edit3.jpg)

...and success! We're now ignoring anything which ends with 'Exception' followed by an open angle 
bracket, followed by one or more occurrences of anything but a close angle bracket, followed by a 
close angle bracket.

I think this little sequence shows off one of the strengths of NDepend, which is how easy it is to 
tailor it to your project if need be. It's perfectly intuitive, has intellisense, extensive built-in 
documentation, and a reactive and helpful editor. Here's what it looked like as I was editing the query:

![NDepend query editor error]({{ site.post_images_dir }}{{ page.images_dir }}NDepend_NameLike_Editor.jpg)

...the feedback on the query result and syntax is instant, and doesn't interfere with your typing at 
all. Excellent stuff :)

[Next time](mutually-dependent-namespaces) I'll turn to rather a more complicated issue - namespaces 
with circular references to each other.