# Builder

**Category:** Creational · **Complexity:** ★★☆ · **Popularity:** ★★★

## Intent

Construct complex objects **step by step**, producing different types and representations
of an object with the same construction code.

## Problem

A complex object needs laborious, step-by-step initialization of many fields and nested
objects. That code usually ends up buried in a monstrous constructor with a long parameter
list, or scattered across the client.

Building a `House` means four walls, a floor, a door, windows, a roof — but some houses
also want a backyard, heating, plumbing, wiring. Two bad escapes:

- **Subclass per configuration.** The hierarchy explodes; every new parameter (porch
  style) multiplies it again.
- **One giant constructor with every parameter.** No subclasses, but most parameters are
  unused most of the time, so nine calls in ten pass junk for the swimming-pool arguments.

## Solution

Extract construction out of the product class into separate **builder** objects. Building
becomes a set of steps (`buildWalls`, `buildDoor`, …) and **you only call the steps you
need** for the configuration you want.

When different representations need different step implementations (cabin walls of wood,
castle walls of stone), write several concrete builders implementing the same step
interface. Same sequence of calls, different product: a house, a small castle, a palace.

The builder does **not** expose the unfinished product while steps are running, so clients
can't grab an incomplete result.

### Director

Optionally extract the *sequence* of step calls into a **Director**. The director defines
the order; the builder implements the steps. Not strictly necessary — the client can call
the steps itself — but it is a good home for reusable construction routines and it hides
construction detail from the client entirely: associate a builder with a director, launch
construction, fetch the result **from the builder**.

## Participants

| Role | Responsibility |
|---|---|
| **Builder** | Interface declaring the construction steps common to all builders |
| **Concrete Builders** | Different implementations of those steps. May produce products that share **no** common interface |
| **Products** | The resulting objects. Unlike other creational patterns, they need not belong to one hierarchy |
| **Director** | Defines the order in which steps are called, so specific configurations can be reused |
| **Client** | Associates a builder with the director — usually once via the director's constructor, or per call by passing the builder to the production method |

The result-fetching method (`getProduct()`) lives on the **concrete builder**, not the
interface, precisely because different builders return unrelated types. If all your
products *do* share a hierarchy, it can safely go on the base interface.

## Use when

- **To kill a telescoping constructor.** Ten optional parameters, overloaded into five
  shorter constructors that all delegate to the big one. Builder lets you set only what
  you need, so nothing has to be crammed into a constructor signature.
- **To create different representations of a product** (stone vs. wooden houses) when
  construction involves similar steps that differ only in detail.
- **To construct Composite trees** or other complex objects: steps can be deferred and
  called recursively without breaking the final product.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `getProduct()` calling `reset()` — the builder is
ready to produce the next product immediately.

```ts
/**
 * The Builder interface specifies methods for creating the different parts of
 * the Product objects.
 */
interface Builder {
    producePartA(): void;
    producePartB(): void;
    producePartC(): void;
}

/**
 * The Concrete Builder classes follow the Builder interface and provide
 * specific implementations of the building steps. Your program may have several
 * variations of Builders, implemented differently.
 */
class ConcreteBuilder1 implements Builder {
    private product: Product1;

    /**
     * A fresh builder instance should contain a blank product object, which is
     * used in further assembly.
     */
    constructor() {
        this.reset();
    }

    public reset(): void {
        this.product = new Product1();
    }

    /**
     * All production steps work with the same product instance.
     */
    public producePartA(): void {
        this.product.parts.push('PartA1');
    }

    public producePartB(): void {
        this.product.parts.push('PartB1');
    }

    public producePartC(): void {
        this.product.parts.push('PartC1');
    }

    /**
     * Concrete Builders are supposed to provide their own methods for
     * retrieving results. That's because various types of builders may create
     * entirely different products that don't follow the same interface.
     * Therefore, such methods cannot be declared in the base Builder interface
     * (at least in a statically typed programming language).
     *
     * Usually, after returning the end result to the client, a builder instance
     * is expected to be ready to start producing another product. That's why
     * it's a usual practice to call the reset method at the end of the
     * `getProduct` method body. However, this behavior is not mandatory, and
     * you can make your builders wait for an explicit reset call from the
     * client code before disposing of the previous result.
     */
    public getProduct(): Product1 {
        const result = this.product;
        this.reset();
        return result;
    }
}

/**
 * It makes sense to use the Builder pattern only when your products are quite
 * complex and require extensive configuration.
 *
 * Unlike in other creational patterns, different concrete builders can produce
 * unrelated products. In other words, results of various builders may not
 * always follow the same interface.
 */
class Product1 {
    public parts: string[] = [];

    public listParts(): void {
        console.log(`Product parts: ${this.parts.join(', ')}\n`);
    }
}

/**
 * The Director is only responsible for executing the building steps in a
 * particular sequence. It is helpful when producing products according to a
 * specific order or configuration. Strictly speaking, the Director class is
 * optional, since the client can control builders directly.
 */
class Director {
    private builder: Builder;

    /**
     * The Director works with any builder instance that the client code passes
     * to it. This way, the client code may alter the final type of the newly
     * assembled product.
     */
    public setBuilder(builder: Builder): void {
        this.builder = builder;
    }

    /**
     * The Director can construct several product variations using the same
     * building steps.
     */
    public buildMinimalViableProduct(): void {
        this.builder.producePartA();
    }

    public buildFullFeaturedProduct(): void {
        this.builder.producePartA();
        this.builder.producePartB();
        this.builder.producePartC();
    }
}

/**
 * The client code creates a builder object, passes it to the director and then
 * initiates the construction process. The end result is retrieved from the
 * builder object.
 */
function clientCode(director: Director) {
    const builder = new ConcreteBuilder1();
    director.setBuilder(builder);

    console.log('Standard basic product:');
    director.buildMinimalViableProduct();
    builder.getProduct().listParts();

    console.log('Standard full featured product:');
    director.buildFullFeaturedProduct();
    builder.getProduct().listParts();

    // Remember, the Builder pattern can be used without a Director class.
    console.log('Custom product:');
    builder.producePartA();
    builder.producePartC();
    builder.getProduct().listParts();
}

const director = new Director();
clientCode(director);
```

