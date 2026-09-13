# Strategy

**Category:** Behavioral · **Complexity:** ★☆☆ · **Popularity:** ★★★

## Intent

Define a **family of algorithms**, put each in a separate class, and make their objects
**interchangeable**.

## Problem

A navigation app for travelers, built around a map. The most requested feature is automatic
route planning. Version one builds routes over roads — drivers are delighted. Then walking
routes. Then public transport. Cyclists are planned; routes through tourist attractions
after that.

The navigator's code bloats. **Each new routing algorithm doubled the size of the main
class** until the beast became unmaintainable. Any change to one algorithm — a bug fix, a
street-score tweak — touches the whole class and risks breaking working code. Teamwork
suffers too: everyone edits the same huge class and spends their time resolving merge
conflicts.

## Solution

Take the class that does one thing in many different ways and **extract every algorithm into
its own class** — a **strategy**.

The original class, the **context**, gets a field holding a reference to one strategy and
**delegates the work** instead of doing it. The context does not choose the strategy; the
**client passes it in**. The context knows very little about strategies: it works with all of
them through one generic interface exposing a single method that triggers the algorithm.

So the context becomes independent of concrete strategies — new algorithms, or changes to
existing ones, touch neither the context nor the other strategies.

Each routing algorithm becomes a class with one `buildRoute(origin, destination)` returning
checkpoints. The navigator doesn't care which one is active; its job is rendering
checkpoints. A setter lets UI buttons swap the active routing behavior at runtime.

**Real-world analogy:** getting to the airport by bus, cab, or bicycle. Transportation
strategies, picked by budget or time constraints.

## Participants

| Role | Responsibility |
|---|---|
| **Context** | Holds a reference to one concrete strategy and communicates with it **only via the strategy interface** |
| **Strategy** | The interface common to all concrete strategies; declares the method the context calls |
| **Concrete Strategies** | The different variations of the algorithm |
| **Client** | Creates a specific strategy and passes it to the context. The context exposes a setter so clients can replace it **at runtime** |

## Use when

- **You want different variants of an algorithm inside an object and the ability to switch
  between them at runtime.**
- **You have many similar classes that differ only in how they execute some behavior.**
  Extract the varying behavior into its own hierarchy and collapse the originals into one
  class, killing the duplication.
- **You want to isolate business logic from algorithm implementation details** that aren't
  important in the context of that logic. Clients get a simple interface and can swap
  algorithms at runtime.
- **Your class has a massive conditional switching between variants of the same algorithm.**
  The conditional disappears: every branch becomes a class behind one interface.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation.

```ts
/**
 * The Context defines the interface of interest to clients.
 */
class Context {
    /**
     * @type {Strategy} The Context maintains a reference to one of the Strategy
     * objects. The Context does not know the concrete class of a strategy. It
     * should work with all strategies via the Strategy interface.
     */
    private strategy: Strategy;

    /**
     * Usually, the Context accepts a strategy through the constructor, but also
     * provides a setter to change it at runtime.
     */
    constructor(strategy: Strategy) {
        this.strategy = strategy;
    }

    /**
     * Usually, the Context allows replacing a Strategy object at runtime.
     */
    public setStrategy(strategy: Strategy) {
        this.strategy = strategy;
    }

    /**
     * The Context delegates some work to the Strategy object instead of
     * implementing multiple versions of the algorithm on its own.
     */
    public doSomeBusinessLogic(): void {
        // ...

        console.log('Context: Sorting data using the strategy (not sure how it\'ll do it)');
        const result = this.strategy.doAlgorithm(['a', 'b', 'c', 'd', 'e']);
        console.log(result.join(','));

        // ...
    }
}

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
interface Strategy {
    doAlgorithm(data: string[]): string[];
}

/**
 * Concrete Strategies implement the algorithm while following the base Strategy
 * interface. The interface makes them interchangeable in the Context.
 */
class ConcreteStrategyA implements Strategy {
    public doAlgorithm(data: string[]): string[] {
        return data.sort();
    }
}

class ConcreteStrategyB implements Strategy {
    public doAlgorithm(data: string[]): string[] {
        return data.reverse();
    }
}

/**
 * The client code picks a concrete strategy and passes it to the context. The
 * client should be aware of the differences between strategies in order to make
 * the right choice.
 */
const context = new Context(new ConcreteStrategyA());
console.log('Client: Strategy is set to normal sorting.');
context.doSomeBusinessLogic();

console.log('');

console.log('Client: Strategy is set to reverse sorting.');
context.setStrategy(new ConcreteStrategyB());
context.doSomeBusinessLogic();
```

