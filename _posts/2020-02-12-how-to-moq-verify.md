---
layout: post
title: How to Moq
excerpt: Moq provides various ways of setting up and verifying behaviour, and I've recently seen confusion over how. So here's a how-to.'
tags: [C&#35;, Moq, Programming Practices, Automated Testing]
---

[Moq](https://github.com/moq/moq4) provides various ways of setting up and verifying behaviour, and 
I've recently seen confusion over how. So here's some examples and pointers.

### Redundant Loose Mock Setups

A _loose_ mock is one ~~with questionable morals~~ which does not throw exceptions when you access 
its members, and is what you get when you use the parameterless `new Mock<T>()` constructor.

So in the following:

```csharp
interface ILogger
{
    void Log(string message);
}

var mockLogger = new Mock<ILogger>();
mockLogger.Setup(l => l.Log(It.IsAny<string>()));

// Use the mockLogger.Object ILogger in the test
```

...calling `logger.Log()` on the mock `ILogger` won't throw an exception, doesn't return a value, 
and therefore doesn't need to be `Setup()`.

### Duplicate Loose Mock Setup() and Verify()



### Strict Mock Verify()

This time on a _strict_ mock, which will throw an exception if you access anything which hasn't been
`Setup()`:

```csharp
var mockLogger = new Mock<ILogger>(MockBehavior.Strict);
mockLogger.Setup(l => l.Log("BOOM"));

// Use the mockLogger.Object ILogger in the test

mockLogger.Verify(l => l.Log("BOOM"));
// ...and / or:
mockLogger.VerifyAll();
```

...in this case the `Setup()` call is necessary as without it the mock will explode when that call 
is made during the test. However, because we're using a _strict_ mock, there's no point calling either
`Verify` method - if `Setup` calls aren't made, or calls are made which weren't `Setup`, the mock
would have thrown an exception.