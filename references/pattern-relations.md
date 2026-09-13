# Pattern relations

Many patterns share a **structure** — composition, delegation, recursion — and differ only in
**intent**. As design pattern principles put it: *"A pattern isn't just a recipe for structuring
your code in a specific way. It can also communicate to other developers the problem the
pattern solves."* Naming a pattern correctly is therefore documentation; naming it wrongly is
misinformation.

The sections below outline key structural differences and intersections between commonly confused patterns:

## The wrapper family

Four patterns wrap one object in another. The interface tells them apart:

| Pattern | Interface of the wrapper | Who controls composition | Life cycle of the wrapped object |
|---|---|---|---|
| [**Adapter**](./adapter.md) | **Different** from the wrapped object | Client | Usually the client's |
| [**Proxy**](./proxy.md) | **Same** — they're interchangeable | Client, but the proxy is transparent | **Usually the proxy's own** |
| [**Decorator**](./decorator.md) | Same or **enhanced**; recursive | **Always the client** | Client's |
| [**Facade**](./facade.md) | **New**, over a whole subsystem | Client | Often the facade's |

More precisely:

- **Adapter vs. Decorator** — Adapter gives a completely different interface; Decorator keeps
  it or extends it. Decorator supports **recursive composition**, Adapter does not.
- **Adapter vs. Facade** — Facade defines a *new* interface for an entire **subsystem**;
  Adapter makes an *existing* interface usable and usually wraps **one** object.
- **Proxy vs. Decorator** — same structure, different intent: a Proxy usually **manages its
  service's life cycle**; decorator composition is **always controlled by the client**.
- **Proxy vs. Facade** — both buffer a complex entity and initialize it themselves, but a
  Proxy has the **same interface** as its service, making them interchangeable.

## The composition-delegation family

[**Bridge**](./bridge.md), [**State**](./state.md), [**Strategy**](./strategy.md) and, to a
degree, [**Adapter**](./adapter.md) all delegate work to another object and look nearly
identical on a class diagram.

- **Bridge** is **designed up-front** so two dimensions can evolve independently; **Adapter**
  is applied to an **existing** app to reconcile incompatible classes.
- **State extends Strategy.** Both change the context's behavior by delegating. Strategy's
  objects are **completely independent and unaware of each other**; State's concrete states
  **may depend on each other and change the context's state at will**.
- **Bridge vs. Strategy** — confusion comes from both allowing runtime replacement. Bridge
  organizes *two dimensions of a design*; Strategy swaps *interchangeable algorithms*.

## Sender → receiver

[**Chain of Responsibility**](./chain-of-responsibility.md), [**Command**](./command.md),
[**Mediator**](./mediator.md) and [**Observer**](./observer.md) each connect senders and
receivers differently:

| Pattern | Connection |
|---|---|
| **Chain of Responsibility** | Passes a request **sequentially along a dynamic chain** of potential receivers until one handles it |
| **Command** | Establishes **unidirectional** connections between senders and receivers |
| **Mediator** | **Eliminates direct connections**, forcing indirect communication through a mediator |
| **Observer** | Lets receivers **dynamically subscribe and unsubscribe** |

**Mediator vs. Observer** — the genuinely elusive pair. Mediator's goal is eliminating
*mutual dependencies* among components, which become dependent on one mediator instead.
Observer's goal is establishing *dynamic one-way connections*, some objects subordinate to
others. A popular Mediator implementation **uses Observer**: the mediator is the publisher and
components subscribe — at which point the two look almost identical. But Mediator can also
permanently link every component to one mediator, resembling Observer not at all and still
being Mediator. And when *every* component becomes a publisher with dynamic connections,
there is no centralized mediator left — only a **distributed set of observers**.

**Facade vs. Mediator** — both organize collaboration among tightly coupled classes. A Facade
introduces **no new functionality**, the subsystem is **unaware** of it, and its objects still
communicate directly. A Mediator **centralizes** communication and components know only the
mediator.

