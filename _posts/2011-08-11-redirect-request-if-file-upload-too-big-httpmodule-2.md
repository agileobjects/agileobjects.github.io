---
layout: post
title: An Improved HttpModule to Redirect Requests When an Uploaded File is Too Big
excerpt: Further to comments on my previous post on this topic, I realised my HttpModule which gives a user a friendly error message if they upload a file which is too big only dealt with half of the problem. The maximum size a request can be is specified in the machine.config and web.config in the maximumRequestLength attribute on the httpRuntime element; if a user uploads a file which is larger than that, the part of the HttpModule which checks the request size is by-passed, and the user gets a not-ver
tags: [C&#35;, ASP.NET, ASP.NET MVC, Patterns]
---

Further to comments on [this post](redirect-request-if-file-upload-too-big-httpmodule), I realised my 
`HttpModule` which gives a user a friendly error message if they upload a file which is too big only
dealt with half of the problem. The maximum size a request can be is specified in the machine.config 
and web.config in the `maximumRequestLength` attribute on the `httpRuntime` element; if a user 
uploads a file which is larger than that, the part of the `HttpModule` which checks the request size 
is by-passed, and the user gets a not-very-friendly 'Maximum Request Length Exceeded' error. I've 
updated the `HttpModule` to cope with this.

The previous module let the page to which the user is redirected know that a file which was too large 
had been uploaded by adding to the page's URL; I've changed this to set a cookie, which is a more 
flexible approach.

Here's the code; if there's an upload error, the page to which the user is redirected will be sent 
a cookie named 'UploadedFileTooBig'. If the file is larger than the `maximumRequestLength` value, 
the `BeginRequest` method is skipped and execution goes straight to the `EndRequest` method. 
`ProcessUploadRequestEnd` therefore double-checks an upload if no error cookie has been set by the 
time it is reached. If a redirect is performed from the `EndRequest` handler, a 'Maximum Request 
Length Exceeded' Exception is thrown on the `context.Response.Redirect` line; the redirect still 
occurs without error though - at least on IIS7.

```csharp
using System;
using System.Configuration;
using System.Linq;
using System.Web;

public class UploadedFileSizeScreeningModule : IHttpModule
{
    private static readonly string _uploadTooBigErrorMessage = 
        Guid.NewGuid().ToString();

    private const string _uploadCookieKey = "UploadedFileTooBig";

    public void Init(HttpApplication application)
    {
        application.BeginRequest += ValidateUploadRequest;
        application.EndRequest += ProcessUploadRequestEnd;
        application.Error += HandleFileUploadError;
    }

    public void Dispose()
    {
    }

    private static void ValidateUploadRequest(
        object source, 
        EventArgs e)
    {
        HttpApplication context = source as HttpApplication;

        if (context == null)
        {
            return;
        }

        if (!IsValidFileUploadRequest(context))
        {
            return;
        }

        EnsureUploadedFileIsSmallEnough(context);
    }

    private static void ProcessUploadRequestEnd(
        object source, 
        EventArgs e)
    {
        HttpApplication context = source as HttpApplication;

        if (context == null)
        {
            return;
        }

        if (!IsValidFileUploadRequest(context))
        {
            return;
        }

        if (IsUploadRequest(context))
        {
            if (!context.Response.Cookies.AllKeys.Contains(_uploadCookieKey))
            {
                EnsureUploadedFileIsSmallEnough(context);
            }
        }
        else
        {
            CleanUpErrorCookie(context);
        }
    }

    private static bool IsValidFileUploadRequest(HttpApplication context)
    {
        if (!IsUploadRequest(context))
        {
            return false;
        }

        // Do something more sensible / appropriate here to check 
        // if the request requires upload size validation:
        return context.Request.Path.Contains("FileUploadPathIdentifier");
    }

    private static bool IsUploadRequest(HttpApplication context)
    {
        return context.Request.HttpMethod.ToUpperInvariant() == "POST";
    }

    private static void EnsureUploadedFileIsSmallEnough(HttpApplication context)
    {
        int maxFileSizeInMB;
        if (!TryGetMaxAllowedFileSize(out maxFileSizeInMB))
        {
            return;
        }

        long contentLength = context.Request.ContentLength;

        if (!IsUploadedFileSmallEnough(contentLength, maxFileSizeInMB))
        {
            throw new InvalidOperationException(_uploadTooBigErrorMessage);
        }
    }

    private static bool TryGetMaxAllowedFileSize(out int maxFileSizeInMB)
    {
        string maxFileSizeSetting = 
            ConfigurationManager.AppSettings["MaxFileUploadSize"];

        if (string.IsNullOrWhiteSpace(maxFileSizeSetting))
        {
            // If the config setting hasn't been specified, 
            // default to 5MB:
            maxFileSizeInMB = 5;
            return false;
        }

        return int.TryParse(maxFileSizeSetting, out maxFileSizeInMB);
    }

    private static bool IsUploadedFileSmallEnough(
        int requestLengthInBytes, 
        int maxFileSizeInMB)
    {
        // Divide by 1024 twice - once to get to KB, once to get to MB:
        int requestLengthInMB = requestLengthInBytes / 1024 / 1024;

        return requestLengthInMB <= maxFileSizeInMB;
    }

    private static void HandleFileUploadError(object sender, EventArgs e)
    {
        HttpApplication context = sender as HttpApplication;

        if (context == null)
        {
            return;
        }

        Exception thrownException = context.Server.GetLastError();

        if (thrownException.Message == _uploadTooBigErrorMessage)
        {
            context.Server.ClearError();
            AddErrorCookie(context);

            context.Response.Redirect(context.Request.Path, true);
        }
    }

    private static void AddErrorCookie(HttpApplication context)
    {
        HttpCookie errorCookie = 
            new HttpCookie(_uploadCookieKey, "UploadedFileTooBig");

        context.Response.SetCookie(errorCookie);
    }

    private static void CleanUpErrorCookie(HttpApplication context)
    {
        if (context.Response.Cookies[_uploadCookieKey] != null)
        {
            context.Response.Cookies[_uploadCookieKey].Expires = 
                DateTime.Now.AddDays(-1);
        }
    }
}
```