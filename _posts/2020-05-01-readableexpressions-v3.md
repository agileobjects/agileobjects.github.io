---
layout: post
title: ReadableExpressions v3 Released
excerpt: The ReadableExpressions Expression debugger visualizers now show colourized, themeable source code, with a variety of translation options.
tags: [C&#35;, Expression Trees, ReadableExpressions]
images_dir: '2020-05-01/'
---

ReadableExpressions translates Expression trees to source code as an alternative to Visual Studio's 
Debug View. There's a set of [Debugger Visualizers]({{ site.re_viz }}) in the Visual Studio Marketplace,
and [a NuGet package]({{ site.re_nuget }}) with the extension method which does all the magic.

ReadableExpressions version 3 provides various options to customise translation, and colourizes the 
visualizer source code view, adding light and dark themes.

## An Example

ReadableExpressions v2 displays the following:

![v2 translation]({{ site.post_images_dir }}{{ page.images_dir }}v2.gif)

...for the same Expression, v3 displays the following:

![v3 translation]({{ site.post_images_dir }}{{ page.images_dir }}v3.gif)

## Translation options

The options menu provides various ways to customise the translation, or switch the theme. Perhaps
you prefer dark? (as I clearly do):

![v3 dark theme]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark.gif#light-border)

...and perhaps you prefer to declare out parameter variables inline?

![v3 out param declared inline]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline.gif#light-border)

Maybe you'd rather use the type name for the parameter, instead of `var`:

![v3 out param declared with type name]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline-explicit.gif#light-border)

...and what type is the lambda's `ip` parameter?

![v3 with lambda parameter type name]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline-explicit-lambda-param.gif#light-border)

## Anything else?

I'll be adding extra options in the future, but I think these are a good start to make the source 
code view more personalisable and transparent. If there's any other options you'd find useful, 
please do let me know in a comment or in the [GitHub issues]({{ site.re_github }}/issues) :)