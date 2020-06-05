---
layout: post
title: Stop Writing So Many Unit Tests!
excerpt: I'm a big fan of automated testing, but it can be hard to get it right. Taking for granted that no tests is A Very Bad Thing, let's take a look at the problem of writing too many.
tags: [Automated Testing]
images_dir: '2020-03-10/'
featured: true
featured_image: '/assets/images/posts/2020-03-10/test-tubes.gif'
hidden: true
---

I'm [a big fan](automated-integration-unit-testing-advantages) of automated testing, but it can be 
hard to get it right. I've seen large code bases with no automated tests, and small code bases with 
lots (and _lots_) of automated tests. Taking for granted that no tests is A Very Bad Thing, let's 
take a look at the problem of writing _too many_.

## The Test Pyramid

The classic [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) indicates how many of what 
sort of tests we should write:

<span style="
    background-image: url({{ site.post_images_dir }}{{ page.images_dir }}TestingPyramidFull.gif#center);
    background-repeat: no-repeat;
    display: block;
    height: 192px;
    margin: 0 auto;
    width: 406px">
</span>

**UI tests** run the application via its user interface, and cover the whole system front-to-back. 
They run relatively **slowly**, are **more complex**, and therefore more **expensive**. They're also 
more **fragile** - a bug is more likely to break any one UI test, as each test covers a large slice 
of the system.

**Service tests** run the application via its API, and cover the API, business logic and data stores.
They're **faster** and **less complex** than UI tests, and therefore **less expensive**. They're 
**more robust** - a bug is less likely to break any one Service test, because each test covers less 
of the system.

**Unit tests** run individual components of the system, usually classes or methods. They cover its 
API and business logic, but not usually its data stores, or anything that can't execute in-memory.
They're **fast**, **simple**, and therefore **inexpensive**. They're **robust** - a bug is unlikely 
to break any one Unit test, because each test is narrowly focused.

Ok, so a few UI tests, a few more Service tests, and lots of Unit tests, right? Well, yes and no.

## The Point of Tests

Ayende [recently wrote](https://ravendb.net/articles/the-goal-of-your-testing-strategy) about the 
_goal_ of writing tests, which is often mistaken for:

- Getting 100% test coverage
- Ensuring classes are decoupled, and we have tests for every class in isolation

...it's neither of those. The _goal_ (or the _point_) of tests is to have:

- An executable specification proving that your system behaves as it should
- A safety net so you can add features and refactor with confidence you haven't broken existing 
  functionality

There are [other advantages](automated-integration-unit-testing-advantages), but I'd say those are 
the main two. Notice they're not focused on metrics or design approach, but on ensuring a system's 
_functionality_. Systems generate value and make money by _behaving_ correctly - not by having perfect 
decoupling, using the latest frameworks, or yielding graphs with lots of green on them. The only 
point of _those_ things is to make correct behaviour easier to achieve.

With that in mind, the most valuable tests are those which do the most to ensure a system's _behaviour_.
Unit tests on an isolated class prove that class behaves correctly, but give very little assurance
the system does. To quote Ayende:

> "The key issue with unit testing the system as a set of individually separated components is that 
> concept that there is value in each component independently. There isn't."

That's an insight I'd like to see spread. With it in mind, let's update the Test Pyramid.

## Updating the Pyramid

Let's consider a couple more characteristics of UI, Service and Unit tests - **coupling**, and 
**value**:

![The Testing Pyramid]({{ site.post_images_dir }}{{ page.images_dir }}TestingPyramidFull.gif#center)

**UI tests** and a system's implementation are **decoupled**. Large-scale changes can be made, and 
if the same UI is produced, UI tests don't need to change. Each test covers entire slices of the 
system, and adds the **most value**.

**Service tests** and a system's implementation are **more coupled**. Implementation changes are 
more likely to require Service test changes. Each test covers whole slices of the system backend, 
and adds **lots of value**.

**Unit tests** and a system's implementation are **tightly coupled**. Implementation changes will 
often require Unit test changes. Each test covers parts of the system's components, and adds the
**least value**.

So lots and lots of unit tests does not a valuable test suite make - the best approach is to write 
fewer unit tests, and make each one more _valuable_.

## Valuable Unit Tests

I'd offer the following guidelines:

- Most unit tests should start at the API and execute the entire stack in-memory, with stubs where
  necessary.
- Use your production system's Dependency Injection code to plug together your test classes. Build 
  your production DI container, then replace services where necessary. Using the DI container not 
  only exercises the DI setup, but helps decouple unit tests from the object trees they're testing.
- Write a domain-specific framework so you can easily set up the models and dependencies a test needs.
- Only write 'isolation' tests for complex business logic. Write one test per code path, with each 
  one executing a particular business circumstance.

This approach maximises unit test value, and minimises coupling between the tests and system. You'll 
write fewer tests, but get more from each one, have a lower maintenance burden and less of a barrier 
to improving your system.

Happy testing!