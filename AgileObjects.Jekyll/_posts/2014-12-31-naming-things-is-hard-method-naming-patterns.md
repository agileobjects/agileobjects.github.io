---
layout: post
title: Naming Things is Hard&#58; Method-Naming Patterns
excerpt: Some of the method-naming patterns I've come across / developed / adopted.
tags: [Programming Practices, Naming Patterns]
---

Here's a few of the method-naming patterns I've come across / developed / adopted.

## Indicating the Result of a Failure

If this method didn't find any customers, what would you expect it to return?

```csharp
public IEnumerable<Customer> GetCustomers()
```

If you said 'an empty enumerable', we'd expect the same thing - an empty enumerable has become a standard
kind of [NullObject](http://en.wikipedia.org/wiki/Null_Object_pattern) return value for these sorts of cases.

What about this method? If it didn't find a customer, what would you expect it to return?

```csharp
public Customer GetCustomer(int customerId)
```

Hmm. I've not come across a standard return value for these cases, so that's not so simple, is it? Might 
it return null? An empty `Customer`? Might it throw an exception? We'd have to look at the method body or 
run tests to find out.

To clear up this ambiguity I've taken to naming these sorts of methods like this:

```csharp
public Customer GetCustomerOrNull(int customerId)

public Customer GetCustomerOrThrow(int customerId)
```

...appending an indication of what will happen in a failure condition to the end of the method name. In 
the absence of [checked exceptions](https://en.wikipedia.org/wiki/Exception_handling#Checked_exceptions) 
the latter example also declares that it might throw an exception... of some sort.

## Maybe It'll Work, Maybe It Won't

If you've ever had an operation which may or may not succeed and which yields a value if it does, you've 
very likely seen the `Try[Something]` pattern before:

```csharp
Enum.TryParse("Registered", out customerType);

int.TryParse("265", out age);

DateTime.TryParse("2014/12/31", out dateOccurred);
```

I've adopted this naming convention for similar circumstances. For example:

```csharp
User currentUser;

if (TryGetCurrentUserDetails(HttpContext, out currentUser))
{
    // Do something
}

// ...

private static bool TryGetCurrentUserDetails(
    HttpContext currentHttpContext, 
    out User user)
```

This being a common pattern in the base class libraries lends it a familiarity which I think out-weighs 
[concerns over using out parameters](https://msdn.microsoft.com/en-us/library/ms182131.aspx) - recognising 
the pattern in the method name tells you how to use the method and what its true / false return values 
mean.

## Involving the First Parameter

Straight to some examples:

```csharp
SayHelloTo(customer);
SayHelloTo(currentUser);

// ...

public void SayHelloTo(Customer customer)

public void SayHelloTo(User user)
```

The pattern names a method in such a way that a combination of the method name and the first parameter 
passed to the method form a simple statement of what the method does. This works particularly well with 
overloads (as in the example) where the difference between the methods is the parameters. Note the aid 
to readability - I find `SayHelloTo(customer)` reads much easier than `SayHelloToCustomer(customer)`. 
I've seen this pattern used in various places, _e.g._ 
[factory methods](https://en.wikipedia.org/wiki/Factory_method_pattern) like `user = User.For(userData)`, 
and like it a lot.