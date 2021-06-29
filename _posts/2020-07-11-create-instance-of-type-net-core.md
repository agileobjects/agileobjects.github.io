---
layout: post
title: Creating an Instance of a Type, 8 Years Later
excerpt: I recently had an enquiry about code in a post from 2012, and thought I'd revisit it. It's better now.
tags: [Expression Trees, Performance]
images_dir: '2020-07-11/'
---

Back in 2012, I [wrote about](fast-csharp-expression-tree-create-instance-from-type-extension-method) 
using Expression Trees to create a Func which creates an instance of a type at runtime. Having recently 
had an enquiry regarding that code, I thought I'd revisit it to see if I can do better now.

<span class="updated">
_tl;dr_: [yes, I can](#performance).
</span>

## 2012

Back in the day, I wrote this (for a more complete description, see 
[the blog]((https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2012.cs))):


```csharp
// To allow for overloads with differing numbers of 
// arguments, flag arguments to ignore using this type:
private class TypeToIgnore
{
}

public static object GetInstance(this Type type)
{
    return GetInstance<TypeToIgnore>(type, null);
}

public static object GetInstance<TArg>(
    this Type type,
    TArg argument)
{
    return GetInstance<TArg, TypeToIgnore>(type, argument, null);
}

public static object GetInstance<TArg1, TArg2>(
    this Type type,
    TArg1 argument1,
    TArg2 argument2)
{
    return GetInstance<TArg1, TArg2, TypeToIgnore>(
        type, argument1, argument2, null);
}

public static object GetInstance<TArg1, TArg2, TArg3>(
    this Type type,
    TArg1 argument1,
    TArg2 argument2,
    TArg3 argument3)
{
    return InstanceCreationFactory<TArg1, TArg2, TArg3>
        .CreateInstanceOf(type, argument1, argument2, argument3);
}

private static class InstanceCreationFactory<TArg1, TArg2, TArg3>
{
    // A dictionary of object-creation Funcs, keyed by the created type:
    private static readonly Dictionary<Type, Func<TArg1, TArg2, TArg3, object>>
        _instanceCreationMethods = 
            new Dictionary<Type, Func<TArg1, TArg2, TArg3, object>>();

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

        // A collection of the constructor argument Types we've 
        // been given; ignore any of the 'ignore this' Type:
        Type[] constructorArgumentTypes = argumentTypes
            .Where(t => t != typeof(TypeToIgnore))
            .ToArray();

        // The constructor which matches the given argument types:
        var constructor = type.GetConstructor(
            BindingFlags.Instance | BindingFlags.Public,
            null,
            CallingConventions.HasThis,
            constructorArgumentTypes,
            new ParameterModifier[0]);

        // A set of Expressions representing the parameters to 
        // pass to the Func:
        var lamdaParameterExpressions = new[]
        {
            Expression.Parameter(typeof(TArg1), "param1"),
            Expression.Parameter(typeof(TArg2), "param2"),
            Expression.Parameter(typeof(TArg3), "param3")
        };

        // A set of Expressions representing the parameters to 
        // pass to the constructor:
        var constructorParameterExpressions =
            lamdaParameterExpressions
                .Take(constructorArgumentTypes.Length)
                .ToArray();

        // An Expression representing the constructor call, 
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

        // Store the compiled Func in the cache Dictionary:
        _instanceCreationMethods[type] = constructorCallingLambda;
    }
```

#### Performance Notes

- `CreateInstanceOf` calls `CacheInstanceCreationMethodIfRequired` to ensure the required 
   Func exists, then retrieves that Func from the `Dictionary`. This is two lookups for every call, 
   which is one more than necessary. I don't think I knew about
   [`Dictionary.TryGetValue`](https://docs.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2.trygetvalue?view=netframework-2.0)
   back then.

- `CacheInstanceCreationMethodIfRequired` creates three-element `argumentTypes` and 
   `lamdaParameterExpressions` arrays, then uses Linq to create new arrays with only the required
   elements. That's just plain inefficient.

#### Code Notes

- The cache `Dictionary` is not thread-safe - all threads would create the same Func, and assigning by
index instead of calling `Add()` avoids 
[item with the same key has already been added](https://stackoverflow.com/questions/26516825/argument-exception-item-with-same-key-has-already-been-added/26517435), 
but I'm not convinced `Dictionary` itself couldn't get into an internal mess.

Still, it was faster than [`Activator.CreateInstance`](https://docs.microsoft.com/en-us/dotnet/api/system.activator.createinstance),
so that's good... right...? Well...

### Design-time vs Runtime

In my original blog, I compared these methods against `Activator.CreateInstance`, but that's not 
really a fair comparison. `Activator` can't get the constructor argument types from generic method 
arguments - it takes an `object` array, and has to get them from its elements. In other words, it 
gets them at runtime, where my methods are given them at 
[design-time](https://stackoverflow.com/questions/2621976/run-time-vs-design-time).

There's a couple of problems with this:

- It's not an apples-to-apples comparison

- If you need to create an instance of a `Type` object at _runtime_, you might not have its constructor 
  argument types at _design_-time

So let's start over.

## 2020

I've rewritten the 
[design-time version](https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020DesignTimeArgs.cs), 
and added a [runtime version](https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020RuntimeArgs.cs).

### Design-time

Here's the two-argument version of my updated Design-time methods:

```csharp
public static object GetInstance<TArg1, TArg2>(
    this Type type,
    TArg1 argument1,
    TArg2 argument2)
{
    return InstanceFactoryCache<TArg1, TArg2>.GetFactoryFor(type)
        .Invoke(argument1, argument2);
}

private static class InstanceFactoryCache<TArg1, TArg2>
{
    // A dictionary of object-creation Funcs, keyed by the created type:
    private static readonly ConcurrentDictionary<Type, Func<TArg1, TArg2, object>> 
        _factoriesByType =
            new ConcurrentDictionary<Type, Func<TArg1, TArg2, object>>();

    public static Func<TArg1, TArg2, object> GetFactoryFor(Type type)
    {
        return _factoriesByType.GetOrAdd(type, t =>
        {
            // The argument types:
            var arg1Type = typeof(TArg1);
            var arg2Type = typeof(TArg2);

            // The matching constructor:
            var ctor = t.GetConstructor(new[] { arg1Type, arg2Type });
                    
            // A set of Expressions representing the parameters to 
            // pass to the Func and constructor:
            var argument1 = Expression.Parameter(arg1Type, "param1");
            var argument2 = Expression.Parameter(arg2Type, "param2");

            // An Expression representing the constructor call, 
            // passing in the constructor parameters:
            var instanceCreation = Expression
                .New(ctor, argument1, argument2);

            // Compile the Expression into a Func which takes two 
            // arguments and returns the constructed object:
            var instanceCreationLambda = Expression
                .Lambda<Func<TArg1, TArg2, object>>(
                    instanceCreation, argument1, argument2);

            return instanceCreationLambda.Compile();
        });
    }
}
```

To note:

- Instead of using `TypeToIgnore`, each method (parameterless, 1-parameter, 2-parameters, etc) now
  has its own cache. This leads to some code duplication, but the focus here is on _performance_, so 
  [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) is less important than not creating 
  objects unnecessarily.

- I'm now using a [`ConcurrentDictionary`](https://docs.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2)
  for thread-safety, with [`GetOrAdd()`](https://docs.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2.getoradd)
  ensuring a single lookup is performed.

### Runtime

The [runtime-arguments code](https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020RuntimeArgs.cs) 
stores Funcs in a `ConcurrentDictionary`, keyed by a custom key class (abbreviated code shown):

```csharp
private class TypeFactoryKey
{
    private readonly int _hashCode;

    public TypeFactoryKey(Type type, object[] arguments)
    {
        Type = type;
        _hashCode = type.GetHashCode();

        var argumentCount = arguments.Length;

        unchecked
        {
            switch (argumentCount)
            {
                case 0:
                    ArgumentTypes = Type.EmptyTypes;
                    return;

                case 1:
                    {
                        var argument = arguments[0];
                        var argumentType = argument.GetType();
                        ArgumentTypes = new[] { argumentType };
                        _hashCode = GetHashCodeValue(argumentType);
                        return;
                    }

                default:
                    ArgumentTypes = new Type[argumentCount];

                    for (var i = 0; i < argumentCount; ++i)
                    {
                        var argument = arguments[i];
                        var argumentType = argument.GetType();
                        ArgumentTypes[i] = argumentType;
                        _hashCode = GetHashCodeValue(argumentType);
                    }

                    return;
            }
        }
    }

    private int GetHashCodeValue(Type argumentType)
        => (_hashCode * 397) ^ argumentType.GetHashCode();

    public Type Type { get; }

    public Type[] ArgumentTypes { get; }

    public override bool Equals(object obj)
        => ((TypeFactoryKey)obj)._hashCode == _hashCode;

    public override int GetHashCode() => _hashCode;
}
```

To note:

- The key uses ReSharper's ['397' method](https://stackoverflow.com/questions/102742/why-is-397-used-for-resharper-gethashcode-override) 
  to generate a [hash code](https://docs.microsoft.com/en-us/dotnet/api/system.object.gethashcode) for 
  itself by combining the hash codes of the type to create, and any argument types. Through overriding 
  `Equals` and `GetHashCode`, the `ConcurrentDictionary` uses this value to look up the appropriate 
  Func. The parameterless and single-argument cases are optimised - the arguments array is iterated 
  for other cases.

- The key stores all the information the Expression Tree code needs to create the Func - this avoids
  creating a [closure](https://www.simplethread.com/c-closures-explained) to call `GetOrAdd`.

- The [Expression Tree Func-creation](https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020RuntimeArgs.cs#L27)
  is similar to the other examples.

- Null arguments [are handled](https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType.Tests/InstanceFromTypeCreationTests.cs#L68),
  but edge-cases exist where passing a null argument means the code won't be able to find a constructor
  to call; the same is true for `Activator`. So try not to do that.

## Performance

Ok, here's what we care about - how do the different methods perform? Here's some 
[Benchmark.NET](https://benchmarkdotnet.org) results, grouped by design-time vs runtime, and parameter
count:

![Benchmark.NET Results]({{ site.post_images_dir }}{{ page.images_dir }}Results.png)

To note:

1. My 2020 design-time code is between **1.5** and **2.5** times **faster** than my 2012 code. Single
   cache lookups and strategic code duplication FTW.

2. My 2020 runtime code is between **6.7** and **6.9** times **faster** than `Activator.CreateInstance` 
   and allocates way less memory, except for the parameterless case. `Activator.CreateInstance` is 
   optimised for parameterless, but my method is only **1.3** times **slower** for parameterless 
   constructors. I could always just delegate the parameterless case to `Activator`.

So there we go - fast object creation from a type with either design-time or runtime-typed arguments. 
It's been interesting to reimplement something I wrote 8 years ago, and see how my coding has changed
in that time.

## Links

- 2020 [Design-time arguments]((https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020DesignTimeArgs.cs)) code
- 2020 [Runtime arguments]((https://github.com/agileobjects/eg-create-instance-from-type/blob/master/CreateInstanceFromType/CreateInstanceFromType2020RuntimeArgs.cs)) code
- Sample code repo [on GitHub](https://github.com/agileobjects/eg-create-instance-from-type)