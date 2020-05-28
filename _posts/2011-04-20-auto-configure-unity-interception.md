---
layout: post
title: Self-Configuring Unity Interception
excerpt: The application I'm currently working on performs user authorization using authorization objects injected into Service Layer methods using Unity Interface Interception. There's quite a lot of these objects, which means quite a lot of configuration, so I decided I'd make them configure themselves :)
tags: [C&#35;, Enterprise Library, Unity, Programming Practices, Patterns, Dependency Injection (DI), Aspect Oriented Programming (AOP)]
---

The application I'm currently working on performs user authorization using authorization objects injected 
into [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html) methods using Unity Interface 
Interception. For a simplified example, the `CustomerService` Service Layer object implements `ICustomerService`:

```csharp
public interface ICustomerService
{
    void UpdateCustomer(int customerId, string name);
}
```

...and has an authorization object injected into `UpdateCustomer()` method calls which checks that 
the user currently assigned to the thread is allowed to access the `Customer` with the given `customerId`.

As you'd imagine, there's quite a lot of these methods, which means quite a lot of authorization objects, 
and quite a lot of configuration. There's also other objects being injected into other method calls, 
so I decided ([not for the first time](auto-configure-enterprise-library-validation)) - I'll make them 
all configure themselves :)

As each of the authorization objects was already responsible for authorization, I gave the responsibility 
for organizing them to a separate `AutoSetupInterceptionManager` object. I made each of the authorization 
objects (and anything else which is executed via Interception) implement this interface:

```csharp
public interface IAutoSetupInterceptionClient
{
    string TargetTypeAndMemberName { get; }

    void ExecuteBeforeMethodCall(
        string invokedMethodName,
        IMethodInvocation input);

    void ExecuteAfterMethodCall(
        string invokedMethodName,
        IMethodInvocation input,
        IMethodReturn methodReturn);
}
```

...then had the manager find them all (using [this extension method](find-local-deployed-types-assemblies-2)), 
pair them up with the method into which they should be injected, and register itself with Unity as an 
`ICallHandler` for that method. Whenever Unity passes an intercepted method call to the 
`AutoSetupInterceptionManager`, the manager passes it - via the `IAutoSetupInterceptionClient` method 
- to whichever objects are configured for the method.

Hopefully that makes some kind of sense; if so - or if not - here's the `AutoSetupInterceptionManager` 
code. The auto-registration is done in the `SetupAutoRegisteredInterception()` method. The 
`IMethodInvocation.GetMethodName()` method is an extension method which returns the signature of the 
intercepted method in the form `<class name>.<method name>`.

```csharp
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Reflection;
using Microsoft.Practices.Unity;
using Microsoft.Practices.Unity.InterceptionExtension;

internal class AutoSetupInterceptionManager : ICallHandler
{
    private readonly Dictionary<string, List<IAutoSetupInterceptionClient>> 
        _interceptionClients;

    public AutoSetupInterceptionManager(IUnityContainer container)
    {
        _interceptionClients = 
            SetupAutoRegisteredInterception(container);
    }

    public int Order
    {
        get;
        set;
    }

    public IMethodReturn Invoke(
        IMethodInvocation input,
        GetNextHandlerDelegate getNext)
    {
        string methodName = input.GetMethodName();

        bool interceptionClientsExist = 
            _interceptionClients.ContainsKey(methodName);

        if (interceptionClientsExist)
        {
            _interceptionClients[methodName].ForEach(ic => 
                ic.ExecuteBeforeMethodCall(methodName, input));
        }

        IMethodReturn methodReturn = getNext().Invoke(input, getNext);

        if (interceptionClientsExist)
        {
            _interceptionClients[methodName].ForEach(ic => 
                ic.ExecuteAfterMethodCall(methodName, input, methodReturn));
        }

        return methodReturn;
    }

    private Dictionary<string, List<IAutoSetupInterceptionClient>> 
        SetupAutoRegisteredInterception(IUnityContainer container)
    {
        Type interceptionClientType = typeof(IAutoSetupInterceptionClient);

        IEnumerable<Type> allAvailableTypes = Assembly
            .GetExecutingAssembly()
            .GetAvailableTypes();

        Type[] interfaceTypes = allAvailableTypes
            .Where(t => t.IsInterface)
            .ToArray();

        Type[] interceptionClientTypes = allAvailableTypes
            .Where(t => 
                !(t.IsInterface || t.IsAbstract) && 
                interceptionClientType.IsAssignableFrom(t))
            .ToArray();

        var interceptionClients = 
            new Dictionary<string, List<IAutoSetupInterceptionClient>>();

        interceptionClientTypes.ForEach(ict =>
        {
            IAutoSetupInterceptionClient interceptionClient = 
                (IAutoSetupInterceptionClient)Activator.CreateInstance(ict);

            string interceptionInterfaceTypeAndMethodName = 
                "I" + interceptionClient.TargetTypeAndMemberName;

            Type interceptionInterfaceType = interfaceTypes.FirstOrDefault(t => 
                interceptionInterfaceTypeAndMethodName.StartsWith(t.Name));

            string interceptionMethodName = interceptionInterfaceTypeAndMethodName
                .Replace(interceptionInterfaceType.Name, null);
            
            string interceptionTypeName = interceptionClient.TargetTypeAndMemberName
                .Replace(interceptionMethodName, null);

            string methodSignature = 
                interceptionTypeName + "." + interceptionMethodName;

            if (!interceptionClients.ContainsKey(methodSignature))
            {
                interceptionClients.Add(
                    methodSignature,
                    new List<IAutoSetupInterceptionClient>());
            }

            if (!interceptionClients[methodSignature].Contains(interceptionClient))
            {
                container
                    .RegisterType(
                        interceptionInterfaceType,
                        new InterceptionBehavior<PolicyInjectionBehavior>())
                    .Configure<UnityInterception>()
                    .SetInterceptorFor(
                        interceptionInterfaceType,
                        new InterfaceInterceptor())
                    .AddPolicy(interceptionMethodName + "Interception")
                    .AddMatchingRule(new MemberNameMatchingRule(interceptionMethodName))
                    .AddCallHandler(this);
  
                interceptionClients[methodSignature].Add(interceptionClient);
            }
        });

        return interceptionClients;
    }
}
```