---
layout: post
title: Self-Configuring Enterprise Library Validation
excerpt: A recent project used Enterprise Library Validation to validate domain objects, and needed it configured for a web front end, a WCF front end, and (of course) unit tests. The same configuration in 3 different places didn't strike me as very DRY, so I figured hey - why not have it configure itself? Here's a quick paraphrase of how I did it.
tags: [Enterprise Library, Unity]
---

A recent project used [Enterprise Library Validation](https://msdn.microsoft.com/en-us/library/ff664356%28v=PandP.50%29.aspx) 
to validate domain objects, and needed it configured for a web front end, a WCF front end, and (of 
course) unit tests. The same configuration in 3 different places didn't strike me as very 
[DRY](https://en.wikipedia.org/wiki/DRY), so I figured hey - why not have it configure itself? Here's 
a quick paraphrase of how I did it.

I started with an abstraction of the validation service:

```csharp
public interface IValidationService
{
    bool IsValid<T>(T objectToValidate) 
        where T : class;
}
```

...which I implemented like so:

```csharp
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Reflection;
using Microsoft.Practices.EnterpriseLibrary.Validation;
 
public class SelfConfiguringEnterpriseLibraryValidationService 
    : IValidationService
{
    private static readonly Dictionary<Type, Validator> _validators = 
        GetConfiguredValidators();
 
    public bool IsValid<T>(T objectToValidate) 
        where T : class
    {
        if (!_validators.ContainsKey(typeof(T)))
        {
            return true;
        }
 
        ValidationResults results = 
            _validators[typeof(T)].Validate(objectToValidate);
 
        return results.IsValid;
    }
 
    private static Dictionary<Type, Validator> GetConfiguredValidators()
    {
        /* Further down the page :) */
    }
}
```

...fairly straightforward: a static-scoped `_validators` Dictionary of `Validator` objects keyed 
by the type of object they validate, and an implementation of `IsValid()` which looks up the 
appropriate `Validator`, and uses it to validate the object if it exists.

The nitty gritty of this class is the `GetConfiguredValidators()` method, which puts together 
the Dictionary of `Validator`s. It uses an extension method 
[I've mentioned before](find-local-deployed-types-assemblies-2) which gets all the available 
deployed types, and goes a bit like this:

```csharp
private static Dictionary<Type, Validator> GetConfiguredValidators()
{
    Dictionary<Type, Validator> validators = 
        new Dictionary<Type, Validator>();
 
    // Get all the available deployed Types;
    IEnumerable<Type> availableTypes = Assembly
        .GetExecutingAssembly()
        .GetAvailableTypes(
            a => a.FullName.StartsWith("MyNamespace."), // <- only our assemblies
            t => !(t.IsAbstract || t.IsInterface));     // <- only concrete Types
 
    IEnumerable<Type> validatorTypes = availableTypes
        .Where(t => typeof(Validator).IsAssignableFrom(t))
        .ToArray()
 
    foreach (Type validatorType in validatorTypes)
    {
        Type validatedType = null;
 
        if (validatorType.IsGenericType)
        {
            // This Validator inherits from Validator<T>, so register 
            // it against T:
            validatedType = validatorType.GetGenericArguments().First();
        }
        else
        {
            // This is a non-generic Validator, so I'm going to rely on 
            // a convention; it should be named [ValidatedType]Validator, 
            // so I can get the validated type from the name:
            string validatedTypeName = 
                validatorType.Name.Replace("Validator", null);
            
            validatedType = availableTypes
                .First(t => t.Name == validatedTypeName);
        }
 
        // Create an instance of the Validator; Validators have a constructor 
        // which takes a NameValueCollection, so supply one of those:
        // Instead of Activator.CreateInstance(), you can use this:
        // Validator validator = 
        //    (Validator)validatorType.GetInstance(new NameValueCollection());
        Validator validator = (Validator)Activator
            .CreateInstance(validatorType, new NameValueCollection());
 
        validators.Add(validatedType, validator);
    });
 
    return validators;
}
```

I then used Unity to plug the implementation in behind the interface, and that's it.

There's a few things to note about this implementation:

1. As per the notes, it relies on non-generic `Validator`s following a particular naming convention
2. It assumes each domain object type should always be subject to the same validation; it makes no 
   provision for Validation RuleSets
3. It assumes there's only a single `Validator` type for each validated type

These issues could all be dealt with fairly easily using:

1. Attributes for non-generic `Validator`s to declare what type they validate
2. Attributes for `Validator`s to label themselves as belonging to a particular Validation RuleSet
3. A `List<Validator>` being used as the `_validators` Dictionary value

It works nicely, and I was quite pleased to delete my validation config :)