---
layout: post
title: Viewing AutoMapper Execution Plans with ReadableExpressions
excerpt: Waaaaaay back in (I think) v6, AutoMapper surfaced its mapping execution plans so you can look at them to see what happens when it maps one object to another. Their default form is not easy to understand, but luckily ReadableExpressions is here to make them... readable. Here's how.
tags: [ReadableExpressions, AutoMapper, Debugging]
images_dir: '2020-06-04/'
featured: true
featured_image: '/assets/images/posts/2020-06-04/magnifying-glass.jpg'
hidden: true
---

Waaaaaay back in (I think) v6, AutoMapper 
[surfaced](https://docs.automapper.org/en/stable/Understanding-your-mapping.html) its mapping execution 
plans so you can look at them to see how it maps one object to another. The execution plan you retrieve 
is an `Expression` object - the one AutoMapper compiles into the `Func` which is executed to perform 
the mapping. Raw `Expression`s are not easy to understand, but luckily 
[ReadableExpressions]({{ site.re_github }}) is here to make them... readable.

## An Example

Let's look at an object-flattening plan - all the source code for this example is 
[on GitHub](https://github.com/agileobjects/eg-automapper-readableexpressions), and I've made
[a DotNetFiddle](https://dotnetfiddle.net/aJYTGZ) you can play with.

Let's flatten:

```csharp
class Wedding
{
    public DateTime Date { get; set; }

    public Person Bride { get; set; }

    public Person Groom { get; set; }
}
	
class Person
{
    public Title Title { get; set; }

    public string Name { get; set; }

    public Address Address { get; set; }
}
	
class Address
{
    public string Line1 { get; set; }
}
	
enum Title
{
    Other, Mr, Ms, Miss, Mrs, Dr
}
```

...to:

```csharp
class WeddingDto
{
    public DateTime Date { get; set; }

    public string BrideTitle { get; set; }

    public string BrideName { get; set; }

    public string BrideAddressLine1 { get; set; }

    public string GroomTitle { get; set; }

    public string GroomName { get; set; }

    public string GroomAddressLine1 { get; set; }
}
```

## Getting the Plan

AutoMapper's execution plan for these two classes is retrieved like this:

```csharp
var configuration = new MapperConfiguration(cfg =>
{
    cfg.CreateMap<Wedding, WeddingDto>();
});

var executionPlan = configuration
    .BuildExecutionPlan(typeof(Wedding), typeof(WeddingDto));
```

The `executionPlan` variable is the `Expression` AutoMapper compiles into its mapping `Func`.

## Viewing the Plan

The default way to view the plan is with Visual Studio's Debug View, which looks like this:

![Visual Studio's Debug View]({{ site.post_images_dir }}{{ page.images_dir }}VsDebugView.gif)

...you can _kind of_ see some of what's going on - there's an `if` test for `$src` being null, there's 
a try / catch which assigns `typeMapDestination.Date`, but there's a lot of noise, and it's not 
terribly easy to decipher.

## Reading the Plan

ReadableExpressions to the rescue! Install the [ReadableExpressions NuGet package]({{ site.re_nuget }}):

```console
PM> Install-Package AgileObjects.ReadableExpressions
```

...assign the result of `executionPlan.ToReadableString()` to a variable, and view _that_:

![ReadableExpression's View]({{ site.post_images_dir }}{{ page.images_dir }}ReadableView.gif)

Oh! It's a lambda which takes `src`, `dest` and `ctxt` arguments, returns the result of a ternary 
and assigns each property within a set of try / catches, handling nulls as it goes. It's much easier 
to understand this way!

## Exploring the Plan

The readable string version of the execution plan `Expression` is much easier to understand than 
its Debug View, but we can do better!

Install [the ReadableExpressions Visualizers]({{ site.re_viz }}) from the Visual Studio Marketplace, 
mouse over the original `executionPlan` variable, and click the magnifying glass:

![ReadableExpression's View]({{ site.post_images_dir }}{{ page.images_dir }}VisualizerView.gif)

Even better! To make it clearer still, the visualizer provides options to customise the output:

![ReadableExpression's Options]({{ site.post_images_dir }}{{ page.images_dir }}VisualizerOptions.gif#medium-border)

This is the best way to see what's mapped and how, and debug any issues you've encountered. Enjoy!

## Links

- Sample code [on GitHub](https://github.com/agileobjects/eg-automapper-readableexpressions)
- Interactive [DotNetFiddle](https://dotnetfiddle.net/aJYTGZ)