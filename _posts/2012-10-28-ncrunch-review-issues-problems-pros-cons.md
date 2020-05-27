---
layout: post
title: No More NCrunch For Me
excerpt: NCrunch is a Visual Studio add-in which runs your tests while you work so you know if you've broken anything, as well as providing coverage indicators in the IDE and coverage metrics on demand. It recently went commercial, and time is running out for the free version I've been using for the last couple of months. From my experiences using NCrunch I'm going to let it expire, and go about my business without it. Here's why.
tags: [C&#35;, ASP.NET, ASP.NET MVC, Programming Practices, Patterns, Automated Testing]
---

When I opened up Visual Studio this morning, I was greeted with this little popup:

![NCrunch is expiring]({{ site.post_images_dir }}2012-10-28/Expiring.png)

[NCrunch](https://www.ncrunch.net) is a Visual Studio add-in which runs your tests while you work so 
you know if and when you've broken anything, as well as providing coverage indicators in the IDE and 
coverage metrics on demand. It recently 
[went commercial](https://blog.ncrunch.net/post/First-Official-Non-beta-Release!-NCrunch-Goes-Commercial.aspx) 
(which I thought was fair enough), and time is running out for the free version I've been using for
the last couple of months. From my experiences using NCrunch I'm going to let it expire, and go about 
my business without it. Here's why.

Before I start, let me say that I think NCrunch is a good product, which is to say it's had a positive 
impact on my programming. I've used it to help test-drive a library I'm making right from the start of 
the project, and especially at the beginning it was very useful to have it run all my tests whenever I 
made a change. The first problem is that while that was cool to start with, it’s recently become a bit 
of a chore.

## Problems Running Tests

NCrunch has two 'engine modes' in which it can run tests for you - it can run all your tests when you 
make a change, or it can figure out which tests were impacted and only run those. Unfortunately, it 
became clear pretty early on that that second option (which _is_ marked as 'experimental') wasn't 
really working for me, so I had to have it run everything. With a smallish number of tests and while
I was adding new features that was great, but I've now got 445 tests (still not exactly loads) and 
am more in a 'clean and tidy' mode where I know that a change I'm making will probably only affect a
particular subset of the tests. With that in mind it's a bit of a drag sitting there after I make a 
change and having to wait for NCrunch to run everything. I _could_ disable it and manually run the 
tests I know are impacted, but then what's the point of having NCrunch? If the 'impacted only' engine 
mode worked well this problem would go away, but that's not what I found.

Secondly, what's wrong with this picture?

![Duplicated tests]({{ site.post_images_dir }}2012-10-28/DuplicateTestRunning.png)

I've got 445 tests, and NCrunch has queued _455_ tests to run. So it's queued duplicate tests - in 
this quickly-screenshotted case 10, but I've seen the total queue get up over 600. If I'm already 
itchy waiting for it to run all my tests against a change I know only affects a few, I'm even itchier 
waiting for it to run a lot of them _twice_.

## Problems With Code Coverage

NCrunch marks each line of code with a dot to say if it's covered by tests - a black dot says the 
line isn't covered, a red dot says it's covered but at least one of the covering tests is failing, 
and a green dot means all the covering tests pass. It also calculates coverage statistics for you. 
Unfortunately, there's a couple of flaws in the coverage.

Firstly, it doesn't support `ExcludeFromCodeCoverage` attributes. This feature has been requested 
and I expect will be included in a later release, but right now it doesn't. So this:

![ExcludeFromCodeCoverageAttribute]({{ site.post_images_dir }}2012-10-28/ExcludeFromCodeCoverage.png)

...is counted as a non-covered line, and drags your coverage statistics down. Hmph. As well as that, 
coverage of certain types of code is missed. This:

![Code coverage error]({{ site.post_images_dir }}2012-10-28/CoverageError.png)

...is _definitely_ covered. I am 100% absolutely certain it is, by several tests. NCrunch doesn't 
pick it up, down go my coverage statistics. I've had NCrunch find genuinely uncovered code which I've 
been able to remove, and that's great, but what's the coverage percentage on this project? Umm... I 
don't know.

## Conclusion

None of these are major, tool-crippling problems, and I expect NCrunch to get much better in future 
releases. The current version has some great features, like this:

![Break into first covering test]({{ site.post_images_dir }}2012-10-28/BreakIntoCoveringTests.png)

...that's a line of code with a failing test covering it, and NCrunch can run that failing test and 
take me to that line exquisitely easily. That's awesome! I'd happily pay for a tool that can do that. 
But here's the thing: NCrunch (as of the time of writing) [costs](https://www.ncrunch.net/buy) $159 
(about £100) for a personal licence and $289 (about £180) for a commercial one. I'm not sure which 
one I'd need as my project is a personal one which I'm intending to open-source, but I'm a professional,
 self-employed developer, but in any case - that seems like a lot of money for an imperfect tool. 
If it did everything it's advertised to do more or less perfectly I'd consider it, but it doesn't. 
So no more NCrunch for me.