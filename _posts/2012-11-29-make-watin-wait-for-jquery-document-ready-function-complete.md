---
layout: post
title: Extending WatiN 2&#58; Wait for JQuery document.ready() Functions to Complete
excerpt: WatiN's DomContainer.WaitForComplete() method pauses test execution until the DOM has finished loading, but if your page has functions registered with JQuery's ready() function, you'll probably want to wait for those to finish executing before testing it. Here's a WatiN extension method which pauses test execution until that happens.
tags: [C&#35;, ASP.NET, ASP.NET MVC, JavaScript, JQuery, Automated Testing]
---

[WatiN](https://watin.org)'s 
[`DomContainer.WaitForComplete()`](https://sourceforge.net/p/watin/code/1217/tree/trunk/src/Core/DomContainer.cs#l139) 
method pauses test execution until the DOM has finished loading, but if your page has functions 
registered with JQuery's [`ready()`](http://api.jquery.com/readys) function, you'll probably want to 
wait for those to finish executing before testing it. Here's a WatiN extension method which pauses 
test execution until that happens.

JQuery (as far as I can see) doesn't provide an event or other way of being notified of when it's 
finished running your `ready()` functions, so you have to get around it another way. Luckily, because 
`ready()` executes the functions it's given in the order they're registered, you can simply register 
another one to add a 'marker' div to the page, and tell WatiN to wait for that div to exist. Here's 
the code; I added the extension method to 
[`Browser`](https://sourceforge.net/p/watin/code/1217/tree/trunk/src/Core/Browser.cs) rather than 
[`DomContainer`](https://sourceforge.net/p/watin/code/1217/tree/trunk/src/Core/DomContainer.cs) 
(`Browser` derives from `DomContainer`) because it's the sort of thing you only execute once for 
each of the pages your test loads, so `Browser` seemed like a good place to put it.

```csharp
public static void WaitForJQueryDocumentReadyFunctionsToComplete(
    this Browser browser)
{
    // Don't try this if JQuery isn't defined on the page:
    if (bool.Parse(browser.Eval("typeof $ == 'function'")))
    {
        const string jqueryCompleteId = 
            "jquery-document-ready-functions-complete";
 
        // Register a ready() function which adds a marker div to 
        // the body:
        browser.Eval(
           @"$(document).ready(function() { " + 
                "$('body').append(
                    '<div id=""" + jqueryCompleteId + @""" />'); " + 
            "});");

        // Wait for the marker div to exist or make the test fail:
        browser.Div(Find.ById(jqueryCompleteId))
               .WaitUntilExistsOrFail(10, 
                   "JQuery document ready functions did not complete.");
    }
}
```

The code uses the `Eval()` method to send JavaScript to the browser to be executed; first to check
that JQuery actually exists on the page, then to add the new `ready()` method. `WaitUntilExistsOrFail()`
is another WatiN extension method I've written (I've ended up writing really 
[quite a lot of them](watin-set-text-is-element-visible-is-field-hidden-extension-methods)) which 
waits for the element on which it is invoked to exist, and uses `Assert.Fail()` to fail the test
with the given message if it doesn't exist within the specified number of seconds. Here it is:

```csharp
public static void WaitUntilExistsOrFail(
    this Element element, 
    int timeoutInSeconds, 
    string failureMessage)
{
    try
    {
        element.WaitUntilExists(timeoutInSeconds);
    }
    catch (WatiNTimeoutException)
    {
        Assert.Fail(failureMessage);
    }
}
```

`WatiNTimeoutException` is a using alias for `WatiN.Core.Exceptions.TimeoutException`:

```csharp
using WatiNTimeoutException = WatiN.Core.Exceptions.TimeoutException;
```

...I use an alias to avoid a conflict with the base class libraries' `System.TimeoutException`.