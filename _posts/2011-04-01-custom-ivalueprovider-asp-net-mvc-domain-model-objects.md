---
layout: post
title: Using a custom IValueProvider for domain model objects in ASP.NET MVC 2
excerpt: I had a series of ASP.NET MVC controllers which took identifiers for various domain objects, loaded the objects, then passed them to ViewModels. In order to DRY out the code a bit I decided to factor the object-loading logic into a customer IValueProvider - it turned out pretty neat, and this is how I did it :)
tags: [ASP.NET MVC, Domain Driven Design (DDD)]
---

I had an ASP.NET MVC project with URLs like this:

Customers/customerX (the details page of Customer 'customerX')

...defined by this route in `RouteTable.Routes`:

```csharp
RouteTable.Routes.MapRoute(
    "CustomerDetails",
    "Customers/{customerName}",
    new { controller = "Customers", action = "Details" });
```

...and leading to this action method:

```csharp
CustomersController.Details(string customerName);
```

I then found the appropriate `Customer` object in the action method, and creates a ViewModel for 
the Details View.

The thing was, I also had an Edit action and a Delete action, and sometimes in other Controllers I 
had to pass in `Customer` names and get hold of other `Customer` objects, and it didn't end up very 
[DRY](https://en.wikipedia.org/wiki/DRY). So today I did a spot of refactoring. I updated my action 
method to:

```csharp
CustomersController.Details(Customer customer);
```

...and implemented a custom `IValueProvider` to provide the `Customer` object.

**A spot of background, just in case**: when the ASP.NET MVC binding system is trying to populate the 
parameters for an action method it wants to execute, it requests them in turn from each of the 
`IValueProvider` objects in the static `ValueProviderFactories.Factories` collection. In my case 
because the `CustomerDetails` route had a token named `customerName`, but the action method was 
expecting a parameter named `customer`, the standard `IValueProviders` couldn't supply a value for the 
parameter, and my custom `IValueProvider` was called into play.

The `IValueProvider` I wrote looked a bit like this:

```csharp
using System.Globalization;
using System.Web.Mvc;

public class DomainObjectValueProvider : IValueProvider
{
    private readonly ControllerContext _context;

    public DomainObjectValueProvider(ControllerContext context)
    {
        this._context = context;
    }

    public bool ContainsPrefix(string prefix)
    {
        return prefix == "customer";
    }

    public ValueProviderResult GetValue(string key)
    {
        string customerName = 
            (string)this._context.RouteData.Values["customerName"];

        Customer customer = 
            CustomerService.FindCustomerByName(customerName);

        return new ValueProviderResult(
            customer,
            customerName,
            CultureInfo.CurrentUICulture);
    }
}
```

The `CustomerService` there is a static [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html) 
object which provides services for the `Customer` entity. In order to add my `DomainObjectValueProvider` 
to the Value Providers system I wrote a `ValueProviderFactory` like this:

```csharp
public class DomainObjectValueProviderFactory : 
    ValueProviderFactory
{
    public override IValueProvider GetValueProvider(
        ControllerContext controllerContext)
    {
        return new DomainObjectValueProvider(controllerContext);
    }
}
```

...and plugged it into the MVC system in Global.asax's `Application_Start()` with this:

```csharp
ValueProviderFactories.Factories.Add(new DomainObjectValueProviderFactory());
```

And it works a treat! ASP.NET MVC rules :)