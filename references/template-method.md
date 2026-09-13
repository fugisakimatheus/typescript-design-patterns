# Template Method

**Category:** Behavioral · **Complexity:** ★☆☆ · **Popularity:** ★★☆

## Intent

Define the **skeleton of an algorithm in a superclass**, letting subclasses override specific
steps **without changing its structure**.

## Problem

A data mining app analyzes corporate documents in various formats (PDF, DOC, CSV) and
extracts data in a uniform shape. It started with DOC, gained CSV, then PDF.

Eventually you notice all three classes share a lot of code. The **format-handling** code is
entirely different; the **processing and analysis** code is nearly identical. You'd like to
kill the duplication while leaving the algorithm's structure intact.

There's a second problem in the client: conditionals picking a course of action based on the
processing object's class. A common base class or interface would let polymorphism replace
all of them.

## Solution

Break the algorithm into **steps**, turn the steps into methods, and put a sequence of calls
to those methods inside a single **template method**. Steps are either `abstract` or carry a
default implementation. To use the algorithm, a client subclasses, implements the abstract
steps, and overrides optional ones — **but never the template method itself**.

For the data miner: a base class whose template method calls the document-processing steps
in order. Opening/closing files and extracting/parsing differ per format and stay in
subclasses; analyzing raw data and composing reports are similar and move **up into the base
class**, shared by all.

Three kinds of step:

- **Abstract steps** — every subclass must implement them.
- **Optional steps** — have a default, can be overridden.
- **Hooks** — optional steps with an **empty body**. The template method works whether or not
  a hook is overridden. Hooks usually sit **before and after crucial steps**, giving
  subclasses extra extension points.

**Real-world analogy:** mass housing construction. A standard architectural plan with a few
extension points — foundation, framing, walls, plumbing, wiring — each slightly adjustable,
so every house comes out a little different.

## Participants

| Role | Responsibility |
|---|---|
| **Abstract Class** | Declares the algorithm's step methods (abstract or defaulted) and the **template method** calling them in a specific order |
| **Concrete Classes** | Override any of the steps — **but not the template method** |

## Use when

- **You want clients to extend only particular steps of an algorithm, not its whole
  structure.** The monolith becomes a series of steps subclasses can extend while the
  superclass keeps the shape.
- **Several classes contain almost identical algorithms with minor differences**, so changing
  the algorithm means editing all of them. Pull the similar steps up into a superclass,
  leaving only what varies in the subclasses.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note the three kinds of step side by side: `baseOperation*`
(default), `requiredOperation*` (abstract), `hook*` (empty).

```ts
/**
 * The Abstract Class defines a template method that contains a skeleton of some
 * algorithm, composed of calls to (usually) abstract primitive operations.
 *
 * Concrete subclasses should implement these operations, but leave the template
 * method itself intact.
 */
abstract class AbstractClass {
    /**
     * The template method defines the skeleton of an algorithm.
     */
    public templateMethod(): void {
        this.baseOperation1();
        this.requiredOperations1();
        this.baseOperation2();
        this.hook1();
        this.requiredOperation2();
        this.baseOperation3();
        this.hook2();
    }

    /**
     * These operations already have implementations.
     */
    protected baseOperation1(): void {
        console.log('AbstractClass says: I am doing the bulk of the work');
    }

    protected baseOperation2(): void {
        console.log('AbstractClass says: But I let subclasses override some operations');
    }

    protected baseOperation3(): void {
        console.log('AbstractClass says: But I am doing the bulk of the work anyway');
    }

    /**
     * These operations have to be implemented in subclasses.
     */
    protected abstract requiredOperations1(): void;

    protected abstract requiredOperation2(): void;

    /**
     * These are "hooks." Subclasses may override them, but it's not mandatory
     * since the hooks already have default (but empty) implementation. Hooks
     * provide additional extension points in some crucial places of the
     * algorithm.
     */
    protected hook1(): void { }

    protected hook2(): void { }
}

/**
 * Concrete classes have to implement all abstract operations of the base class.
 * They can also override some operations with a default implementation.
 */
class ConcreteClass1 extends AbstractClass {
    protected requiredOperations1(): void {
        console.log('ConcreteClass1 says: Implemented Operation1');
    }

    protected requiredOperation2(): void {
        console.log('ConcreteClass1 says: Implemented Operation2');
    }
}

/**
 * Usually, concrete classes override only a fraction of base class' operations.
 */
class ConcreteClass2 extends AbstractClass {
    protected requiredOperations1(): void {
        console.log('ConcreteClass2 says: Implemented Operation1');
    }

    protected requiredOperation2(): void {
        console.log('ConcreteClass2 says: Implemented Operation2');
    }

    protected hook1(): void {
        console.log('ConcreteClass2 says: Overridden Hook1');
    }
}

/**
 * The client code calls the template method to execute the algorithm. Client
 * code does not have to know the concrete class of an object it works with, as
 * long as it works with objects through the interface of their base class.
 */
function clientCode(abstractClass: AbstractClass) {
    // ...
    abstractClass.templateMethod();
    // ...
}

console.log('Same client code can work with different subclasses:');
clientCode(new ConcreteClass1());
console.log('');

console.log('Same client code can work with different subclasses:');
clientCode(new ConcreteClass2());
```

