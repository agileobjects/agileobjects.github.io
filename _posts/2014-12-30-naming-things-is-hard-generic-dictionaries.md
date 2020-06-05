---
layout: post
title: Naming Things is Hard&#58; Dictionaries
excerpt: I've been working with a codebase recently which makes a lot of use of dictionaries - here's a few words about naming them.
tags: [Naming Patterns]
---

Following on from [my previous post](/naming-things-is-hard-right-level-of-abstraction) on naming things, 
here's a few words about naming dictionaries.

I've been working with a codebase recently which makes a lot of use of dictionaries, and often 
find them useful to implement a kind of [strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern) 
where the keys are values you might otherwise have in a switch statement, something like this:

```csharp
public class Foo
{
    private readonly Dictionary<CustomerType, Action<Customer>> _customerActionsByType;

    public Foo()
    {
        _customerActionsByType = new Dictionary<CustomerType, Action<Customer>>
        {
            { CustomerType.Anonymous, DoAnonymousCustomerStuff },
            { CustomerType.Registered, DoRegisteredCustomerStuff }
        };
    }

    public void DoCustomerStuff(Customer customer)
    {
        _customerActionsByType[customer.Type].Invoke(customer);
    }

    private static void DoAnonymousCustomerStuff(Customer customer)
    {
    }

    private static void DoRegisteredCustomerStuff(Customer customer)
    {
    }
}
```

Through working with lots of dictionaries, I've started naming them as in the example above - 
`[value type]By[key type]`. So, for other, possibly-gratuitous examples:

```csharp
sectionsById
eventsByDayOfTheWeek
ordersByCustomer
```

...you get the idea. I like this naming pattern for dictionaries because it includes both the things 
the dictionary structure exposes to the program - the types of the keys and the values - in a way 
which also describes the purpose of the object. It _doesn't_ contain the word 'dictionary' because 
that's an implementation detail.