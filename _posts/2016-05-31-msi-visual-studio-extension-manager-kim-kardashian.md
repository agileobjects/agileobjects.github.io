---
layout: post
title: MSIs, Visual Studio Extension Manager and Possible Kim Kardashian
excerpt: I've now reached v1.5.1 of the ReadableExpressions Debugger Visualizers, and solving a recent bug led me on a bit of an adventure. Here's the details, along with a tenuous Kim Kardashian reference.
tags: [C&#35;, ReadableExpressions, Expression Trees]
---

I've now reached v1.5.1 of the ReadableExpressions Debugger Visualizers, and have got quite a 
useful little extension, if I do say so myself. GitHub and OSS have done their thing with issues 
reported by a user, and I'm pretty happy with the progress. I've only really had one tricky bug, 
and solving it led me on a bit of an adventure, so I thought I'd write about it.

The recommended way of installing a Visual Studio extension is with a 
[VSIX](https://blogs.msdn.microsoft.com/quanto/2009/05/26/what-is-a-vsix), but installation and 
uninstallation of visualizers involves copying files to (and deleting file from) Program Files, 
which - because a VSIX provides no opportunity to run code during an uninstall - is something I 
have to use an MSI for. The MSI:

- Writes the visualizer DLLs to the appropriate Visual Studio folders, making them available during 
  debugging

- Writes an [extension.vsixmanifest](https://blogs.msdn.microsoft.com/visualstudio/2010/02/19/how-vsix-extensions-are-discovered-and-loaded-in-vs-2010)
  file to the appropriate Visual Studio folders, telling Visual Studio that the extension is installed

Adding an extension [using an MSI](https://blogs.msdn.microsoft.com/visualstudio/2009/10/26/vsix-and-msi)
means Extension Manager can't perform update installs itself; you get the following message:

![_config.yml](/images/posts/2016-05-31/Messages.png)

...but 'Updates will appear on the Updates tab'; you just have to download and install them 
yourself when notified.

But there was [the problem](https://github.com/agileobjects/ReadableExpressions/issues/4). Updates 
of my extension weren't appearing on the Updates tab. Why not?

After trying various changes to the extension.vsixmanifest and the version number format, I turned 
to [StackOverflow](https://stackoverflow.com/questions/37349459/vs2015-extension-manager-not-reporting-update-for-msi-intalled-extension/37553852)
and [the MSDN forum](https://social.msdn.microsoft.com/Forums/vstudio/en-US/01eea18b-7933-498b-bac3-425a0132bde2/msiinstalled-extension-updates-not-appearing-in-extension-manager?forum=vsx)
for help. Despite offering 50 of my sweet, sweet StackOverflow points I didn't get anything which
led to a fix from either. I got [some help](https://github.com/agileobjects/ReadableExpressions/issues/2#issuecomment-221586470)
on GitHub which pointed me at [the Extensions Service](https://visualstudiogallery.msdn.microsoft.com/Services/VStudio/Extension.svc),
from which a query for the current versions of 
[NuGet Client Tools](https://visualstudiogallery.msdn.microsoft.com/5d345edc-2e2d-4a9c-b73b-d53956dc458d),
the [SQLite Toolbox](https://visualstudiogallery.msdn.microsoft.com/0e313dfd-be80-4afb-b5e9-6e74d369f7a1)
and my extension gave me the following result:

![_config.yml](/images/posts/2016-05-31/Service.png)

...a blank string for my extension's latest version number.

## May as well start again, then

I tried adding the new extension version as a brand new extension, and - to my surprise - saw the 
following field on the form:

![_config.yml](/images/posts/2016-05-31/VSIXID.png)

VSIX ID?! Where had that been all this time? I went back to edit my existing extension's page, and 
sure enough, no VSIX ID box:

![_config.yml](/images/posts/2016-05-31/NoVSIXID.png)

Well, not much I can do about that - I filled in my extension's ID, added the new extension, and - 
hurrah! - the service now returned the version number! I checked the Extension Manager Updates 
tab - waited for it to refresh... and waited... and waited... hmm, it wasn't refreshing. What's 
going on?

## Kardashian?

I went back to my extension's page, and... ummm...

![_config.yml](/images/posts/2016-05-31/ErrorNew.png)

Ut-oh. How about the page for the previous version?

![_config.yml](/images/posts/2016-05-31/ErrorOld.png)

Ut-oh. How about the Visual Studio Gallery website itself?

![_config.yml](/images/posts/2016-05-31/ErrorAll.png)

Oh dear. Ummm... did I just break the internet? Nahh - probably a coincidence. *Probably*.

## The fix is in

Anyway, the gallery website came back online within about ten minutes (sorry about that, if it was 
something I did...) and the update was being reported correctly. Adding a new version wasn't a 
satisfactory solution, though - the previous version had a couple of hundred downloads and a couple 
of reviews which the new version then didn't display. I checked the edit form again, and the VSIX 
ID box was in the DOM, but was not (and as of the time of this writing, is not) displayed on Chrome.
However! It did appear when I deselected then reselected one of the supported Visual Studio versions,
which - after deleting the new version I previously added - finally let me associate the extension's
ID with the extension!

![_config.yml](/images/posts/2016-05-31/VSIXID_1.png)

Which meant, after lots of fun, Visual Studio reported the update:

![_config.yml](/images/posts/2016-05-31/Update.png)

\**Phew*\*

## Bonus MSI Extension Installer Info

You've been so good in reading this far, here's some stuff I discovered while working with MSIs and 
installing extensions using them:

- If you set an MSI to remove previous versions of a product, it uninstalls the versions - *i.e.* 
  they're removed from the [Programs and Features](https://windows.microsoft.com/en-ca/windows/uninstall-change-program)
  list, but it *doesn't* run the previous versions' MSI uninstall code. That doesn't sound right to 
  me either, but that was what I found. [YMMV](https://en.wiktionary.org/wiki/YMMV)

- Listing Visual Studio version numbers in the form `[oldest-newest]` in an extension.vsixmanifest 
  will stop the extension appearing in the Extension Manager. You have to use `[oldest,newest]`

- Having a `Scope="Global"` attribute on your extension.vsixmanifest's 
  [Installation element](https://msdn.microsoft.com/en-us/library/hh696828.aspx) will stop the 
  extension appearing in the Extension Manager. Just don't include it.

So there you go. If you're out of breath after all that, why not have a nice coffee?