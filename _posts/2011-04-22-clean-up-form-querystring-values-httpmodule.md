---
layout: post
title: Using an HttpModule to Clean Up Form and QueryString Input
excerpt: To avoid XSS attacks, ASP.NET throws a lovely yellow screen of death. But sometimes you want to accept potentially dangerous input, or you just don't want to have that error splashed across the screen. Being a fan of prevention rather than cure, I figured I'd make an IHttpModule to screen input before it gets to my application.
tags: [C&#35;, ASP.NET, ASP.NET MVC, Aspect Oriented Programming (AOP)]
---

**"A potentially dangerous Request.Form value was detected from the client"**

To avoid [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting), ASP.NET's default behaviour 
is to throw a lovely yellow screen of death with that message. It's nice to be protected, but sometimes 
you want to accept potentially dangerous input, or maybe you just don't want to have that error splashed 
across the screen. The latter was the case for me recently, but I wasn't completely happy with the 
standard solution.

The first part of the solution is telling ASP.NET not to validate the request. For both web forms and 
MVC, you add this to `system.web` in web.config:

```xml
<httpRuntime requestValidationMode="2.0"/>
```

...then with web forms you disable validation by adding `validateRequest="false"` to the `Page` 
directive, and with MVC a `[ValidateInput(false)]` attribute to the appropriate controller or action.

Being a fan of prevention rather than cure, and liking aspect-oriented solutions to problems, I figured 
it'd be nicer to screen input before it gets to my MVC application than stick attributes all over the 
place. My old friend the `IHttpModule` is perfect for this; it centralises input clean up by plugging
into the request pipeline, and can swapped for a different module later if the screening rules change. 
My application just receives screened input without knowing how, where or why the screening was done.

So this is what my colleague Andrew Beaton and I came up with - an `IHttpModule` which removes all 
HTML tags from the form and query string, then HTML-encodes whatever's left. Add it to the `httpModules` 
section of the `system.web` element and the `modules` section of the `system.webServer` element in 
web.config, and voila!

```csharp
using System;
using System.Collections.Specialized;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;

public class InputScreeningModule : IHttpModule
{
    private static readonly Regex _inputCleaner = 
        new Regex("<[^>]+>", RegexOptions.Compiled);

    public void Init(HttpApplication context)
    {
        context.BeginRequest += CleanUpInput;
    }

    public void Dispose()
    {
    }

    private static void CleanUpInput(object sender, EventArgs e)
    {
        HttpRequest request = ((HttpApplication)sender).Request;

        if (request.QueryString.Count > 0)
        {
            CleanUpCollection(request.QueryString);
        }

        if (request.HttpMethod == "POST")
        {
            if (request.Form.Count > 0)
            {
                CleanUpCollection(request.Form);
            }
        }
    }

    private static void CleanUpCollection(NameValueCollection collection)
    {
        // Both the form and query string collections are 
        // read-only by default, so use Reflection to make 
        // them writable:
        PropertyInfo readonlyProperty = collection.GetType().GetProperty(
            "IsReadOnly",
            BindingFlags.Instance | BindingFlags.NonPublic);

        readonlyProperty.SetValue(collection, false, null);

        for (int i = 0; i < collection.Count; i++)
        {
            if (string.IsNullOrWhiteSpace(collection[i]))
            {
                continue;
            }

            collection[collection.Keys[i]] = HttpUtility.HtmlEncode(
                _inputCleaner.Replace(collection[i], string.Empty));
        }

        readonlyProperty.SetValue(collection, true, null);
    }
}
```