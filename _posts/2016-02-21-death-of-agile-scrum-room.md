---
layout: post
title: Death of a Scrum Room
excerpt: A friend of mine works at a company where the scrum process is gradually being phased out. Why is it happening, and what are the consequences?
tags: [{{ Programming Practices | url_encode }}]
---

A friend of mine (seriously - a friend of mine - this isn't about me) works at a medium-large 
company on a medium-large application in a medium-size dev team. A few years ago they had a 
[scrum master](https://en.wikipedia.org/wiki/Scrum_(software_development)#Scrum_master) and ran 
fortnightly sprints with retrospectives, demos and stand-ups. Sprint work was planned and protected,
and if anything was added during a sprint - which didn't happen often - the impact was accounted for.
The team worked in a dedicated scrum room, which helped foster a productive atmosphere and kept 
disturbances and distractions to a minimum. They delivered several major releases on time, with 
minimal production issues.

Now, this was not some dev utopia. It was a legacy application, and had some truly impressive poor 
design. 2000-line JavaScript files. 3000-line stored procedures. Oodles of business logic in both. 
Lots of duplication, and - to begin with - no automated tests. But architecture was refactored, 
code was de-duplicated, tests were written, and goals were accomplished.

The thing was, 'The Business' weren't sure about agile, and the scrum master had regular fights to 
run things that way. The problems were textbook:

- Resistance to addition of work mid-sprint

- Lack of oversight - is dev X really taking this long to finish story Y? How do we know it's not 
  already finished, and now they're just playing [Minesweeper](https://www.freeminesweeper.org/minecore.html)?

- Lack of 'precise' answers to questions like "On exactly what date will this massive new piece of work be delivered?"

So a little under a year ago, they parted ways with the scrum master. People began filtering into 
the room to talk to devs about their work. Devs were called into meetings to discuss when and how 
they were going to fix issues they were in the middle of fixing. Refactoring started to be 
second-guessed by non-devs, and was eventually banned. Two months went by with enforced overtime.

A new development manager was brought in - a proud and public fan of 'old school waterfall'. 
Timesheets were introduced. The product owner was moved onto something else, the acting replacement 
was moved out of the scrum room and became more difficult to get hold of. The test team was moved 
into the scrum room. And then, very recently, the scrum room doors were removed. So no more scrum 
room, and only the fading vestiges of agile practice remain. Why did this happen, and what are the 
consequences?

The scrum master was originally brought in to organise the team and implement a productive process,
but vital elements of the business never really got on board with agile. Running scrum produced 
some great results, but lacked the (in my experience, fictitious) security and control of waterfall.
Refactoring was absolutely necessary, but a hard sell - "You want to work on... making it the same...?" 
A new dev manager with an anti-agile attitude (there's still plenty of them about) confirmed things
didn't have to run that way.

With mounting time pressure on development, code quality decreased - oversight increased to 
compensate. But the product is still making money - if it easily pays for a team to maintain it, 
does it matter if it's poorly written? I guess it depends on whether job satisfaction matters. The 
more ambitious devs are unhappy and the current job market for developers is very strong, so you do
the maths on where that's heading. I wonder if eventually a new scrum master will be brought in to 
improve the environment, and the whole process will start all over again. It'll be interesting to 
see.

Well-run agile teams can produce great results, but even now - *15 years* after the [Agile 
Manifesto](https://www.agilemanifesto.org) - it's often viewed with suspicion. If you like agile 
practice you can make efforts to sell it, but *people hate change*, and you have to know when to 
move on. Some devs like regimented, waterfall environments, so if those environments and devs find 
each other, everyone's happy. You spend too much time at work to stay somewhere if you're not 
enjoying it.