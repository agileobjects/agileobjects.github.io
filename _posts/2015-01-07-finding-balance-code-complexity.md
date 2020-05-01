---
layout: post
title: Finding a Balance&#58; Code 'Complexity'
excerpt: On any project, there's a tension between writing code everyone finds easily accessible, and using more modern techniques which make code more terse and expressive. Here's some thoughts on addressing that tension.
tags: [Programming Practices, Patterns]
---

"If you want to create a masterpiece - if you want to paint the Sistine Chapel - you can do that in your 
own time. Here, it's magnolia. All magnolia, in every room"

These words of guidance were spoken to me by a technical lead when establishing the level of code 
'complexity' for a project a while back. I'm putting 'complexity' in scare-quotes here because 'complexity' 
wasn't really referring to something like the number of moving parts, it was referring to coding style. 
Without looking to bias anyone before I get to the discussion, I think it's accurate to say we were 
actually talking about code _modernity_. Allow me to elaborate. Or don't - close the tab, y'know - you 
don't have to do what I say :)

A quick aside - I'm about to talk about 'average programmers', and I'm aware that by implication I'm 
placing myself in the 'above-average' group. I'm additionally aware there could be an arrogance (perceived 
or real) about doing this, but... hey. That's the impression I've got from working in various teams 
at several companies on different projects. And it's my blog :)

So. *ahem* Dear reader - it's probably fair to say that if you are a programmer, you're an above-average 
one. I feel some confidence in saying this because research has shown and experience has attested that the 
average programmer does not read programming blogs, and yet here you are, reading one. The average 
programmer 'learns how to code' when they're starting out and expands their horizons and improves only a 
little over the course of their career. This means that _most programmers_ get used to the style and 
practices of coding that were most popular when they were starting out, and anything introduced and 
established later looks foreign and strange, and - depending on how set-in-their ways they are - even 
convoluted and over-complex. Let's look at some concrete examples.

- [LINQ](https://msdn.microsoft.com/en-gb/library/bb397926.aspx) has been around since the .NET framework 
  3.5 in late 2007. That's [at the time of writing] more than _seven years_.

- F# has been around since mid 2005. Using F# as a symbol for the use of functional programming in .NET, 
  that's more than _nine years_.

So .NET programmers have had nearly a decade to stumble across functional programming and long enough to 
get [itchy in a marriage](https://en.wikipedia.org/wiki/The_seven-year_itch) to play around with LINQ. It 
has been my experience however that most programmers aren't particularly familiar or comfortable with either.
In the name of fairness I should point out that when exposed to either, most of 'most programmers' are 
interested and want to learn how it all fits together, but the point remains that it at first just looks 
like 'complexity'.

Some examples. These two code blocks both print the numbers 1 to 10, grouped by the remainder when you 
divide each by 2. See what you think:

```csharp
var numbersByRemainder = new SortedList<int, List<string>>();

for (var i = 1; i <= 10; i++)
{
    var remainderFromDivisionByTwo = i % 2;

    if (!numbersByRemainder.ContainsKey(remainderFromDivisionByTwo))
    {
        numbersByRemainder[remainderFromDivisionByTwo] = new List<string>();
    }

    var name = i.ToString(CultureInfo.InvariantCulture);

    numbersByRemainder[remainderFromDivisionByTwo].Add(name);
}

foreach (var remainder in numbersByRemainder.Keys)
{
    var numbers = string.Join(", ", numbersByRemainder[remainder]);

    Console.WriteLine("Remainder: {0}, numbers: {1}", remainder, numbers);
}
```

...and:

```csharp
Enumerable
    .Range(1, 10)
    .Select(i => new
    {
        Name = i.ToString(CultureInfo.InvariantCulture),
        RemainderFromDivisionByTwo = i % 2
    })
    .GroupBy(i => i.RemainderFromDivisionByTwo)
    .Select(grp => new
    {
        RemainderFromDivisionByTwo = grp.Key,
        Numbers = string.Join(", ", grp.Select(i => i.Name))
    })
    .OrderBy(i => i.RemainderFromDivisionByTwo)
    .ToList()
    .ForEach(i => Console.WriteLine(
        "Remainder: {0}, numbers: {1}",
        i.RemainderFromDivisionByTwo,
        i.Numbers));
```

You can see the first one in action [here](https://dotnetfiddle.net/3RGqwv), and the second one 
[here](https://dotnetfiddle.net/xQ1iNU). Those two links by the way both go to 
[DotNetFiddle](https://dotnetfiddle.net), which for my money (of which I'm offering none) is one of the 
best things on the internet, especially for programmers :)

So, both code blocks accomplish the same task - which do you find easier to read? Personally, it's the 
second one. I start with a sequence of numbers and run each one through a series of _declared_ 
operations to get the result - it reads to me like a series of English commands, and my brain wraps 
around that more easily. The grouping and ordering of the results is explicitly stated instead of being 
implied by the use of the `SortedList`. On blogs and in books I read, code like this is more and more 
common. You have to admit, though - it's not Magnolia.

And so to the point I want to address. On any project, there's a tension between writing code everyone 
finds easily accessible, and using more [relatively] modern techniques which can make code more terse, 
expressive and perhaps more attractive to future 'above-average'-programmer recruits. This tension 
should be resolved with a team discussion and an agreed approach - the earlier the better. I think it 
does everyone involved a service to aim higher than the most junior or inexperienced team members - 
keeping in mind that they will need coaching at least to begin with - and by doing so raise the skill 
level of the average team member and therefore the capabilities of the team. For this to be viable, 
anyone identifying themselves as 'above average' has a responsibility to try and educate the team they're 
on and provide the coaching where necessary. For work life to be tolerable however, that same group has 
to keep their mouths shut and paint everything magnolia if that's the decision that's taken.

You can always paint the Sistine Chapel at home :)