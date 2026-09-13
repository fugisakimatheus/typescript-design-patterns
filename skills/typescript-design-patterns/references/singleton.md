# Singleton

**Category:** Creational · **Complexity:** ★☆☆ · **Popularity:** ★★☆

> **Read this one with suspicion.** Modern architectural guidance says it plainly:
> *"A lot of developers consider the Singleton pattern an antipattern. That's why its usage
> is on the decline in TypeScript code."* Know it so you can recognize it and replace it —
> not so you reach for it first.

## Intent

Ensure a class has **only one instance**, and provide a **global access point** to it.

## Problem

Singleton solves two problems at once — which is itself a **violation of the Single
Responsibility Principle**:

1. **One instance only.** Usually to control access to a shared resource such as a database
   or a file. A regular constructor can't do this: by design a constructor call always
   returns a new object. Clients may not even realize they keep getting the same object.
2. **A global access point.** Global variables are handy but unsafe — any code can
   overwrite them and crash the app. Singleton gives the same reach while protecting the
   instance from being replaced.

And the code enforcing #1 shouldn't be scattered across the program; keeping it in one
class is better, especially when the rest of the code already depends on it.

**Real-world analogy:** a country's government. Whoever the individuals are, "The
Government of X" is a single global access point identifying the group in charge.

## Solution

Every implementation shares two steps:

1. **Make the default constructor private**, so no one can `new` the class.
2. **Add a static creation method** that acts as a constructor: it calls the private
   constructor, caches the object in a static field, and returns that cached object on
   every subsequent call.

## Participants

| Role | Responsibility |
|---|---|
| **Singleton** | Declares the static `getInstance` method returning the one instance. The constructor is hidden from clients; `getInstance` is the only way in |

## Use when

- **A class should have exactly one instance available to all clients** — one database
  object shared by different parts of the program.
- **You need stricter control over a global variable.** Unlike a global, Singleton
  guarantees the single instance and nothing but the Singleton class itself can replace it.

You can relax the limit later and allow N instances: only the body of `getInstance` changes.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Uses a `#` private static field and a static getter.

```ts
/**
 * The Singleton class defines an `instance` getter, that lets clients access
 * the unique singleton instance.
 */
class Singleton {
    static #instance: Singleton;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() { }

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): Singleton {
        if (!Singleton.#instance) {
            Singleton.#instance = new Singleton();
        }

        return Singleton.#instance;
    }

    /**
     * Finally, any singleton can define some business logic, which can be
     * executed on its instance.
     */
    public someBusinessLogic() {
        // ...
    }
}

/**
 * The client code.
 */
function clientCode() {
    const s1 = Singleton.instance;
    const s2 = Singleton.instance;

    if (s1 === s2) {
        console.log(
            'Singleton works, both variables contain the same instance.'
        );
    } else {
        console.log('Singleton failed, variables contain different instances.');
    }
}

clientCode();
```

Output:

```
Singleton works, both variables contain the same instance.
```

## Idiomatic TypeScript

**ES modules are already singletons.** A module body runs once per module graph and the
exported binding is shared by every importer — no class, no static field, no lazy-init
dance:

```ts
// logger.ts — this IS a singleton
const transport = createTransport(env.LOG_LEVEL)

export const log = {
  info: (msg: string, meta?: LogMeta) => transport.write('info', msg, meta),
  error: (msg: string, meta?: LogMeta) => transport.write('error', msg, meta)
}
```

Add **lazy initialization** only when construction is expensive or must happen after some
bootstrap step:

```ts
let client: ApiClient | undefined

export const getApiClient = (): ApiClient => (client ??= new ApiClient(config))

// Exported for tests — the escape hatch a class singleton famously lacks
export const resetApiClient = () => {
  client = undefined
}
```

**What to prefer instead, and when:**

| Need | Better than Singleton |
|---|---|
| One shared value across a React tree | Context provider — scoped, swappable per test/story |
| Shared client state | A store module (Zustand and friends) — one instance, but with a documented reset |
| One dependency injected everywhere | Pass it as a parameter, or build it once in composition root — testable without globals |
| One config object | A frozen exported constant |

Note the SSR trap: in a server runtime, module-level mutable state is shared **across
requests**. Anything request-scoped (current user, locale, request id) must never live in a
singleton.

## How to implement

1. Add a private static field to hold the instance.
2. Declare a public static creation method to get it.
3. Implement **lazy initialization** inside that method: create on first call, store, and
   return the same instance afterwards.
4. Make the constructor private — the static method can still call it, other objects can't.
5. Replace every direct constructor call in client code with the static creation method.

## Pros and cons

**Pros**

- Guaranteed single instance.
- A global access point to it.
- Initialized only on first request.

**Cons**

- **Violates the Single Responsibility Principle** — it solves two problems at once.
- **Masks bad design**: components end up knowing too much about each other.
- Needs special treatment in **multithreaded** environments so threads don't each create
  one. (Not an issue on the JS main thread, but relevant across workers, which each get
  their own module graph and therefore their *own* "singleton".)
- **Hard to unit test.** Mock frameworks lean on inheritance; the constructor is private and
  static methods can't be overridden in most languages. Practical advice:
  *"Or just don't write the tests. Or don't use the Singleton pattern."*
- Breaks modularity: a class that depends on a Singleton can't be reused in another context
  without dragging the Singleton along.

## Identification

A static creation method (or static getter) that returns the same cached object. In
TypeScript, also a module exporting a mutable, lazily-created instance.

## Relations with other patterns

- A **Facade** can often become a Singleton — one facade object usually suffices.
- **Flyweight** looks similar if all shared state collapses into one object, but: there is
  only ever one Singleton instance whereas a Flyweight class has many instances with
  different intrinsic states, and a Singleton **can be mutable** while flyweights are
  **immutable**.
- **Abstract Factories**, **Builders** and **Prototypes** can all be implemented as
  Singletons.

## Anti-signals

- You want it for **convenient reach**, not for a genuine one-instance invariant — that's a
  global variable with extra steps. Inject the dependency instead.
- The state is **request- or user-scoped** and the code runs on a server (SSR, route
  handlers): a singleton leaks data between requests.
- Tests need to start from a clean slate and there's no reset path.
- Two features need slightly different configurations of "the" instance — the invariant was
  never real.

## See also

[facade](./facade.md) · [flyweight](./flyweight.md) · [abstract-factory](./abstract-factory.md) · [builder](./builder.md) · [prototype](./prototype.md)
