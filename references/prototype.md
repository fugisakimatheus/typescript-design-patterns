# Prototype

**Category:** Creational · **Complexity:** ★☆☆ · **Popularity:** ★★☆
**Also known as:** Clone

## Intent

Copy existing objects **without making your code depend on their classes**.

## Problem

To duplicate an object "from the outside" you must create a new instance of the same class
and copy every field across. Two things break that:

- Some fields are **private** and invisible from outside the object.
- You must **know the concrete class** to construct the duplicate — and sometimes you only
  know the interface the object follows, because it arrived as a parameter typed by that
  interface.

## Solution

Delegate cloning **to the object being cloned**. Declare a common interface — usually a
single `clone` method — that every cloneable class implements. The client clones through
that interface and stays decoupled from the concrete class. Because an object can reach
the private fields of another object of the same class, `clone` can copy everything,
private fields included.

An object that supports cloning is a **prototype**. When objects have dozens of fields and
hundreds of possible configurations, **pre-built prototypes replace subclassing**: keep a
set of objects configured in various ways, and clone the one you want instead of building
from scratch.

**Real-world analogy:** not an industrial prototype (passive) but **mitotic cell
division** — the original takes an active role in producing the copy.

## Participants

**Basic**

| Role | Responsibility |
|---|---|
| **Prototype** | Interface declaring the cloning method(s), usually just `clone` |
| **Concrete Prototype** | Implements cloning: copies data and handles edge cases — linked objects, recursive dependencies |
| **Client** | Produces a copy of any object following the prototype interface |

**With a registry**

| Role | Responsibility |
|---|---|
| **Prototype Registry** | Catalog of frequently used, pre-built prototypes ready to copy. Simplest form is a `name → prototype` map; a richer one supports real search criteria |

## Use when

- **Your code shouldn't depend on the concrete classes of the objects it copies** — common
  when objects arrive from third-party code through an interface, so the concrete classes
  are unknown and unusable as dependencies.
- **You want to cut down subclasses that differ only in how they initialize.** Instead of a
  dummy subclass per configuration, keep pre-built prototypes and clone the matching one.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. The interesting part is the **back reference**: after
cloning, the nested object must point at the *clone*, not the original.

```ts
/**
 * The example class that has cloning ability. We'll see how the values of field
 * with different types will be cloned.
 */
class Prototype {
    public primitive: any;
    public component: object;
    public circularReference: ComponentWithBackReference;

    public clone(): this {
        const clone = Object.create(this);

        clone.component = Object.create(this.component);

        // Cloning an object that has a nested object with backreference
        // requires special treatment. After the cloning is completed, the
        // nested object should point to the cloned object, instead of the
        // original object. Spread operator can be handy for this case.
        clone.circularReference = new ComponentWithBackReference(clone);

        return clone;
    }
}

class ComponentWithBackReference {
    public prototype;

    constructor(prototype: Prototype) {
        this.prototype = prototype;
    }
}

/**
 * The client code.
 */
function clientCode() {
    const p1 = new Prototype();
    p1.primitive = 245;
    p1.component = new Date();
    p1.circularReference = new ComponentWithBackReference(p1);

    const p2 = p1.clone();
    if (p1.primitive === p2.primitive) {
        console.log('Primitive field values have been carried over to a clone. Yay!');
    } else {
        console.log('Primitive field values have not been copied. Booo!');
    }
    if (p1.component === p2.component) {
        console.log('Simple component has not been cloned. Booo!');
    } else {
        console.log('Simple component has been cloned. Yay!');
    }

    if (p1.circularReference === p2.circularReference) {
        console.log('Component with back reference has not been cloned. Booo!');
    } else {
        console.log('Component with back reference has been cloned. Yay!');
    }

    if (p1.circularReference.prototype === p2.circularReference.prototype) {
        console.log('Component with back reference is linked to original object. Booo!');
    } else {
        console.log('Component with back reference is linked to the clone. Yay!');
    }
}

clientCode();
```

Output:

```
Primitive field values have been carried over to a clone. Yay!
Simple component has been cloned. Yay!
Component with back reference has been cloned. Yay!
Component with back reference is linked to the clone. Yay!
```

