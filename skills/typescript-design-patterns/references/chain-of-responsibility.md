# Chain of Responsibility

**Category:** Behavioral · **Complexity:** ★★☆ · **Popularity:** ★★☆
**Also known as:** CoR, Chain of Command

## Intent

Pass requests along a **chain of handlers**. Each handler decides either to process the
request or to pass it to the next handler in the chain.

## Problem

An online ordering system needs sequential checks: authenticate the user, and if
authentication fails there's no point running anything else. Over the months more checks
pile on — sanitize raw request data, filter repeated failed requests from one IP
(brute-force protection), return cached results for repeated identical requests.

The check code grows bloated. Changing one check affects the others. Worst of all, reusing
the checks for other components means **duplicating** them, because those components need
*some* of the checks but not all. The system becomes hard to comprehend and expensive to
maintain.

## Solution

Turn each check into a **stand-alone handler object** with a single method, taking the
request as an argument. Link the handlers into a chain: each holds a reference to the next
one, and after processing may pass the request further.

**The key move:** a handler can decide **not** to pass the request on, stopping all further
processing.

Two flavors:

- **Everyone gets a turn** — each handler does its work then passes along (the ordering
  checks above).
- **First capable handler wins** (the more canonical one) — a handler decides whether it
  *can* process the request; if yes it stops there. Either one handler processes it or none
  does. This is how GUI event stacks work: a click propagates from the button through its
  containers up to the main window, handled by the first element capable of it.

That GUI case also shows something worth remembering: **a chain can always be extracted
from an object tree**.

All handlers must implement the **same interface**, and each should only care that the next
one has the handling method — that's what lets chains be composed at runtime without
coupling to concrete classes.

**Real-world analogy:** tech support. Autoresponder → live operator → engineer. Each level
passes you up until someone can actually solve the problem.

## Participants

| Role | Responsibility |
|---|---|
| **Handler** | Common interface: one method for handling requests, sometimes another for setting the next handler |
| **Base Handler** | Optional; holds the boilerplate — the "next" reference, and the default behavior of forwarding to the next handler when one exists |
| **Concrete Handlers** | The actual processing code. On each request, decide **(a)** whether to process it and **(b)** whether to pass it along. Usually **self-contained and immutable**, taking all data once via the constructor |
| **Client** | Composes chains once or dynamically. May send a request to **any** handler in the chain, not just the first |

## Use when

- **The program processes different kinds of requests in various ways and the exact types
  and sequences aren't known beforehand.** Link handlers into a chain and let each one be
  asked in turn.
- **Several handlers must execute in a particular order.** The link order *is* the
  execution order.
- **The set of handlers and their order change at runtime.** With setters on the "next"
  field you can insert, remove and reorder handlers dynamically.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. `setNext` returns the handler it was given, which is what
makes `monkey.setNext(squirrel).setNext(dog)` read as a chain.

```ts
/**
 * The Handler interface declares a method for building the chain of handlers.
 * It also declares a method for executing a request.
 */
interface Handler<Request = string, Result = string> {
    setNext(handler: Handler<Request, Result>): Handler<Request, Result>;

    handle(request: Request): Result;
}

/**
 * The default chaining behavior can be implemented inside a base handler class.
 */
abstract class AbstractHandler implements Handler
{
    private nextHandler: Handler;

    public setNext(handler: Handler): Handler {
        this.nextHandler = handler;
        // Returning a handler from here will let us link handlers in a
        // convenient way like this:
        // monkey.setNext(squirrel).setNext(dog);
        return handler;
    }

    public handle(request: string): string {
        if (this.nextHandler) {
            return this.nextHandler.handle(request);
        }

        return null;
    }
}

/**
 * All Concrete Handlers either handle a request or pass it to the next handler
 * in the chain.
 */
class MonkeyHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === 'Banana') {
            return `Monkey: I'll eat the ${request}.`;
        }
        return super.handle(request);

    }
}

class SquirrelHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === 'Nut') {
            return `Squirrel: I'll eat the ${request}.`;
        }
        return super.handle(request);
    }
}

class DogHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === 'MeatBall') {
            return `Dog: I'll eat the ${request}.`;
        }
        return super.handle(request);
    }
}

/**
 * The client code is usually suited to work with a single handler. In most
 * cases, it is not even aware that the handler is part of a chain.
 */
function clientCode(handler: Handler) {
    const foods = ['Nut', 'Banana', 'Cup of coffee'];

    for (const food of foods) {
        console.log(`Client: Who wants a ${food}?`);

        const result = handler.handle(food);
        if (result) {
            console.log(`  ${result}`);
        } else {
            console.log(`  ${food} was left untouched.`);
        }
    }
}

/**
 * The other part of the client code constructs the actual chain.
 */
const monkey = new MonkeyHandler();
const squirrel = new SquirrelHandler();
const dog = new DogHandler();

monkey.setNext(squirrel).setNext(dog);

/**
 * The client should be able to send a request to any handler, not just the
 * first one in the chain.
 */
