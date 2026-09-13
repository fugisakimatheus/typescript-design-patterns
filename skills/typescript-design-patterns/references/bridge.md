# Bridge

**Category:** Structural · **Complexity:** ★★★ · **Popularity:** ★☆☆

## Intent

Split a large class, or a set of closely related classes, into **two separate hierarchies —
abstraction and implementation — that can be developed independently**.

## Problem

A `Shape` class has subclasses `Circle` and `Square`. Add colors and you need `BlueCircle`,
`RedCircle`, `BlueSquare`, `RedSquare` — **four** combinations. Add `Triangle`: two more
subclasses. Add a third color: three more. The hierarchy grows geometrically because you're
extending in **two independent dimensions** at once.

## Solution

Swap inheritance for **composition**. Extract one dimension into its own hierarchy and have
the original class hold a **reference** to it. Color code moves to a `Color` hierarchy
(`Red`, `Blue`); `Shape` gets a color field and delegates color work to it. That reference
is the **bridge**. New colors no longer touch the shape hierarchy, and vice versa.

### Abstraction and Implementation, decoded

The GoF terms sound more academic than the idea is:

- **Abstraction** (a.k.a. *interface*) — the **high-level control layer** for an entity. It
  does no real work itself; it delegates to the implementation layer.
- **Implementation** (a.k.a. *platform*) — the layer that does the actual work.

These are **not** the `interface` / `abstract class` keywords of your language.

In a real app the abstraction might be the **GUI** and the implementation the **OS API** it
calls. Such an app extends in two independent directions: several GUIs (customer, admin)
and several APIs (Windows, Linux, macOS). Without Bridge you get spaghetti — hundreds of
conditionals tying GUI kinds to API kinds. With Bridge the GUI classes change without
touching the API classes, and supporting one more OS means one more implementation
subclass.

## Participants

| Role | Responsibility |
|---|---|
| **Abstraction** | High-level control logic; relies on the implementation object for the low-level work |
| **Implementation** | Interface common to all concrete implementations. The abstraction may only talk to implementations through it |
| **Concrete Implementations** | Platform-specific code |
| **Refined Abstractions** | Variants of the control logic; still work through the general implementation interface |
| **Client** | Cares only about the abstraction — but it is the client's job to **link** an abstraction to an implementation |

The two interfaces **need not match**. Typically the implementation offers **primitive
operations** and the abstraction composes **higher-level behaviors** out of them.

## Use when

- **You want to divide and organize a monolithic class with several variants of some
  functionality** (e.g. a class that can talk to various database servers). Splitting it
  into hierarchies lets each change independently and cuts the risk of breaking the rest.
- **You need to extend a class in several orthogonal dimensions.** One hierarchy per
  dimension; the original class delegates instead of doing everything.
- **You need to switch implementations at runtime.** Optional, but Bridge makes it a field
  assignment.

> That last point is why Bridge is so often confused with **Strategy**. The structure is the
> same; the *intent* differs — Bridge organizes two dimensions of a design up-front,
> Strategy swaps interchangeable algorithms.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation.

```ts
/**
 * The Abstraction defines the interface for the "control" part of the two class
 * hierarchies. It maintains a reference to an object of the Implementation
 * hierarchy and delegates all of the real work to this object.
 */
class Abstraction {
    protected implementation: Implementation;

    constructor(implementation: Implementation) {
        this.implementation = implementation;
    }

    public operation(): string {
        const result = this.implementation.operationImplementation();
        return `Abstraction: Base operation with:\n${result}`;
    }
}

/**
 * You can extend the Abstraction without changing the Implementation classes.
 */
class ExtendedAbstraction extends Abstraction {
    public operation(): string {
        const result = this.implementation.operationImplementation();
        return `ExtendedAbstraction: Extended operation with:\n${result}`;
    }
}

/**
 * The Implementation defines the interface for all implementation classes. It
 * doesn't have to match the Abstraction's interface. In fact, the two
 * interfaces can be entirely different. Typically the Implementation interface
 * provides only primitive operations, while the Abstraction defines higher-
 * level operations based on those primitives.
 */
interface Implementation {
    operationImplementation(): string;
}

/**
 * Each Concrete Implementation corresponds to a specific platform and
 * implements the Implementation interface using that platform's API.
 */
class ConcreteImplementationA implements Implementation {
    public operationImplementation(): string {
        return 'ConcreteImplementationA: Here\'s the result on the platform A.';
    }
}

class ConcreteImplementationB implements Implementation {
    public operationImplementation(): string {
        return 'ConcreteImplementationB: Here\'s the result on the platform B.';
    }
}

/**
 * Except for the initialization phase, where an Abstraction object gets linked
 * with a specific Implementation object, the client code should only depend on
 * the Abstraction class. This way the client code can support any abstraction-
 * implementation combination.
 */
function clientCode(abstraction: Abstraction) {
    // ..

    console.log(abstraction.operation());

    // ..
}

/**
 * The client code should be able to work with any pre-configured abstraction-
 * implementation combination.
 */
let implementation = new ConcreteImplementationA();
let abstraction = new Abstraction(implementation);
clientCode(abstraction);

console.log('');

implementation = new ConcreteImplementationB();
abstraction = new ExtendedAbstraction(implementation);
clientCode(abstraction);
```

