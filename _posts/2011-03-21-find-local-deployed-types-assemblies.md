---
layout: post
title: Dynamically accessing deployed Assemblies and Types in C#
excerpt: First post - might as well start with an extension method of mine I've found rather useful recently. It returns a collection of Types from all locally-deployed Assemblies, optionally filtering by Assembly and Type.
tags: [C&#35;, Enterprise Library, Unity]
---

<span class="updated">
This code didn't quite work how I intended, so I've updated it in a [follow up blog](find-local-deployed-types-assemblies-2).
</span>

<span class="first">
So - first post - might as well start with an extension method of mine I've found rather useful 
recently. It returns a collection of types from all locally-deployed assemblies, optionally filtering
by assembly and type. It's an extension method on `Assembly`, so if you wanted to get all the 
available types which implement the `IService` interface, you could call:
</span>

```csharp
IEnumerable<Type> services = Assembly
    .GetExecutingAssembly()
    .GetAvailableTypes(typeFilter: t => 
        (t != typeof(IService)) && 
        typeof(IService).IsAssignableFrom(t));
```

That would dynamically load all the local assemblies, then load each of their types and add any which 
match the given `typeFilter` to the set of types returned.

I've used this method to set up [Enterprise Library Validation](auto-configure-enterprise-library-validation); 
picking out all available `Validator` objects and registering them against the objects they validate, 
as well as setting up authorisation on a Service Layer using Unity Interception - both with no configuration 
files or attributes! I've found it very handy indeed for static scope initialisation tasks like these.

Anyway, here's the code - it's in C#4:

```csharp
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;

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
        // directory; this happens in debugging and deployment 
        // scenarios where each assembly lives in a separate folder. 
        // We need to find the deployment root and hunt down the other 
        // assemblies!

        // Get a reference to another assembly referenced by the 
        // executing assembly which is in the same namespace:
        string assemblyTopLevelNamespace = 
            assembly.FullName.Substring(0, assembly.FullName.IndexOf('.') + 1);

        AssemblyName referencedAssemblyName = assembly
            .GetReferencedAssemblies()
            .FirstOrDefault(an => 
                an.FullName.StartsWith(assemblyTopLevelNamespace));

        if (referencedAssemblyName == null)
        {
            return availableAssemblies;
        }

        Assembly referencedAssembly = 
            Assembly.Load(referencedAssemblyName);
        
        string referencedAssemblyDirectory = 
            Path.GetDirectoryName(referencedAssembly.Location);

        string commonRootDirectory = GetCommonDirectoryPath(
            assemblyDirectory,
            referencedAssemblyDirectory);

        IEnumerable<string> allDeployedAssemblies = 
            GetAssembliesWithinDirectory(commonRootDirectory);

        ForceAssemblyLoadCompletion(allDeployedAssemblies, assemblyFilter);

        return allDeployedAssemblies;
    }

    private static void ForceAssemblyLoadCompletion(
        IEnumerable<string> assemblyPaths,
        Func<Assembly, bool> assemblyFilter)
    {
        // In some debugging scenarios, assemblies are copied locally only 
        // when requested; we can force all the referenced assemblies to be
        // copied locally and therefore available by calling Assembly.GetTypes():
        assemblyPaths.ForEach(p =>
        {
            Assembly assembly = Assembly.LoadFrom(p);

            if ((assemblyFilter == null) || assemblyFilter.Invoke(assembly))
            {
                assembly.GetTypes();
            }
        });
    }

    private static IEnumerable<string> GetAssembliesWithinDirectory(string directory)
    {
        return Directory.EnumerateFiles(directory, "*.dll", SearchOption.AllDirectories);
    }

    private static string GetCommonDirectoryPath(string path1, string path2)
    {
        string[] path1Directories = path1.Split(Path.DirectorySeparatorChar);
        string[] path2Directories = path2.Split(Path.DirectorySeparatorChar);

        for (int i = 0; i < path1Directories.Length; i++)
        {
            if (path2Directories[i] != path1Directories[i])
            {
                StringBuilder rootDirectoryBuilder = new StringBuilder();

                for (int j = 0; j < i; j++)
                {
                    rootDirectoryBuilder
                        .Append(path1Directories[j])
                        .Append(Path.DirectorySeparatorChar);
                }

                return rootDirectoryBuilder.ToString();
            }
        }

        // If we've got here then apparently the two paths 
        // are the same:
        return path1;
    }
}
```