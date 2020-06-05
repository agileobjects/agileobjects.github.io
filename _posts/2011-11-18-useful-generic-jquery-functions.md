---
layout: post
title: Handy Generic JQuery Functions
excerpt: I was a bit of a late-comer to the JQuery party, but now I've been using it for a while it's given me a host of options for adding extra flair to the client side of my applications. Here's a few generic JQuery functions I've written which can be used to add some neat little features to a page. Just call any of them from a document ready function.
tags: [JavaScript, JQuery]
---

I was a bit of a late-comer to the JQuery party, but now I've been using it for a while it's given 
me a host of options for adding extra flair to the client side of my applications. Here's a few 
generic JQuery functions I've written which can be used to add some neat little features to a page. 
Just call any of them from a document ready function.

## Apply JQuery Themeroller Styles to all Page Buttons

The [JQuery Themeroller](https://jqueryui.com/themeroller) is a great tool for creating a theme for 
a site based on colours and styles for particular page elements. The [JQuery.UI](https://jqueryui.com) 
library then provides a set of functions which allow you to apply styles to page elements. This 
function applies a JQuery Themeroller style to all the buttons on a page - as well as any elements 
which have a `button` class applied to them - and then makes the mouse pointer turn into a cursor 
when you mouse over them:

```js
function addCursorPointerToButtons() {
    $("button, input[type='submit'], input[type='button'], .button")
        .button().css("cursor", "pointer");
}
```

## Automatically Remove the Default Value from a Select Box

Required drop-down select boxes often have a default option which reads 'Please select...' (or something 
like that), but once someone has selected a value, there's no need to retain that. This function removes 
the default option from any select boxes on the page which have a `data-val-remove-default` attribute 
once one of the non-default options has been chosen:

```js
function removeDefaultSelectOptionOnSelect() {
    $("select[data-val-remove-default='']").change(function () {
        var sel = $(this);
        if (sel.val() != "") { 
            sel.children("option[value='']:first").remove();
        }
    });
}
```

## Automatically add a Required Label and Stars to a Form

It's standard to have a little \* next to required form field elements. This function adds the text 
**\* Required** to the top of the first form on the page, and adds \*s to any element within the form with 
the class `editor-label` and a `data-val-required` attribute:

```js
function addRequiredFieldLabels() {
    var elements = $(".editor-label[data-val-required='']");
    if (!elements.length) { return; }
    
    var requiredString = 
        "<div class='editor-required-key'>* Required</div>";
    var prependString = 
        "<span class='editor-required-label'> * </span>";
    
    var firstFormOnThePage = $("form:first");
 
    if (!firstFormOnThePage.children('div.editor-required-key').length) {
        firstFormOnThePage.prepend(requiredString);
    }
 
    elements.each(function (index, value) {
        var formElement = $(this);
        if (!formElement.children('span.editor-required-label').length) {
            formElement.prepend(prependString);
        }
    });
}
```

I hope those come in handy :)