> The example uses `any` and `Object.create` to demonstrate JS semantics. Don't copy that
> style into production code — see the idiomatic section below.

## Idiomatic TypeScript

JavaScript ships cloning primitives, so Prototype is mostly a **registry of presets** here
rather than a `clone()` hierarchy:

```ts
// A typed clone contract — no `any`, no Object.create
interface Cloneable<T> {
  clone(): T
}

// Preset registry: the pattern's real payoff in TS — configuration without subclasses
const notificationPresets = {
  critical: { channel: 'push', retries: 5, ttlSeconds: 60 },
  digest: { channel: 'email', retries: 1, ttlSeconds: 86_400 }
} as const satisfies Record<string, NotificationSpec>

type PresetName = keyof typeof notificationPresets

// structuredClone handles nested objects, Maps, Sets, Dates and cycles — unlike a spread
export const fromPreset = (name: PresetName, overrides: Partial<NotificationSpec> = {}): NotificationSpec => ({
  ...structuredClone(notificationPresets[name]),
  ...overrides
})
```

Cloning depth, ranked:

| Tool | Depth | Handles cycles | Notes |
|---|---|---|---|
| `{ ...obj }` / `Object.assign` | shallow | no | Nested objects stay shared — the usual bug |
| `structuredClone(obj)` | deep | **yes** | Native; drops functions, class identity, DOM nodes |
| Hand-written `clone()` | exact | you decide | Needed when identity, functions, or back references matter |

In a React codebase, the corresponding move is **immutable update helpers** (immer's
`produce`, or a spread-per-level update) — same goal, copy without touching the original,
with structural sharing instead of a full deep copy.

## How to implement

1. Create the prototype interface with a `clone` method, or add the method to every class
   of an existing hierarchy.
2. Give each prototype class an **alternative constructor accepting an instance of itself**
   that copies all fields. In a subclass, call the parent constructor so the superclass
   copies its own private fields. (Where the language has no overloading — JavaScript
   included — do the copying inside `clone` instead; a constructor is safer because the
   object is fully configured the moment `new` returns.)
3. The cloning method is usually one line: `new` with the prototype constructor. **Every
   class must override it with its own class name**, or clones come back as the parent
   class.
4. Optionally add a **centralized prototype registry** — a factory class, or a static
   method on the base prototype — that looks a prototype up by tag or richer criteria,
   clones it, and returns the copy. Then replace direct subclass constructor calls with
   calls to the registry.

## Pros and cons

**Pros**

- Clone objects without coupling to their concrete classes.
- Drops repeated initialization code in favor of cloning pre-built prototypes.
- Produces complex objects conveniently.
- An alternative to inheritance for configuration presets.

**Cons**

- Cloning complex objects with **circular references** is tricky.

## Identification

A `clone` or `copy` method on the object itself. In TypeScript, also a module exposing
named preset objects that callers copy rather than construct.

## Relations with other patterns

- Many designs **start with Factory Method** and evolve toward **Abstract Factory**,
  Prototype, or **Builder**.
- Abstract Factory classes can be **composed using Prototype** instead of factory methods.
- Helps **Command** when copies of commands must be kept in history.
- Designs heavy in **Composite** and **Decorator** benefit: clone the complex structure
  instead of rebuilding it.
- Prototype isn't inheritance-based (no subclass explosion) but needs complicated clone
  initialization; **Factory Method** is inheritance-based with no initialization step.
- Can be a **simpler alternative to Memento** when the state is straightforward and has no
  links to external resources (or links that are easy to re-establish).
- Abstract Factories, Builders and Prototypes can all be **Singletons**.

## Anti-signals

- Objects hold non-clonable resources — sockets, file handles, subscriptions. Cloning
  silently duplicates the handle.
- A shallow copy is passed off as a clone: the original and the copy share nested state and
  mutating one corrupts the other.
- The clone needs a fresh identity (id, timestamps, version) but the pattern copies the old
  values — decide explicitly what does *not* get copied.

## See also

[factory-method](./factory-method.md) · [abstract-factory](./abstract-factory.md) · [memento](./memento.md) · [composite](./composite.md) · [decorator](./decorator.md)
