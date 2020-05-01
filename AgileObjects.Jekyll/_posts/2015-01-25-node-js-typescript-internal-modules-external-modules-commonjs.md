---
layout: post
title: Node.js and TypeScript Modules&#58; Internal, External... Shake it All About
excerpt: When I decided to write a JavaScript game, I knew I'd need to run the same logic on the server and the browser, so Node.js was an obvious choice. It's JavaScript on the server, right? Anything I write to run in a browser will be runnable on the server as well. Easy! Well… not so much. Here's the misunderstandings and problems I faced, along with my solution.
tags: [JavaScript, Node.js, Programming Practices]
---

Well, that was painful.

When I decided to write a JavaScript game, I knew I'd need to run the same logic on the server and 
the browser, so [Node.js](https://nodejs.org) was an obvious choice. It's JavaScript on the server,
right? Anything I write to run in a browser will be runnable on the server as well. Easy! Well... 
not so much.

The issues I came across boiled down to the way each JavaScript environment expects code to be
organised. [TypeScript](https://www.typescriptlang.org)'s abstractions actually made it more 
difficult for me to figure out, but I stuck at it Dear Reader, and now hopefully you can benefit 
from the hours I spent slamming my head in a drawer. Not literally.

## An 'Internal' TypeScript Module

Let's say we write the following TypeScript to run in a browser:

```typescript
module Here.Is.Johnny {
    export class Axe {
        public swing(): void { }
    }
}
```

That gets compiled to the following JavaScript:

```javascript
var Here;
(function (Here) {
    var Is;
    (function (Is) {
        var Johnny;
        (function (Johnny) {
            var Axe = (function () {
                function Axe() { }
                Axe.prototype.swing = function () { };
                return Axe;
            })();
            Johnny.Axe = Axe;
        })(Johnny = Is.Johnny || (Is.Johnny = {}));
    })(Is = Here.Is || (Here.Is = {}));
})(Here || (Here = {}));
```

This series of nested [self-invoking functions](https://www.w3schools.com/js/js_function_definition.asp) 
creates a `Here` object with an `Is` property of type `object` which has a `Johnny` property of 
type `object` which has a `Axe` property which points to the `Axe` 
[constructor function](https://javascript.info/constructor-new#:~:text=Constructor%20functions%20or%2C%20briefly%2C%20constructors,populated%20one%20at%20the%20end.). 
When we run this in a browser the `Here` object is created (if it doesn't already exist) and gets 
added to the browser's `window` object to act as the root of the 'namespace' we've created. 
Subsequent references to `Here` in other files will point to `window.Here` which points to our 
root namespace object and everything works as you'd expect. Marvellous!

Now, despite the fact that:

- We've exported the `Axe` class with the export keyword, and

- The namespace's root `Here` object is automatically accessible in other TypeScript files

...`Here.Is.Johnny` is known as an *Internal Module*. Why is it 'internal'? What is it 'internal' 
to? I don't know. Umm... someone help me out?

## A CommonJS External Module

To have the same class run happily in Node you have to write a [CommonJS](https://wiki.commonjs.org/wiki/CommonJS) 
module. TypeScript puts a bit of sugar around that, which means you write something like this:

```typescript
module Here.Is.Johnny {
    export class Axe {
        public swing(): void { }
    }
}

export = Here;
```

...which compiles to the following:

```javascript
var Here;
(function (Here) {
    var Is;
    (function (Is) {
        var Johnny;
        (function (Johnny) {
            var Axe = (function () {
                function Axe() { }
                Axe.prototype.swing = function () { };
                return Axe;
            })();
            Johnny.Axe = Axe;
        })(Johnny = Is.Johnny || (Is.Johnny = {}));
    })(Is = Here.Is || (Here.Is = {}));
})(Here || (Here = {}));
module.exports = Here;
```

...that is, the same as before but with the last line assigning `Here` to the `exports` property 
of the magical `module` object to tell Node that the value of that variable is what should be 
returned when this module is `require`d by another. Compare what happens with this to the browser 
example above: when we run it via Node the `Here` object is created (if it doesn't already exist)
and gets added to the Node execution context to act as the root of the namespace we've created. 
Subsequent references to `Here` in other files will point to... *their own* `Here` object, *not*
this one. To reference *this* `Here` object, other modules will have to `require` it or have it 
injected into them.

So to summarise:

- A set of internal modules share the same execution context (provided by the browser) and have 
  transparent access to all members exported from a namespace

- A set of external modules each have their own execution context (provided in this case by Node) 
  and have *no* access to any members exported from a namespace or module without explicitly 
  `require`-ing that module.

## Accessing Internal Modules in Node

And so to the promise of write-once, run-anywhere JavaScript - a promise I invented and made to 
myself after not really looking into it quite as thoroughly as perhaps I should have.

Looking at the JavaScript generated for the browser and for Node and the module formats used by 
each, it's not difficult to see why we can't easily use internal modules from Node external ones. 
Writing a new external TypeScript module for Node, we can reference and use the internal module 
defined above like this:

```typescript
import Johnny = Here.Is.Johnny;

var movieProps = {
    axe: Johnny.Axe
}

export = movieProps;
...which TypeScript merrily compiles to:

var Johnny = Here.Is.Johnny;
var movieProps = {
    axe: Johnny.Axe
};
module.exports = movieProps;
```

Unfortunately this errors at runtime because the execution context in which Node runs that code has
no `Here` variable on which to read the `Is` property; I guess TypeScript compiles it anyway 
because it hasn't figured that the mystical boundary between internal and external modules has been
breached. The issue is, just because we can reference `Here.Is.Johnny` in our pretty little editor 
doesn't make anything actually evaluate the code in which those objects are defined and add them to
Node's execution context. Ah.

To do that, we have to import the internal module:

```typescript
import Here = require("./InternalModule");
var johnny = Here.Is.Johnny;

var movieProps = {
    bigKnife: johnny.Axe
}

export = movieProps;
```

...but this doesn't compile because `InternalModule` is... an *internal* module, and so can't be 
`require`d.

So how do you access all your lovely internal modules in Node? Well... you can't. At least not 
without...

## An Internal Module Converter

The solution I came up with after much head-scratching, coffee-drinking, false starts, raging at 
Visual Studio for intermittently deciding not to debug Node, and reading and re-reading [this 
StackOverflow question and answer](https://stackoverflow.com/questions/17719258/wrap-many-internal-modules-for-exporting-in-typescript) 
was to write [a class](https://github.com/SteveWilkes/BoardGameEngine/blob/master/BoardGameEngine.Node/Scripts/Generic/AgileObjects.TypeScript.InternalModuleLoaderBase.ts)
(in an external module) to combine internal modules into a single external one and export the root 
namespace. To this end the class performs the following steps:

- Finds all the JavaScript files in the current working directory and sub-directories

- Creates an object to represent each of the internal modules defined in those files

- Orders those internal modules based on which modules are dependent on which

- Combines the modules' source code into a single JavaScript file, ordering them such that each 
  class is defined *after* the classes on which it depends

- Removes all the duplicate root namespace object declarations

- Appends a `module.exports =` statement to the bottom of the file, turning it into a CommonJS 
  module.

...so with my module converter [added to the project build](https://nodejstools.codeplex.com/wikipage?title=PreAndPostBuildActions) 
using [Grunt](https://gruntjs.com/getting-started) I now have all my internal modules in a single 
external module source file. `require`ing that file in my Node application's start up gives me a 
reference to the root namespace object from which I can instantiate any of the classes I've 
defined - and presto! I can run and debug the same code I wrote for the browser in Node! Hurrah! :)

So would I recommend [this class I've written](https://github.com/SteveWilkes/BoardGameEngine/blob/master/BoardGameEngine.Node/Scripts/Generic/AgileObjects.TypeScript.InternalModuleLoaderBase.ts) 
to anyone else with the same problem to solve? Well... I guess... but not *really*. I've kind of 
thrown it together and it has a few provisos and conventions by which it expects code to be written
which might make it awkward to use. This is also the kind of problem I'd like to think would be 
obsolete in a future TypeScript version, but we'll see. I know you can use [Asynchronous Module 
Definition](https://en.wikipedia.org/wiki/Asynchronous_module_definition) on the browser and there's
a [Node adapter for RequireJS](https://requirejs.org/docs/node.html) so that may have been another 
way to go, but I'd already written lots of internal modules by the time I got to this point on the 
assumption that executing the same JavaScript in the browser and on Node wouldn't be a big deal. Oh
well, it was a good learning experience, and I can now press on :)