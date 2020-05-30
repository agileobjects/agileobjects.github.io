---
layout: post
title: Extending WatiN&#58; Useful Extension Methods
excerpt: I've been doing a fair amount of UI testing using WatiN recently – here's some extension methods I've found useful.
tags: [C&#35;, ASP.NET, ASP.NET MVC, Automated Testing]
---

I've been doing a fair amount of UI testing using [WatiN](https://watin.org) recently – here's some 
extension methods I've found useful.

## Check if a Field is Hidden

This checks if a WatiN `TextField` is actually a hidden field. WatiN makes no distinction between 
text and hidden inputs, so this can come in handy if you render an input sometimes as hidden and 
sometimes as a visible text field. Note that this doesn't check if an input is _visible_ (I've got 
another extension method for that in a moment), it checks if it's _hidden_.

```csharp
public static bool IsHiddenField(this TextField textField)
{
    if (textField == null || !textField.Exists)
    {
        return false;
    }

    var textFieldType = textField.GetAttributeValue("type");

    return (textFieldType != null) && 
            textFieldType.ToLowerInvariant() == "hidden";
}
```

## Enter Field Text Quickly

The next method quickly sets the value of a text field to a given string. By default WatiN types the
text you give it into a text field one character at a time which can be necessary if you have behaviour 
you want to test which is triggered by individual key presses, but which most of time is just painfully 
slow; this method dumps the text in in one go. Note that if it's not a hidden field then it gives it 
focus first; this helps trigger validation once the value has been set and focus moves elsewhere.

```csharp
public static void SetText(this TextField textField, string value)
{
    if ((textField == null) || !textField.Exists)
    {
         return;
    }

    if (!textField.IsHiddenField())
    {
        textField.Focus();
    }

    textField.Value = value;
}
```

## Check if a Field is Visible

Finally, here's a method which checks if an `Element` is currently visible. It does so by walking up 
the DOM and checking for a `Style.Display` of 'none' on any element between the one on which the 
method is invoked, and any of its ancestors.

```csharp
public static bool IsElementVisible(this Element element)
{
    if ((element == null) || !element.Exists)
    {
        return false;
    }

    while ((element != null) && element.Exists)
    {
        if (element.Style.Display.ToLowerInvariant()
            .Contains("none"))
        {
            return false;
        }

        element = element.Parent;
    }

    return true;
}
```

Hope they come in handy :)