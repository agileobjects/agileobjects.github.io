---
layout: post
title: Self-Documenting Code&#58; No Comment
excerpt: What's the role of comments in self-documenting code? Here's an example from another blog, with some thoughts.
tags: [Programming Practices, JavaScript]
images_dir: '2020-07-11/'
---

I recently Googled 'Best way to document JavaScript', and one of the first results was
[this blog](https://gomakethings.com/whats-the-best-way-to-document-javascript), which I thought 
contained some good info, as well as some things I don't agree with. Top of the list would be:

> Self-documenting code is bullshit.

I mean... it's not... is it?

## Self-Documenting Code

Self-documenting code is code written in such a way that it's easy to read and understand its intention. 
It doesn't make all formal documentation redundant - even a system made of perfectly 
self-documenting code can benefit from documentation describing its high-level structures and goals - 
but it removes the need for _a lot_ of documentation and code comments.

## For Example

The blog gives the following example of code documented with comments:

```js
/**
 * Toggle visibility of a content tab
 * @param  {String} selector Selector for the element
 * @param  {Node}   toggle   The element that triggered the tab
 */
var toggleVisibility = function (selector, toggle) {

    // If there's no selector, bail
    if (!selector) return;

    // Get the tab to show
    var elem = document.querySelector(selector);
    if (!elem) return;

    // Show the element
    elem.classList.add('active');

    // If a toggle element was provided, add an .active class 
    // for styling
    if (toggle) {
        toggle.classList.add('active');
    }

    // Bring the newly visible element into focus
    elem.focus()

    // If elem.focus() didn't work, add tabindex="-1" and try 
    // again (elements that aren't focusable by default need a 
    // tabindex)
    if (document.activeElement.matches(selector)) return;
    elem.setAttribute('tabindex', '-1');
    elem.focus();
};
```

The code itself is pretty neatly-written - let's take it line-by-line, consider which comments add
value, and if we can make it more self-documenting.

### JSDoc Documentation

The function is declared with [JSDoc](https://jsdoc.app) documentation:

```js
/**
 * Toggle visibility of a content tab
 * @param  {String} selector Selector for the element
 * @param  {Node}   toggle   The element that triggered the tab
 */
var toggleVisibility = function (selector, toggle) {
```

According to the documentation, this function toggles the visibility of a tab - but its name and the 
names of its arguments make no mention of tabs. Maybe the file containing this function is tab-specific, 
so [within its context](/naming-things-is-hard-namespace-interface-class-method-context) this makes 
sense, but maybe not. In any case, this can be more self-documenting:

```js
var toggleTabVisibility = function (tabSelector, triggerElement) {
```

The function name and selector argument now mention tabs, which makes it more clear what this function
is for, and what to pass in. I've also renamed `toggle` to `triggerElement`, as according to the 
documentation, `toggle` is the 'element that triggered the tab'. With these changes, I'd argue the 
JSDoc block is redundant.

### Redundant Comments

Next statement:

```js
    // If there's no selector, bail
    if (!tabSelector) return;
```

This is one of those comments which basically repeats its code. It's the sort of comment Uncle Bob 
recommends not to write in [Clean Code](https://smile.amazon.co.uk/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882).
It's noise, and we can remove it.

### Generic Names and Lies

Next statement:

```js
    // Get the tab to show
    var elem = document.querySelector(tabSelector);
    if (!elem) return;
```

This statement is already a little easier to understand as `selector` is now named `tabSelector`, but 
it can be improved. `elem` is a completely generic variable name - it gives us a hint what type the 
variable is, but tells us nothing about its purpose.

Secondly, is the comment lying? It says we're getting the tab to 'show', but doesn't this function 
_toggle_ visibility? The JSDoc said 'Toggle visibility of a content tab' - I'd expect from that it 
would _show_ hidden tabs, and _hide_ visible ones. Sure enough though, it only _shows_ tabs, it doesn't 
hide them. This is one of the problems with documentation and comments - unlike code, they can _lie_.

So with a quick detour to rename the function:

```js
var showTab = function (tabSelector, triggerElement) {
```

...we can make the comment redundant with a descriptive variable name:

```js
    var tabToShow = document.querySelector(tabSelector);
    if (!tabToShow) return;
```

### Self-Documenting CSS

Next statement:

```js
    // Show the element
    tabToShow.classList.add('active');
```

It's not 100% clear that adding the `active` class will cause `tabToShow` to become visible, but with
a more self-documenting CSS class name:

```js
    tabToShow.classList.add('visible');
```

...the comment is redundant.

The comments for the next two statements again pretty much repeat what 
their code is doing, especially with our updated naming:

```js
    // If a toggle element was provided, add an .active class 
    // for styling
    if (triggerElement) {
        triggerElement.classList.add('visible');
    }

    // Bring the newly visible element into focus
    tabToShow.focus()
```

They're noise, and we can remove them.

### Worthwhile Comments

The comment for the _next_ statements actually adds value:

```js
    // If elem.focus() didn't work, add tabindex="-1" and try 
    // again (elements that aren't focusable by default need a 
    // tabindex)
    if (document.activeElement.matches(tabSelector)) return;
    tabToShow.setAttribute('tabindex', '-1');
    tabToShow.focus();
```

It explains how we ended up at the final two lines, and why we're adding a `tabindex` - that information 
would be tricky to convey in the code itself, so the comment has earned its place.

We can however, self-document a little more with a helper function:

```js
function hasFocus(elementSelector) {
    return document.activeElement.matches(elementSelector);
}

...

    if (hasFocus(tabSelector)) return;
    
    // tabToShow.focus() didn't work, add tabindex="-1" and try 
    // again (elements that aren't focusable by default need a 
    // tabindex)
    tabToShow.setAttribute('tabindex', '-1');
    tabToShow.focus();
```

...the slightly-altered comment remains though, and still serves a purpose.

## Self-Documented

Our final, refactored function looks like this:

```js
var showTab = function (tabSelector, triggerElement) {

    if (!tabSelector) return;

    var tabToShow = document.querySelector(tabSelector);
    if (!tabToShow) return;

    tabToShow.classList.add('visible');

    if (triggerElement) {
        triggerElement.classList.add('visible');
    }

    tabToShow.focus()

    if (hasFocus(tabSelector)) return;

    // tabToShow.focus() didn't work, add tabindex="-1" and try 
    // again (elements that aren't focusable by default need a 
    // tabindex)
    tabToShow.setAttribute('tabindex', '-1');
    tabToShow.focus();
};
```

With more self-documenting function, parameter and variable names, the documentation and almost every 
comment is redundant.

No bullshit!