# Factory Method

**Category:** Creational · **Complexity:** ★☆☆ · **Popularity:** ★★★
**Also known as:** Virtual Constructor

## Intent

Provide an interface for creating objects in a superclass, but allow subclasses to alter the type of objects that will be created.

## Problem

A logistics app starts with everything coupled to a `Truck` class. When sea transport
has to be added, `Ship` cannot slot in without touching the whole codebase, and the code
fills up with conditionals that switch behavior on the transport's concrete class. Every
new transport type repeats the same edit.

## Solution

Replace direct `new` calls with calls to a **factory method**. Objects are still built
with `new`, but from inside that method, so a subclass can override it and change the
class of the returned **product**.

The constraint: subclasses may only return different products if those products share a
common base class or interface, and the factory method's declared return type must be
that interface. Client code then treats every product as the abstract type — it knows
`Transport` has `deliver()`, not how any particular one works.

## Participants

| Role | Responsibility |
|---|---|
| **Product** | Interface common to every object the creator can produce |
| **Concrete Products** | The different implementations of that interface |
| **Creator** | Declares the factory method whose return type is the product interface. Despite the name, creating products is *not* its primary job — it holds core business logic that consumes products. The method may be `abstract`, or return a default product |
| **Concrete Creators** | Override the factory method to return a different product type |

A factory method does **not** have to build a fresh instance every call — it may return a
cached object, one from a pool, or any other source.

## Use when

- **You don't know beforehand the exact types and dependencies** your code must work
  with. Construction is separated from use, so adding a product type means one new
  creator subclass, not edits across the app.
- **You want to let users of your library or framework extend its internal components.**
  Funnel all component construction into one overridable factory method: a consumer
  subclasses `UIFramework` into `UIWithRoundButtons`, overrides `createButton()`, and the
  framework picks up their `RoundButton` with no other change.
- **You want to reuse existing objects instead of rebuilding them** (DB connections, file
  handles, sockets). A constructor must return a new object by definition; a factory
  method can hand back a pooled one.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation — canonical structure, roles named after their part.

```ts
/**
 * The Creator class declares the factory method that is supposed to return an
 * object of a Product class. The Creator's subclasses usually provide the
 * implementation of this method.
 */
abstract class Creator {
    /**
     * Note that the Creator may also provide some default implementation of the
     * factory method.
     */
    public abstract factoryMethod(): Product;

    /**
     * Also note that, despite its name, the Creator's primary responsibility is
     * not creating products. Usually, it contains some core business logic that
     * relies on Product objects, returned by the factory method. Subclasses can
     * indirectly change that business logic by overriding the factory method
     * and returning a different type of product from it.
     */
    public someOperation(): string {
        // Call the factory method to create a Product object.
        const product = this.factoryMethod();
        // Now, use the product.
        return `Creator: The same creator's code has just worked with ${product.operation()}`;
    }
}

/**
 * Concrete Creators override the factory method in order to change the
 * resulting product's type.
 */
class ConcreteCreator1 extends Creator {
    /**
     * Note that the signature of the method still uses the abstract product
     * type, even though the concrete product is actually returned from the
     * method. This way the Creator can stay independent of concrete product
     * classes.
     */
    public factoryMethod(): Product {
        return new ConcreteProduct1();
    }
}

class ConcreteCreator2 extends Creator {
    public factoryMethod(): Product {
        return new ConcreteProduct2();
    }
}

/**
 * The Product interface declares the operations that all concrete products must
 * implement.
 */
interface Product {
    operation(): string;
}

/**
 * Concrete Products provide various implementations of the Product interface.
 */
class ConcreteProduct1 implements Product {
    public operation(): string {
        return '{Result of the ConcreteProduct1}';
    }
}

class ConcreteProduct2 implements Product {
    public operation(): string {
        return '{Result of the ConcreteProduct2}';
    }
}

/**
 * The client code works with an instance of a concrete creator, albeit through
 * its base interface. As long as the client keeps working with the creator via
 * the base interface, you can pass it any creator's subclass.
 */
