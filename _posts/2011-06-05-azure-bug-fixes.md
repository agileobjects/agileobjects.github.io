---
layout: post
title: Simple Solutions to Horrible Azure Pain - as Usual
excerpt: I recently spent far too long debugging a problem with our Azure application. We have two Azure cloud projects, and at about the same time they both started refusing to start; the web applications they house both worked perfectly when deployed to local IIS. There turned out to be two different problems - both very simple - so I thought I'd share what they turned out to be :)
tags: [Azure]
---

I recently spent far too long debugging a problem with our Azure application. We have two Azure cloud 
projects, and they both started refusing to start at about the same time, with different error messages. 
The web applications they house both worked absolutely fine when deployed to local IIS. There turned 
out to be two different problems - both very simple - so I thought I'd share what they turned out to 
be :)

## Problem 1

One application failed to start in Azure, with the error message "Unable to find the constructor for 
Type `FormattedDatabaseTraceListener`". We'd recently switched from logging to Azure Table Storage 
using a `DiagnosticMonitorTraceListener` to logging to a database using a `FormattedDatabaseTraceListener`.
This had been succesfully tested on one cloud project (an MVC application) but the other (a WCF service) 
refused to start. We're using the Enterprise Library for logging, but commenting out the logging 
configuration didn't make any difference.

I eventually noticed the difference between the MVC app and the WCF service - the MVC app had an Azure 
config transform which added a `FormattedDatabaseTraceListener` to the `system.diagnostics` config 
section; there's no way of specifying constructor arguments for listeners registered in this section 
(unlike in the Enterprise Library configuration), the `FormattedDatabaseTraceListener` doesn't have 
a parameterless constructor, and the exception was indicating this problem. I fixed this by creating 
a subclass of `FormattedDatabaseTraceListener` which had a parameterless constructor and registering 
that instead - presto!

## Problem 2

The MVC app was failing to start, saying that there was no configuration file. Specifically, the Azure 
[`RoleEntryPoint`](https://msdn.microsoft.com/en-us/library/microsoft.windowsazure.serviceruntime.roleentrypoint.aspx) 
wasn't able to use the application's DI system to resolve its dependencies, as there was no configuration.

Our Azure projects are configured to use 
[Full IIS](https://blogs.msdn.com/b/windowsazure/archive/2010/12/02/new-full-iis-capabilities-differences-from-hosted-web-core.aspx) 
mode, which means the applications run in IIS, and the `RoleEntryPoint`s run in 
[Hosted Web Core](https://msdn.microsoft.com/en-us/library/ms693696%28v=vs.90%29.aspx). The application 
uses `web.config`, and the `RoleEntryPoint` uses `WaIISHost.exe.config`. It turned out the build 
action for `WaIISHost.exe.config` was set to 'Never copy' - setting it to 'Copy always' did the trick.

It pretty much always seems to turn out that horrible bugs have simple solutions!