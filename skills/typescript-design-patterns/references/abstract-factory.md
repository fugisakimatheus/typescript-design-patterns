# Abstract Factory

**Category:** Creational · **Complexity:** ★★☆ · **Popularity:** ★★★

## Intent

Produce **families of related objects** without specifying their concrete classes.

## Problem

A furniture shop simulator has a family of related products (`Chair` + `Sofa` +
`CoffeeTable`) and several variants of that family (`Modern`, `Victorian`, `ArtDeco`).
Individual objects must be created so they **match other objects of the same family** — a
Modern sofa next to Victorian chairs makes customers angry. And when vendors update their
catalogs, adding a product or a whole new family must not force edits to core code.

## Solution

1. Declare an interface for **each distinct product** of the family (`Chair`, `Sofa`,
   `CoffeeTable`) and make every variant implement it.
2. Declare the **Abstract Factory** — one interface listing a creation method per product
   (`createChair`, `createSofa`, `createCoffeeTable`), each returning the *abstract*
   product type.
3. Implement one **concrete factory per variant**. `ModernFurnitureFactory` can only build
   `ModernChair`, `ModernSofa`, `ModernCoffeeTable` — so whatever it returns always
   matches.

Client code talks to factories *and* products only through the abstract interfaces, so
swapping the factory swaps the whole variant without touching the client. The concrete
factory itself is usually chosen once at initialization, from config or environment.

## Participants

| Role | Responsibility |
|---|---|
| **Abstract Products** | Interfaces for the distinct-but-related products making up a family |
| **Concrete Products** | Implementations grouped by variant. Every abstract product must exist in every variant |
| **Abstract Factory** | Declares one creation method per abstract product |
| **Concrete Factories** | One per variant; creates only that variant's products, but the method signatures still return abstract products |
| **Client** | Works with any factory/variant through abstract interfaces only |

## Use when

- Your code needs to work with **various families of related products** and you don't want
  it coupled to their concrete classes — they may be unknown up front, or you want room to
  extend later. The interface guarantees you never mix variants.
- **A class has grown a set of factory methods that blur its primary responsibility.**
  Extract them into a standalone factory, or a full Abstract Factory, so the class goes
  back to doing one thing.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `anotherUsefulFunctionB(collaborator)`: it *accepts*
any `AbstractProductA` but only works correctly with its own variant — that constraint is
exactly what the factory enforces at construction time.

```ts
/**
 * The Abstract Factory interface declares a set of methods that return
 * different abstract products. These products are called a family and are
 * related by a high-level theme or concept. Products of one family are usually
 * able to collaborate among themselves. A family of products may have several
 * variants, but the products of one variant are incompatible with products of
 * another.
 */
interface AbstractFactory {
    createProductA(): AbstractProductA;

    createProductB(): AbstractProductB;
}

/**
 * Concrete Factories produce a family of products that belong to a single
 * variant. The factory guarantees that resulting products are compatible. Note
 * that signatures of the Concrete Factory's methods return an abstract product,
 * while inside the method a concrete product is instantiated.
 */
class ConcreteFactory1 implements AbstractFactory {
    public createProductA(): AbstractProductA {
        return new ConcreteProductA1();
    }

    public createProductB(): AbstractProductB {
        return new ConcreteProductB1();
    }
}

/**
 * Each Concrete Factory has a corresponding product variant.
 */
class ConcreteFactory2 implements AbstractFactory {
    public createProductA(): AbstractProductA {
        return new ConcreteProductA2();
    }

    public createProductB(): AbstractProductB {
        return new ConcreteProductB2();
    }
}

/**
 * Each distinct product of a product family should have a base interface. All
 * variants of the product must implement this interface.
 */
interface AbstractProductA {
    usefulFunctionA(): string;
}

/**
 * These Concrete Products are created by corresponding Concrete Factories.
 */
class ConcreteProductA1 implements AbstractProductA {
    public usefulFunctionA(): string {
        return 'The result of the product A1.';
    }
}

class ConcreteProductA2 implements AbstractProductA {
    public usefulFunctionA(): string {
        return 'The result of the product A2.';
    }
}

/**
 * Here's the base interface of another product. All products can interact with
 * each other, but proper interaction is possible only between products of the
 * same concrete variant.
 */
interface AbstractProductB {
    /**
     * Product B is able to do its own thing...
     */
    usefulFunctionB(): string;

    /**
     * ...but it also can collaborate with the ProductA.
     *
     * The Abstract Factory makes sure that all products it creates are of the
     * same variant and thus, compatible.
     */
    anotherUsefulFunctionB(collaborator: AbstractProductA): string;
}

/**
 * These Concrete Products are created by corresponding Concrete Factories.
 */
class ConcreteProductB1 implements AbstractProductB {

    public usefulFunctionB(): string {
        return 'The result of the product B1.';
    }

    /**
     * The variant, Product B1, is only able to work correctly with the variant,
     * Product A1. Nevertheless, it accepts any instance of AbstractProductA as
     * an argument.
     */
    public anotherUsefulFunctionB(collaborator: AbstractProductA): string {
        const result = collaborator.usefulFunctionA();
        return `The result of the B1 collaborating with the (${result})`;
    }
}

class ConcreteProductB2 implements AbstractProductB {

    public usefulFunctionB(): string {
        return 'The result of the product B2.';
    }

    /**
     * The variant, Product B2, is only able to work correctly with the variant,
     * Product A2. Nevertheless, it accepts any instance of AbstractProductA as
     * an argument.
     */
    public anotherUsefulFunctionB(collaborator: AbstractProductA): string {
        const result = collaborator.usefulFunctionA();
        return `The result of the B2 collaborating with the (${result})`;
    }
}

/**
 * The client code works with factories and products only through abstract
 * types: AbstractFactory and AbstractProduct. This lets you pass any factory or
 * product subclass to the client code without breaking it.
 */
function clientCode(factory: AbstractFactory) {
    const productA = factory.createProductA();
    const productB = factory.createProductB();

    console.log(productB.usefulFunctionB());
    console.log(productB.anotherUsefulFunctionB(productA));
}

/**
 * The client code can work with any concrete factory class.
 */
console.log('Client: Testing client code with the first factory type...');
clientCode(new ConcreteFactory1());

console.log('');

console.log('Client: Testing the same client code with the second factory type...');
clientCode(new ConcreteFactory2());
```

