---
layout: post
title: A Generic, Disposable WCF Service Client
excerpt: WCF clients need to be cleaned up properly, but as they're usually auto-generated they don't implement IDisposable. I've been doing a fair bit of WCF work recently, so I wrote a generic WCF client wrapper which effectively gives me a disposable service client.
tags: [WCF]
---

<span class="updated">
I've done better! An improved service client wrapper is described 
[here](generic-disposable-testable-wcf-service-client).
</span>

<span class="first">
WCF clients need to be cleaned up properly, but as they're usually auto-generated they don't implement 
`IDisposable`. I've been doing a fair bit of WCF work recently, so I wrote a generic WCF client wrapper 
which effectively gives me a disposable service client.
</span>

The `ServiceClientWrapper` is constructed using a `WebServiceConfig` instance, which contains a 
`Binding`, an `EndPointAddress`, and whether the client should ignore SSL certificate errors - 
pretty useful during testing! The `Binding` can be created based on configuration data or entirely 
programmatically - that's not the client's concern.

Here's the service client code:

```csharp
using System;
using System.Net;
using System.Net.Security;
using System.ServiceModel;

public class ServiceClientWrapper<TClient, IService> : IDisposable
    where TClient : ClientBase<IService>
    where IService : class
{
    private readonly WebServiceConfig _config;
 
    private TClient _serviceClient;
 
    public ServiceClientWrapper(WebServiceConfig config)
    {
        _config = config;
    }
 
    public TClient CreateServiceClient()
    {
        DisposeExistingServiceClientIfRequired();
 
        if (_config.IgnoreSslErrors)
        {
            ServicePointManager.ServerCertificateValidationCallback =
                (obj, certificate, chain, errors) => true;
        }
        else
        {
            ServicePointManager.ServerCertificateValidationCallback =
                (obj, certificate, chain, errors) => 
                    errors == SslPolicyErrors.None;
        }
 
        // Or you can use:
        // _serviceClient = (TClient)typeof(TClient).GetInstance(
        //     _config.Binding,
        //     _config.Endpoint);
        _serviceClient = (TClient)Activator.CreateInstance(
            typeof(TClient),
            _config.Binding,
            _config.Endpoint);
 
        if (_config.ClientCertificate != null)
        {
            _serviceClient.ClientCredentials.ClientCertificate
                .Certificate = _config.ClientCertificate;
        }
 
        return _serviceClient;
    }
 
    public void Dispose()
    {
        DisposeExistingServiceClientIfRequired();
    }
 
    private void DisposeExistingServiceClientIfRequired()
    {
        if (_serviceClient != null)
        {
            try
            {
                if (_serviceClient.State == CommunicationState.Faulted)
                {
                    _serviceClient.Abort();
                }
                else
                {
                    _serviceClient.Close();
                }
            }
            catch
            {
                _serviceClient.Abort();
            }
 
            _serviceClient = null;
        }
    }
}
```

A client for a particular service can then be created something like this:

```csharp
public class ManagementServiceClientWrapper :
    ServiceClientWrapper<ManagementServiceClient, IManagementService>
{
    public ManagementServiceClientWrapper(WebServiceConfig config)
        : base(config)
    {
    }
}
```

...or with an alias in the using list (if you don't need a reusable class):

```csharp
using ManagementServiceClientWrapper =
    ServiceClientWrapper<ManagementServiceClient, IManagementService>;
```

...where `ManagementServiceClient` is the auto-generated client class, and the `IManagementService` 
is the auto-generated WCF service interface - and used like this:

```csharp
using (var wrapper = new ManagementServiceClientWrapper(config))
{
    wrapper.CreateServiceClient().CallService();
}
```

The underlying WCF client created by the `CreateServiceClient()` call will be disposed after the 
`using()`, and hey presto - a disposable WCF service client.

**Edit**: I've added an example application using the client at 
[https://bitbucket.org/MrSteve/wcfserviceclientexample](https://bitbucket.org/MrSteve/wcfserviceclientexample).