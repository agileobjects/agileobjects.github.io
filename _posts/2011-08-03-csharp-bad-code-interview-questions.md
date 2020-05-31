---
layout: post
title: Interview question - what's wrong with this code?
excerpt: You can learn a lot about good code from reading bad code, and at least something about how well someone codes from  what they can tell you about bad code. With this in mind I handed a print out of some bad code to the latest prospective developers I've interviewed, to see what they made of it. I'll write another blog with the things I think is wrong with the code soon (there's quite a few of them), but it'd be very interesting to hear what people think is wrong with it before I do :)
tags: [C&#35;, Programming Practices, Patterns, Domain Driven Design (DDD), Dependency Injection (DI)]
---

<span class="updated">
NB: This post is followed up [here](csharp-bad-code-interview-questions-2).
</span>

<span class="first">
You can learn a lot about good code from reading bad code, and at least something about how well someone 
codes from what they can tell you about bad code. With this in mind I handed a print out of some bad 
code to the latest prospective developers I've interviewed, to see what they made of it. The bad code is 
below; I'll write another blog with the things I think is wrong with it soon (there's quite a lot of it),
but it'd be very interesting to hear what people think is wrong with it before I do :)
</span>

The bad code - it doesn't actually compile, but that's the tip of its 'badness' iceberg...

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
sqlserverdatabase, LoggingService and CommunicationService are all classes which exist, but are not shown.
```

So what's wrong with it? :)

**Edit**: I've had a couple of good responses to this, with things I hadn't considered - I'll approve 
all the comments when I post my take on it. Keep 'em coming! :)

**Edit 2**: I've now posted the follow up to this.