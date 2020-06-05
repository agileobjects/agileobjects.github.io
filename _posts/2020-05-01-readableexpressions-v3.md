---
layout: post
title: ReadableExpressions v3 Released
excerpt: The ReadableExpressions Expression debugger visualizers now show colourized, themeable source code, with a variety of translation options.
tags: [Expression Trees, ReadableExpressions, Debugging]
images_dir: '2020-05-01/'
---

ReadableExpressions translates Expression trees to source code as an alternative to Visual Studio's 
Debug View. There's a set of [Debugger Visualizers]({{ site.re_viz }}) in the Visual Studio Marketplace,
and [a NuGet package]({{ site.re_nuget }}) with the extension method which does all the magic.

ReadableExpressions version 3 provides various options to customise translation, and colourizes the 
visualizer source code view, adding light and dark themes.

## Now in Technicolor <sup>&copy;</sup>

For a simple lambda calling a `TryGet`-style method on its parameter and returning the `out` parameter
value, ReadableExpressions v2 displays this:

![v2 translation]({{ site.post_images_dir }}{{ page.images_dir }}v2.gif)

...for the same Expression, v3 displays this:

![v3 translation]({{ site.post_images_dir }}{{ page.images_dir }}v3.gif)

Colourized with Visual Studio 2019's light theme colours!

## Translation options

The options menu let you switch the theme - perhaps you prefer dark? (as I obviously do):

![v3 dark theme]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark.gif#medium-border)

There's also various ways to customise the translation - maybe you'd prefer to declare out parameter 
variable inline:

![v3 out param declared inline]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline.gif#medium-border)

...and perhaps you'd rather use the parameter type name, instead of `var`:

![v3 out param declared with type name]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline-explicit.gif#medium-border)

...or be shown the type of the lambda's `ip` parameter:

![v3 with lambda parameter type name]({{ site.post_images_dir }}{{ page.images_dir }}v3-dark-inline-explicit-lambda-param.gif#medium-border)

## More to come

I'll be adding extra options in the future, but I think these are a good start to make the source 
code view more personalisable and transparent. If there's any other options you'd find useful, 
please do let me know in a comment or in the [GitHub issues]({{ site.re_github }}/issues) :)