---
layout: post
title: Dynamically accessing deployed Assemblies and Types in C# - Part 2
excerpt: First post - might as well start with an extension method of mine I've found rather useful recently. It returns a collection of Types from all locally-deployed Assemblies, optionally filtering by Assembly and Type.
tags: [C&#35;]
---

Well, will you look at that - no sooner do I write [my first blog](find-local-deployed-types-assemblies) 
about an extension method I've written for accessing deployed Assemblies and Types, than I discover 
today that it doesn't actually work quite how I intended it. Excellent!

The issue is in scenarios where assemblies are copied into a deployment directory as and when they're 
needed, which I attempted to work around in the original version by calling `GetTypes()` on all the 
assemblies which are found. That gave me the following problem:

1. Assembly A is loaded because it contains types used as the system starts up. Assembly A references 
   assembly B, so that is loaded too.
2. Assembly B uses a type from assembly C, so calling `AssemblyB.GetTypes()` causes assembly C to 
   get loaded. Hurrah!
3. Assembly D contains an implementation of an interface from assembly C, but assembly C only references 
   its interface, so assembly D isn't loaded until that type is injected by the DI system. That happens 
   after my call to `GetAvailableTypes()`, so I don't get to access assembly D. Damn.

So, how do I get around that? Well, it turns out `Assembly.CodeBase` is the `Uri` of the original 
assembly file - the location the assembly is copied _from_ when it's deployed - and at least in the 
environments I'm using (local IIS7 and VS debug on Windows 7, NUnit and Azure / Dev Fabric) I can 
parse the directory path from that property and just load all the Assemblies in that directory. This 
works just fine because that directory necessarily contains everything the deployment needs to run. 
Yay!

So here's the updated code, which it turns out is quite a bit simpler than the original (I never 
liked calling `GetTypes()`, you know):

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

/// <summary>
/// Extra methods to execute via an instance of an Assembly.
/// </summary>
public static class AssemblyExtensions
{
    /// <summary>
    /// Returns all the Type objects with match the given <paramref name="typeFilter"/> 
    /// from the executing assembly and any assemblies in its or lower directories.
    /// </summary>
    /// <param name="assembly">The Assembly on which the method is called.</param>
    /// <param name="assemblyFilter">
    /// The filter which should be satisfied to consider an Assembly for the returned 
    /// set of Types, if applicable.
    /// </param>
    /// <param name="typeFilter">
    /// The filter which should be satisfied to include the Type in the returned 
    /// set of Types, if applicable.
    /// </param>
    /// <returns>Any Types which match the <paramref name="typeFilter"/>.</returns>
    public static IEnumerable<Type> GetAvailableTypes(
        this Assembly assembly,
        Func<Assembly, bool> assemblyFilter = null,
        Func<Type, bool> typeFilter = null)
    {
        string assemblyDirectory = Path.GetDirectoryName(assembly.Location);

        List<Type> matchingTypes = new List<Type>();

        IEnumerable<string> availableAssemblies = GetAvailableAssemblies(
            assembly, 
            assemblyDirectory, 
            assemblyFilter);

        availableAssemblies.ForEach(a =>
        {
            Assembly availableAssembly = Assembly.LoadFrom(a);

            if ((assemblyFilter == null) || assemblyFilter.Invoke(availableAssembly))
            {
                IEnumerable<Type> matchingTypesFromThisAssembly = 
                    availableAssembly.GetTypes();

                if (typeFilter != null)
                {
                    matchingTypesFromThisAssembly = matchingTypesFromThisAssembly
                        .Where(typeFilter)
                        .ToArray();
                }

                matchingTypes.AddRange(matchingTypesFromThisAssembly);
            }
        });

        Type[] distinctMatchingTypes = matchingTypes
            .Distinct()
            .OrderBy(t => t.Name)
            .ToArray();

        return distinctMatchingTypes;
    }

    private static IEnumerable<string> GetAvailableAssemblies(
        Assembly assembly,
        string assemblyDirectory,
        Func<Assembly, bool> assemblyFilter)
    {
        IEnumerable<string> availableAssemblies = 
            GetAssembliesWithinDirectory(assemblyDirectory);

        if (availableAssemblies.Count() > 1)
        {
            return availableAssemblies;
        }

        // The currently-executing assembly is the only one it its
        // directory; this happens in deployment scenarios where 
        // each assembly is compiled into a separate folder at runtime.
        // We therefore go back to the original deployment directory 
        // and load all the assemblies in there:
        Uri assemblyCodeBaseUri = new Uri(assembly.CodeBase);

        string assemblyCodeBaseDirectory = Path
            .GetDirectoryName(assemblyCodeBaseUri.LocalPath);

        return GetAssembliesWithinDirectory(assemblyCodeBaseDirectory);
    }

    private static IEnumerable<string> GetAssembliesWithinDirectory(string directory)
    {
        return Directory.EnumerateFiles(directory, "*.dll", SearchOption.TopDirectoryOnly);
    }
}
```