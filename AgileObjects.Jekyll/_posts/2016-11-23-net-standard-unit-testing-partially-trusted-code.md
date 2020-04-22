---
layout: post
title: .NET Standard and Testing Partially Trusted Code
excerpt: Because libraries written for .NET Standard can run on multiple platforms - with more to come in the future - it's worth considering how or if they run in partially trusted environments. Here's some pointers on how.
tags: [C&#35;, .NET Core, AgileMapper, ReadableExpressions, Programming Practices]
images_dir: '2016-11-23/'
---

Because libraries written for 
[.NET Standard](https://blogs.msdn.microsoft.com/dotnet/2016/09/26/introducing-net-standard) can run 
on multiple platforms - with more to come in the future - it's worth considering how or if they run
in [partially trusted](https://stackoverflow.com/questions/376049/what-is-a-partially-trusted-assembly-application-code-etc-in-net)
environments. Having implemented support in both 
[ReadableExpressions](https://www.nuget.org/packages/AgileObjects.ReadableExpressions) and 
[AgileMapper](https://github.com/agileobjects/AgileMapper), here's some pointers on how.

## What is Partial Trust?

Managed .NET code runs with a set of permissions, used to determine the actions it can perform. If 
there are no restrictions, the code runs in Full Trust; if there are restrictions, it's Partial 
Trust.

For example, the following class uses reflection to access the underlying `_items` array in a 
`List<T>`:

```csharp
public static class ListUnwrapper<T>
{
    public static T[] GetItems(List<T> list)
    {
        var underlyingArray = typeof(List<T>)
            .GetField(
                "_items",
                BindingFlags.NonPublic | BindingFlags.Instance)
            .GetValue(list);

        return (T[])underlyingArray;
    }
}
```

Accessing the value of this private field requires the 
[`ReflectionPermission`](https://msdn.microsoft.com/en-us/library/system.security.permissions.reflectionpermission%28v=vs.110%29.aspx),
so when the above code is executed, the environment in which it is executing must be granted that 
permission. Without it, a [`MemberAccessException`](https://msdn.microsoft.com/en-us/library/system.memberaccessexception(v=vs.110).aspx)
is thrown.

## Testing in Partial Trust

There's a few steps to testing code in a Partial Trust environment:

#### Enable Partially-Trusted Callers

Add the assembly-level [`AllowPartiallyTrustedCallersAttribute`](https://msdn.microsoft.com/en-us/library/system.security.allowpartiallytrustedcallersattribute(v=vs.110).aspx)
to the AssemblyInfo.cs of the assembly under test - this declares that the assembly can be used from 
Partial Trust environments:

```csharp
[assembly: AllowPartiallyTrustedCallers]
```

#### Write a Test Helper

Tests can be executed in partial trust by setting up a partially-trusted 
[`AppDomain`](https://msdn.microsoft.com/en-us/library/2bh4z9hs(v=vs.110).aspx), having that 
`AppDomain` create an instance of a class containing your test methods (your test helper), and 
executing those methods via a remote proxy from a Full Trust test class.

For example, a basic test helper for the `ListUnwrapper` would look like this - it derives from 
[`MarshalByRefObject`](https://msdn.microsoft.com/en-us/library/system.marshalbyrefobject%28v=vs.110%29.aspx)
to enable remoting from the Full Trust domain into the Partially-Trusted one:

```csharp
public class ListUnwrapperTestHelper : MarshalByRefObject
{
    public void TestGetItems()
    {
        var list = new List<int> { 1, 2, 3 };
        var unwrapped = ListUnwrapper<int>.GetItems(list);

        Assert.True(list.SequenceEqual(new[] { 1, 2, 3 }));
    }
}
```

#### Write a Partial Trust Helper Method

Your full-trust test class needs a helper method with which to create a Partially-Trusted domain and 
execute the test helper test methods. Something like this:

```csharp
public static class PartialTrustHelper<THelper>
{
    public static void Execute(Action<THelper> testAction)
    {
        // Just a wrapper method for void tests:
        Execute(helper =>
        {

            testAction.Invoke(helper);
            return default(object);
        });
    }

    public static TResult Execute<TResult>(Func<THelper, TResult> test)
    {
        AppDomain partialTrustDomain = null;

        try
        {
            // Use the untrusted Internet Zone:
            var evidence = new Evidence();
            evidence.AddHostEvidence(new Zone(SecurityZone.Internet));

            // Setup a permission set from the same untrusted Zone:
            var permissions = new NamedPermissionSet(
                "PartialTrust",
                SecurityManager.GetStandardSandbox(evidence));

            // Setup the new AppDomain with the same root directory
            // as the current one:
            var domainSetup = new AppDomainSetup { ApplicationBase = "." };

            // Create a partially-trusted domain:
            partialTrustDomain = AppDomain.CreateDomain(
                "PartialTrust",
                evidence,
                domainSetup,
                permissions);

            // Create a remoting proxy:
            var helper = partialTrustDomain.CreateInstanceAndUnwrap(
                typeof(THelper).Assembly.FullName,
                typeof(THelper).FullName);

            return test.Invoke((THelper)helper);
        }
        finally
        {
            if (partialTrustDomain != null)
            {
                // Be sure to clean up the newly-created domain:
                AppDomain.Unload(partialTrustDomain);
            }
        }
    }
}
```

#### Write Tests

Putting the above pieces together allows you to write tests which execute the test helper's methods:

```csharp
public class WhenUnwrappingLists
{
    [Fact]
    public void ShouldUnwrap()
    {
        PartialTrustHelper<ListUnwrapperTestHelper>
            .Execute(helper => helper.TestGetItems());
    }
}
```

...then as the test helper's method executes, you can see that the current `AppDomain` is only 
partially-trusted:

![Untrusted AppDomain]({{ site.post_images_dir }}{{ page.images_dir }}UntrustedAppDomain.png)


## From Red to Green

So, one problem - the test we've written fails, because as mentioned, Partially-Trusted code can't
use reflection to access the values of private fields:

![Exception]({{ site.post_images_dir }}{{ page.images_dir }}Exception.png)

To fix this, we're going to need to provide a work-around.

#### Identifying Partial Trust

The first thing we need to do is figure out if we're running in a Partial Trust environment. The 
most reliable way of doing that is to try to perform the restricted operation we're interested in, 
and catch the exception:

```csharp
public static class TrustSettings
{
    public static readonly bool HasReflectionPermission;

    static TrustSettings()
    {
        try
        {
            // GetNonPublicStaticMethod is a helper polyfill from
            // my NetStandardPolyfills library:
            typeof(TrustTester)
                .GetNonPublicStaticMethod("IsPartialTrust")
                .Invoke(null, null);

            HasReflectionPermission = true;
        }
        catch
        {
            // Ignore
        }
    }
}

internal class TrustTester
{
    private static void IsPartialTrust() { }
}
```

Note that in order for an exception to be thrown, the operation we execute must be inaccessible in 
the current context, so the private method we try to invoke is on a *separate* class.

#### The Work-Around

Now we can check if we have the `ReflectionPermission`, we can update `ListUnwrapper` to provide 
an alternative implementation:

```csharp
public static class ListUnwrapper<T>
{
    public static T[] GetItems(List<T> list)
    {
        if (!TrustSettings.HasReflectionPermission)
        {
            // Running in partial trust:
            return list.ToArray();
        }
            
        var underlyingArray = typeof(List<T>)
            .GetField(
                "_items",
                BindingFlags.NonPublic | BindingFlags.Instance)
            .GetValue(list);

        return (T[])underlyingArray;
    }
}
```

The two paths here aren't equivalent - `ToArray()` returns an array containing only the list elements,
whereas a `List`'s underlying array can have empty elements on the end - but you get the point for 
the example.

Our test now passes, and we can write other tests to cover the Full Trust scenario :)