function clientCode(creator: Creator) {
    // ...
    console.log('Client: I\'m not aware of the creator\'s class, but it still works.');
    console.log(creator.someOperation());
    // ...
}

/**
 * The Application picks a creator's type depending on the configuration or
 * environment.
 */
console.log('App: Launched with the ConcreteCreator1.');
clientCode(new ConcreteCreator1());
console.log('');

console.log('App: Launched with the ConcreteCreator2.');
clientCode(new ConcreteCreator2());
```

Output:

```
App: Launched with the ConcreteCreator1.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct1}

App: Launched with the ConcreteCreator2.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct2}
```

## Idiomatic TypeScript

In TypeScript the creator subclass hierarchy is usually overkill. The pattern's value —
*construction is a replaceable, typed seam* — survives with a plain function, and the
discriminated union makes the mapping exhaustive at compile time.

```ts
// The product contract — one interface, several implementations
interface Transport {
  readonly kind: TransportKind
  deliver(cargo: Cargo): Promise<DeliveryReceipt>
}

type TransportKind = 'road' | 'sea' | 'air'

// A Record keyed by the union: adding a member to TransportKind breaks the build here,
// which is exactly the safety a switch/default factory would silently lose.
const transportFactories: Record<TransportKind, () => Transport> = {
  road: () => new RoadTransport(),
  sea: () => new SeaTransport(),
  air: () => new AirTransport()
}

export const createTransport = (kind: TransportKind): Transport => transportFactories[kind]()

// The consumer stays coupled to Transport only
const shipOrder = async (kind: TransportKind, cargo: Cargo) => createTransport(kind).deliver(cargo)
```

Pick the class-based form when the creator genuinely carries business logic that
subclasses must specialize *along with* the product (the `Dialog.render()` case). Pick the
function + `Record` form when the only thing that varies is which object comes back.

## How to implement

1. Make all products follow the same interface, declaring methods that make sense for
   every product.
2. Add an empty factory method to the creator class, returning the product interface.
3. Find every product constructor call in the creator and replace it with a call to the
   factory method, moving the construction code inside. A temporary parameter selecting
   the product type is fine at this stage — a big `switch` here is expected.
4. Create a creator subclass per product type, override the factory method in each, and
   move the matching construction branch into it.
5. If there are too many product types to justify a subclass each, keep the control
   parameter: `GroundMail.createTransport(kind)` can serve both `Truck` and `Train`.
6. If the base factory method ended up empty, make it `abstract`; if something remains,
   keep it as the default behavior.

## Pros and cons

**Pros**

- Avoids tight coupling between the creator and the concrete products.
- **Single Responsibility Principle** — product creation lives in one place.
- **Open/Closed Principle** — new product types don't break existing client code.

**Cons**

- The code gets more complicated: the pattern needs a lot of new subclasses. It pays off
  best when introduced into a creator hierarchy that already exists.

## Identification

Creation methods that construct objects from concrete classes while declaring the return
type as an abstract class or interface. If the return type is the concrete class, it's a
plain helper, not a factory method.

## Relations with other patterns

- Many designs **start with Factory Method** (simpler, customizable via subclasses) and
  evolve toward **Abstract Factory**, **Prototype**, or **Builder** (more flexible, more
  complicated).
- **Abstract Factory** classes are often built out of a set of factory methods.
- Pairs with **Iterator** so collection subclasses return matching iterator types.
- **Prototype** isn't inheritance-based so it avoids the subclass explosion, but it needs
  complicated initialization of the clone; Factory Method needs no initialization step.
- Factory Method is a **specialization of Template Method**, and can also be one step
  inside a larger template method.

## Anti-signals

- Only one product type exists and no second is planned — `new` is clearer.
- The "factory" returns a concrete class the caller then narrows anyway; the abstraction
  buys nothing.
- Choosing between a fixed, closed set of products in TypeScript: a `Record<Union, …>`
  lookup gives exhaustiveness that a creator hierarchy does not.

## See also

[abstract-factory](./abstract-factory.md) · [builder](./builder.md) · [prototype](./prototype.md) · [template-method](./template-method.md)
