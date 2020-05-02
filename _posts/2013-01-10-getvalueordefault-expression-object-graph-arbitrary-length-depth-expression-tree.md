---
layout: post
title: GetValueOrDefault() For An Expression of Arbitrary Length Using Expression Trees
excerpt: In my most recent project we had to support classes with fairly deep object graphs where any of the nodes could validly be null. We didn't want to have lots of 'if not null' checks everywhere, so I wrote an extension method which takes an expression of any length and returns the expression value or a default value if any of the nodes are null. Here's the extension method code, along with an overview of how it works.
tags: [C&#35;, Expression Trees]
---

In my most recent project we had to support classes with fairly deep object graphs where any of the 
nodes could validly be null. We didn't want to have lots of 'if not null' checks everywhere, so I 
wrote an extension method which takes an expression of any length and returns the expression value 
or a default value if any of the nodes are null. It enabled us to do this - for this example let's 
say we've got a `Person` class which has an `Address` property of type `Address`, which in turn has 
a `Postcode` property of type `Postcode`, which itself has a `Value` property of type `string`:

```csharp
person.GetValueOrDefault(p => p.Address.Postcode.Value);
```

You can also optionally pass in a default value to return, like this:

```csharp
person.GetValueOrDefault(p => p.Address.Postcode.Value, "No postcode");
```

If `person`, `person.Address` or `person.Address.Postcode` are null the default value is returned.
Here's the code for the extension method, followed by an overview of how it works:

```csharp
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Collections.Concurrent;

public static class ObjectExtensions
{
    public static TResponse GetValueOrDefault<T, TResponse>(
        this T root,
        Expression<Func<T, TResponse>> property,
        TResponse defaultValue = default(TResponse))
        where T : class
    {
        if (root == null)
            return defaultValue;
 
        return ValueOrDefaultCache<T, TResponse>.Cache
            .GetOrAdd(
                property.Body.ToString(), 
                key => CreateValueOrDefaultLambda(property))
            .Invoke(root, defaultValue);
    }
 
    private static Func<T, TResponse, TResponse> CreateValueOrDefaultLambda<T, TResponse>(
        Expression<Func<T, TResponse>> property)
        where T : class
    {
        var rootParameter = property.Parameters.First();
        var defaultValueParameter = Expression.Parameter(typeof(TResponse), "default");
 
        var memberExpression = (MemberExpression)property.Body;
        Expression valueOrDefaultExpression = null;
 
        while (memberExpression != null)
        {
            var memberDefaultValue = Expression.Default(memberExpression.Type);
            var memberIsNotDefault = Expression.NotEqual(memberExpression, memberDefaultValue);
 
            valueOrDefaultExpression = Expression.Condition(
                memberIsNotDefault,
                (valueOrDefaultExpression ?? memberExpression),
                defaultValueParameter);
 
            memberExpression = memberExpression.Expression as MemberExpression;
        }
 
        var lambda = Expression.Lambda<Func<T, TResponse, TResponse>>(
            valueOrDefaultExpression, 
            rootParameter,
            defaultValueParameter);
 
        return lambda.Compile();
    }
 
    private static class ValueOrDefaultCache<T, TResponse>
    {
        public static readonly ConcurrentDictionary<string, Func<T, TResponse, TResponse>> 
            Cache = new ConcurrentDictionary<string, Func<T, TResponse, TResponse>>();
    }
}
```

The `ValueOrDefaultCache` class contains a `ConcurrentDictionary` which caches functions which return
a value or default for a given expression against the 'signature' of the expression itself. Because 
`ValueOrDefaultCache` is static and generic, one dictionary and set of functions is cached per root 
and leaf object type, ensuring the functions are unique. To illustrate, the cache entry for our 
`person.GetValueOrDefault()` example above looks like this:

![Cache]({{ site.post_images_dir }}2013-01-10/Cache.png)

The cached method is built using Expression Trees; starting at the leaf the while loop walks back up
to the expression root, creating a nested 
[ternary condition](https://msdn.microsoft.com/en-us/library/ty67wk28(v=vs.80).aspx) for each node. 
The condition's true branch returns the expression value for the leaf node, or the set of ternary 
conditions so far for the other nodes. The false branch returns the default value - either that 
supplied by the caller or the default value of the leaf node's Type. Once a set of ternary operators 
has been built which checks the entire expression, a Lambda Expression is created and compiled into 
the function to be cached and executed.

For example, on the first pass over the loop for our `person.GetValueOrDefault()` example:

![First pass]({{ site.post_images_dir }}2013-01-10/Expression1.png)

...the `valueOrDefaultExpression` goes as far as checking if `p.Address.Postcode.Value` is different
to the default value for `string`; if it is it returns it, otherwise it returns the value of the 
default parameter passed to the function. The second time around the loop looks like this:

![Second pass]({{ site.post_images_dir }}2013-01-10/Expression2.png)

...now the conditional checks if `p.Address.Postcode` is different to the default value for `Postcode`;
if it is it returns the result of the first conditional, otherwise as before it returns the value 
of the default parameter passed to the function.

The Expression continues to built in this way to an arbitrary depth. Eventually the expression from 
our example looks like this:

![Final pass]({{ site.post_images_dir }}2013-01-10/Expression3.png)

And we've got a way of checking each node in an object graph of arbitrary depth to make sure it has 
a value. The expression is compiled and the resulting function cached, so the next time we execute 
`person.GetValueOrDefault(p => p.Address.Postcode.Value)`, it runs at almost native speed.

This version of the function only deals with `MemberAccessExpressions`, which means it doesn't deal 
with `MethodCallExpressions`; calls to instance or extension methods. Maybe I'll update it to do so 
at some point, otherwise I'll leave it as an exercise for the reader :)