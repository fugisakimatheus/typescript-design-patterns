# Facade

**Category:** Structural · **Complexity:** ★☆☆ · **Popularity:** ★★☆

## Intent

Provide a **simplified interface** to a library, a framework, or any other complex set of
classes.

## Problem

To work with a sophisticated library you must initialize a pile of objects, track their
dependencies, call methods in the right order. Your business logic ends up **tightly
coupled to the implementation details of third-party classes** — hard to read, hard to
maintain.

## Solution

A facade is a class offering a **simple interface to a complex subsystem**. It deliberately
exposes **less** than the subsystem does — only the features clients actually care about.

An app that uploads short cat videos might depend on a professional video conversion
library with dozens of features, but all it needs is `encode(filename, format)`. Write that
class, wire it to the library, and you have your first facade.

**Real-world analogy:** phoning a shop to place an order. The operator is your facade to
every service and department — a simple voice interface over the ordering system, payment
gateways, and delivery services.

## Participants

| Role | Responsibility |
|---|---|
| **Facade** | Convenient access to part of the subsystem's functionality. Knows where to route each request and how to drive all the moving parts |
| **Additional Facade** | An extra facade preventing one facade from collecting unrelated features and becoming complex itself. Usable by clients *and* by other facades |
| **Complex Subsystem** | Dozens of objects requiring correct initialization order and data formats. **Unaware the facade exists** — subsystem classes go on talking to each other directly |
| **Client** | Uses the facade instead of the subsystem objects |

## Use when

- **You need a limited but straightforward interface to a complex subsystem.** Subsystems
  grow more complex over time — applying design patterns alone adds classes — and the
  configuration and boilerplate demanded of clients grows with them. The facade is a
  shortcut to the most-used features that fit most requests.
- **You want to structure a subsystem into layers.** Define one facade per level and make
  subsystems talk only through facades — coupling drops. (Video framework → a video layer
  and an audio layer, each behind a facade. This starts to resemble **Mediator**.)

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note the constructor: the facade can accept existing
subsystem objects or create its own — the second half of "facades usually manage the full
life cycle of what they use".

```ts
/**
 * The Facade class provides a simple interface to the complex logic of one or
 * several subsystems. The Facade delegates the client requests to the
 * appropriate objects within the subsystem. The Facade is also responsible for
 * managing their lifecycle. All of this shields the client from the undesired
 * complexity of the subsystem.
 */
class Facade {
    protected subsystem1: Subsystem1;

    protected subsystem2: Subsystem2;

    /**
     * Depending on your application's needs, you can provide the Facade with
     * existing subsystem objects or force the Facade to create them on its own.
     */
    constructor(subsystem1?: Subsystem1, subsystem2?: Subsystem2) {
        this.subsystem1 = subsystem1 || new Subsystem1();
        this.subsystem2 = subsystem2 || new Subsystem2();
    }

    /**
     * The Facade's methods are convenient shortcuts to the sophisticated
     * functionality of the subsystems. However, clients get only to a fraction
     * of a subsystem's capabilities.
     */
    public operation(): string {
        let result = 'Facade initializes subsystems:\n';
        result += this.subsystem1.operation1();
        result += this.subsystem2.operation1();
        result += 'Facade orders subsystems to perform the action:\n';
        result += this.subsystem1.operationN();
        result += this.subsystem2.operationZ();

        return result;
    }
}

/**
 * The Subsystem can accept requests either from the facade or client directly.
 * In any case, to the Subsystem, the Facade is yet another client, and it's not
 * a part of the Subsystem.
 */
class Subsystem1 {
    public operation1(): string {
        return 'Subsystem1: Ready!\n';
    }

    // ...

    public operationN(): string {
        return 'Subsystem1: Go!\n';
    }
}

/**
 * Some facades can work with multiple subsystems at the same time.
 */
class Subsystem2 {
    public operation1(): string {
        return 'Subsystem2: Get ready!\n';
    }

    // ...

    public operationZ(): string {
        return 'Subsystem2: Fire!';
    }
}

/**
 * The client code works with complex subsystems through a simple interface
 * provided by the Facade. When a facade manages the lifecycle of the subsystem,
 * the client might not even know about the existence of the subsystem. This
 * approach lets you keep the complexity under control.
 */
function clientCode(facade: Facade) {
    // ...

    console.log(facade.operation());

    // ...
}

/**
 * The client code may have some of the subsystem's objects already created. In
 * this case, it might be worthwhile to initialize the Facade with these objects
 * instead of letting the Facade create new instances.
 */
const subsystem1 = new Subsystem1();
const subsystem2 = new Subsystem2();
const facade = new Facade(subsystem1, subsystem2);
clientCode(facade);
```

