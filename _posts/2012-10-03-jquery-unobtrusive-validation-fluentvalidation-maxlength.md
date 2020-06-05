---
layout: post
title: Unobtrusive Maximum Input Lengths with JQuery and FluentValidation
excerpt: JQuery unobtrusive validation can be used to show an error message when the user inputs too many characters or a numeric value which is too big. On a recent project we wanted to use input's maxlength attribute to prevent a user from entering too many characters rather than cure the problem with an error message - here's how we did it.
tags: [JavaScript, JQuery, FluentValidation]
---

If you use [FluentValidation](https://fluentvalidation.codeplex.com) and set a maximum length for a 
string or a maximum value for a numeric property, JQuery validation is used to show an error message 
when the user inputs too many characters or a numeric value which is too big. On a recent project we 
wanted to use `input`'s maxlength attribute to prevent a user from entering too many characters 
rather than cure the problem with an error message, and I added this JQuery to add maxlength attributes 
based on JQuery validation's `data-` attributes.

```js
$(function () {
    $("input[data-val-range-max],input[data-val-length-max]")
        .each(function (i, e) {
            var input = $(e);
            var maxlength = input.is("[data-val-range-max]")
                ? input.data("valRangeMax").toString().length
                : input.data("valLengthMax");
            input.attr("maxlength", maxlength);
    });
});
```

Presto!