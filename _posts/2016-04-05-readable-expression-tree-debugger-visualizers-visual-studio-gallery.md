---
layout: post
title: ReadableExpressions Debugger Visualizers now in the Visual Studio Gallery
excerpt: Bowing to vast, popular demand (one comment), I've now put an installer for the ReadableExpressions Debugger Visualizers on the Visual Studio Gallery.
tags: [C&#35;, ReadableExpressions, Expression Trees, Programming Practices]
---

Bowing to vast, popular demand (a comment on the blog), I've now put an installer for the 
ReadableExpressions Debugger Visualizers on the [Visual Studio Gallery]({{ site.re_viz }}).
Installation copies the Visualizers into whichever versions of Visual Studio (v10 to v15) are installed.

My first attempt used a [VSIX](https://blogs.msdn.microsoft.com/quanto/2009/05/26/what-is-a-vsix),
but had the following issues:

- It had to run a console application in an elevated process to be able to copy files into the 
  Program Files directory

- The copying process happened when the extension was [loaded](https://msdn.microsoft.com/en-ca/library/dd293638.aspx?f=255&MSPPError=-2147217396) - 
  each extension you add is loaded at a certain point of the Visual Studio lifecycle - which really 
  isn't a good fit for the 'copy some files to a directory once' story

- I couldn't find a way to have the Visualizer files removed when the extension was removed

...so I switched to using an [MSI](https://blogs.msdn.microsoft.com/visualstudio/2009/10/26/vsix-and-msi). 
This was a perfect fit for the install / uninstall actions, but by default didn't show up in the 
Visual Studio [Extension Manager](https://weblogs.asp.net/scottgu/visual-studio-2010-extension-manager-and-the-new-vs-2010-powercommands-extension).
I found the answer to that [here](https://blogs.msdn.microsoft.com/visualstudio/2009/10/26/vsix-and-msi),
and created an [extension.vsixmanifest](https://msdn.microsoft.com/en-us/library/ee943167.aspx) 
which the installer manually copies / removes from the appropriate place. As an aside, an extension 
won't show up in the Extension Manager if its vsixmanifest file is saved as UTF-8. Why would that 
happen? Who can say. I'm just recording it here for posterity.

So! Get your fresh-baked Expression Debugger Visualizers [here]({{ site.re_viz }}), and if there's 
any problems, please do let me know in the comments or add an issue [on GitHub]({{ site.re_github }}/issues).