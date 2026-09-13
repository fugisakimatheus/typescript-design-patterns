# Decorator

**Category:** Structural · **Complexity:** ★★☆ · **Popularity:** ★★☆
**Also known as:** Wrapper

> Not the same thing as a TypeScript `@decorator`. The language feature is one *way* to
> apply this pattern (and several others); the pattern is about **wrapping an object in
> another object with the same interface**.

## Intent

Attach new behaviors to objects by placing them inside **wrapper objects that contain those
behaviors**.

## Problem

A notification library starts with a `Notifier` class that sends email. Users want SMS,
Facebook, Slack. You subclass `Notifier` per channel — fine. Then someone asks the obvious:
*"Why can't I use several channels at once? If my house is on fire I want every channel."*

Subclasses combining channels (`SmsAndSlackNotifier`, `EmailAndSmsAndFacebookNotifier`, …)
produce a **combinatorial explosion**, bloating both library and client code.

## Solution

Inheritance has two caveats that cause this:

- **It's static.** You can't change an existing object's behavior at runtime — only replace
  the whole object with one from a different subclass.
- **One parent only.** Most languages won't let a class inherit from several classes at
  once.

Use **aggregation/composition** instead: one object holds a reference to another and
delegates work to it. The linked "helper" can then be swapped at runtime, and an object can
borrow behavior from many classes by holding many references.

A **wrapper** holds a target object, exposes the **same set of methods**, and delegates
every request to it — possibly altering the result **before or after** passing it along.

A wrapper becomes a real Decorator when its reference field accepts **any object following
the component interface**, so wrappers can wrap wrappers. The client stacks decorators; the
last one in the stack is what it holds, and because every layer implements the base
interface, no client code can tell a bare notifier from a decorated one.

**Real-world analogy:** clothing. Cold → sweater. Still cold → jacket on top. Raining →
raincoat. Each garment extends your behavior without being part of you, and any of them can
come off.

## Participants

| Role | Responsibility |
|---|---|
| **Component** | Common interface for both wrappers and wrapped objects |
| **Concrete Component** | The class being wrapped; defines the basic behavior decorators alter |
| **Base Decorator** | Holds a reference to a wrapped object, **typed as the component interface** so it can hold concrete components *and* other decorators. Delegates everything |
| **Concrete Decorators** | Extra behaviors added dynamically. Override the base decorator's methods and run their behavior before or after calling the parent method |
| **Client** | Wraps components in as many layers as it likes, working through the component interface |

## Use when

- **You need to assign extra behaviors to objects at runtime without breaking the code that
  uses them.** Structure business logic into layers, one decorator per layer, and compose
  them per case.
- **Extending behavior via inheritance is awkward or impossible** — a `final` class can only
  be reused by wrapping it.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note that concrete decorators call `super.operation()`
rather than `this.component.operation()` — that's what makes decorator classes easy to
extend further.

```ts
/**
 * The base Component interface defines operations that can be altered by
 * decorators.
 */
interface Component {
    operation(): string;
}

/**
 * Concrete Components provide default implementations of the operations. There
 * might be several variations of these classes.
 */
class ConcreteComponent implements Component {
    public operation(): string {
        return 'ConcreteComponent';
    }
}

/**
 * The base Decorator class follows the same interface as the other components.
 * The primary purpose of this class is to define the wrapping interface for all
 * concrete decorators. The default implementation of the wrapping code might
 * include a field for storing a wrapped component and the means to initialize
 * it.
 */
class Decorator implements Component {
    protected component: Component;

    constructor(component: Component) {
        this.component = component;
    }

    /**
     * The Decorator delegates all work to the wrapped component.
     */
    public operation(): string {
        return this.component.operation();
    }
}

/**
 * Concrete Decorators call the wrapped object and alter its result in some way.
 */
class ConcreteDecoratorA extends Decorator {
    /**
     * Decorators may call parent implementation of the operation, instead of
     * calling the wrapped object directly. This approach simplifies extension
     * of decorator classes.
     */
    public operation(): string {
        return `ConcreteDecoratorA(${super.operation()})`;
    }
}

/**
 * Decorators can execute their behavior either before or after the call to a
 * wrapped object.
 */
class ConcreteDecoratorB extends Decorator {
    public operation(): string {
        return `ConcreteDecoratorB(${super.operation()})`;
    }
}

/**
 * The client code works with all objects using the Component interface. This
 * way it can stay independent of the concrete classes of components it works
 * with.
 */
function clientCode(component: Component) {
    // ...

    console.log(`RESULT: ${component.operation()}`);

    // ...
}

/**
 * This way the client code can support both simple components...
 */
const simple = new ConcreteComponent();
console.log('Client: I\'ve got a simple component:');
clientCode(simple);
console.log('');

/**
 * ...as well as decorated ones.
 *
 * Note how decorators can wrap not only simple components but the other
 * decorators as well.
 */
const decorator1 = new ConcreteDecoratorA(simple);
const decorator2 = new ConcreteDecoratorB(decorator1);
console.log('Client: Now I\'ve got a decorated component:');
clientCode(decorator2);
```

