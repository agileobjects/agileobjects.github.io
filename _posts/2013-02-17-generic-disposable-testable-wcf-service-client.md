---
layout: post
title: A Generic, Disposable, Unit-Testable, Error-Handling WCF Service Client
excerpt: I recently reused my generic, disposable WCF service client, and made some changes to make it simpler to use and easier to unit test. Here's what I did.
tags: [C&#35;, ASP.NET, ASP.NET MVC, WCF, Programming Practices, Patterns, Dependency Injection (DI), Automated Testing]
---

I recently reused my [generic, disposable WCF service client](generic-disposable-wcf-service-client), 
and made some changes to make it simpler to use and easier to unit test. The original client was used 
like this:

```csharp
using (var wrapper = new ServiceClientWrapper<
    ManagementServiceClient, IManagementService>(config))
{
    wrapper.CreateServiceClient().CallService();
}
```

...where config is a `WebServiceConfig` - a simple Data Bag which contains details of the service 
to call:

```csharp
using System.Security.Cryptography.X509Certificates;

public class WebServiceConfig
{
    public string Binding { get; set; }

    public string Endpoint { get; set; }

    public bool IgnoreSslErrors { get; set; }

    public X509Certificate2 ClientCertificate { get; set; }
}
```

Having worked with the client on previous projects I'd noticed some problems with it; every time you 
use it you have to write a `using` statement and call `CreateServiceClient()`. That's a minor 
inconvenience, but a bigger problem comes with unit testing code that uses it - newing up the 
`ServiceClientWrapper` makes it impossible to [mock](https://en.wikipedia.org/wiki/Mock_object), 
but the class being `IDisposable` means it's intended for one-shot uses and isn't an appropriate 
candidate to be [injected](https://en.wikipedia.org/wiki/Dependency_injection) as a dependency. I 
worked around this by injecting in a `ServiceClientWrapperFactory` class which I _could_ mock, but 
at some point I read [Jimmy Bogard](https://lostechies.com/jimmybogard) advise that your design may 
be flawed if you're making objects which do nothing but create other objects, and while I generally 
have no problem changing a design to make it more testable, I knew this was one of those occasions.

So I had these problems to solve:

1. Stop the user having to write `using` statements
2. Make the client injectable
3. Make the client mockable or stubbable
4. Get rid of the factory class which did nothing but make clients for unit tests

I'd also noticed a lot of boilerplate code to handle exceptions and retry service calls, and I wanted 
to get rid of that, too.

Thanks to these requirements, the class I wrote ended up being quite different to the previous client. 
It's still `IDisposable` (more on why later) but it hides the process of creating and `using` a 
service client inside two `Execute()` methods. The previous client being constructed with a `config` 
limited its use to the service and setup defined therein - the new client is passed a `config` through 
its `Execute()` methods, which means the same instance can be used to call different services with 
different settings.

This is the new class I wrote:

```csharp
using System;
using System.Net;
using System.Net.Security;
using System.ServiceModel;

public class ServiceClientWrapper<TClient, TService> : IDisposable
    where TClient : ClientBase<TService>, TService
    where TService : class
{
    private TClient _serviceClient;

    public void Execute(
        WebServiceConfig config,
        Action<TService> serviceCall,
        Action<CommunicationException> commsExceptionHandler = null,
        int numberOfTimesToRetry = 1)
    {
        Execute<object>(
            config,
            service => { serviceCall.Invoke(service); return null; },
            commsExceptionHandler,
            numberOfTimesToRetry);
    }

    public TResult Execute<TResult>(
        WebServiceConfig config,
        Func<TService, TResult> serviceCall,
        Action<CommunicationException> commsExceptionHandler = null,
        int numberOfTimesToRetry = 1)
    {
        SetupSecurity(config);

        var i = 0;
        CommunicationException thrownException = null;

        while (i < numberOfTimesToRetry)
        {
            DisposeExistingServiceClientIfRequired(); 

            try
            {
                return serviceCall
                    .Invoke(CreateServiceClient(config));
            }
            catch (CommunicationException faultEx)
            {
                thrownException = faultEx;

                if (commsExceptionHandler != null)
                {
                    try
                    {
                        commsExceptionHandler
                            .Invoke(thrownException);
                    }
                    catch (CommunicationException rethrownEx)
                    {
                        thrownException = rethrownEx;
                    }
                }

                ++i;
            }
            finally
            {
                DisposeExistingServiceClientIfRequired();
            }
        }

        throw thrownException;
    }

    private static void SetupSecurity(WebServiceConfig config)
    {
        if (config.IgnoreSslErrors)
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
    }

    protected virtual TService CreateServiceClient(
        WebServiceConfig config)
    {
        // Or you can use:
        // _serviceClient = (TClient)typeof(TClient).GetInstance(
        //     config.Binding,
        //     new EndpointAddress(config.Endpoint));
        _serviceClient = (TClient)Activator.CreateInstance(
            typeof(TClient),
            config.Binding,
            new EndpointAddress(config.Endpoint));

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

At its simplest you use it like this - note that this time it's a member of the class using it - it's 
been injected in through the constructor, for instance:

```csharp
_serviceClientWrapper.Execute(
    config,
    service => service.DoSomething());
```

If you have a service which returns a value, you can call it like this:

```csharp
var response = _serviceClientWrapper.Execute(
    config,
    service => service.GetResponse());
```

If you want to handle `CommunicationException`s yourself, you can pass in a handler:

```csharp
var response = _serviceClientWrapper.Execute(
    config,
    service => service.GetResponseWhichMightError(),
    commsException => SendMeAnEmailAboutThis(commsException));
```

...and if you want to retry a service call when `CommunicationException`s are thrown, you can pass 
in the number of times to retry:

```csharp
var response = _serviceClientWrapper.Execute(
    config,
    service => service.GetUnreliableResponse(),
    commsException => SendMeAnEmailAboutThis(commsException),
    numberOfTimesToRetry: 3);
```

And so to the testability! Moving the WCF client creation code into a dedicated virtual 
`CreateServiceClient` method makes the client wrapper stubbable:

```csharp
using System.ServiceModel;

public class StubServiceClientWrapper<TClient, TService> : 
    ServiceClientWrapper<TClient, TService>
    where TClient : ClientBase<TService>, TService
    where TService : class
{
    private readonly TService _serviceClientToReturn;

    public StubServiceClientWrapper(TService serviceClientToReturn)
    {
        _serviceClientToReturn = serviceClientToReturn;
    }

    protected override TService CreateServiceClient(
        WebServiceConfig config)
    {
        return _serviceClientToReturn;
    }
}
```

...where the stub is created with a TService instance to return from the overridden `CreateServiceClient` 
method. Then - as an example - a Service class like this:

```csharp
public class Service
{
    private readonly WebServiceConfig _config;
    
    private readonly ServiceClientWrapper<
        ManagementServiceClient, IManagementService> 
            _serviceClientWrapper;

    public Service(
        WebServiceConfig config,
        ServiceClientWrapper<
            ManagementServiceClient, IManagementService> 
                serviceClientWrapper)
    {
        _config = config;
        _serviceClientWrapper = serviceClientWrapper;
    }

    public string GetResponse()
    {
        return _serviceClientWrapper.Execute(
            _config,
            serviceClient => serviceClient.GetResponse());
    }
}
```

...can be tested using a combination of the stub and a mock (using [Moq](https://code.google.com/p/moq) 
in this case) like this:

```csharp
var config = new WebServiceConfig
{
    Binding = "MyBinding",
    Endpoint = "http://service.com/Service.svc"
};

var wcfClient = new Mock<IManagementService>();
wcfClient.Setup(wcf => wcf.GetResponse()).Returns("Hello!");

var stubClientWrapper = new StubServiceClientWrapper<
    ManagementServiceClient, IManagementService>(
        wcfClient.Object);

var service = new Service(config, stubClientWrapper);

var serviceResponse = service.GetResponse();

Assert.AreEqual("Hello!", serviceResponse);
```

And there we have it - a unit-testable WCF service client wrapper. Because the stub only overrides the 
`CreateServiceClient` method everything else can be unit tested, including the retry and error-handling 
behaviour.

As mentioned, the new client wrapper is still `IDisposable`, even though you should never end up with 
an undisposed WCF client within it; I chose to leave it as `IDisposable` because classes with disposable 
members [should themselves be disposable](https://msdn.microsoft.com/en-us/ms182172.aspx).