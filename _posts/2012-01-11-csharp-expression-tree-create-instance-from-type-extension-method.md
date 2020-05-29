---
layout: post
title: A C# Extension Method using Expression Trees to Create an instance from a Type
excerpt: I recently wrote a Type.GetInstance() extension method, and used the opportunity to play around with Expression Trees, which I'd recently read up on. Here's the set of extension methods I came up with, which allow you to quickly create an instance of a Type from the Type itself.
tags: [C&#35;, Expression Trees, Programming Practices, Performance]
---

<span class="updated">
Edit: I've now written an improved version of this set of extension methods, which can be found 
[here](fast-csharp-expression-tree-create-instance-from-type-extension-method). Consider these 
deprecated!
</span>

<span class="first">
I recently wrote a `Type.GetInstance()` extension method, and used the opportunity to play around 
with Expression Trees, which I'd recently read up on in [C# in Depth](https://csharpindepth.com). 
Here's the set of extension methods I came up with, which allow you to quickly create an instance 
of a Type from the Type itself; like this:
</span>

```csharp
// No constructor arguments:
MyClass myClassInstance = (MyClass)typeof(MyClass)
    .GetInstance();

// One constructor argument:
MyClass myClassInstance = (MyClass)typeof(MyClass)
    .GetInstance(argument1);

// Three constructor arguments:
MyClass myClassInstance = (MyClass)typeof(MyClass)
    .GetInstance(argument1, argument2, argument3);
```

Where would you use this? Well, for example to create an instance of an object from a generic type 
argument; I'm now using it in my [generic WCF client](generic-disposable-testable-wcf-service-client). 
I tend to find myself looking up Types at runtime quite often, and this gives me a neat and fast way 
of creating instances.

## Things to note:

- An Expression Tree is a tree of objects which can be compiled into an executable method.

- The Expression Tree below creates a `Func` which accepts up to three constructor arguments and returns 
  the constructed object. I wanted overloads which took fewer arguments and for them to call the one 
  which took the most, so I added a private `TypeToIgnore` class which is used solely to identify a 
  constructor argument which should be ignored when putting together the set of constructor parameters.

- To make extra extension methods which take more arguments, you'd need to add an extra `object` parameter 
  to the `Func`.

Here's the C# 4 code; I've commented it quite heavily, so hopefully it'll make sense:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
 
public static class TypeExtensions
{
    // This dictionary will hold a cache of object-creation functions, 
    // keyed by the constructor signature
    private static readonly 
        Dictionary<string, Func<object, object, object, object>> 
            _instanceCreationMethods =
                new Dictionary<
                    string, 
                    Func<object, object, object, object>>();
 
    /// <summary>
    /// Returns an instance of the <paramref name="type"/> on which 
    /// the method is invoked.
    /// </summary>
    /// <param name="type">
    /// The type on which the method was invoked.
    /// </param>
    /// <returns>An instance of the <paramref name="type"/>.</returns>
    public static object GetInstance(this Type type)
    {
        return GetInstance<TypeToIgnore>(type, null);
    }
 
    /// <summary>
    /// Returns an instance of the <paramref name="type"/> on which 
    /// the method is invoked.
    /// </summary>
    /// <typeparam name="TArg">
    /// The type of the argument to pass to the constructor.
    /// </typeparam>
    /// <param name="type">
    /// The type on which the method was invoked.
    /// </param>
    /// <param name="argument">
    /// The argument to pass to the constructor.
    /// </param>
    /// <returns>
    /// An instance of the given <paramref name="type"/>.
    /// </returns>
    public static object GetInstance<TArg>(
        this Type type, 
        TArg argument)
    {
        return GetInstance<TArg, TypeToIgnore>(type, argument, null);
    }
 
    /// <summary>
    /// Returns an instance of the <paramref name="type"/> on which 
    /// the method is invoked.
    /// </summary>
    /// <typeparam name="TArg1">
    /// The type of the first argument to pass to the constructor.
    /// </typeparam>
    /// <typeparam name="TArg2">
    /// The type of the second argument to pass to the constructor.
    /// </typeparam>
    /// <param name="type">
    /// The type on which the method was invoked.
    /// </param>
    /// <param name="argument1">
    /// The first argument to pass to the constructor.
    /// </param>
    /// <param name="argument2">
    /// The second argument to pass to the constructor.
    /// </param>
    /// <returns>
    /// An instance of the given <paramref name="type"/>.
    /// </returns>
    public static object GetInstance<TArg1, TArg2>(
        this Type type, 
        TArg1 argument1, 
        TArg2 argument2)
    {
        return GetInstance<TArg1, TArg2, TypeToIgnore>(
            type, argument1, argument2, null);
    }
 
    /// <summary>
    /// Returns an instance of the <paramref name="type"/> on which 
    /// the method is invoked.
    /// </summary>
    /// <typeparam name="TArg1">
    /// The type of the first argument to pass to the constructor.
    /// </typeparam>
    /// <typeparam name="TArg2">
    /// The type of the second argument to pass to the constructor.
    /// </typeparam>
    /// <typeparam name="TArg3">
    /// The type of the third argument to pass to the constructor.
    /// </typeparam>
    /// <param name="type">The type on which the method was invoked.
    /// </param>
    /// <param name="argument1">
    /// The first argument to pass to the constructor.
    /// </param>
    /// <param name="argument2">
    /// The second argument to pass to the constructor.
    /// </param>
    /// <param name="argument3">
    /// The third argument to pass to the constructor.
    /// </param>
    /// <returns>
    /// An instance of the given <paramref name="type"/>.
    /// </returns>
    public static object GetInstance<TArg1, TArg2, TArg3>(
        this Type type,
        TArg1 argument1,
        TArg2 argument2,
        TArg3 argument3)
    {
        string constructorSignatureKey;
 
        var argumentTypes = new[]
        { 
            typeof(TArg1), typeof(TArg2), typeof(TArg3) 
        };
 
        CacheInstanceCreationMethodIfRequired(
            type, 
            argumentTypes, 
            out constructorSignatureKey);
 
        return _instanceCreationMethods[constructorSignatureKey]
            .Invoke(argument1, argument2, argument3);
    }
  
    private static void CacheInstanceCreationMethodIfRequired(
        Type type,
        Type[] argumentTypes,
        out string constructorSignatureKey)
    {
        // Make a constructor signature key unique to the Type and 
        // argument we've been given; ignore any arguments which 
        // are of the 'ignore this' Type:
        Type[] constructorArgumentTypes = argumentTypes
            .Where(t => t != typeof(TypeToIgnore))
            .ToArray();
 
        constructorSignatureKey =
            GetConstructorSignatureKey(type, constructorArgumentTypes);

        // Bail out if we've already cached the instance 
        // creation method:
        if (_instanceCreationMethods
            .ContainsKey(constructorSignatureKey))
        {
            return;
        }
 
        // Get the Constructor which matches the given argument Types:
        var constructor = type.GetConstructor(
            BindingFlags.Instance | BindingFlags.Public,
            null,
            CallingConventions.HasThis,
            constructorArgumentTypes,
            new ParameterModifier[0]);

        // Get a set of Expressions representing the parameters which 
        // will be passed to the Func:
        var lamdaParameterExpressions = 
            GetLambdaParameterExpressions(argumentTypes).ToArray();

        // Get a set of Expressions representing the parameters which 
        // be passed to the constructor:
        var constructorParameterExpressions = 
            GetConstructorParameterExpressions(
                lamdaParameterExpressions,
                constructorArgumentTypes).ToArray();

        // Get an Expression representing the constructor call, 
        // passing in the constructor parameters:
        var constructorCallExpression = Expression
            .New(constructor, constructorParameterExpressions);

        // Compile the Expression into a Func which takes three 
        // arguments and returns the constructed object:
        var constructorCallingLambda = Expression
            .Lambda<Func<object, object, object, object>>(
                constructorCallExpression, 
                lamdaParameterExpressions)
            .Compile();
 
        _instanceCreationMethods
            .Add(constructorSignatureKey, constructorCallingLambda);
    }
 
    private static IEnumerable<ParameterExpression> 
        GetLambdaParameterExpressions(
            Type[] argumentTypes)
    {
        for (int i = 0; i < argumentTypes.Length; i++)
        {
            yield return Expression
                .Parameter(typeof(object), string.Concat("param", i));
        }
    }
 
    private static IEnumerable<UnaryExpression> 
        GetConstructorParameterExpressions(
            ParameterExpression[] lamdaParameterExpressions,
            Type[] constructorArgumentTypes)
    {
        for (int i = 0; i < constructorArgumentTypes.Length; i++)
        {
            // Each parameter passed to the lambda is of type object, 
            // so we need to convert it into the appropriate type for 
            // the constructor:
            yield return Expression.Convert(
                lamdaParameterExpressions[i], 
                constructorArgumentTypes[i]);
        }
    }
 
    private static string GetConstructorSignatureKey(
        Type type, 
        Type[] argumentTypes)
    {
        return string.Concat(
            type.FullName, 
            " (", 
            string.Join(", ", argumentTypes.Select(at => at.FullName)), 
            ")");
    }
  
    // To allow for overloads with differing numbers of arguments, 
    // we flag arguments which should be ignored by using this Type:
    private class TypeToIgnore
    {
    }
}
```