Output:

```
Client: I've got a simple component:
RESULT: ConcreteComponent

Client: Now I've got a decorated component:
RESULT: ConcreteDecoratorB(ConcreteDecoratorA(ConcreteComponent))
```

## Idiomatic TypeScript

**Higher-order functions are the decorator.** Same signature in, same signature out, with
behavior added around the call:

```ts
type Fetcher<Args extends unknown[], Result> = (...args: Args) => Promise<Result>

// Each decorator preserves the signature — that's the whole contract
const withRetry =
  <A extends unknown[], R>(fetcher: Fetcher<A, R>, attempts = 3): Fetcher<A, R> =>
  async (...args) => {
    let lastError: unknown
    for (let i = 0; i < attempts; i++) {
      try {
        return await fetcher(...args)
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  }

const withLogging =
  <A extends unknown[], R>(fetcher: Fetcher<A, R>, name: string): Fetcher<A, R> =>
  async (...args) => {
    const startedAt = performance.now()
    const result = await fetcher(...args)
    log.info(`${name} took ${performance.now() - startedAt}ms`)
    return result
  }

// Stacking reads outside-in: logging wraps retry wraps the raw call
const loadAccount = withLogging(withRetry(fetchAccount), 'loadAccount')
```

The object form stays useful when the component has **several methods** that must all be
wrapped consistently:

```ts
class CachedAccountRepository implements AccountRepository {
  constructor(
    private readonly inner: AccountRepository,
    private readonly cache: Map<string, Account> = new Map()
  ) {}

  async findById(id: string) {
    const hit = this.cache.get(id)
    if (hit) return hit
    const account = await this.inner.findById(id)
    this.cache.set(id, account)
    return account
  }

  async save(account: Account) {
    await this.inner.save(account)
    this.cache.delete(account.id)
  }
}
```

React HOCs (`withAuth(Component)`) and Express/Koa middleware are the same idea. Order
matters in all of them — see the cons.

## How to implement

1. Confirm the domain looks like **one primary component with multiple optional layers**
   over it.
2. Find the methods common to the component and the layers; declare them in a **component
   interface**.
3. Create the concrete component with the base behavior.
4. Create the **base decorator** with a field typed as the component interface, delegating
   all work to the wrapped object.
5. Make sure every class implements the component interface.
6. Create concrete decorators extending the base decorator, each running its behavior
   before or after the parent call.
7. **The client assembles the stack** — composition is the client's responsibility.

## Pros and cons

**Pros**

- Extend behavior without a new subclass.
- Add or remove responsibilities **at runtime**.
- Combine behaviors by wrapping in multiple decorators.
- **Single Responsibility Principle** — a monolith of behavior variants splits into small
  classes.

**Cons**

- Hard to **remove a specific wrapper** from the middle of a stack.
- Hard to write decorators whose behavior **doesn't depend on their order** in the stack.
- The initial layer-configuration code can look pretty ugly.

## Identification

Creation methods or constructors that **accept an object of the same class or interface as
the current class**. In functional TypeScript: a function taking a function and returning
one with the same signature.

## Relations with other patterns

- **Adapter** provides a *completely different* interface; Decorator keeps it the same or
  extends it, and supports **recursive composition** — impossible with Adapter.
- Quick discriminator: Adapter → *different* interface · **Proxy** → *same* interface ·
  Decorator → *enhanced* interface.
- **Chain of Responsibility** has nearly the same class structure, but CoR handlers run
  arbitrary operations independently and **may stop the request at any point**; decorators
  must stay consistent with the base interface and **may not break the flow**.
- **Composite** also uses recursive composition, but a Decorator has exactly **one child**
  and **adds responsibilities**, while a Composite **sums up** its children. They cooperate:
  decorate one node inside a Composite tree.
- Designs heavy in Composite and Decorator benefit from **Prototype** — clone structures
  instead of rebuilding them.
- **Decorator changes an object's skin; Strategy changes its guts.**
- **Proxy** shares the structure but not the intent: a Proxy usually **manages the life
  cycle** of its service object itself, whereas decorator composition is always **controlled
  by the client**.

## Anti-signals

- The wrapper changes the interface — that's an [Adapter](./adapter.md).
- Layers are order-sensitive in surprising ways and nothing documents the required order.
- A single behavior toggle would do: a boolean option beats a decorator class.
- You need to reach past a wrapper to the wrapped object; the abstraction is leaking.

## See also

[adapter](./adapter.md) · [proxy](./proxy.md) · [composite](./composite.md) · [chain-of-responsibility](./chain-of-responsibility.md) · [strategy](./strategy.md)
