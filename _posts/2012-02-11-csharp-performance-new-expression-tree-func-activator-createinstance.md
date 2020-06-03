---
layout: post
title: C# Performance&#58; new vs Func vs Activator.CreateInstance()
excerpt: I recently wrote an extension method which uses an Expression Tree to create a Func which creates an instance of an object from its Type. With that done I thought I'd check the performance difference between my method and Activator.CreateInstance(), which it was intended to replace. Here's what I found.
tags: [Expression Trees, Performance]
images_dir: '2012-02-11/'
---

<span class="updated">
Edit: As a result of these tests, I've written a 
[better-performing](fast-csharp-expression-tree-create-instance-from-type-extension-method) set of extension methods.
</span>

<span class="first">
I recently wrote [an extension method](csharp-expression-tree-create-instance-from-type-extension-method) 
which uses an Expression Tree to create a `Func` which creates an instance of an object from its type. 
With that done I thought I'd check the performance difference between my method and 
`Activator.CreateInstance()`, which it was intended to replace.
</span>

I wrote a simple console application which tested using `new`, `Type.GetInstance()` and 
`Activator.CreateInstance()` by creating 100,000 instances of objects with zero to three constructor 
parameters and calculating the average time of each construction. For `Type.GetInstance()` and 
`Activator.CreateInstance()` I created a single instance of each object before running the test 
so they could perform any caching outside of the actual performance measurement.

The results were as follows; the third column shows the total number of ticks taken to create 100,000 
objects, the fourth the number of ticks taken per object:

![GetInstance Performance]({{ site.post_images_dir }}{{ page.images_dir }}GetInstancePerformance.gif)

A few things to note:

- Unsurprisingly, using `new` is always and by far the fastest way to go.

- With a parameterless constructor, using `Activator.CreateInstance()` is almost as fast as using 
  `new`, and much, much faster than using `Type.GetInstance()`.

- When your constructor takes one or more parameters, `Type.GetInstance()` takes about 70% the time 
  of `Activator.CreateInstance()`.

I find myself wondering why `Type.GetInstance()` isn't faster than it is; after all, aren't `Func`s 
created by Expression Trees supposed to nearly as fast as regular code? I've not looked into it in 
any great detail, but I think its performance is weighed down by the generic nature of the method 
and the way the `Func`s are cached.

Because the `Func`s are cached in a dictionary which returns a `Func<object, object, object, object>`, 
calling the `Func` requires an Expression to cast each argument to its correct type, and this introduces 
overhead. This is confirmed by looking at the Expression Debug View in Visual Studio, which displays 
the created Lambda like this:

![Expression Debug View]({{ site.post_images_dir }}{{ page.images_dir }}ExpressionVisualiser.gif)

With these results, I'm going to update the parameterless overload of `Type.GetInstance()` to delegate 
to `Activator.CreateInstance()`, and I wonder if I might be able to use a generic helper class 
to cache a strongly-typed `Func` and so avoid the casting... something to consider (I've now considered 
it and written [new methods](fast-csharp-expression-tree-create-instance-from-type-extension-method)). 
I guess it's always best to make decisions based on data :)