---
layout: post
title: NDepend on a Real Project, Round 1.4&#58; Mutually Dependent Namespaces
excerpt: This is the fourth in a series of blogs looking at things NDepend told me about a personal project of mine - this time mutually-dependent namespaces.
tags: [C&#35;, NDepend, Programming Practices]
images_dir: '2014-01-05/'
---

This is the fourth in a series of blogs looking at things NDepend told me about a personal project 
of mine. The previous posts are:

- A description of the project (an object-object mapper) and the first change I made regarding [an 
  abstract class](ndepend-real-project-dashboard-abstract-class-constructor)
- A look at various methods NDepend said were [never called](ndepend-real-project-dead-methods), and
- A curious case of [Exception naming](ndepend-real-project-exception-naming)

This is the last of the Critical Rule violations NDepend warned me about in its first analysis. The 
detailed report looks like this:

![NDepend Cyclic Namespaces report]({{ site.post_images_dir }}{{ page.images_dir }}Cyclic_Namespaces.jpg)

It's fairly self-explanatory - it lists which namespaces are mutually dependent, which namespaces 
they're mutually dependent with, and how many Types are used by each pair of namespaces, creating 
the dependency. Mutually dependent namespaces indicate the way classes have been grouped doesn't 
organise them in a strict higher-to-lower fashion, or perhaps that the way namespaces have been 
designated is inconsistent between parts of the system. Having mutually-dependent namespaces would 
make splitting my assembly into multiple assemblies awkward, if I wanted to do that sort of thing.

So I've got 24 namespaces which have mutual dependencies on other namespaces. Looking at the list, 
you can see the first five involve the `Helpers` namespace, which is one I use for extension methods, 
and the sixth one is `Caching.Keys`, which I use for classes which generate a unique key against 
which to cache something. Following the instructions in the report above (_export the first namespace 
to the vertical header of the dependency matrix_, with a few more steps after that) gives me a 
dependency matrix, illustrating which classes are dependent on which:

![NDepend Cyclic Namespaces Dependency Matrix]({{ site.post_images_dir }}{{ page.images_dir }}Dependency_Matrix.jpg)

The rows list the members of `Caching.Keys`, and the columns list the members of `Mapping.MemberPopulation`. 
The blue squares indicate the number of members from the column using a member from the row, the 
green squares indicate the number of members from the row using a member from the column, and the 
black squares indicate members used mutually, with the number indicating the depth of the cycle. To 
have all the dependencies going in the right direction, I should have no black squares, and all the 
coloured squares the same colour - either green or blue.

Drilling into the members to which the black squares relate, you get more detail, along with a nice 
explanation in a pop-up help box:

![NDepend Cyclic Namespaces Dependency Matrix Detail]({{ site.post_images_dir }}{{ page.images_dir }}Dependency_Matrix_Detail.jpg)

So the problem is that the `GetMemberValueKey.For()` factory method is using members in the 
`MemberPopulation` namespace, and members in the `MemberPopulation` namespace are using the 
`GetMemberValueKey.For()` factory method. Which members? We can drill further still:

![NDepend Cyclic Namespaces Dependency Matrix Detail 2]({{ site.post_images_dir }}{{ page.images_dir }}Dependency_Matrix_Detail2.jpg)

...and see exactly which ones - `.For()` is using (for example) the `Member.QualifiedName` property 
(the green square with the arrow), and the `TypedMember<T>` type is using `.For()` (the blue square 
in the right-most column).

So how can I fix it? I see two options:

1. Have `TypedMember<T>` pass the values the `.For()` method currently gets for itself into `.For()` 
   as arguments. This would increase `.For()`'s parameter list from two to three, and would mean if 
   I needed to add extra pieces of information to the key to ensure it's unique, I'd have to add 
   further arguments still. It would also be the opposite of the 
   [PreserveWholeObject](https://www.refactoring.com/catalog/preserveWholeObject.html) refactoring 
   pattern, which I tend to lean towards instead of having long lists of arguments. 
2. Move the `GetMemberValueKey` Type into the same namespace as `TypedMember<T>`. This would mean 
   abandoning the `Caching.Keys` namespace altogether, as I'm not going to move one `Key` type 
   without moving the others, but I think this is my preferred approach. `GetMemberValueKey` is only 
   used by `TypedMember<T>`, and probably belongs in the same conceptual bucket - classes describing 
   members on types which can be mapped from and to. I never was 100% comfortable with that `Keys` 
   namespace, you know...

So that's the last of the Critical Rules, next time I'll start looking at the Non-critical ones, 
starting with an old classic - a constructor calling a virtual method. Or _does_ it...?