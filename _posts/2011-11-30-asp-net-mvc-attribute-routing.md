---
layout: post
title: Easier ASP.NET MVC Routing
excerpt: I've recently refactored the way Routes are declared in an ASP.NET MVC application I'm working on, and I wanted to share part of the system I came up with; a really easy way to declare and keep track of ASP.NET MVC Routes, which then allows you to find the name of the Route which has been selected for the current request.
tags: [C&#35;, ASP.NET MVC]
images_dir: '2011-11-30/'
---

I've recently refactored the way Routes are declared in an ASP.NET MVC application I'm working on, 
and I wanted to share part of the system I came up with; a really easy way to declare and keep track 
of ASP.NET MVC routes, which then allows you to find the name of the `Route` which has been selected 
for the current request.

## Traditional MVC Route Declaration

Traditionally, ASP.NET MVC Routes are added to the application's `RouteCollection` using overloads 
of the `RouteCollection.MapRoute()` method; for example, this is the standard way the default 
`Route` which matches **/controller/action** URLs is created:

```csharp
routes.MapRoute(
    "Default",
    "{controller}/{action}/{id}",
    new 
    { 
        controller = "Home", 
        action = "Index", 
        id = UrlParameter.Optional 
    });
```

The first argument declares that this route is to be named 'Default', the second specifies the route's 
URL pattern, and the third contains the URL pattern segments' default values. To then write a link 
to a URL which matches the default Route in a View, you can use the 
[`HtmlHelper.RouteLink()`](https://msdn.microsoft.com/en-us/library/dd470133.aspx) method, like this:

```csharp
@ this.Html.RouteLink(
    "Default", 
    new { controller = "Orders", action = "Index" })
```

...that substitutes 'Orders' into the **{controller}** segment of the default route's URL pattern, 
and 'Index' into the **{action}** segment. The **{Id}** segment was declared optional and isn't 
specified here.

That's about the most basic thing you can do with MVC routing, and I already have reservations:

1. I've duplicated the magic string "Default" between the Route declaration and the use of `RouteLink()`.
   This isn't likely to cause a problem for the default route, but once you get to dozens of Routes
   the duplication is a pain.
2. There's no easy way to get from the `RouteLink()` method call to the declaration of the route 
   itself, so getting the names of the route's URL parameters correct requires some effort.
3. The call to `MapRoute()` is quite verbose; with dozens of routes this gets pretty ugly.
4. If at some point during a request I want to find out the name of the route has been matched.... 
   and I can't.

To get around these issues, I wanted to achieve the following:

1. Make declaring a route very easy, using as little code as possible.
2. Introduce a direct link between where a route is declared, where the route is defined and where 
   the route's name is used, so I can use Visual Studio's Go To Definition to get from a call to 
   `RouteLink()` to the declaration of the route I'm using, making it easier to make sure I use the 
   correct URL parameters.
3. Create a way to access the currently-selected route's name during the execution of a request.

My first step was to come up with a quick and easy syntax for declaring Routes.

## 1. An Easy Route Declaration Syntax

I figured the easiest way of declaring a route was to put all the information in a single string with a special syntax. For example, the default MVC route would be declared like this:

```csharp
"{controller:Home}/{action:Index}/{Id}*"
```

This contains the same information as the regular way of defining a route, but is far more compact:

- The default values for each URL segment are specified in a colon-separated section after the segment 
  name
- The **{Id}** segment is declared as optional simply by placing a * after it

That's the default route - a pretty simple example - so how about this?

```csharp
routes.MapRoute(
    "CustomerOrderList",
    "Orders/{customerRef}/{pageNo}",
    new { controller = "Orders", action = "List", pageNo = UrlParameter.Optional },
    new { customerRef = "^[a-zA-Z0-9]+$", pageNo = "^[0-9]+$" });
```

This maps to the `List` action on the `Orders` controller URLs which:

1. Start with the string **Orders/**
2. Then have a **{customerRef}** set of characters and numbers
3. Then optionally a numeric **{pageNo}**.

And again, it's quite verbose. Here's my alternative:

```csharp
"Orders/{customerRef:^[a-zA-Z0-9]+$}/{pageNo:^[0-9]+$}*->Orders/List"
```

Quite a bit more brief, and again, containing the same information as the regular way of declaring 
routes:

- Regular expression constraints are declared after the colon separator, the same as default values
- The target controller and action are specified after the ->
- The **{pageNo}** is defined as optional by placing a * after it

With an appropriate parser that gave me a nice, compact and clear way to declare routes. Next I wanted 
to have a single place where Routes were declared and accessed.

## 2. A Central Place to Declare and Access Routes

I wanted all my routes declared in one, dedicated place, which I would also use for route names when 
calling `RouteLink()`. With this in mind I made a single class named Routes with a series of public, 
constant fields, each one relating to a particular route. With this done, I figured a good place to 
actually declare each route was in an attribute on the field defining the route's name; the attribute 
would parse the route definition string and make the resulting route object available as a property. 
I then made the routes class examine its own fields during its static setup, and cache all the 
attribute-created Route objects in an internal `Dictionary`. Finally I made routes use that cache 
to register the routes when requested, and to access them later when required.

So the Routes class declares its named Routes like this:

```csharp
public static class Routes
{
    [RouteDefinition("Orders/{customerName}->Orders/Index")]
    public const string OrdersCustomerIndex = "OrdersCustomerIndex";

    [RouteDefinition(
        "Orders/{customerName}/{orderId:^([0-9]+)$}->Orders/Details")]
    public const string OrdersDetails = "OrdersDetails";

    [RouteDefinition("{controller:Home}*/{action:Index}*")]
    public const string Default = "Default";
}
```

...which are then used like this:

```csharp
@ this.Html.RouteLink(
    Routes.Default, 
    new { controller = "Orders", action = "Index" })
```

Now that using **Go To Definition** on the `Routes.Default` constant takes me to where the route is 
actually defined, it's nice and easy to quickly check on the parameter names when using `RouteLink()`. 
Finally, I wanted to be able to access the name of the current Route during a request.

## 3. Recovering the Route Name

The `RouteDefinitionAttribute` creates a `NamedRoute` class; a simple derivative of `Route`, but 
with a `Name` property. When the `Routes` class examines its fields and caches all the defined routes, 
it has access to the name of the route through the name of the field against which it is defined. It 
was therefore a pretty easy matter to have `Routes` give `NamedRoute` its name when it creates its 
cache of routes. This means that the route which is found in `RequestContext.RouteData.Route` is 
now a `NamedRoute`, and I can recover the route's name during a request. For visibility, I made 
`NamedRoute.ToString()` return the route name and URL pattern, like this:

![Named Routes]({{ site.post_images_dir }}{{ page.images_dir }}NamedRoutes.png)

The screenshot is from an example project I've made on 
[bitbucket](https://bitbucket.org/MrSteve/namedroutingexample/src); it contains all the named route 
classes and an MVC 3 application which demonstrates their use. I've found this way of defining and 
using routes much tidier than the default MVC system, and hope you find it useful too :)