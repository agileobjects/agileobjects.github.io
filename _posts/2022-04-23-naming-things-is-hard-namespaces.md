---
layout: post
title: Naming Things Is Hard&#58; Namespaces
excerpt: How should classes be grouped into namespaces, and how should those namespaces be named? Is 'Interfaces' a namespace?
tags: [Naming Patterns]
---

Organising classes into namespaces gives high-level clues to what classes do, what sort of classes
they are, and makes it easier to navigate to classes of interest. But how should classes be grouped,
and how should the groups be named? What's a helpful group name, and what isn't?

## How to Group Classes

Let's say you're looking for a set of hand towels in a department store - how would you find them?
You'd probably go to the homewares department, then to the bathrooms section, and finally to towels - 
and that's how to group classes into namespaces - make categories of successively smaller scope. Is 
'hand towels' a namespace? Probably not - the smallest namespace scope should be wide enough to contain
several classes with common features, and how many different types of hand towels are there?

Next, let's say the department store sold descriptions of all its product, as well as the products 
themselves. Would it make more sense to have a top-level 'Descriptions' department, or to group the
descriptions with the products they describe? The latter! Which is to point out:

## 'Interfaces' is not a Namespace

I've seen countless projects with an 'Interfaces' namespace, usually without narrower namespaces within.
This is like our department store having a single 'Descriptions' department, with no further organisation
within it - it doesn't help organise your code, and it's not a meaningful grouping.

The 'Interfaces' namespace is usually found in a separate project, and used to implement
[Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control), which is a worthwhile thing
to do. So how should we organise and name interfaces for IoC, without having an 'Interfaces' namespace?

The appropriate name for a project like this is something like '[Prefixes].Abstractions', _e.g._
[Microsoft.Extensions.Logging.Abstractions](https://nuget.org/packages/Microsoft.Extensions.Logging.Abstractions),
and if you look at the types in that project - _e.g._ 
[`ILogger`](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.Logging.Abstractions/src/ILogger.cs) -
you'll note that 'Abstractions' is not part of the namespace. The department store doesn't have a
'Descriptions' department.

Oh, and by the same reasoning - 'Implementations' isn't a namespace either :)

## Quick Tips

- If a namespace will contain several child items, make it plural, _e.g._ 
  [Microsoft.Extensions.Options.DataAnnotations](https://nuget.org/packages/Microsoft.Extensions.Options.DataAnnotationsDataAnnotations),
  or [System.IO.Pipelines](https://nuget.org/packages/System.IO.Pipelines)

- If a namespace will contain a particular implementation of something, make it singular, _e.g._
  [Microsoft.Extensions.FileSystemGlobbing](https://nuget.org/packages/Microsoft.Extensions.FileSystemGlobbing),
  or [System.Security.SecureString](https://nuget.org/packages/System.Security.SecureString)

- Name namespaces after the behaviours or services they provide, _e.g._ 'Security', 'Caching',
  'Logging', etc
  
- Put cross-cutting behaviours within your service namespaces into namespaces of their own, _e.g._
  'Caching.Configuration'

- Within test projects, reproduce the namespaces of the classes under test, _e.g._ tests for types in an 
  'ExceptionHandling.AspNetCore' namespace should live in 'ExceptionHandling.AspNetCore.Tests'

Happy namespacing!
