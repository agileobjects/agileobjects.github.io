---
layout: post
title: Interview question - there's a lot wrong with this code :)
excerpt: I had some really great responses to my last post regarding some bad code I've shown to interviewees - pretty much everything I intended to be bad was spotted, as well as some interesting points I hadn't considered. Here's the code again along with the bad bits as I saw them, and then I'll go over the extra points raised in the comments.
tags: [C&#35;, Programming Practices, Patterns, Domain Driven Design (DDD), Dependency Injection (DI)]
---

I had some really great responses to [my last post](csharp-bad-code-interview-questions) regarding some 
bad code I've shown to interviewees - pretty much everything I intended to be bad was spotted, as well 
as some interesting points I hadn't considered. Here's the code again along with the bad bits as I saw 
them, and then I'll go over the extra points raised in the comments.

The bad code:

```csharp
namespace MyNamespace
{
    using System;

    public class Customer
    {

        public void PlaceOrder(string orderReference, OrderedProductData[] orderedProductData)
        {
 
            if (orderReference = "")
                throw new OrderCreationException();
 
            orderReference = orderReference.Trim();
 
 
            Order newOrder = new Order(orderReference);
 
            newOrder.Customer = this;
 
            int i;
 
            for (OrderedProductData dataItem in orderedProductData) {
                
                Product product = sqlserverdatabase.findproduct(dataItem.ProductID);
 
                newOrder.AddOrderItem(product);
 
                ++i;
            }
 
            LoggingService.LogInformation(
            "A new order has been placed: " + orderReference + " at " + DateTime.Now);
 
            CommunicationService.SendEmail(
                "New Order!",
                "A new order has been placed: " + orderReference + " at " + DateTime.Now,
                "ordernotifications@mycompany.com", "orders@mycompany.com");
        }
    }
}
```

## What I Thought Was Wrong With It

1. Inconsistent styling: the curly braces are placed inconsistently, there's inconsistent capitalisation 
   in class and method names, double whitespace before the `Order newOrder =` line and inconsistent 
   indentation in the arguments to the `LoggingService` and `CommunicationService` calls. Some of 
   this is a matter of taste, but bracket placement and casing conventions should at least be consistent. 
   I like [StyleCop](https://archive.msdn.microsoft.com/sourceanalysis), and don't like to make it 
   angry :)

2. `OrderedProductData` being passed in as an array is unnecessarily restrictive; if it was an 
   `IEnumerable<OrderedProductData>` instead then clients could pass in arrays or `List`s without 
   having to convert them.

3. `orderReference = ""` doesn't compile because it's assignment instead of comparison.

4. `orderReference` is checked for being an empty `string`, but not for being `null`. It's then 
   `Trimmed`, which could throw a nasty `NullReferenceException`. As pointed out more than once in 
   the comments, the check should use `string.IsNullOrWhitespace()`.

5. `orderReference` is checked for validity, `orderedProductData` isn't. If the latter was null it 
   would throw a `NullReferenceException` when the method tried to enumerate it.

6. The `OrderCreationException` thrown if `orderReference` is an empty string is really very 
   unhelpful. I thought it should have an error message; one of the comments recommended using an 
   `ArgumentException` instead. I suppose that comes down to how you do your exception handling; 
   maybe a layer above the `Customer` would catch any exceptions and wrap them in an 
   `OrderCreationException`; maybe it'd be nicer to throw an `OrderCreationException` with an 
   `ArgumentException` as its `InnerException`. In any case throwing a custom exception with no 
   message is a bit rubbish.

7. The `Order` constructor takes an order reference, but not a `Customer`; the `Customer` is assigned 
   later using a setter. I can't put this any better than **Alastair Smith**: "The created `Order`'s 
   `Customer` property is set outside the constructor, thus making the class mutable and allowing the 
   `Customer` property to change. I can't think of any reason why an Order would need to be assigned 
   to a different `Customer`".

8. The `int i` is created and incremented, but never used for anything. What's the point of that?

9. The second reason the code doesn't compile: a `foreach` loop declared as a for loop.

10. `dataItems` in the `foreach` loop could be null; this isn't checked.

11. `sqlserverdatabase`, the `LoggingService` and the `CommunicationService`
    should not be used directly by anyone or anything; generally speaking, static method use on a 
    dependency is evil. All three of these classes should be accessed via an interface and injected.

12. To be really strict, it shouldn't be `dataItem.ProductID`, it should be `dataItem.ProductId`; 
   'id' is an abbreviation, not an acronym.

13. Finding `Product`s and adding them to the `Order` is not the job of the `Customer`; this violates 
   the [SRP](https://en.wikipedia.org/wiki/Single_responsibility_principle). For the same reason the 
   `Customer` should not be sending emails.

14. Again, if you're being really strict (as I tend to like to be) the same message is constructed twice 
   for the `LoggingService` and `CommunicationService` calls. Maybe in only a small way, but this 
   violates [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).

15. Also pointed out more than once in the comments, the string concatenation used in the `LoggingService` 
   and `CommunicationService` calls should be done using `string.Format`; this is not only neater, 
   but with use of a `CultureInfo` would ensure appropriate formatting of the `DateTime` in the message.

16. Sending emails from a `Customer` object is not only a violation of the SRP, it's also incorrect from 
   a layering point of view. Why does a `Customer` know anything sending emails? This should be handled 
   in the Application layer, and is an ideal candidate for 
   [Domain Events](auto-configure-domain-event-handler). With reference to point 11, not only should the 
   `CommunicationService` be injected, but it shouldn't be injected into `Customer`. I'd argue the 
   same is true of the `LoggingService`. The email sent is supposed to be to alert the company with 
   whom the `Order` has been placed, but that's not exactly clear.

So those were the things I intended to be available for spotting by an interview candidate, and as I said 
the vast majority were picked up in the comments - well done all! :)

## What I Didn't Spot Was Wrong With It

There were also things picked up I hadn't considered. Namely:

1. "`orderReference` is a string. This feels weakly-typed and I would argue it should be an instance of 
   a separate class."

Good point! I suppose it depends on the source of order references - if they're chosen by users and can 
be any combination of any characters a string pretty much does the job, but if there are any rules around 
them (and at very least they're going to have a maximum length) I can see the argument for a dedicated 
class.

2. "`AddOrderItem` is dealing directly with `Product`s, when the `PlaceOrder()` method has an array 
   of `OrderedProductData`. It would seem more sensible to make use of the `OrderedProductData` 
   objects directly, because `AddOrderItem()` is losing any notion of quantities of products ordered."

So it is - again - I just didn't think of that :)

## Stuff Which *Might* Be Wrong With It

Interestingly, the `Customer` object having a `PlaceOrder` method was cited more than once as an error, 
and less preferrable to an `OrderService.PlaceOrder` method, or some other service method, perhaps on 
the `Order` object. A friend at work pointed out this is an example of the 
[Spreadsheet Conundrum](https://my.safaribooksonline.com/book/programming/0596008740/general-development-issues/prefactoring-chp-3-sect-11) 
(the link is to Google's cache of the page, as the actual site was down at the time of writing) - in a 
method involving two classes, should the method go on class 1 or class 2? The answer to the conundrum is 
"It depends" - it depends what the two classes are. I think in this example the method fits nicely on 
`Customer` because in real life `Customer`s place `Order`s, `Order`s don't place themselves. If the 
`Order` creation process was particularly complex I could see the argument for an `OrderService`, but 
I'm always wary of an [AnemicDomainModel](https://martinfowler.com/bliki/AnemicDomainModel.html).

## To Sum Up

It's quite impressive just how bad a method with a dozen lines of code can be, and I've found it really 
interesting to see other peoples' take on it. Thanks very much to those who left comments :)