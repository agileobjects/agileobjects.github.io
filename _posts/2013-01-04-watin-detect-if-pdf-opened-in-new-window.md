---
layout: post
title: Extending WatiN 3&#58; Detecting if a PDF Has Opened In a New Window
excerpt: WatiN lets you attach to browser windows so you can verify their contents and close them as part of your tests, but the standard API doesn't detect windows with PDF documents in them. Here's an extension method which does.
tags: [C&#35;, ASP.NET, ASP.NET MVC, JavaScript, JQuery, Automated Testing]
---

[WatiN](https://watin.org) lets you attach to browser windows so you can verify their contents and 
close them as part of your tests, but the standard API doesn't detect windows with PDF documents in 
them. Adapted from 
[this answer](https://stackoverflow.com/questions/1191897/how-to-check-if-pdf-was-successfully-opened-in-the-browser-using-watin) 
on StackOverflow, here's an extension method which does.

```csharp
private static readonly ConstraintContext _emptyConstraintContext = 
    new ConstraintContext();

public static TPage ShouldOpenANewWindow<TPage>(
    this TPage page,
    Action<TPage> windowOpeningAction,
    Constraint windowFindMethod,
    bool closeBrowserIfExists = true)
    where TPage : BasePage
{
    Assert.IsFalse(Browser.Exists<IE>(windowFindMethod));
 
    windowOpeningAction.Invoke(page);
 
    // Make sure the opening window hasn't been replaced by checking 
    // a window still exists with the Title of the Document of the 
    // given page:
    Assert.IsTrue(Browser.Exists<IE>(
        Find.ByTitle(page.Document.Title)));
 
    InternetExplorer matchingWindow = null;
            
    // Try 10 times to find a matching window:
    for (int i = 0; i < 10; i++)
    {
        foreach (InternetExplorer internetExplorer in 
                    new ShellWindowsClass())
        {
            if (internetExplorer.FullName.Contains("iexplore.exe"))
            {
                if (windowFindMethod.Matches(
                    new TitleAndUrlAttributeBag(
                        internetExplorer.LocationName, 
                        internetExplorer.LocationURL),
                    _emptyConstraintContext))
                {
                    matchingWindow = internetExplorer;
                    break;
                }
            }
        }
 
        if (matchingWindow != null)
        {
            break;
        }
 
        // None of the currently-open IE windows matches the given 
        // title or URL; wait for 1 second then try again:
        Thread.Sleep(1000);
    }
 
    if (matchingWindow == null)
    {
        Assert.Fail("The expected new browser window was not found.");
    }
 
    if (closeBrowserIfExists)
    {
        matchingWindow.Quit();
    }
 
    return page;
}
```

The method extends a base `Page` class, assuming that you're using 
[WatiN's Page pattern](https://watinandmore.blogspot.co.uk/2009/06/introducing-page-class.html). You
invoke it on an instance of a page, passing in an action which is expected to cause the new window 
to open, and a WatiN `Constraint` detailing how to identify the window if it exists. The `Constraint` 
is passed a `TitleAndUrlAttributeBag`, a simple implementation of WatiN's `IAttributeBag` interface 
which provides title and URL values only. This means you can only use `Constraint`s which check window 
titles or URLs, but this should be sufficient for most cases. Here's the `TitleAndUrlAttributeBag` source:

```csharp
internal class TitleAndUrlAttributeBag : IAttributeBag
{
    private readonly Dictionary<string, string> _attributes;

    public TitleAndUrlAttributeBag(
        string windowTitle, 
        string browserUrl)
    {
        _attributes = new Dictionary<string, string>
        {
            { "title", windowTitle },
            { "href", browserUrl}
        };
    }

    public T GetAdapter<T>() where T : class
    {
        return default(T);
    }

    public string GetAttributeValue(string attributeName)
    {
        return _attributes[attributeName];
    }
}
```

Note the hard-coded strings **"title"** and **"href"**; 
[these are the values](https://sourceforge.net/p/watin/code/1217/tree/trunk/src/Core/Find.cs#l31) 
WatiN will request when processing an `AttributeConstraint` for a title or URL respectively.

So, given this Page class:

```csharp
internal class MyPage : BasePage
{
    public void ViewTermsAndConditions()
    {
        this.Document.Link(Find.ById("terms-and-conditions")).Click();
    }
}
```

...you can use the extension method to check a Terms and Conditions PDF opens in a new window like this:

```csharp
var myPage = new MyPage();

myPage.ShouldOpenANewWindow(
    page => page.ViewTermsAndConditions(), 
    Find.ByUrl(url => url.EndsWith("terms.pdf")));
```