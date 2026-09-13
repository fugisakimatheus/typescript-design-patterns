---
name: typescript-design-patterns
description: >-
  The 22 classic Gang of Four design patterns catalogued for TypeScript as ready-to-apply playbooks: intent, problem solved, participants, conceptual OOP example, and idiomatic TypeScript rewrites (discriminated unions, HOFs, generators, Record lookups). Includes trade-offs, how to recognize each pattern, and when NOT to apply them. Use when structuring new features, reviewing architecture, refactoring bloated classes/conditionals, designing extension points, or choosing between class hierarchies and union types. Triggers on: design pattern, GoF, Gang of Four, factory, abstract factory, builder, prototype, singleton, adapter, bridge, composite, decorator, facade, flyweight, proxy, chain of responsibility, command, iterator, mediator, memento, observer, state machine, strategy, template method, visitor, double dispatch, undo/redo, middleware pipeline, event emitter, anti-corruption layer, which pattern should I use.
license: MIT
metadata:
  author: fugisakimatheus
  version: "1.0.0"
---

# TypeScript Design Patterns

The classic **Gang of Four** catalog, written for TypeScript. Each pattern has a dedicated
file in [`references/`](./references/) containing the theory, the canonical TypeScript
example, a modern TypeScript rewrite, and the trade-offs.

## How to use this skill

1. **Start from the symptom, not the pattern name.** Open
   [`references/choosing-a-pattern.md`](./references/choosing-a-pattern.md) and find the
   problem you actually have.
2. **Load exactly one reference file.** They're self-contained and 200–400 lines; loading
   several wastes context for no gain.
3. **Check the TypeScript shortcut before committing to the classic form.** Several GoF
   patterns exist to work around limitations TypeScript doesn't have.
4. **Name it in the code.** A pattern is also communication — `ShippingStrategy` tells the
   next reader which problem was being solved.

Two cross-cutting files:

- [`choosing-a-pattern.md`](./references/choosing-a-pattern.md) — routing by symptom, the
  TypeScript-shortcut table, and the cost checklist.
- [`pattern-relations.md`](./references/pattern-relations.md) — telling confusable patterns
  apart (Strategy vs. State vs. Bridge, Proxy vs. Decorator vs. Adapter, Mediator vs.
  Observer, …).

## Catalog

Ratings for complexity (Cx) and popularity (Pop) are out of three stars:

### Creational — how objects get made

| Pattern | Intent | Cx | Pop |
|---|---|---|---|
| [factory-method](./references/factory-method.md) | Creation through an overridable method, so subclasses pick the concrete product | ★☆☆ | ★★★ |
| [abstract-factory](./references/abstract-factory.md) | Produce **families** of related objects that are guaranteed to match | ★★☆ | ★★★ |
| [builder](./references/builder.md) | Construct complex objects **step by step**; same steps, different representations | ★★☆ | ★★★ |
| [prototype](./references/prototype.md) | Copy existing objects without depending on their classes | ★☆☆ | ★★☆ |
| [singleton](./references/singleton.md) | One instance, globally reachable — *widely considered an antipattern; read the file* | ★☆☆ | ★★☆ |

### Structural — how objects are composed

| Pattern | Intent | Cx | Pop |
|---|---|---|---|
| [adapter](./references/adapter.md) | Make an incompatible interface usable — *different* interface | ★☆☆ | ★★★ |
| [decorator](./references/decorator.md) | Add behavior by wrapping, stackably — *enhanced* interface | ★★☆ | ★★☆ |
| [proxy](./references/proxy.md) | Control access: lazy, cached, guarded, remote — *same* interface | ★★☆ | ★☆☆ |
| [facade](./references/facade.md) | One simple interface over a complex subsystem | ★☆☆ | ★★☆ |
| [composite](./references/composite.md) | Treat a tree of objects and a single object identically | ★★☆ | ★★☆ |
| [bridge](./references/bridge.md) | Split abstraction from implementation so two dimensions grow independently | ★★★ | ★☆☆ |
| [flyweight](./references/flyweight.md) | Share intrinsic state to fit more objects in RAM — *profile first* | ★★★ | ☆☆☆ |

### Behavioral — how objects communicate

| Pattern | Intent | Cx | Pop |
|---|---|---|---|
| [strategy](./references/strategy.md) | Interchangeable algorithms behind one interface | ★☆☆ | ★★★ |
| [observer](./references/observer.md) | Subscription mechanism for notifying many objects | ★★☆ | ★★★ |
| [command](./references/command.md) | A request as an object — deferrable, queueable, undoable | ★☆☆ | ★★★ |
| [iterator](./references/iterator.md) | Traverse a collection without exposing its representation | ★★☆ | ★★★ |
| [state](./references/state.md) | Behavior changes with internal state; states drive transitions | ★☆☆ | ★★☆ |
| [template-method](./references/template-method.md) | Algorithm skeleton in a base class, steps overridden by subclasses | ★☆☆ | ★★☆ |
| [chain-of-responsibility](./references/chain-of-responsibility.md) | Pass a request along handlers; any may handle it or stop it | ★★☆ | ★★☆ |
| [mediator](./references/mediator.md) | Components talk only through a central object | ★★☆ | ☆☆☆ |
| [memento](./references/memento.md) | Snapshot and restore state without breaking encapsulation | ★★★ | ★☆☆ |
| [visitor](./references/visitor.md) | New operations over a stable element hierarchy, via double dispatch | ★★★ | ★☆☆ |

> The classic Gang of Four catalog counts 23 patterns; the 22 patterns documented
> above cover all creational, structural, and behavioral patterns (except Interpreter).

## The TypeScript delta

Several patterns were invented to work around limitations that TypeScript doesn't have. Use
the shortcut unless the note in the right column applies — details in each pattern file.

| Pattern | Shortcut | Keep the classic form when |
|---|---|---|
| Strategy | function parameter, `Record<Union, Fn>` | several operations vary together |
| Command | closure | it must be inspected, serialized, queued or inverted |
| Singleton | ES module export | — (module + lazy getter always wins) |
| Builder | options object | construction is ordered or validated per step |
| Observer | `useSyncExternalStore`, `addEventListener` | you're building the emitter itself |
| Iterator | `Symbol.iterator`, generators | — (never hand-roll `next()`) |
| Visitor | discriminated union + exhaustive `switch` | elements are classes with private state |
| State | union + transition table | each state carries multi-method behavior |
| Decorator | higher-order function | the component has many methods to wrap |
| Template Method | function taking a `steps` object | a framework extends by subclassing |

**The general rule:** variants differing in **data** → discriminated union. Variants
differing in **one behavior** → function type. Variants differing in **several behaviors plus
private state** → class. And prefer `Record<Union, …>` or a mapped type wherever "every
variant is handled" should be a **compile error**, not a runtime fallback.

## Working rules

- **No pattern without a present problem.** One variant → no pattern. Two → usually a
  conditional. Three and growing → pattern.
- **Don't rename what's already there.** If the code implements Strategy, call it Strategy;
  inventing a new name for a known shape costs the next reader a translation.
- **Pattern ≠ inheritance.** Most of these work with composition, and in TypeScript most
  work with plain functions and unions.
- **Code examples in `references/` come in two flavors** — the *Conceptual example* blocks
  are canonical object-oriented implementations (4-space indent, semicolons, occasional `any`);
  the *Idiomatic TypeScript* blocks are written to modern style and are the ones to copy.

## Source & Foundations

All design patterns, structural participant roles, and architectural principles follow the canonical
Gang of Four (*Design Patterns: Elements of Reusable Object-Oriented Software*) catalog,
adapted with modern idioms for TypeScript.
