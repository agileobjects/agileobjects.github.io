---
layout: post
title: AgileMapper&#58; a zero-configuration, highly configurable, transparent, id-aware object mapper
excerpt: Regular readers of my blog (maybe even both of you) will have seen sporadic references to 'my pet mapper project'. It's now - finally! - in a beta stage I'm happy to talk about.
tags: [{{ Expression Trees | url_encode }}, AgileMapper, ReadableExpressions, {{ C# | url_encode }}, {{ Programming Practices | url_encode }}]
---

Regular readers of my blog (maybe even both of you) will have seen sporadic references to 'my pet
mapper project', going back to my first use of [NDepend](https://www.ndepend.com) in December 2013. 
I've actually thrown it away and restarted a few times since January 2013, but it's now - finally! - 
in a beta stage I'm happy to talk about.

Given [AutoMapper](https://automapper.org) and [ValueInjecter](https://github.com/omuleanu/ValueInjecter),
why write a mapper? Well...

- I spent the second half of 2012 working on an insurance application which required a lot of 
  mapping between objects with 30 - 50 fields each. We did it all manually because we couldn't find 
  a way in any of the available mappers to see what would and wouldn't be mapped 

- I thought it would be useful to have a mapper which can map anything to anything without 
  configuration - like ValueInjecter - but with a friendly, fluent API for configuration when 
  necessary - like AutoMapper 

- I thought it would be useful to have a mapper which - also without configuration - can pair up 
  and update source and target objects using their identifiers 

- It's a difficult project (seriously - try it), so working on it and solving the problems therein 
  would make me a better programmer

So I've written a mapper which solves the above problems.

## Highlights

#### Create new objects from existing objects or perform deep clones

```csharp
var customer = new Customer { Name = "Barney" };
var customerDto = mapper.Map(customer).ToANew<CustomerDto>();

var clonedCustomerDto = mapper.Clone(customerDto);
```

#### Update existing objects in an id-aware manner

```csharp
var dtos = new[]
{
    new CustomerDto { Id = 1234, Name = "Maggie" },
    new CustomerDto { Id = 5678, Name = "Lisa" }
};
var customers = new[]
{
    new Customer { CustomerId = 5678 }, // Name updated to 'Lisa'
    new Customer { CustomerId = 1234 }  // Name updated to 'Maggie'
};
mapper.Map(dtos).Over(customers);
```

#### View (and cache) a mapping execution plan for mapping two types

```csharp
var plan = mapper.GetPlanFor<PersonViewModel>().ToANew<Person>();
```

![_config.yml](/images/posts/2016-10-03/MappingPlan.gif)

## Other Stuff

- You can use it via a [static or instance API](https://agilemapper.readthedocs.io/Static-vs-Instance-Mappers)

- It performs [object merges](https://agilemapper.readthedocs.io/Performing-Merges)

- It [parses and converts](https://agilemapper.readthedocs.io/Type-Conversion) numeric types, `Guids`,
  `DateTime`s and `string`s out of the box

- It maps [lists, collections, enumerables and arrays](https://agilemapper.readthedocs.io/Collections) 
  out of the box

- It maps to [constructor arguments](https://agilemapper.readthedocs.io/Object-Construction)

- It handles circular references out of the box

- You can configure custom [data sources](https://agilemapper.readthedocs.io/configuration/Member-Values), 
  members to [ignore](https://agilemapper.readthedocs.io/configuration/Ignoring-Target-Members), 
  [callbacks](https://agilemapper.readthedocs.io/configuration/Mapping-Callbacks) at  precise points 
  within a mapping, custom [object factories](https://agilemapper.readthedocs.io/configuration/Object-Construction), 
  [exception handling](https://agilemapper.readthedocs.io/configuration/Exception-Handling), 
  [naming patterns](https://agilemapper.readthedocs.io/configuration/Member-Name-Patterns) with 
  which to match members... and [more](https://agilemapper.readthedocs.io/configuration)!

## Check it out!

AgileMapper is free, [MIT licensed](https://github.com/agileobjects/AgileMapper/blob/master/LICENCE.md),
available at version 0.6 [on NuGet](https://www.nuget.org/packages/AgileObjects.AgileMapper), and 
can be installed via the package manager console with:

```console
PM> Install-Package AgileObjects.AgileMapper
```

It's hosted [on GitHub](https://github.com/agileobjects/AgileMapper) with pretty decent 
[documentation](https://agilemapper.readthedocs.io), and the public API is all documented. I'll be 
reporting on and fine-tuning performance over the coming weeks, as well as adding new features like 
better support for Dictionaries. If you give it a try and find a bug please feel free to add it [on 
GitHub](https://github.com/agileobjects/AgileMapper/issues). Enjoy!