---
layout: post
title: A Friendlier NUnit PredicateConstraint
excerpt: I've taken to using NUnit's constraint model for my unit tests, as I find it a great way to write readable tests which state exactly what they prove. NUnit has lots of built-in Constraints, but its PredicateConstraint doesn't return very helpful error messages; here's a friendlier version, which does.
tags: [C&#35;, Automated Testing]
---

After recently reading [a book](https://www.amazon.co.uk/Growing-Object-Oriented-Software-Guided-Signature/dp/0321503627) 
on effective unit testing, I've taken to using the 
[NUnit constraint model](https://www.nunit.org/index.php?p=constraintModel&r=2.4) for my unit tests. 
I find it a great way to write readable tests which state exactly what they prove; for example, it's 
pretty clear what this test shows, just from reading the code as a sentence:

```csharp
Assert.That(AnAccount(WithNoOrders), HasAnOutstandingBalanceOf(Zero));
```

In NUnit's `Constraint` model the first argument to `Assert.That` returns an object to test, and 
the second returns an NUnit `Constraint` which determines if the test object is in an expected state. 
In this example the `AnAccount()` method would return an `Account` object, and the 
`HasAnOutstandingBalanceOf()` method would return an NUnit `Constraint` which tests the 
`Account.OutstandingBalance` property against an expected value.

NUnit has simple `Constraint`s for checking if an object under test is null, an empty collection, etc, 
and for more complex tests it has a 
[`PredicateConstraint`](https://code.google.com/p/nunit4netce-and-silverlight/source/browse/trunk/NUnit-2.5.3.9345/nunit.framework/Constraints/PredicateConstraint.cs?spec=svn2&r=2), 
which takes a `Predicate` to run. The `HasAnOutstandingBalanceOf` method in our example could use 
a `PredicateConstraint` to run its test like this:

```csharp
private static Constraint HasAnOutstandingBalanceOf(
    int expectedOutstandingBalance)
{
    return new PredicateConstraint<Account>(
        a => a.OutstandingBalance == expectedOutstandingBalance);
}
```

When the test runs, the test runner will call the supplied `Predicate` to check if the test has 
passed. The thing is, if the test fails, the NUnit output will say something like this:

```csharp
Expected: <a value matching lambda>
Was: 1.00
```

Now, **'&lt;a value matching lambda&gt;'** isn't a very helpful message when diagnosing what the 
test was expecting. To get more helpful messages, I've written a `FriendlyPredicateConstraint`; 
it takes a predicate just like the `PredicateConstraint`, but also takes the expected value and 
a Func to retrieve the actual value, so these can be used in the test results if something goes wrong.

Here's the code:

```csharp
using System;
using NUnit.Framework.Constraints;

public class FriendlyPredicateConstraint<T> : PredicateConstraint<T>
{
    private readonly string _expectedValue;
    private readonly Func<T, object> _actualValueGetter;

    public FriendlyPredicateConstraint(
        Predicate<T> matchingPredicate,
        object expectedValue,
        Func<T, object> actualValueGetter)
        : base(matchingPredicate)
    {
        _expectedValue = expectedValue.ToString();
        _actualValueGetter = actualValueGetter;
    }

    public override bool Matches(object actual)
    {
        // This method is called to find out if the object returned 
        // by the test satisfies the Constraint:
        bool matches = base.Matches(actual);

        if (!matches && (_actualValueGetter != null) && (actual is T))
        {
            // The test failed, so retrieve the actual value from the 
            // object under test. 'this.actual' is a property in the 
            // base 
            // class which supplies the test output with the actual 
            // value:
            this.actual = _actualValueGetter.Invoke((T)actual);
        }

        return matches;
    }

    public override void WriteDescriptionTo(MessageWriter writer)
    {
        // If the test fails then this method is called to print the
        // expected value to the test output:
        writer.WriteExpectedValue(_expectedValue);
    }
}
```

So now HasAnOutstandingBalanceOf can be rewritten like this:

```csharp
private static Constraint HasAnOutstandingBalanceOf(
    int expectedOutstandingBalance)
{
    return new FriendlyPredicateConstraint<Account>(
        a => a.OutstandingBalance == expectedOutstandingBalance,
        // The expected value:
        "OutstandingBalance = " + expectedOutstandingBalance,
        // The actual value:
        a => "OutstandingBalance = " + a.OutstandingBalance);
}
```

...and if the test fails, the output will say this:

```csharp
Expected: OutstandingBalance = 0.00
Was: OutstandingBalance = 1.00
```

Which is much more helpful :)