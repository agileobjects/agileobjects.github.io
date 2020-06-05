---
layout: post
title: How to Moq
excerpt: Moq provides various ways of setting up and verifying behaviour, and I've recently seen some confusion over how. So here's some examples and pointers.
tags: [Moq, Automated Testing]
---

[Moq](https://github.com/moq/moq4) provides various ways of setting up and verifying behaviour, and 
I've recently seen some confusion over how. So here's some examples and pointers.

### It.Is() for a constant value

A quick one - this:

```csharp
loggerMock.Setup(l => l.Log(
    It.Is<string>(msg => msg.Equals("Some logged value"))));
```

...is the same as this:

```csharp
loggerMock.Setup(l => l.Log("Some logged value"));
```

`It.Is()` should be used to specify a condition an argument should match, not the complete argument 
value.

### Redundant Loose Mock Setups

A _loose_ mock is ~~up for anything~~ one which allows you access its members without explicit 
`Setup()`s, and is the default created by the parameterless `new Mock<T>()` constructor.

So in the following:

```csharp
var mockLogger = new Mock<ILogger>();
mockLogger.Setup(l => l.Log(It.IsAny<string>()));

// Use the mockLogger.Object ILogger in the test
```

...the mock `ILogger` will allow all `logger.Log()` calls, and they therefore don't need to be 
`Setup()`.

### Duplicate Loose Mock Setup() and Verify()

`Verify()` asserts that a given action was performed on a mock during a test. Again with a loose
mock, the action you're verifying doesn't need to be `Setup()`.

So in this example:

```csharp
var mockLogger = new Mock<ILogger>();
mockLogger.Setup(l => l.Log("Asplode"));

// Use the mockLogger.Object ILogger in the test

mockLogger.Verify(l => l.Log("Asplode"));
```

...the `Verify()` method is self-contained, and doesn't need the `Setup()` call. 

### Verifiable without VerifyAll()

Marking a `Setup()` as `Verifiable()` includes it in a set of actions which a call to `VerifyAll()`
will assert have taken place. 

In this example:

```csharp
var mockLogger = new Mock<ILogger>();
mockLogger.Setup(l => l.Log("BOOM"))).Verifiable();

// Use the mockLogger.Object ILogger in the test

mockLogger.Verify(l => l.Log("Started"));
mockLogger.Verify(l => l.Log("Completed"));
```

...specific `Verify()`s are used instead of a `VerifyAll()`, and `Verifiable()` is unecessary.

Hope that was helpful for someone :)