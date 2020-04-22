---
layout: post
title: Why Automated Tests Are So Great
excerpt: I've recently done work at a company where there are no automated tests, and tests aren't part of the culture. I've been writing tests for so long now that it's jarring to consider working without them, so I've gone ahead and written tests for my part of the work. As I've done so it's really brought home the advantages of writing tests, and I wanted to list them out.
tags: [Programming Practices, Patterns, Automated Testing]
---

I've recently done work at a company where there are no automated tests, and tests aren't part of the culture. 
I've been writing tests for so long now that it's jarring to consider working without them, so I've gone ahead 
and written tests for my part of the work. As I've done so it's really brought home the advantages of writing 
tests, and I wanted to list them out.

## Tests Make Your Code Work

The earlier you write a test for a piece of code, the sooner you'll find yourself stepping through it, 
double-checking that and how it works. Working with code through tests is a unique experience, and things occur 
to you when you're stepping through a class that won't when you're reading through it. What if that variable 
turned out to have that value? What if that resource turned out to be unavailable? Watching your code go 
through its paces brings home the fact that it's going to be part of a functioning system with real users one 
day, and makes you consider if it does its job properly.

## Tests Give You Entry Points To Diagnose Problems

If something goes wrong in a particular part of your system, tests give you a way to access that part without 
going through the various layers that usually sit between it and the outside world. Without tests you have to
crank up the entire system and work your way from the user interface to the situation that caused the error. 
That could include getting a user into a particular state or entering a particular combination of data - do 
any of that even a little bit wrong and you can easily find yourself no closer to a solution, proclaiming that 
"[it works on my machine](https://www.codinghorror.com/blog/2007/03/the-works-on-my-machine-certification-program.html)". 
Worse still is if the error was caused by something transient, or a quirk in a third party system only 
triggered by certain circumstances - with tests you can easily stub out components and reliably simulate that 
behaviour so you can check how your system deals with it. Without tests... well... good luck with that.

## Tests Guard Against Other People's Changes

A colleague working without tests reported the other day that he'd spent most of a day trying to figure out 
why part of the system he'd written had stopped working. He'd been sending the same data to a third-party 
service all along, and up until that morning it'd always worked; he now wasn't sure if something had changed 
with his setup or what he was doing, or something had changed with the third party. Tests would have stopped 
this problem before it got started - he would have had a failing test to go to telling him what had changed.

## Tests Are Specification

You have a specification which says in circumstance ABC the system should perform action XYZ - does it? Sure, 
you stepped through it those times and saw it do XYZ, but a lot has happened since then - does it do XYZ now? 
Tests are an _executable_ specification of what your system does. Not what it's _supposed_ to do, but what it 
_does_. Tests are the only specification you have which the code _definitely_ fulfils. You probably have a 
Word document which says how your system is supposed to behave, but your tests tell you how it _actually_ 
behaves. In every area of life, you only know what you can demonstrate - tests are a great way of demonstrating 
what your system does.

## Tests Are Documentation

How are the classes and subsystems in your system used? What inputs do they expect? What outputs do they give? 
Do they have any quirky behaviour? Do they throw exceptions or returns nulls or empty collections? That 
third-party library you're using to validate bank account details - does it say account number 111111 with a 
valid sort code is valid, or invalid? You can write comments, [Sandcastle](https://blogs.msdn.com/b/sandcastle) 
comments, Word documents and make UML diagrams all you want, but your tests are the only documentation you 
can _rely on_ to be accurate. If code changes, passing tests _have_ to change with it - comments, documents 
and diagrams don't.

## Tests Are Insurance

You put an application live and move on. A few months later you revisit it to add a new feature - without 
tests, how easy is it to tell if your new feature breaks any of your old features? This is a few months down 
the road and your familiarity with the existing system has faded, so your intuition isn't going to help you 
as much as it once did. This is another area where tests pay huge dividends - if your new feature breaks an 
existing one, your tests will let you know. I've added to and refactored code on a well-tested project where 
I've genuinely had no idea (and put next to no effort into figuring out) if it would break something - safely 
insured that if it does, my tests will tell me. Without tests you're stepping on eggshells whenever you need 
to change existing code.

...and _that's_ why tests are so great. I've been working with them for so long now that it baffles me how 
anyone writes anything non-trivial without them. Getting used to writing tests takes some discipline and 
effort, but it's repaid many times over - if you don't write tests, you owe it to yourself and your team to
start.