console.log('Chain: Monkey > Squirrel > Dog\n');
clientCode(monkey);
console.log('');

console.log('Subchain: Squirrel > Dog\n');
clientCode(squirrel);
```

Output:

```
Chain: Monkey > Squirrel > Dog

Client: Who wants a Nut?
  Squirrel: I'll eat the Nut.
Client: Who wants a Banana?
  Monkey: I'll eat the Banana.
Client: Who wants a Cup of coffee?
  Cup of coffee was left untouched.

Subchain: Squirrel > Dog

Client: Who wants a Nut?
  Squirrel: I'll eat the Nut.
Client: Who wants a Banana?
  Banana was left untouched.
Client: Who wants a Cup of coffee?
  Cup of coffee was left untouched.
```

## Idiomatic TypeScript

The **middleware pipeline** is this pattern, and it's how you'll actually meet it. A
handler receives the context plus a `next` function and chooses whether to call it:

```ts
type Middleware<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>

// Composing right-to-left so the first middleware in the array runs first
export const compose =
  <Ctx>(middlewares: Middleware<Ctx>[]): Middleware<Ctx> =>
  (ctx, next) => {
    const run = (index: number): Promise<void> =>
      index === middlewares.length ? next() : middlewares[index](ctx, () => run(index + 1))
    return run(0)
  }

const authenticate: Middleware<RequestCtx> = async (ctx, next) => {
  const user = await verifyToken(ctx.headers.authorization)
  if (!user) {
    ctx.response = unauthorized() // chain stops here: next() is never called
    return
  }
  ctx.user = user
  await next()
}

const rateLimit: Middleware<RequestCtx> = async (ctx, next) => {
  if (await isOverLimit(ctx.ip)) {
    ctx.response = tooManyRequests()
    return
  }
  await next()
}

const handler = compose([rateLimit, authenticate, handleOrder])
```

The **first-capable-handler** variant is cleaner as a plain array plus `find`, when handlers
are pure and independent:

```ts
interface UploadHandler {
  canHandle(file: File): boolean
  handle(file: File): Promise<UploadResult>
}

const handlers: UploadHandler[] = [imageHandler, pdfHandler, csvHandler]

export const upload = async (file: File) => {
  const handler = handlers.find(h => h.canHandle(file))
  // "Some requests end up unhandled" is a real case — decide what that means
  if (!handler) throw new UnsupportedFileError(file.type)
  return handler.handle(file)
}
```

You already rely on this pattern in DOM event bubbling (`stopPropagation()` is a handler
refusing to pass the request on), Express/Koa/Next middleware, and interceptor stacks.

## How to implement

1. Declare the **handler interface** and the signature of the handling method. The most
   flexible approach is to **convert the request into an object** and pass it as an
   argument.
2. Consider an **abstract base handler** holding the "next" reference and the default
   forward-if-exists behavior. Make it immutable unless chains change at runtime, in which
   case add a setter.
3. Create concrete handlers. Each makes **two decisions**: whether to process, and whether
   to pass along.
4. The client assembles chains itself, or receives pre-built ones — in which case add
   **factory classes** that build chains from configuration or environment.
5. The client may trigger **any** handler, not just the first.
6. Because chains are dynamic, the client must handle: a chain of a **single link**, requests
   that **don't reach the end**, and requests that reach the end **unhandled**.

## Pros and cons

**Pros**

- You control the **order** of request handling.
- **Single Responsibility Principle** — classes that invoke operations are decoupled from
  those that perform them.
- **Open/Closed Principle** — new handlers without touching client code.

**Cons**

- **Some requests may end up unhandled.**

## Identification

Behavioral methods on one group of objects that **indirectly call the same method on other
objects**, with all objects following a common interface.

## Relations with other patterns

**CoR, Command, Mediator and Observer all connect senders to receivers differently:**

- **Chain of Responsibility** passes a request along a **dynamic chain** of potential
  receivers until one handles it.
- **Command** establishes **unidirectional** connections between senders and receivers.
- **Mediator** eliminates direct connections, forcing indirect communication through a
  mediator object.
- **Observer** lets receivers **dynamically subscribe and unsubscribe**.

Also:

- Often combined with **Composite**: a leaf passes a request up through its parents to the
  root.
- Handlers can be implemented as **Commands** — many operations over one context object. Or
  invert it: the **request itself is a Command**, so one operation runs across a chain of
  different contexts.
- Nearly the same class structure as **Decorator**, but CoR handlers run arbitrary
  independent operations and **may stop the request**; decorators must stay consistent with
  the base interface and **may not break the flow**.

## Anti-signals

- The order is fixed, the handlers are few, and every one always runs — a plain sequence of
  function calls is clearer.
- Nothing defines what happens when no handler takes the request.
- Handlers reach into each other's state instead of communicating through the request —
  the chain is now a hidden coupling.

## See also

[command](./command.md) · [decorator](./decorator.md) · [composite](./composite.md) · [mediator](./mediator.md) · [observer](./observer.md)
