---
layout: post
title: Naming Things is Hard&#58; Keeping Context in Mind
excerpt: Nothing that you name in coding exists in a vacuum. It will all be used and referenced in a certain way, and this should inform the names you choose. Here's some examples.
tags: [Programming Practices, Naming Patterns]
---

Well, look at this naming stuff turning into a series :)

Nothing that you name in coding exists in a vacuum. It will all be used and referenced in a certain way, 
and this should inform the names you choose. Here's some examples:

## Boolean Members

Boolean members on classes should usually be given names starting with 'Is' or 'Has' to indicate their 
boolean-ness, but boolean helper methods _within_ a class should not. So for example:

```csharp
if (CustomerIsEntitledToAMassiveDiscount(customer))
{
    // Do something
}

// ...

private bool CustomerIsEntitledToAMassiveDiscount(Customer customer)
{
    // Figure it out…        
}
```

`CustomerIsEntitledToAMassiveDiscount` here encapsulates the logic which makes that decision. This makes 
the purpose of the `if` statement clear and provides an English-language description for the blob of logic 
which makes the determination. As a helper method of that type (which is the 'Encapsulate Conditionals' 
type from [Clean Code](https://www.amazon.co.uk/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882), 
by the way), it will always be called by an `if` statement, and as such should be named in a way appropriate 
to that _context_, _i.e._ the context of being presented as the body of a readable sentence which starts 
with the word 'if'.

Alternatively, how would we name a property on `Customer` which encapsulated the same logic? The context 
is again informative; our property will still be used in `if` statements, but always via a member of a 
variable [probably] named '`customer`'. That means it doesn't need the word 'Customer' in it. Which gives 
us...? `customer.IsEntitledToAMassiveDiscount`. Again, note that that makes a readable English-language 
statement when used as the body of a sentence beginning with the word 'if'.

## 'Parenting'

What's wrong with this picture?

```csharp
public interface ICustomerService
{
    IEnumerable<BankAccountDetails> GetCustomerBankAccountDetails(int customerId);

    Address GetCustomerDefaultDeliveryAddress(int customerId);

    IEnumerable<Address> GetCustomerAddresses(int customerId);

    int GetCustomerInsideLegMeasurementInCm(int customerId);
}
```

...or this one?

```csharp
namespace LetteringRendering
{
    public interface ILetterRenderingLetterRenderer
    {
        Letter RenderLetter(LetterRenderingData letterRenderingData);
    }
}
```

Both examples have _redundant qualifiers_. Implementations of the interface in the first example will provide 
information (some of it quite personal) about `Customer`s; they will be used via a variable named [probably] 
'`customerService`'. The service therefore establishes the context of the operations as that of the 'Customer', 
and we don't need the word 'Customer' in every method.

The namespace and interface names in the second example establish their contexts as related to letter rendering;
the interface name therefore doesn't need 'LetterRendering' in it. The interface method will be used via 
implementations named (can you guess?) '`letterRenderer`' or '`renderer`' or similar, and will be used to 
assign a variable named something like '`letter`' or '`renderedLetter`'; it therefore doesn't need the word 
'Letter' in it - what else is an `ILetterRenderer` going to render if not a `Letter`? Similarly, I don't think 
the parameter name needs '`letterRendering`' in it - it can simply be named '`data`'; the _context_ established 
by the method to which it belongs already tells us that it's related to letter rendering.

What about the `LetterRenderingData` type? I shall leave that to you to discuss with yourself - if you reach 
a conclusion let me know what you think with a comment :)