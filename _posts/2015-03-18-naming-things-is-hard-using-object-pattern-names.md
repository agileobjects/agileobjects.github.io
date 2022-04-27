---
layout: post
title: Naming Things Is Hard&#58; Using Object Pattern Names
excerpt: Design Patterns - tried-and-true solutions to common problems - have now been around long enough that many of them have very familiar names. We can use those names as part of an object-naming strategy.
tags: [Naming Patterns, Domain Driven Design (DDD), Patterns]
---

[Design Patterns](https://en.wikipedia.org/wiki/Software_design_pattern) - tried-and-true solutions
to common problems - have now been around long enough that many of them have very familiar names. 
We can use those names as part of an object-naming strategy.

## The Factory Pattern

See? You've heard of this one, haven't you? [Factory](https://en.wikipedia.org/wiki/Factory_%28object-oriented_programming%29) 
objects create instances of other objects, almost always 
[Services](https://lostechies.com/jimmybogard/2008/08/21/services-in-domain-driven-design). You 
might have to supply some sort of criteria, but you ask them for an instance of something, whizzy
things happen and an instance is returned. The naming would look something like this:

```csharp
public class WhizzyServiceFactory
{
    public WhizzyService Create()
    {
        // Whizzy stuff omitted

        return new WhizzyService();
    }
}
```

The Factory is named by appending the word 'Factory' to the type of object it creates, and the 
method is named `Create`. Why not `CreateWhizzyService()`? Because the object is a 
`WhizzyServiceFactory` - what else would it create?

## The QueryObject Pattern

This pattern is less well-known than a Factory, and rather unhelpfully has two different 
implementations. The first - from Martin Fowler's 
[Patterns of Enterprise Architecture](https://martinfowler.com/eaaCatalog/queryObject.html) - is an
object which encapsulates a data store query, and is used as a parameter to a method on a 
[Repository](https://msdn.microsoft.com/en-us/library/ff649690.aspx). The second - from 
[CQRS](https://msdn.microsoft.com/en-gb/library/dn568103.aspx) - reverses the situation by knowing 
how to execute a particular query against a Repository it's *given*. `QueryObject`s are usually 
used to access [Entities](https://www.infoq.com/news/2015/01/aggregates-value-objects-ddd), but 
(for example) let's say we have a Service parsed from a pattern held in a datastore, like this:

```csharp
public class WhizzyServiceParser
{
    public WhizzyService Parse(string pattern)
    {
        // Whizzy parsing omitted

        return new WhizzyService();
    }
}

public class GetWhizzyServiceQuery
{
    private readonly WhizzyServiceParser _parser;
    private readonly IRepository _repository;

    public GetWhizzyServicesQuery(
        WhizzyServiceParser parser, 
        IRepository repository)
    {
        _parser = parser;
        _repository = repository;
    }

    public WhizzyService Execute()
    {
        return _parser.Parse(
            _repository.GetWhizzyServicePattern());
    }
}
```

So here we have two patterns - Factory and QueryObject - which a component uses to retrieve 
instances of objects. The component uses each of them in exactly the same way, so as far as it's 
concerned they could both be named `whizzyServiceSource` with methods named `Get()`. But using 
the design pattern names and naming the methods in a way which indicates what's going on behind the
scenes still wins because it provides information to colleagues, or *your future self*. Not to 
stereotype the interests of coding blog readers, but that's a bit science-fictiony, isn't it?

Clearly labelling a design pattern being used in a component provides information about what the 
object does, how it does it, how it should be used and how it's likely to behave, which is all well
worth doing. This highlights the fact that careful naming not only helps describe the flow of a 
program, but also aids maintainability down the road.