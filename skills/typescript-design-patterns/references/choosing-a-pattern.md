# Choosing a pattern

Symptom-first routing. Find the smell you actually have, then open **one** reference file.

## The first question

> **Does the code have the problem the pattern solves — today?**

Every pattern trades simplicity for flexibility along one specific axis. If you can't name
the axis that's currently hurting, the pattern is premature. A direct call, a plain function
and an `if` are legitimate answers, and in TypeScript they're often the *better* answer
because the type system already provides what the pattern was invented to fake.

## By symptom

### Object creation

| Symptom | Pattern |
|---|---|
| `new ConcreteThing()` scattered everywhere; adding a variant means editing every call site | [factory-method](./factory-method.md) |
| Objects come in **families** and mixing variants would be a bug (Modern sofa + Victorian chair) | [abstract-factory](./abstract-factory.md) |
| Constructor with ten optional parameters; or construction is **ordered / validated as it goes** | [builder](./builder.md) |
| You need copies but shouldn't depend on concrete classes; or you have many "configuration preset" subclasses | [prototype](./prototype.md) |
| Exactly one instance must exist and be reachable everywhere | [singleton](./singleton.md) — but read its warnings first; an ES module is already one |

### Fitting things together

| Symptom | Pattern |
|---|---|
| An existing class has the **wrong interface** for your code (vendor DTO, legacy API) | [adapter](./adapter.md) |
| A subsystem takes 20 lines of setup to do one useful thing | [facade](./facade.md) |
| The class hierarchy is exploding because you're extending in **two independent dimensions** | [bridge](./bridge.md) |
| Part–whole tree where a leaf and a branch must be handled identically | [composite](./composite.md) |
| Behavior must be added to objects **at runtime**, in combinations | [decorator](./decorator.md) |
| Access must be controlled, deferred, cached, logged, or made remote — **same interface** | [proxy](./proxy.md) |
| Millions of similar objects exhaust RAM and share duplicate state | [flyweight](./flyweight.md) — profile first |

### Behavior and communication

| Symptom | Pattern |
|---|---|
| A massive conditional choosing between variants of **the same algorithm** | [strategy](./strategy.md) |
| Behavior changes with the object's **state**, and states drive transitions between each other | [state](./state.md) |
| Several classes share an algorithm's skeleton but differ in a few steps | [template-method](./template-method.md) |
| A request should travel through a series of checks, any of which may stop it | [chain-of-responsibility](./chain-of-responsibility.md) |
| An operation must be **deferred, queued, logged, serialized, or undone** | [command](./command.md) |
| State must be snapshotted and restored **without breaking encapsulation** | [memento](./memento.md) |
| Many objects need to react to one object's changes, and the set changes at runtime | [observer](./observer.md) |
| A web of components all talking to each other directly | [mediator](./mediator.md) |
| Traversing a structure without exposing how it stores elements | [iterator](./iterator.md) |
| New operations must be added over a stable hierarchy of element types | [visitor](./visitor.md) |

## TypeScript's shortcuts

Several GoF patterns exist to work around limitations TypeScript doesn't have. Reach for the
language feature first; reach for the full pattern when you need what it can't give you.

| Pattern | TypeScript shortcut | Use the full pattern when |
|---|---|---|
| **Strategy** | A function parameter; `Record<Union, Fn>` | Several operations must vary together |
| **Command** | A closure | You must inspect, serialize, queue or invert it |
| **Singleton** | An ES module's exported binding | Never, really — module + lazy getter covers it |
| **Builder** | Options object with optional properties | Construction is stateful, ordered, or validated per step |
| **Observer** | `useSyncExternalStore`, `addEventListener` | You're building the emitter itself |
| **Iterator** | `Symbol.iterator` / generators | Never hand-roll `next()`/`valid()` |
| **Visitor** | Discriminated union + exhaustive `switch` | Elements are classes with private state |
| **State** | Discriminated union + transition table | Each state carries substantial multi-method behavior |
| **Decorator** | Higher-order function | The component has several methods to wrap consistently |
| **Prototype** | `structuredClone`, spread, immer | Clone semantics need per-field decisions |
| **Template Method** | Function taking a `steps` object | A framework wants users to extend by subclassing |
| **Factory Method** | `Record<Union, () => T>` | The creator carries business logic subclasses specialize |

**The general shape:** a **discriminated union** replaces a class hierarchy when the variants
differ in *data*; a **function type** replaces it when they differ in one *behavior*; a
**class** still wins when they differ in *several behaviors plus private state*.

And a TypeScript-only advantage worth optimizing for: `Record<Union, …>` and mapped types
make "every variant is handled" a **compile error when it's violated**, which no class
hierarchy gives you.

## Cost checklist before committing

- **How many variants exist today?** One → no pattern. Two → usually a conditional. Three or
  more, still growing → pattern.
- **Who adds the next variant?** If it's someone outside your codebase, the extension point
  must be public and documented.
- **What breaks when a variant is added?** Ideally nothing; at worst, a compile error that
  names every place to update. Never a silent runtime fallback.
- **Can a newcomer trace one request end to end?** Every layer of indirection costs someone
  a jump. Indirection that isn't paying for flexibility is pure cost.

## See also

[pattern-relations](./pattern-relations.md) — telling similar patterns apart.
