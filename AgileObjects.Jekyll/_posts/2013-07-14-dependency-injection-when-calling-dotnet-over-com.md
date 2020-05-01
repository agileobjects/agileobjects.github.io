---
layout: post
title: Using Dependency Injection When Calling .NET Over COM
excerpt: I've recently been working with a number of VB6 systems which use C# .NET components via COM, and wanted to keep the same sort of organisational structures and patterns in the C# part of the application as I would if it was a standard MVC app or WCF service - namely, using Dependency Injection to plug the various C# classes together. This is easier said than done with COM, but here's an approach I've used to achieve it.
tags: [C&#35;, Programming Practices, Patterns, Dependency Injection (DI), Unity]
---

COM provides a way for legacy systems to use components written in modern languages and frameworks, and 
allows the steady porting of components away from the legacy system and into something more friendly. 
I've recently been working with a number of VB6 systems which use C# .NET components via COM, and wanted 
to keep the same sort of organisational structures and patterns in the C# part of the application as I 
would if it was a standard MVC app or WCF service - namely, using 
[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) to plug the various C# classes 
together.

This is easier said than done when using COM, because MVC, Web Forms, WCF (etc.) give you a standard 
entry point where you can organise your Dependency Injection and put your objects together, usually using 
an [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) container like 
[Unity](https://github.com/unitycontainer/unity). COM provides no such standard entry point, so you have 
to do a bit more work to leverage Inversion of Control. You need several features for this to work cleanly; 
by way of a simplified example, let's go through them for a .NET encryption component.

We start with a COM-visible [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)-style 
class to provide the entry point into the .NET part of the application. It's this class which VB6 creates 
to access the .NET functionality, and it's here that we use Dependency Injection to plug the .NET components 
together. For our example, let's say we have an `IEncryptor` interface and an `RsaEncryptor` class which 
is going to perform the encryption.

To use DI we need two .NET classes - one which provides the Dependency Injection service, and one which 
registers all the dependencies. Let's start with the service:

```csharp
using System.Linq;
using Microsoft.Practices.Unity;

internal static class InjectionService
{
    private static readonly UnityContainer _container = new UnityContainer();

    internal static void Register<T>(params string[] propertiesToInject)
    {
        var propertyInjections = propertiesToInject
            .Select(propertyName => new InjectionProperty(propertyName))
            .ToArray();

        _container.RegisterType<T>(propertyInjections);
    }

    internal static void Register<TAbstraction, TImplementation>()
        where TImplementation : TAbstraction
    {
        _container.RegisterType<TAbstraction, TImplementation>();
    }

    internal static T BuildUp<T>(T existingInstance)
    {
        return _container.BuildUp(existingInstance);
    }
}
```

This provides a thin, statically-accessible wrapper around a 
[UnityContainer](https://msdn.microsoft.com/en-us/library/dd203101.aspx) which actually does the work - 
we'll see why it has to have static operations in a moment. Note that the first `Register` overload takes 
zero-or-more names of properties which should be injected for the given type.

Next, our class which registers the Service Layer class and the `RsaEncryptor` class as the implementation 
to use for the `IEncryptor` interface:

```csharp
internal static class DependencyInjectionConfig
{
    internal static void Setup()
    {
        // When building up an instance of the EncryptionService, inject a value
        // into its 'Encryptor' property:
        InjectionService.Register<EncryptionService>("Encryptor");

        InjectionService.Register<IEncryptor, Md5Encryptor>();
    }
}
```

Again, pretty straightforward. Finally, our COM-visible Service Layer class:

```csharp
[ComVisible(true)]
public class EncryptionService
{
    static EncryptionService()
    {
        DependencyInjectionConfig.Setup();
    }

    public EncryptionService()
        : this(performBuildUp: true)
    {
    }

    internal EncryptionService(bool performBuildUp)
    {
        if (performBuildUp)
        {
            InjectionService.BuildUp(this);
        }
    }

    public IEncryptor Encryptor
    {
        get;
        set;
    }
}
```

This has a couple of features to note:

1. The static constructor calls the `DependencyInjectionConfig` to get the dependencies registered with 
   the `InjectionService`. The Service Layer's static constructor is as good an entry point as you get 
   when a .NET component is used via COM as it's only called once, the first time the component is created. 
   This is why the injection classes both need to be static.

2. The internal constructor optionally calls `InjectionService.BuildUp()` to populate its `Encryptor` property;
   because the class is necessarily created via COM using its parameterless constructor, you have to use 
   property injection (as opposed to the preferable constructor injection) to create dependencies. The 
   `performBuildUp` parameter services two purposes: to enable you to create an instance of the class 
   _without_ it automatically calling `InjectionService.BuildUp()` - in a unit test, say - and to provide 
   some visibility on the class' public API that it __ call `InjectionService.BuildUp()`, as that call is 
   a [Service Locator](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern)-style dependency 
   which would otherwise be entirely hidden.

You can then use this from VB6 like this:

```visualbasic
Dim encryptionService As EncryptionService
Set encryptionService = New EncryptionService
encryptedString = encryptionService.Encryptor.Encrypt(unencryptedString)
```

Working with COM presents some challenges which you don't have to worry about when working in a pure 
.NET environment, or when your components communicate via WCF or Web API. Using static constructors to 
initialise a system isn't ideal, but I've found the above approach enables me to keep some of the same 
organisation I'd use in a standard .NET application.