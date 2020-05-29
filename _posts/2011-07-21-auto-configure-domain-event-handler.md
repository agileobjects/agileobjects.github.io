---
layout: post
title: Self-Configuring Domain Event Handlers
excerpt: I recently implemented Domain Events as a way of organising domain logic in our application; I really liked the way it worked out, so I wanted to share an overview of using Domain Events, as well as a class which automatically looks up all the available IDomainEventHandlers.
tags: [C&#35;, Programming Practices, Patterns, Dependency Injection (DI), Domain Driven Design (DDD)]
---

I recently implemented [Domain Events](https://www.udidahan.com/2009/06/14/domain-events-salvation) as 
a way of organising domain logic in our application. To summarise how they work:

1. Every event in your application is modelled as a class which implements the empty `IDomainEvent` 
   interface
2. `IDomainEvent`s are raised by a domain object calling a static 
   `DomainEvents.Raise<T>(T domainEvent) where T : IDomainEvent` method
3. The `DomainEvents` class passes raised `IDomainEvent` objects to the `Handle<T>(T domainEvent)` 
   method of classes which implement the `IDomainEventHandler<T>` interface for the type of 
   `IDomainEvent` raised

One task more or less left to the reader in the blog above is how the `DomainEvent`s class finds all 
the `IDomainEventHandler`s to which it has to pass `IDomainEvent`s. I (as usual) didn't want to 
bother registering handlers, so I made some changes to have them register themselves.

So as an example, here's an `IDomainEvent` which signals that an `Order` has been placed:

```csharp
public class OrderPlaced : IDomainEvent
{
    private readonly Order _order;

    public OrderPlaced(Order order)
    {
        _order = order;
    }

    public Order PlacedOrder
    {
        get { return _placedOrder; }
    }
}
```

...and an `IDomainEventHandler` which sends a confirmation email when the event is raised:

```csharp
public class NotificationEmailDomainEventHandler : 
    IDomainEventHandler<OrderPlaced>
{
    public void Handle(OrderPlaced domainEvent)
    {
        // send an email using domainEvent.PlacedOrder;
    {
}
```

The static `DomainEvents` class is a [singleton](https://en.wikipedia.org/wiki/Singleton_pattern) 
which uses an `IDomainEventHandlerLibrary` to access the `IDomainEventHandler`s to which it 
should pass raised `IDomainEvent`s. The singleton instance is created by the `InjectionService`; 
a static class which wraps the application's dependency injection container and supplies the 
`IDomainEventHandlerLibrary`. The `IDomainEventHandlerLibrary` interface is as follows:

```csharp
public interface IDomainEventHandlerLibrary
{
    IEnumerable<IDomainEventHandler<T>> GetEventHandlers<T>(
        T domainEvent);
}
```

...and the `DomainEvents` class looks like this:

```csharp
public class DomainEvents
{
    private static readonly DomainEvents _instance = 
        InjectionService.Resolve<DomainEvents>();

    private readonly IDomainEventHandlerLibrary _handlerLibrary;

    public DomainEvents(IDomainEventHandlerLibrary handlerLibrary)
    {
        _handlerLibrary = handlerLibrary;
    }

    public static void Raise<T>(T domainEvent) 
        where T : IDomainEvent
    {
        _instance.InstanceRaise(domainEvent);
    }

    private void InstanceRaise<T>(T domainEvent) 
        where T : IDomainEvent
    {
        IEnumerable<IDomainEventHandler<T>> eventHandlers = 
            _handlerLibrary.GetEventHandlers(domainEvent);

        if (eventHandlers != null)
        {
            foreach (IDomainEventHandler<T> handler in eventHandlers)
            {
                handler.Handle(domainEvent);
            }
        }
    }
}
```

A self-configuring implementation of `IDomainEventHandlerLibrary` then looks like this:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

public class SelfConfiguredDomainEventHandlerLibrary : 
    IDomainEventHandlerLibrary
{
    private static Dictionary<Type, List<IDomainEventHandler>> 
        _eventHandlerCache = CreateEventHandlerCache();

    public IEnumerable<IDomainEventHandler<T>> GetEventHandlers<T>(
        T domainEvent)
        where T : IDomainEvent
    {
        if (!_eventHandlerCache.ContainsKey(typeof(T)))
        {
            return null;
        }

        return _eventHandlerCache[typeof(T)]
            .Cast<IDomainEventHandler<T>>()
            .ToArray();
    }

    private static Dictionary<Type, List<IDomainEventHandler>> 
        CreateEventHandlerCache()
    {
        var eventHandlerCache = 
            new Dictionary<Type, List<IDomainEventHandler>>();

        Assembly
            .GetExecutingAssembly()
            .GetAvailableTypes(typeFilter: t => 
                !t.IsInterface && 
                typeof(IDomainEventHandler).IsAssignableFrom(t))
            .Select(t => 
                (IDomainEventHandler)InjectionService.Resolve(t))
            .ForEach(eh =>
            {
                eh.GetType()
                    .GetInterfaces()
                    .Where(it => 
                        it.IsGenericType &&
                        typeof(IDomainEventHandler)
                            .IsAssignableFrom(it))
                    .ForEach(it =>
                    {
                        Type handledDomainEventType = 
                            it.GetGenericArguments().First();

                        if (!eventHandlerCache
                                .ContainsKey(handledDomainEventType))
                        {
                            eventHandlerCache.Add(
                                handledDomainEventType, 
                                new List<IDomainEventHandler>());
                        }

                        eventHandlerCache[handledDomainEventType]
                            .Add(eh);
                    });
            });

        return eventHandlerCache;
    }
}
```

A couple of things to note:

1. The generic `IDomainEventHandler<T>` interface is derived from an empty, non-generic 
   `IDomainEventHandler` interface in order for this to work
2. The `Assembly.GetAvailableTypes()` method is 
   [an extension method of mine](find-local-deployed-types-assemblies-2)