Output:

```
Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass1 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass1 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway

Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass2 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass2 says: Overridden Hook1
ConcreteClass2 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway
```

## Idiomatic TypeScript

The class form is right where a framework wants users to extend via inheritance. In
application code, the **higher-order function with an injected steps object** gives the same
skeleton with none of the inheritance downsides — and it composes:

```ts
// The steps, as data. Required steps are required; hooks are optional.
interface ImportSteps<Raw, Parsed> {
  read(file: File): Promise<Raw> // required
  parse(raw: Raw): Parsed[] // required
  beforeAnalyze?(rows: Parsed[]): void // hook
  analyze?(rows: Parsed[]): Report // optional step with a default
}

const defaultAnalyze = <T,>(rows: T[]): Report => ({ count: rows.length, generatedAt: new Date() })

// The template method: the skeleton, fixed. Callers cannot reorder it.
export const runImport = async <Raw, Parsed>(file: File, steps: ImportSteps<Raw, Parsed>): Promise<Report> => {
  const raw = await steps.read(file)
  const rows = steps.parse(raw)
  steps.beforeAnalyze?.(rows)
  return (steps.analyze ?? defaultAnalyze)(rows)
}

const csvSteps: ImportSteps<string, CsvRow> = {
  read: file => file.text(),
  parse: text => parseCsv(text)
}

const report = await runImport(csvFile, csvSteps)
```

Why prefer this in TypeScript: no `protected` members leaking into the subclass contract, no
LSP hazard from a subclass suppressing a default, steps are testable in isolation, and the
optional hooks are visible in one type instead of scattered across a hierarchy.

You meet the class version constantly in frameworks — React's lifecycle methods on a class
component, a base test case with `setUp`/`tearDown`, `abstract class BaseRepository`.
Recognize it, and when you're the one designing the extension point, ask whether **passing
the steps in** beats **making callers extend you**.

## How to implement

1. Analyze the algorithm and break it into steps. Note which are **common to all subclasses**
   and which are always unique.
2. Create the abstract base class with the template method and abstract step methods. Outline
   the structure in the template method. Consider making it **`final`** so subclasses can't
   override it.
3. All steps being abstract is fine — but some benefit from a **default implementation** that
   subclasses needn't write.
4. Consider adding **hooks** between crucial steps.
5. Create one concrete subclass per variation: implement every abstract step, override
   optional ones as needed.

## Pros and cons

**Pros**

- Clients override only certain parts of a large algorithm, so they're insulated from changes
  to the other parts.
- Duplicate code moves up into the superclass.

**Cons**

- Some clients may be **limited by the provided skeleton**.
- You might **violate the Liskov Substitution Principle** by suppressing a default step in a
  subclass.
- Template methods get harder to maintain **the more steps they have**.

## Identification

A method in a base class that calls a bunch of other methods which are either **abstract or
empty**.

## Relations with other patterns

- **Factory Method is a specialization of Template Method** — and a factory method may itself
  be one step inside a larger template method.
- **Template Method vs. Strategy**: Template Method is **inheritance**-based, altering parts
  of an algorithm by extending them in subclasses. It works at the **class level**, so it's
  **static**. Strategy is **composition**-based, altering behavior by supplying different
  strategy objects, at the **object level**, **switchable at runtime**.

## Anti-signals

- A deep hierarchy where you must read three classes to know what actually runs.
- Subclasses overriding a default step to do nothing — the skeleton doesn't fit them.
- The template method has grown a dozen steps and every subclass overrides a different
  subset.
- Only one subclass exists, and there's no second in sight.

## See also

[strategy](./strategy.md) · [factory-method](./factory-method.md)
