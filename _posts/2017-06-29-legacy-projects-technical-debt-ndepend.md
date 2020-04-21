---
layout: post
title: Legacy Projects, Technical Debt and NDepend
excerpt: Legacy systems are commonplace, but it's difficult to come up with anything concrete to justify the expense of an update to someone with an eye on the bottom line. Thankfully, the folks at NDepend have now built technical debt computation on top of their code analysis tools, giving you a much easier way to have these sorts of discussions. Here's a real-world example.
tags: [C&#35;, Programming Practices]
---

Unless every project you've worked on has been green field and / or built with no time pressure,
you'll have found yourself working on a legacy project at some point. Unwieldy methods, mystery 
sections of code, ancient technologies, wholesale duplication... it's not much fun, but it's a 
large percentage of the code that's out there.

Projects to replace or rewrite these systems are commonplace, but where do you begin? What if 
you want to make a case to the business that such a system needs to be replaced? 
[Technical debt](https://en.wikipedia.org/wiki/Technical_debt) can be a useful metaphor to make 
that case, but while it's easy to explain in the abstract, it's difficult to come up with anything 
concrete to justify the expense of an update to someone with an eye on the bottom line.

Thankfully, the folks at [NDepend](https://www.ndepend.com) have now built technical debt computation 
on top of their code analysis tools, giving you a much easier way to have these sorts of discussions. 
This is doubly powerful - as well as putting a concrete cost on choosing not to 
[refactor](https://en.wikipedia.org/wiki/Code_refactoring), the data it presents has the authority of 
having been produced by a tool. Tools don't try to get nice, tidy-up projects 
[for academic reasons](https://codesqueeze.com/refactorbation) - they impartially detect problems in 
code. Someone (I think [Erik Deitrich](https://daedtech.com), but I can't find the blog) recently pointed 
out the advantages of an automated critique of this sort - there's no politics or personal opinions involved, 
and that automatically means everyone takes it more seriously.

## A Real-World Example

I'm currently working with a legacy project, so when I heard about NDepend's new technical debt 
capabilities, I was eager to fire it up and see what it said. With all the default settings, it said 
this!

![_config.yml](/images/posts/2017-06-29/InitialReport.png)

The main takeaways are:

- Based on the number of lines of code, the project took an estimated 2,536 days of development 

- The code had 19,486 issues (!) of various severity - 2,736 were Major issues or worse 

- Based on the number and types of issues, the project's technical debt will take 944 development
  days to fix; i.e. we are currently 944 days in the hole if we are going to sort this out completely. 
  That's approximately 3.5 developers for a year! 

- The debt cost was 37.23% (944 technical debt days / 2,536 development days); i.e. 37.23% of the 
  total cost of developing the software now exists as technical debt. Sad face. 

- As it was a legacy project, it predictably had no automated tests, which would have enabled NDepend 
  to more precisely calculate the total annual interest incurred by the debt. Double sad face. You 
  can still see NDepend's total interest calculation in the Debt and Issues explorer, though (see 
  below) - it was 481 development days; i.e. an additional 481 days of development time needed every
  year the issues in the code base go unfixed - that's about 2 whole developers!

These numbers make a powerful financial argument for refactoring and cleaning up the code. Which is 
exactly what we're doing :)

## But there's more - Debt and Issues

As usual with NDepend, you can explore the issues it finds in great detail. Selecting from the 
Explore debt menu:

![_config.yml](/images/posts/2017-06-29/DebtExplorer.png)

...you can check out Debt and Issues on a rule-by-rule basis:

![_config.yml](/images/posts/2017-06-29/DebtAndIssuesPerRule.png)

The main offenders here are the aforementioned unwieldy methods and direct use of data access code 
in the UI layer. You see the debt and annual interest here on a per-rule basis, with the annual 
interest sum in the bottom row.

You can click into a particular rule to see more details, as well as the query used to calculate the 
debt and interest. For the 'Methods too complex' rule, that looks like this:

![_config.yml](/images/posts/2017-06-29/MethodsTooComplexRule.png)

Debt is calculated directly from the [Cyclomatic Complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity) 
measurement - the number of paths through the method. Interest is calculated as 10 minutes per year 
if the method is 100% covered by tests, and 2 hours per year otherwise. Again as usual with NDepend, 
if you think these numbers don't sound quite right, or you'd like a method's complexity to be taken 
into account when calculating its annual interest, you can tweak the query yourself until you're happy 
with it - it's just C# Linq in Visual Studio!

## Queries, Rules and Issues

The dashboard indicated violation of 8 critical rules - clicking that opens the Queries and Rules Explorer:

![_config.yml](/images/posts/2017-06-29/RulesExplorer.png)

Our 8 violated rules are listed in the right-hand pane - again, mainly down to unwieldy methods. 
Clicking into each rule presents the list of offenders with direct access to the code.

## Summing Up

Static analysis has always been a very useful tool, but linking it to technical debt is one of those 
simple, brilliant ideas - bringing issues into the real world, especially for non-technical stakeholders. 
Compare explaining that the methods in a code base are too big and complex - some with Cyclomatic 
Complexities in 100s! - verses explaining that the methods in a code base cost 2.5 months of development 
time every year. The latter is much more visceral. The former sounds academic - the latter sounds 
_expensive_. It's indispensable data when talking about legacy systems.
