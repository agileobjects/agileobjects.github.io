---
layout: post
title: A Super-Fast C# Extension Method using Expression Trees to Create an instance from a Type
excerpt: Having written an extension method to create an instance from a Type and been a bit underwhelmed by its performance, I looked into exactly what was happening and have now got it working much, much faster. Here's how.
tags: [Expression Trees, Performance]
images_dir: '2012-02-19/'
---

<span class="updated">
Edit: I've now written an improved version of this set of extension methods, which can be found 
[here](create-instance-of-type-net-core). Consider these deprecated!
</span>

<span class="first">
Having written [an extension method](csharp-expression-tree-create-instance-from-type-extension-method) 
to create an instance from a Type and been 
[a bit underwhelmed](csharp-performance-new-expression-tree-func-activator-createinstance) by its 
performance, I looked into exactly what was happening and have now got it working much, _much_ faster.
</span>

To recap, the problem with the first version of this method is that it cached the `Func`s it created 
with all their argument types as `object`, which meant they had to be cast every time the `Func` was 
invoked. This can be seen in all the **Convert** calls in Visual Studio's Expression Debug View:

![Expression Visualiser]({{ site.post_images_dir }}{{ page.images_dir }}ExpressionDebugView.gif)

It turned out that this way of doing things was 10 times slower than using `Activator.CreateInstance()` 
with no constructor parameters, and took 70% of the time when one or more parameters was used. I was 
sure I could improve on that :)

With the source of the performance problem being the type of the cache forcing casting of the arguments,
what I needed was a type-safe cache. The types in question are the types of the constructor parameters 
used when `Type.GetInstance()` is called, so what I needed was some sort of dynamic cache which would 
retain those types. I read [C# in Depth](https://www.manning.com/skeet2) recently, and picked up a handy 
bit of trivia to do with static, generic types.

When you use a static generic type, the C# compiler creates a singleton instance of that type _for 
each unique combination of type parameters you use_. That means with a static, generic helper class,
the compiler would create a type-safe cache for me, which I can key by the `Type` being constructed. 
So that was what I did:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
 
public static class TypeExtensions
{
    /// <summary>
    /// Returns an instance of the <paramref name="type"/> on which  
    /// the method is invoked.
    /// </summary>
    /// <param name="type"> 
    /// The type on which the method was invoked. 
    /// </param>
    /// <returns> 
    /// An instance of the <paramref name="type"/>. 
    /// </returns>
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
    /// <param name="type"> 
    /// The type on which the method was invoked. 
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
        return InstanceCreationFactory<TArg1, TArg2, TArg3>
            .CreateInstanceOf(type, argument1, argument2, argument3);
    }
 
    // To allow for overloads with differing numbers of arguments, 
    // we flag arguments which should be ignored by using this Type:
    private class TypeToIgnore
    {
    }
 
    private static class InstanceCreationFactory<TArg1, TArg2, TArg3>
    {
        // This dictionary will hold a cache of object-creation 
        // functions, keyed by the Type to create:
        private static readonly 
            Dictionary<Type, Func<TArg1, TArg2, TArg3, object>> 
                _instanceCreationMethods = 
                    new Dictionary<
                        Type, Func<TArg1, TArg2, TArg3, object>>();
 
        public static object CreateInstanceOf(
            Type type, 
            TArg1 arg1, 
            TArg2 arg2, 
            TArg3 arg3)
        {
            CacheInstanceCreationMethodIfRequired(type);
 
            return _instanceCreationMethods[type]
                .Invoke(arg1, arg2, arg3);
        }
 
        private static void CacheInstanceCreationMethodIfRequired(
            Type type)
        {
            // Bail out if we've already cached the instance 
            // creation method:
            if (_instanceCreationMethods.ContainsKey(type))
            {
                return;
            }
 
            var argumentTypes = new[] 
            {
                typeof(TArg1), typeof(TArg2), typeof(TArg3) 
            };
 
            // Get a collection of the constructor argument Types 
            // we've been given; ignore any which are of the
            // 'ignore this' Type:
            Type[] constructorArgumentTypes = argumentTypes
                .Where(t => t != typeof(TypeToIgnore))
                .ToArray();
 
            // Get the Constructor which matches the given argument 
            // Types:
            var constructor = type.GetConstructor(
                BindingFlags.Instance | BindingFlags.Public,
                null,
                CallingConventions.HasThis,
                constructorArgumentTypes,
                new ParameterModifier[0]);
 
            // Get a set of Expressions representing the parameters 
            // which will be passed to the Func:
            var lamdaParameterExpressions = new[]
            {
                Expression.Parameter(typeof(TArg1), "param1"),
                Expression.Parameter(typeof(TArg2), "param2"),
                Expression.Parameter(typeof(TArg3), "param3")
            };
 
            // Get a set of Expressions representing the parameters 
            // which will be passed to the constructor:
            var constructorParameterExpressions = 
                lamdaParameterExpressions
                    .Take(constructorArgumentTypes.Length)
                    .ToArray();

            // Get an Expression representing the constructor call, 
            // passing in the constructor parameters:
            var constructorCallExpression = Expression
                .New(constructor, constructorParameterExpressions);
 
            // Compile the Expression into a Func which takes three 
            // arguments and returns the constructed object:
            var constructorCallingLambda = Expression
                .Lambda<Func<TArg1, TArg2, TArg3, object>>(
                    constructorCallExpression, 
                    lamdaParameterExpressions)
                .Compile();
 
            _instanceCreationMethods[type] = constructorCallingLambda;
        }
    }
}
```

The `Func`s created by this version of the method now look like this in the Expression Debug View:

![Expression Visualiser]({{ site.post_images_dir }}{{ page.images_dir }}ExpressionDebugView_2.gif)

That's more like it - no casting! So how does it perform compared to the previous set of methods? 
Well, here's the output of
[the same performance measurement](csharp-performance-new-expression-tree-func-activator-createinstance) 
I ran before; the third column shows the total number of ticks taken to create 100,000 objects, the 
fourth the number of ticks taken per object:

![Updated GetInstance Performance]({{ site.post_images_dir }}{{ page.images_dir }}GetInstancePerformance_2.gif)

To sum up the improvement:

- An instance is now created in 5 ticks - between 10% and 7% of the time taken by 
  `Activator.CreateInstance()`
- Because the arguments aren't cast, performance doesn't degrade when constuctors are used with extra 
  parameters

That's more like it! I was especially pleased to be able to apply a bit of trivia I read from a C# 
book to a problem like this and see a genuine improvement. The more I use and get used to Expression 
Trees, the more I like them and find uses for them :)