Output:

```
Client: Strategy is set to normal sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
a,b,c,d,e

Client: Strategy is set to reverse sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
e,d,c,b,a
```

## Idiomatic TypeScript

A well-known trade-off of this pattern: *"A lot of modern programming
languages have functional type support that lets you implement different versions of an
algorithm inside a set of anonymous functions… without bloating your code with extra classes
and interfaces."* TypeScript is one of them, and **the function is the strategy**:

```ts
// The strategy interface is just a function type
type ShippingCalculator = (order: Order) => Money

const standardShipping: ShippingCalculator = order => flatRate(order.weightKg)
const expressShipping: ShippingCalculator = order => flatRate(order.weightKg) * 1.8
const freeShipping: ShippingCalculator = () => zero()

// A Record keyed by the union: adding a shipping method breaks the build here
const shippingStrategies = {
  standard: standardShipping,
  express: expressShipping,
  free: freeShipping
} as const satisfies Record<ShippingMethod, ShippingCalculator>

// The context takes the strategy as a parameter and stays oblivious to the variants
export const quote = (order: Order, method: ShippingMethod): Quote => ({
  items: order.items,
  shipping: shippingStrategies[method](order)
})
```

Prefer an **object with several methods** when the strategy has more than one operation that
must vary together — encode *and* decode, validate *and* format:

```ts
interface ExportStrategy {
  readonly extension: string
  readonly mimeType: string
  serialize(rows: Row[]): Blob
}

const csvExport: ExportStrategy = {
  extension: 'csv',
  mimeType: 'text/csv',
  serialize: rows => new Blob([toCsv(rows)], { type: 'text/csv' })
}
```

Everyday strategies you already pass around: the comparator in `array.sort(compareFn)`, a
`renderItem` prop, a validation resolver handed to a form library, a custom `queryFn`.

**The rule of thumb:** if the "strategy" is one function called from one place, a parameter
is the whole pattern — don't build a class hierarchy around it. If the set of variants is
closed and known, the `Record` keyed by a union gives you exhaustiveness the class version
can't.

## How to implement

1. In the context class, identify an algorithm **prone to frequent changes** — often a
   massive conditional selecting a variant of the same algorithm.
2. Declare the **strategy interface** common to all variants.
3. Extract each algorithm into its own class implementing that interface.
4. Add a strategy field to the context plus a setter. The context works with the strategy
   **only through the interface**, and may define an interface of its own that lets a strategy
   access its data.
5. Clients associate the context with the strategy matching how they expect it to do its
   primary job.

## Pros and cons

**Pros**

- Swap algorithms **at runtime**.
- Isolate an algorithm's implementation details from the code using it.
- **Replace inheritance with composition.**
- **Open/Closed Principle** — new strategies without changing the context.

**Cons**

- With only a couple of algorithms that rarely change, the extra classes and interfaces are
  needless complication.
- **Clients must know the differences between strategies** to pick the right one.
- In languages with functional types, anonymous functions do the same job **without the extra
  classes**.

## Identification

A method that lets a **nested object do the actual work**, plus a **setter** for replacing
that object.

## Relations with other patterns

- **Bridge**, **State**, Strategy (and to a degree **Adapter**) share a structure — all
  composition-based delegation — but solve different problems.
- **Command vs. Strategy**: both parameterize an object with an action, different intents.
  Command turns *any operation* into an object so it can be deferred, queued, historied, or
  sent to a remote service. Strategy describes **different ways of doing the same thing**,
  swapped within one context.
- **Decorator changes an object's skin; Strategy changes its guts.**
- **Template Method vs. Strategy**: Template Method uses **inheritance** — alter parts of an
  algorithm by extending them in subclasses, at the **class level**, statically. Strategy uses
  **composition** — alter behavior by supplying different strategies, at the **object level**,
  switchable at runtime.
- **State extends Strategy.** Both delegate to helper objects; Strategy's are completely
  independent and unaware of each other, while State's may depend on each other and change
  the context's state at will.

## Anti-signals

- Two variants that will never become three — an `if` is clearer than an interface.
- The context inspects which concrete strategy it holds; the abstraction has failed.
- Strategies with wildly different signatures forced behind one interface via optional
  parameters.
- The client can't tell which strategy to choose, so choosing becomes its own conditional
  somewhere else.

## See also

[state](./state.md) · [bridge](./bridge.md) · [template-method](./template-method.md) · [command](./command.md) · [decorator](./decorator.md)
