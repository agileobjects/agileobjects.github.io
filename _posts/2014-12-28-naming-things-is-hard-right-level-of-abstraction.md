---
layout: post
title: Naming Things is Hard&#58; Finding the Right Level of Abstraction
excerpt: It is said and experience has confirmed - in programming, naming things is hard. So hard it's common for programmers with years and years (and years) of experience to regularly name things poorly. Here's some of the processes I use to name variables and types, focusing on finding the right level of abstraction.
tags: [Naming Patterns]
---

It is said and experience has confirmed - in programming, 
[naming things is hard](https://martinfowler.com/bliki/TwoHardThings.html). So hard in fact that it's 
common for programmers with years and years (and years) of experience to regularly name things poorly.

There's a number of nuances to giving something an appropriate name, but the one I'm going to talk about 
here is _finding the right level of abstraction_. Here's some simple examples:

```csharp
var customerList = new List<Customer>();
var sqlServerConnection = GetDatabaseConnection();
```

In each of these cases, the variable name includes information about its type. Now, in a real program 
the lines of code following these declarations will use the variables in one way or another - `customerList`
will have customers added to it, `sqlServerConnection` will be used to execute SQL queries, etc. In this 
way we can think of each of these variables as providing a _service_ to the code which uses them - that 
code will have a certain set of interactions with them and require a certain interface to do so; it's in 
that interface - in the service provided by each variable to the code that consumes it - that the 
appropriate level of abstraction is found.

To be more specific: the code that uses `customerList` probably just needs to be able to put a bunch of 
`Customer` objects in a group - odds are the fact that the object fulfilling that need is a `List` is 
irrelevant, therefore 'List' doesn't need to be in the name. Further, if we change `customerList` to be 
a `Collection<Customer>`, the variable name is now not only exposing details about the underlying 
implementation - it's lying about them. We could change it to `customerCollection` as part of the same 
refactoring, or... we could just name the variable `customers`.

`sqlServerConnection` is similarly specific about the implementation the variable represents. Does it 
matter to the code which consumes `sqlServerConnection` that it's using an SQL Server database as opposed 
to a (_e.g._) MySQL database? The method which creates the database connection is the provider-agnostic 
`GetDatabaseConnection`, so probably not. If not - and we've established in my made-up scenario that it 
isn't - we can just name the variable `connection`.

To try and summarise this in a single, pithy statement: a name with the _right level of abstraction_ 
describes the role played in the code _without unnecessary detail_.

## A More Subtle, More Real-World Example

Let's say we've got an existing application which provides car insurance quotes, and we're going to be 
extending it to include quotes for life insurance by integrating a 
[WCF](https://msdn.microsoft.com/en-us/library/ms731082%28v=vs.110%29.aspx) service from the 
globally-renowned Rainbow Unicorn Corporation. We can already imagine some of the objects involved in 
this scenario:

- Something to represent an insurance quote
- Something to represent a provider of insurance quotes
- Something to represent a _service_ which provides insurance quotes
- Something to represent a customer on whom a quote is based
- Something containing the information Rainbow Unicorn need to provide a quote
- Something detailing Rainbow Unicorn's response to a quotation request

Let's name some of these objects.

At the heart of this setup is something which contains all the information common to insurance quotes we 
obtain, irrespective of who provided them; I suggest we call this object `Quote`. Hang on though - our 
application only deals with insurance quotes, so shouldn't it be '`InsuranceQuote`'? I'd say no, because 
_as_ the application only deals with insurance quotes, the 
[context](/naming-things-is-hard-namespace-interface-class-method-context) of its code is _already_ specific 
to insurance - we don't need to [repeatedly](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) specify 
that with our object naming.

Let's name the object which represents Rainbow Unicorn themselves. They are a provider specifically of life 
insurance, so how about... `LifeInsuranceProvider`? Let's break that name down into its parts and justify 
each of them; `Provider` - yep, happy with that, they provide things. `InsuranceProvider` - happy with that 
too, but... doesn't that contradict the approach we took when we named `Quote`? Well, yes and no. The context 
of the application is insurance - which makes it unnecessary to plaster the word 'insurance' everywhere - 
but removing that word in this instance leaves us with `Provider`, which is a common term in programming; 
for that reason I'd vote for using 'insurance' here to differentiate the object from one which provides 
(_e.g._) validation / data storage / logging. Finally, do we need the word 'life'? That depends. Will the 
object describe anything specific to life insurance providers? If so ok, we might want the 'life' prefix, 
if not, no - `InsuranceProvider` will cover all the bases.

Onto the object we use to call Rainbow Unicorn's service - what shall we name that? Let's consider what we 
know about it, and build the name from those details:

- It's a service - let's call it _Service_

- It provides quotes - let's call it _QuotationService_

- It's specific to life insurance - let's call it _LifeInsuranceQuotationService_

- It's provided by Rainbow Unicorn, and will therefore contain details specific to Rainbow Unicorn's needs - 
  let's call it _RainbowUnicornLifeInsuranceQuotationService_

- It operates over WCF - that's an implementation detail, so let's not include that.

So `RainbowUnicornLifeInsuranceQuotationService` - quite a long name, isn't it? But I'd say the sum of 
the parts provides just enough detail to encapsulate the service it provides, _and no more_.

Back to our application. To avoid unnecessary details of our new life insurance service bleeding into parts 
of the application which don't need to know about them, we'll create an interface for 
`RainbowUnicornLifeInsuranceQuotationService` to implement. What should we name it?

- It's a service which provides quotes - let's call it `IQuotationService`

- Our application already obtains car insurance quotes, so we'll need to differentiate our new service from 
  any existing car insurance-specific interface - let's call it `ILifeInsuranceQuotationService`

- It's implemented by Rainbow Unicorn - that's an implementation detail, so let's not include that.

Giving us an `ILifeInsuranceQuotationService`, implemented by the `RainbowUnicornLifeInsuranceQuotationService`.
Both of these names contain enough and only the details which describe the role they play in the application.

## Summing Up

Naming things is tricky, but I think it's something which has rules which can be applied to obtain 
objectively better or poorer results. I've gone through some of the processes I use to name variables 
and types here - hopefully it's been useful :)