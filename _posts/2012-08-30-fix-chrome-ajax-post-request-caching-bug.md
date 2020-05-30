---
layout: post
title: Fixing Chrome's AJAX Request Caching Bug
excerpt: I recently had to make a set of web pages restore their state when the user arrived on them after clicking the browser's back button. I used JQuery's ajax function to get the data, but even with JQuery's cache&#58; false setting and MVC's OutputCache attribute, Chrome insisted on retrieving it from its cache. Here's how I solved the problem.
tags: [C&#35;, ASP.NET, ASP.NET MVC, JavaScript, JQuery]
---

I recently had to make a set of web pages restore their state when the user arrived on them after 
clicking the browser's back button. The pages in question had various content loaded in response to 
user actions, which meant I had to manually get them back into a valid state after the page loaded.

I got hold of the page's data in a JavaScript ViewModel using a 
[JQuery ajax](https://api.jquery.com/jQuery.ajax) call, then iterated over the properties, filling 
in the fields as I went. I built in the ability to describe dependencies between inputs to make sure 
fields were filled in in the correct order and at the correct time, and that all worked nicely. To 
make sure the browser didn't cache the AJAX call results I used the JQuery's `cache: false` option, 
and ASP.NET MVC's [`OutputCache`](https://msdn.microsoft.com/en-us/library/system.web.mvc.outputcacheattribute%28v=vs.108%29.aspx) 
attribute for good measure. That all worked perfectly... except in Chrome.

Chrome insisted on retrieving the data from its cache. `cache: false` adds a random query string 
parameter to make the browser think it's a unique request - it made no difference. I made the AJAX 
call a POST - it made no difference.

Eventually what I had to do was add a random token to the URL (not the query string) and use MVC 
routing to deliver the request to the correct action. The project had a single Controller for all 
AJAX requests, so this route:

```csharp
routes.MapRoute(
    name: "NonCachedAjaxActions",
    url: "AjaxCalls/{cacheDisablingToken}/{action}",
    defaults: new { controller = "AjaxCalls" },
    constraints: new { cacheDisablingToken = "[0-9]+" });
```

...and this amendment to the ajax call:

```js
function loadPageData(url) {
    // Insert a timestamp before the URL's action segment:
    var indexOfFinalUrlSeparator = url.lastIndexOf("/");
    var uniqueUrl =
        url.substring(0, (indexOfFinalUrlSeparator + 1)) +
        new Date().getTime() + 
        url.substring(indexOfFinalUrlSeparator);
    // Call the now-unique action URL:
    $.ajax(uniqueUrl, { cache: false, success: completePageDataLoad });
}
```

...did the trick.