**Chain of Responsibility vs. Decorator** — near-identical class structures, both recursive
composition. But CoR handlers execute **arbitrary, independent operations** and **may stop the
request at any point**; decorators must stay consistent with the base interface and **may not
break the flow**.

## Creation lineage

- Many designs **start with Factory Method** (simpler, customizable via subclasses) and evolve
  toward **Abstract Factory**, **Prototype**, or **Builder** (more flexible, more complicated).
- **Abstract Factory vs. Builder** — Abstract Factory creates **families** and returns each
  product **immediately**; Builder runs **extra construction steps** before you fetch the
  product.
- **Abstract Factory** classes are often built on a set of **Factory Methods**, but can also
  be composed using **Prototype**.
- **Factory Method vs. Prototype** — Factory Method is inheritance-based (subclass explosion)
  but needs **no initialization step**; Prototype avoids inheritance but requires **complicated
  initialization of the clone**.
- **Abstract Factory** can replace a **Facade** when all you want to hide is *how* subsystem
  objects are created.
- **Abstract Factories, Builders and Prototypes can all be implemented as Singletons.**
- A **Facade** can often become a **Singleton** — one instance usually suffices.

## Tree and traversal

- **Builder** helps construct complex **Composite** trees; its steps can recurse.
- **Iterator** traverses Composite trees.
- **Visitor** executes an operation over an entire Composite tree.
- **Visitor + Iterator** traverses a complex structure and operates on elements of different
  classes.
- Shared leaf nodes of a Composite can be **Flyweights** to save RAM.
- **Chain of Responsibility + Composite** — a leaf passes a request up through its parents to
  the root.
- **Composite vs. Decorator** — similar diagrams, both recursive composition. A **Decorator
  has exactly one child** and **adds responsibilities**; a **Composite sums up** its children's
  results. They cooperate: decorate one node inside a Composite tree.
- Designs heavy in Composite and Decorator benefit from **Prototype** — clone structures
  instead of rebuilding them.

## Operations, state and history

- **Command vs. Strategy** — both parameterize an object with an action, different intents.
  Command turns *any operation* into an object so it can be deferred, queued, historied, or
  sent remotely; **Strategy describes different ways of doing the same thing**, swapped within
  one context.
- **Command + Memento** for undo: commands perform the operations, mementos save the target's
  state just before each executes.
- **Prototype** can be a **simpler alternative to Memento** when the state is straightforward
  and has no links to external resources (or links that are easy to re-establish).
- **Prototype** also helps when copies of **Commands** go into history.
- **Memento + Iterator** captures and rolls back the current iteration state.
- **CoR handlers can be Commands** (many operations over one context object). Inverted: the
  **request itself is a Command**, so one operation runs across a chain of different contexts.
- **Visitor is a powerful version of Command** — its objects execute operations over objects
  of many different classes.

## Inheritance vs. composition

- **Factory Method is a specialization of Template Method** — and a factory method can be one
  step inside a larger template method.
- **Template Method vs. Strategy** — Template Method uses **inheritance**, altering parts of an
  algorithm by extending them in subclasses, at the **class level**, so it is **static**.
  Strategy uses **composition**, altering behavior with different strategy objects, at the
  **object level**, **switchable at runtime**.
- **Decorator changes an object's skin; Strategy changes its guts.**

## Singleton-adjacent

- **Flyweight vs. Singleton** — Flyweight would resemble Singleton if all shared state
  collapsed into one object, but there should be only **one Singleton instance** whereas a
  **Flyweight class has many instances** with different intrinsic states; and a **Singleton may
  be mutable** while **flyweights are immutable**.
- **Flyweight vs. Facade** — Flyweight shows how to make **lots of little objects**; Facade
  shows how to make **a single object representing an entire subsystem**.

## Pairings worth knowing

- **Abstract Factory + Bridge** — when some Bridge abstractions only work with specific
  implementations, the factory encapsulates those pairings and hides them from the client.
- **Builder + Bridge** — the director plays the abstraction, the builders the implementations.
- **Factory Method + Iterator** — collection subclasses return matching iterator types.

## See also

[choosing-a-pattern](./choosing-a-pattern.md) — routing by symptom.
