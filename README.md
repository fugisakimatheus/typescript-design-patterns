# TypeScript Design Patterns

[![skills.sh](https://skills.sh/b/fugisakimatheus/typescript-design-patterns)](https://skills.sh/fugisakimatheus/typescript-design-patterns)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive catalog of the 22 classic **Gang of Four (GoF)** design patterns tailored for modern TypeScript. Formatted as an open **Agent Skill** for AI coding agents (Claude Code, Cursor, Codex, Antigravity, GitHub Copilot, Windsurf, OpenCode) and a ready-to-use playbook for software engineers.

---

## What's Inside

Every pattern in this skill provides:

1. **Intent & Problem**: Real-world software engineering problem each pattern solves.
2. **Participants**: Roles and relationships between classes or interfaces.
3. **Canonical Implementation**: Clean, canonical object-oriented implementation.
4. **Modern Idiomatic Rewrite**: Modern TypeScript alternatives (discriminated unions, higher-order functions, generators, Record lookups) that achieve the same result with less boilerplate.
5. **Trade-offs**: Honest pros, cons, and complexity/popularity indicators.
6. **When NOT to apply**: Warnings against over-engineering and premature abstraction.

---

## Installation

### Via `skills` CLI

Install this skill into your AI agent environment with a single command:

```bash
npx skills add fugisakimatheus/typescript-design-patterns
```

### Supported AI Agents

Works seamlessly across all major AI agent ecosystems:
- **Claude Code** (`~/.claude/skills/`)
- **Cursor** (`.cursor/skills/`)
- **Antigravity / Gemini** (`~/.gemini/skills/`)
- **OpenAI Codex** (`~/.codex/skills/`)
- **GitHub Copilot** (`.github/skills/`)
- **Windsurf** (`.windsurf/skills/`)
- **OpenCode**

### Use Without Installing

Run interactively or generate prompts on demand:

```bash
npx skills use fugisakimatheus/typescript-design-patterns --agent claude-code
```

---

## Catalog Overview

### Creational Patterns
How objects get created and instantiated:
- [Factory Method](references/factory-method.md) — Creation through an overridable method; subclasses pick concrete product.
- [Abstract Factory](references/abstract-factory.md) — Produce families of related objects guaranteed to match.
- [Builder](references/builder.md) — Step-by-step construction of complex objects.
- [Prototype](references/prototype.md) — Clone existing objects without depending on concrete classes.
- [Singleton](references/singleton.md) — Single instance with global point of access.

### Structural Patterns
How classes and objects are composed into larger structures:
- [Adapter](references/adapter.md) — Make incompatible interfaces work together.
- [Bridge](references/bridge.md) — Decouple abstraction from implementation so both can vary independently.
- [Composite](references/composite.md) — Treat individual objects and compositions of objects uniformly.
- [Decorator](references/decorator.md) — Attach additional responsibilities dynamically via wrapping.
- [Facade](references/facade.md) — Simple unified interface over a complex subsystem.
- [Flyweight](references/flyweight.md) — Share fine-grained state to support large numbers of objects in memory.
- [Proxy](references/proxy.md) — Provide a surrogate or placeholder to control access.

### Behavioral Patterns
How objects communicate and distribute responsibility:
- [Chain of Responsibility](references/chain-of-responsibility.md) — Pass requests along a chain of handlers.
- [Command](references/command.md) — Encapsulate a request as an object (undoable, queueable).
- [Iterator](references/iterator.md) — Sequential traversal of collections without exposing internal representations.
- [Mediator](references/mediator.md) — Centralize complex communications between components.
- [Memento](references/memento.md) — Capture and externalize an object's internal state for restore.
- [Observer](references/observer.md) — Subscription mechanism for notifying multiple dependents.
- [State](references/state.md) — Alter behavior when internal state changes.
- [Strategy](references/strategy.md) — Interchangeable family of algorithms behind a common interface.
- [Template Method](references/template-method.md) — Skeleton of an algorithm in a base class, steps deferred to subclasses.
- [Visitor](references/visitor.md) — Separate operations from the object structure on which they operate.

---

## Navigating the Skill

- **[choosing-a-pattern.md](references/choosing-a-pattern.md)** — Start from the symptom: find the exact problem you have and route to the right pattern.
- **[pattern-relations.md](references/pattern-relations.md)** — Disambiguation guide: Strategy vs. State vs. Bridge, Proxy vs. Decorator vs. Adapter, Mediator vs. Observer.

---

## Token Efficiency & Progressive Disclosure

This skill is designed specifically for AI agent context windows:
- **`SKILL.md`** serves as a lightweight routing index loaded initially into the prompt.
- Deep implementations are stored in **`references/`**, loaded on demand only when a specific pattern is needed.

---

## License

This project is licensed under the [MIT License](LICENSE).
