---
layout: post
title: I See AnemicDomainModels
excerpt: AnemicDomainModel is an anti-pattern I seem to keep coming across. Here's an overview of it, the problems it causes, and some pointers on leaving it behind.
tags: [Patterns, Domain Driven Design (DDD)]
---

[AnemicDomainModel](https://www.martinfowler.com/bliki/AnemicDomainModel.html) is an anti-pattern I seem 
to keep coming across. It's when a system has objects which represent its business entities, but all the 
business logic is crammed into static classes. The static classes (usually called `SomethingOperations`, 
or `SomethingServices`) take business entity instances in their methods and manipulate those entities 
directly, implementing business logic in a procedural fashion.

The problems with this setup:

1. Your 'business objects' are just glorified data carriers - bags of getters and setters with no 
   behaviour. This makes it much more difficult to use all those neat OO tricks which can simplify the 
   way a system does its work, like polymorphism. Your static classes get filled with switch statements 
   and logic paths based on whether the object they're dealing with represents `Thing1` or `Thing2` or 
   `Thing3`, instead of the behaviour being implemented by `Thing1`, `Thing2` and `Thing3`, with another 
   class just invoking that behaviour. Your system becomes more complicated than it needs to be, and 
   everyone gets very sad.

2. Because your business logic classes are static, the classes that help them carry out their work also 
   have to be static. You end up with a network of static classes strongly coupled to other static classes 
   by direct references, with no visibility of the dependencies. This makes it much more difficult to 
   write automated tests, which makes your system fragile and difficult to change. Everyone gets very sad.

OO has been around for decades – with the 
[Gang of Four](https://www.amazon.co.uk/Design-patterns-elements-reusable-object-oriented/dp/0201633612) 
patterns book published nearly 20 years ago – so why are people still writing these sorts of systems? 
I think it betrays a fundamental failure to grasp the nature of OO. OO systems are composed of objects 
which are composed of other objects, with behaviour arising through object-object interactions. I see 
AnemicDomainModel systems built by people who first learned procedural programming and later tried to 
incorporate OO into their repertoire, but didn't manage to make the necessary shift in their thinking. 
They tend to have decades of experience, and to therefore be responsible for creating systems. They 
tend to be members of the large majority of developers who don't continue to read about or study their 
craft, and therefore miss out on better ways of doing things. As the systems get bigger and creak under 
their design flaws, they blame the business coming up with requirements late, changing their minds, or 
coming up with things they never expected – all things a well-designed OO system can handle.

How do you get from an AnemicDomainModel to a more best-practice OO system? Ideally you start by levering
in some testability seams so you can get test coverage without having to call web services or query 
databases – this will protect you as you [refactor](https://refactoring.com). You can then pick out bits
and pieces to move from static classes into appropriate business objects – perhaps starting by 
[replacing those switch statements](https://sourcemaking.com/refactoring/replace-conditional-with-polymorphism)
with polymorphism. It's a long road - and naturally the business will be pushing for new functionality 
to be added the entire time - and it boils down to a lack of education, or desire to educate oneself. 
Good luck!