Output:

```
Abstraction: Base operation with:
ConcreteImplementationA: Here's the result on the platform A.

ExtendedAbstraction: Extended operation with:
ConcreteImplementationB: Here's the result on the platform B.
```

## Idiomatic TypeScript

The pattern shows up most clearly as **a port with several drivers**, where the high-level
service composes primitives it doesn't implement:

```ts
// Implementation side: primitives only, one per provider
interface PaymentGateway {
  charge(amountCents: number, token: string): Promise<GatewayResult>
  refund(chargeId: string): Promise<GatewayResult>
}

class StripeGateway implements PaymentGateway {
  /* ... */
}
class PagarmeGateway implements PaymentGateway {
  /* ... */
}

// Abstraction side: higher-level control logic, written once
class Checkout {
  constructor(protected readonly gateway: PaymentGateway) {}

  async pay(order: Order, token: string) {
    const result = await this.gateway.charge(order.totalCents, token)
    return result.ok ? markPaid(order, result.id) : markFailed(order, result.error)
  }
}

// Refined abstraction: a variant of the control logic, still provider-agnostic
class InstallmentCheckout extends Checkout {
  async pay(order: Order, token: string) {
    const chunks = splitInstallments(order)
    /* ...compose the same primitives differently... */
  }
}

// The client links the two — and only here does a provider name appear
const checkout = new InstallmentCheckout(new StripeGateway())
```

In React, the same split is **headless logic + renderer**: a hook (or context) holds the
control logic while the visual layer is swapped freely. Two dimensions — behavior and
presentation — each free to grow.

## How to implement

1. **Identify the orthogonal dimensions**: abstraction/platform, domain/infrastructure,
   frontend/backend, interface/implementation.
2. Work out the operations the client needs and put them on the base abstraction.
3. Work out which operations are available on **all** platforms; declare the ones the
   abstraction needs in the general implementation interface.
4. Create a concrete implementation class per platform, all following that interface.
5. Add a reference field for the implementation inside the abstraction, and delegate most
   of the work to it.
6. If there are several variants of high-level logic, create **refined abstractions** by
   extending the base abstraction.
7. The client passes an implementation into the abstraction's constructor, then forgets
   about implementations and works with the abstraction only.

## Pros and cons

**Pros**

- Platform-independent classes and apps.
- Client code works with high-level abstractions, never exposed to platform details.
- **Open/Closed Principle** — abstractions and implementations grow independently.
- **Single Responsibility Principle** — high-level logic and platform details are separated.

**Cons**

- Applying it to a **highly cohesive class** just makes the code more complicated.

## Identification

A clear separation between a **controlling entity** and several different **platforms** it
relies on, linked by a reference passed in at construction.

## Relations with other patterns

- **Bridge is designed up-front**, letting parts of an app be developed independently;
  **Adapter** is applied to an existing app to reconcile incompatible classes.
- **Bridge**, **State**, **Strategy** (and to a degree Adapter) share the composition-based
  structure but address different problems.
- **Abstract Factory** pairs with Bridge when some abstractions only work with specific
  implementations — the factory encapsulates those pairings and hides them from the client.
- **Builder** combines with Bridge: the director is the abstraction, the builders are the
  implementations.

## Anti-signals

- Only one implementation exists and no second is planned — you've added indirection for
  nothing.
- The dimensions aren't truly independent: every new abstraction needs a matching
  implementation change.
- What you actually want is to **swap an algorithm at runtime** — that's [Strategy](./strategy.md),
  and calling it Bridge misleads the next reader.

## See also

[adapter](./adapter.md) · [strategy](./strategy.md) · [state](./state.md) · [abstract-factory](./abstract-factory.md) · [builder](./builder.md)
