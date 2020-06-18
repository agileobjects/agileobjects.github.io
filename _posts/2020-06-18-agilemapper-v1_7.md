---
layout: post
title: AgileMapper v1.7 Released
excerpt: AgileMapper 1.7 is now on NuGet with bug fixes, and some new options for configuring data sources.
tags: [AgileMapper]
images_dir: '2020-06-18/'
---

_AgileMapper is a powerful and unopinionated object mapper for .NET 3.5+ and .NET Standard 1.0+. It 
flattens, unflattens, deep clones, merges, updates and projects queries. It works without configuration, 
but if needed, is highly and easily configurable._

AgileMapper 1.7 is now [on NuGet]({{ site.am_nuget }}) with bug fixes, and some new options for 
[configuring data sources]({{ site.am_docs }}/configuration/Member-Values).

## Configuring Complete Type Mappings

AgileMapper does a pretty good job of figuring out how to map a pair of types, but for times when 
types don't match up at all, complete mappings can now be configured. This configuration is applied 
by the mapper whenever the configured type pair is matched:

```csharp
Mapper.WhenMapping
   .From<Address>().To<AddressDto>()
   .MapInstancesUsing(ctx => new AddressDto
   {
       Number = ctx.Source.HouseNo,
       Line1 = ctx.Source.Street,
       Line2 = ctx.Source.Town,
       Line3 = ctx.Source.City,
       Line4 = ctx.Source.County,
       Postcode = ctx.Source.PostalCode
   });
```

[This DotNetFiddle](https://dotnetfiddle.net/XNPrMS){:target="_blank"} has a live example.

## Alternate Data Sources

To map from a data source other than a source model's matching member, an alternate source can be 
configured. Again, this configuration is applied whenever the configured type pair is matched:

```csharp
Mapper.WhenMapping
    .FromDictionariesWithValueType<ProductDto>()
    .Over<List<Product>>()
    .Map(ctx => ctx.Source.Values)
    .ToTargetInstead(); // <- not ToTarget()
```

In this example AgileMapper's usual [Dictionary mapping]({{ site.am_docs }}/Dictionary-Mapping) is 
skipped, and the source Dictionary's `Values` collection is used to update the target `List<Product>` 
using [collection mapping]({{ site.am_docs }}/Collections) instead.

[This DotNetFiddle](https://dotnetfiddle.net/JzQfLX){:target="_blank"} has a live example.

Note that `ToTargetInstead()` is different to `ToTarget()`:

```csharp
Mapper.WhenMapping
    .FromDictionariesWithValueType<ProductDto>()
    .Over<List<Product>>()
    .Map(ctx => ctx.Source.Values)
    .ToTarget(); // <- not ToTargetInstead()
```

With `ToTarget()`, the usual Dictionary mapping is performed, _followed_ by a collection mapping from 
`Dictionary.Values`.

## Sequential Data Sources

A set of data sources can now be applied to a target one after the other:

```csharp
Mapper.WhenMapping
    .From<Customer>()
    .ToANew<CustomerViewModel>()
    .Map((c, vm) => new[] { c.HomeAddress })
        .Then.Map((c, vm) => new[] { c.WorkAddress })
        .Then.Map((c, vm) => c.AddressHistory)
    .To(vm => vm.AllAddresses);
```

In this example the target view model's `AllAddresses` collection is populated first using the source
`Customer`'s `HomeAddress`, then the `WorkAddress`, then the `AddressHistory` collection. Previously
only one [non-conditional data source]({{ site.am_docs }}/configuration/Member-Values#conditional-data-sources)
could be configured for a target member - this option enables multiple sources to be applied in sequence.

Please report any issues or suggestions [on GibHub]({{ site.am_github }}/issues). Happy mapping!