Output:

```
Standard basic product:
Product parts: PartA1

Standard full featured product:
Product parts: PartA1, PartB1, PartC1

Custom product:
Product parts: PartA1, PartC1
```

## Idiomatic TypeScript

TypeScript has **optional properties and object literals**, so the "telescoping
constructor" problem that motivates Builder in Java barely exists. Before reaching for a
builder, check whether an options object solves it:

```ts
// Often enough — this IS the fix for a 10-parameter constructor in TypeScript
interface HouseOptions {
  walls: number
  roof: RoofKind
  pool?: PoolSpec
  garage?: GarageSpec
}

const createHouse = (options: HouseOptions): House => ({ ...houseDefaults, ...options })
```

Builder still earns its place when construction is **stateful, ordered, or validated as it
goes** — a query builder, a test-data builder, a pipeline assembler. The TypeScript-native
version is a **fluent, immutable chain**, where the return type tracks what has been set:

```ts
// Each step returns a new builder whose type records the keys set so far, so
// `.build()` only typechecks once every required field is present.
class QueryBuilder<Set extends keyof QuerySpec = never> {
  private constructor(private readonly spec: Partial<QuerySpec>) {}

  static create(): QueryBuilder {
    return new QueryBuilder({})
  }

  from(table: string): QueryBuilder<Set | 'table'> {
    return new QueryBuilder({ ...this.spec, table })
  }

  where(predicate: Predicate): QueryBuilder<Set | 'where'> {
    return new QueryBuilder({ ...this.spec, where: [...(this.spec.where ?? []), predicate] })
  }

  // `this` is constrained: build() is unavailable until `from()` has been called
  build(this: QueryBuilder<'table' | Set>): Query {
    return compile(this.spec as QuerySpec)
  }
}

const query = QueryBuilder.create().from('accounts').where(isActive).build()
```

The **Director** rarely appears as a class in TypeScript; it shows up as a plain function
that wraps a known sequence — `buildSportsCar(builder)` — which is the same idea with less
ceremony.

## How to implement

1. Confirm you can clearly define **common construction steps** for all product
   representations. If you can't, the pattern doesn't apply.
2. Declare those steps in the base builder interface.
3. Create a concrete builder per representation and implement the steps. Add a
   result-fetching method **on the concrete builder** — it can't live on the interface
   unless all products share a hierarchy.
4. Consider a director class to encapsulate the common construction sequences.
5. The client creates both builder and director, and passes the builder to the director
   (constructor, or per production method).
6. Fetch the result from the director only if all products share an interface; otherwise
   fetch from the builder.

## Pros and cons

**Pros**

- Construct objects step by step, defer steps, or run steps recursively.
- Reuse the same construction code for different representations.
- **Single Responsibility Principle** — complex construction is isolated from the product's
  business logic.

**Cons**

- Overall complexity rises: the pattern requires several new classes.

## Identification

A class with a **single creation method** plus several methods to configure the result.
Builder methods often chain: `someBuilder.setValueA(1).setValueB(2).create()`.

## Relations with other patterns

- Many designs **start with Factory Method** and evolve toward **Abstract Factory**,
  **Prototype**, or Builder.
- **Abstract Factory** returns the product immediately and specializes in families; Builder
  runs extra construction steps before you fetch the product.
- Use Builder to construct **Composite** trees — the steps can recurse.
- Combine with **Bridge**: the director is the abstraction, builders are implementations.
- Abstract Factories, Builders and Prototypes can all be **Singletons**.

## Anti-signals

- The object has a handful of fields and no ordering or validation rules — an options
  object with optional properties is simpler and just as safe in TypeScript.
- The builder is a plain setter bag with no invariants; you've just made construction
  longer without making it safer.
- A `build()` that can be called at any time and returns a half-initialized object — the
  pattern's main guarantee (no incomplete product escapes) has been dropped.

## See also

[abstract-factory](./abstract-factory.md) · [factory-method](./factory-method.md) · [composite](./composite.md) · [bridge](./bridge.md) · [prototype](./prototype.md)
