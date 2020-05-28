---
layout: post
title: Using an HttpModule to Redirect a Request When an Uploaded File is Too Big
excerpt: Today I wanted to build something into an ASP.NET MVC application to impose a size limit on uploaded files. I wanted to use an HttpModule so I could get at the upload before any Controllers got involved, and redirect the request if the file was too big. I did this without much fuss, but the redirect went to an ASP.NET "Maximum request length exceeded" error page. I just wanted to do a redirect, darnit!
tags: [C&#35;, ASP.NET, ASP.NET MVC, Patterns]
---

<span class="updated">
NB: an improved version of this module is [here](redirect-request-if-file-upload-too-big-httpmodule-2).
</span>

<span class="first">
Today I wanted to build something into an ASP.NET MVC application to impose a size limit on uploaded 
files. I wanted to:
</span>

1. Use an `HttpModule` so I could get at the upload before any Controllers got involved, and
2. Redirect the request if the file was too big

I did this without much fuss, but the redirect ended up at an ASP.NET "Maximum request length exceeded" 
error page. I found 
[this solution](https://stackoverflow.com/questions/2759193/display-custom-error-page-when-file-upload-exceeds-allowed-size-in-asp-net-mvc2/3787284#3787284) 
using custom error pages on Stackoverflow, and 
[this one](https://www.velocityreviews.com/forums/t97027-how-to-handle-maximum-request-length-exceeded-exception.html) 
reading the whole request and then redirecting on VelocityReviews, but I wanted to have the entire 
solution in one class, and I just wanted to do a redirect, darnit.

So I came up with this; it's an `HttpModule` which throws an `InvalidOperationException` with a 
unique error message if the request is too big, then catches that same error, calls `Server.ClearError()`,
and performs the redirect. The original request has `"/FileTooBig"` appended to it so the page knows 
to display a error message about file upload size.

```csharp
using System;
using System.Configuration;
using System.Web;

public class UploadedFileSizeScreeningModule : IHttpModule
{
    private static readonly string _uploadTooBigErrorMessage = 
        Guid.NewGuid().ToString();

    public void Init(HttpApplication application)
    {
        application.BeginRequest += ValidateUploadRequest;
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

        int maxFileSizeInMB;
        if (!TryGetMaxAllowedFileSize(out maxFileSizeInMB))
        {
            return;
        }

        if (!IsValidFileUploadRequest(context))
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

    private static bool IsValidFileUploadRequest(HttpApplication context)
    {
        if (context.Request.HttpMethod.ToUpperInvariant() != "POST")
        {
            return false;
        }

        // Do something more sensible / appropriate here to check 
        // if the request requires upload size validation:
        return context.Request.Path.Contains("FileUploadPathIdentifier");
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

            string newPath = 
                string.Concat(context.Request.Path, "/FileTooBig");

            context.Response.Redirect(newPath, true);
        }
    }
}
```