Output:

```
Facade initializes subsystems:
Subsystem1: Ready!
Subsystem2: Get ready!
Facade orders subsystems to perform the action:
Subsystem1: Go!
Subsystem2: Fire!
```

## Idiomatic TypeScript

A **module with a few exported functions** is the everyday facade. No class needed:

```ts
// checkout/index.ts — the only thing feature code imports
import { reserveInventory, releaseInventory } from './inventory'
import { authorizePayment, capturePayment } from './payments'
import { createShipment } from './logistics'
import { emitOrderPlaced } from './events'

// One call replaces the five-step dance and its ordering rules
export const placeOrder = async (cart: Cart, payment: PaymentToken): Promise<Order> => {
  const reservation = await reserveInventory(cart)
  const authorization = await authorizePayment(payment, cart.totalCents)

  try {
    const order = await createOrder(cart, authorization)
    await capturePayment(authorization)
    await createShipment(order)
    emitOrderPlaced(order)
    return order
  } catch (error) {
    await releaseInventory(reservation)
    throw error
  }
}
```

Two familiar frontend instances of the same pattern:

- A **public barrel** (`index.ts`) exporting a slice's few supported entry points while the
  internals stay private — the facade *is* the module boundary.
- A **custom hook** (`useAccountDetails(id)`) that hides query keys, cache wiring, derived
  state and mutations behind one return value.

Keep a facade **thin and additive**: it orchestrates and simplifies, it does not own
business rules and it does not block direct subsystem access for the rare caller that
legitimately needs it.

## How to implement

1. Check whether a **simpler interface than the subsystem's own** is possible. You're on
   track if it makes client code independent of many subsystem classes.
2. Declare and implement that interface in a new facade class, redirecting calls to the
   right subsystem objects. The facade is also responsible for **initializing the subsystem
   and managing its life cycle**, unless the client already does that.
3. For the full benefit, route **all** client communication through the facade. Then a
   subsystem upgrade only touches the facade.
4. If the facade grows too big, extract part of its behavior into a **refined facade**.

## Pros and cons

**Pros**

- Isolates your code from subsystem complexity.

**Cons**

- A facade can become a **god object** coupled to every class in the app.

## Identification

A class with a simple interface that **delegates most of its work to other classes**, and
usually manages the full life cycle of the objects it uses.

## Relations with other patterns

- **Facade defines a new interface** over an entire subsystem; **Adapter** makes an
  *existing* interface usable and usually wraps one object.
- **Abstract Factory** can replace a Facade when all you want to hide is how subsystem
  objects are *created*.
- **Flyweight** is about making many little objects; Facade is about making **one object
  that stands for a whole subsystem**.
- **Mediator** does a similar job — organizing collaboration among tightly coupled classes —
  but: a Facade adds **no new functionality** and the subsystem is unaware of it, with
  components still free to talk directly; a **Mediator centralizes** communication and
  components know only the mediator.
- A Facade class can often become a **Singleton** — one instance usually suffices.
- **Proxy** also buffers a complex entity and initializes it itself, but a Proxy has the
  **same interface** as its service object, making them interchangeable.

## Anti-signals

- The facade has grown dozens of methods and imports from everywhere — split it into
  refined facades before it becomes the god object.
- It adds business rules rather than orchestration; those belong in the subsystem.
- It is a pure pass-through with one method per subsystem method — it simplifies nothing.

## See also

[adapter](./adapter.md) · [mediator](./mediator.md) · [proxy](./proxy.md) · [abstract-factory](./abstract-factory.md) · [singleton](./singleton.md) · [flyweight](./flyweight.md)
