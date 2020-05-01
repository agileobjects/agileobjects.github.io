---
layout: post
title: Interview Trivia Questions
excerpt: There is a style of technical interview question which I think is more or less pointless. Here's some examples, with what I think is a question worth asking instead.
tags: [C&#35;, Patterns, Programming Practices, Dependency Injection (DI)]
---

Here's some interview questions I've been asked / seen:

- Name three features introduced with C# 3.0

- How does ASP.NET MVC's [Anti Forgery Token](https://blog.stevensanderson.com/2008/09/01/prevent-cross-site-request-forgery-csrf-using-aspnet-mvcs-antiforgerytoken-helper)
  work?

- How can you update web.config programatically?

The last one is from [CSharpStar](https://www.csharpstar.com/csharp-interview-questions-part-2), 
where it is presented with a series of other interview questions for 'Experienced Professionals'.

What do these questions have in common? If you don't know the answer off the top of your head, you 
can find it with about [two minutes of Googling](https://codeahoy.com/2016/04/30/do-experienced-programmers-use-google-frequently).
These are trivia questions - do you know this piece of information about your framework of choice? 
If someone answers all these questions correctly - are they a good programmer? How much confidence 
do you have that they know how to structure an application? That they'll write maintainable code?

I don't rate these types of questions. Good programming consists of applying skills pragmatically, 
analysing trade-offs between simplicity and complexity, and delivering a product which can be 
maintained, understood, extended, and *used*. How does knowing what features were introduced in 
C# 3.0 help with that?

Here's an interview question I think *is* worth its salt:

Class `Switch` takes an instance of `Light` in its constructor, and wraps its `LightUp()` and 
`TurnOff()` methods:

```csharp
public class Switch
{
    private readonly Light _light;

    public Switch(Light light)
    {
        _light = light;
    }

    public void On() { _light.LightUp(); }

    public void Off() { _light.TurnOff(); }
}
```

What changes would you make to be able to use `Switch` with an instance of `Light` *or* `Rotor`? 
`Rotor` has the methods `Start()` and `Stop()`.

Easy question? You may be surprised how often I've asked interview candidates this and they've been 
unable to answer. One person - with years of experience - suggested making `Rotor` derive from 
`Light`.

To answer that question you need to have an at-least basic understanding of dependency inversion, 
coupling, encapsulation, composition and abstraction. These are not things you can get your head 
around with two minutes on Google. For my money (of which - as usual - I'm offering none) this is 
vastly more useful than finding out if someone knows off the top of their head how to use an XML 
writer.

If you're in the position of putting technical interview questions together, try to pick ones which 
tell you about someone's ability to design software. That's the most difficult thing about the 
job - not parrot-fashion familiarity with a framework's intricacies.