Output:

```
Client: Testing client code with the first factory type...
The result of the product B1.
The result of the B1 collaborating with the (The result of the product A1.)

Client: Testing the same client code with the second factory type...
The result of the product B2.
The result of the B2 collaborating with the (The result of the product A2.)
```

## Idiomatic TypeScript

The factory is just an object whose properties are creation functions. Typing it as an
interface keeps the family contract; a `Record` keyed by the variant union makes "every
variant implements every product" a compile-time guarantee instead of a code review note.

```ts
interface StorageAdapter {
  upload(file: File): Promise<string>
}

interface QueueAdapter {
  publish(event: DomainEvent): Promise<void>
}

// The abstract factory: one creation method per product of the family
interface InfraFactory {
  createStorage(): StorageAdapter
  createQueue(): QueueAdapter
}

type Environment = 'local' | 'aws'

// A missing variant, or a variant missing a product, fails typecheck here
const infraFactories: Record<Environment, InfraFactory> = {
  local: {
    createStorage: () => new FsStorageAdapter(),
    createQueue: () => new InMemoryQueueAdapter()
  },
  aws: {
    createStorage: () => new S3StorageAdapter(),
    createQueue: () => new SqsQueueAdapter()
  }
}

// Chosen once, at initialization — everything downstream sees only InfraFactory
export const createInfra = (env: Environment): InfraFactory => infraFactories[env]
```

On the frontend the same shape shows up as a **provider object passed through context**:
one object bundling the adapters a subtree needs, swapped wholesale for tests, demo mode,
or a different backend. That is Abstract Factory, even when nobody writes the word
`Factory`.

## How to implement

1. Map out a **matrix**: distinct product types (rows) versus variants (columns).
2. Declare abstract product interfaces for every product type; make all concrete products
   implement them.
3. Declare the abstract factory interface with one creation method per abstract product.
4. Implement one concrete factory class per variant.
5. Add factory initialization code: instantiate the right concrete factory from config or
   environment, and pass that object to every class that constructs products.
6. Find all direct product constructor calls and replace them with calls to the factory.

## Pros and cons

**Pros**

- Products from one factory are guaranteed **compatible with each other**.
- Avoids tight coupling between concrete products and client code.
- **Single Responsibility Principle** — creation code lives in one place.
- **Open/Closed Principle** — new variants don't break existing clients.

**Cons**

- The code can get more complicated than warranted: the pattern drags in a lot of new
  interfaces and classes.

## Identification

Recognizable by methods that **return a factory object**, which is then used to create
specific sub-components. If a method returns a single product rather than a family, you're
looking at a Factory Method.

## Relations with other patterns

- Many designs **start with Factory Method** and evolve toward Abstract Factory,
  **Prototype**, or **Builder**.
- **Builder** constructs one complex object step by step; Abstract Factory creates families
  and returns each product immediately.
- Abstract Factory classes are often built on a set of **Factory Methods**, or composed
  using **Prototype**.
- Can substitute for **Facade** when all you want to hide is *how* subsystem objects are
  created.
- Pairs with **Bridge** when some abstractions only work with specific implementations —
  the factory encapsulates those pairings.
- Abstract Factories, Builders and Prototypes can all be implemented as **Singletons**.

## Anti-signals

- There is only one variant, and no second is on the roadmap.
- The products aren't actually related — a factory that creates unrelated objects is a
  service locator in disguise.
- Variants differ only in configuration values, not behavior; a config object beats a
  class hierarchy.

## See also

[factory-method](./factory-method.md) · [builder](./builder.md) · [prototype](./prototype.md) · [bridge](./bridge.md) · [facade](./facade.md)
