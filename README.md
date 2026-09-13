# TypeScript Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/fugisakimatheus/typescript-skills?display_name=tag&sort=semver&color=brightgreen)](https://github.com/fugisakimatheus/typescript-skills/releases)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Standard-purple.svg)](https://agentskills.io)

Open repository of **Agent Skills** for TypeScript development with AI coding agents (Claude Code, Cursor, Codex, Antigravity, GitHub Copilot, Windsurf, OpenCode) and software engineers.

### Included Skills

- **[`typescript-design-patterns`](skills/typescript-design-patterns)**: A comprehensive catalog of the 22 classic **Gang of Four (GoF)** design patterns tailored for modern TypeScript as ready-to-apply playbooks for AI coding agents.

---

## What's Inside (`typescript-design-patterns`)

Every pattern in this skill provides:

1. **Intent & Problem**: Real-world software engineering problem each pattern solves.
2. **Participants**: Roles and relationships between classes or interfaces.
3. **Canonical Implementation**: Clean, canonical object-oriented implementation.
4. **Modern Idiomatic Rewrite**: Modern TypeScript alternatives (discriminated unions, higher-order functions, generators, Record lookups) that achieve the same result with less boilerplate.
5. **Trade-offs**: Honest pros, cons, and complexity/popularity indicators.
6. **When NOT to apply**: Warnings against over-engineering and premature abstraction.

---

## Installation

### Via `skills` CLI (Recommended)

Install all skills from this repository into your AI agent environment with a single command:

```bash
npx skills add fugisakimatheus/typescript-skills
```

Or install specifically the `typescript-design-patterns` skill:

```bash
npx skills add fugisakimatheus/typescript-skills --skill typescript-design-patterns
```

The CLI automatically detects your installed coding agents and configures the skill.

### Manual Installation

You can also copy the `typescript-design-patterns` skill directory directly into your agent's skill path:

```bash
# Project-level (shared with team)
cp -r skills/typescript-design-patterns .agents/skills/

# Global (available across all projects)
# Claude Code:
cp -r skills/typescript-design-patterns ~/.claude/skills/

# Antigravity CLI:
cp -r skills/typescript-design-patterns ~/.gemini/antigravity-cli/skills/

# Cursor:
cp -r skills/typescript-design-patterns ~/.cursor/skills/
```

### Supported AI Agents

Works seamlessly across all major AI agent ecosystems:
- **Claude Code** (`~/.claude/skills/`)
- **Cursor** (`.agents/skills/` or `~/.cursor/skills/`)
- **Antigravity / Gemini** (`.agents/skills/` or `~/.gemini/antigravity-cli/skills/`)
- **OpenAI Codex** (`.agents/skills/` or `~/.codex/skills/`)
- **GitHub Copilot** (`.agents/skills/` or `~/.copilot/skills/`)
- **Windsurf** (`.windsurf/skills/`)
- **OpenCode** (`.agents/skills/`)

### Use Without Installing

Run interactively or generate prompts on demand:

```bash
npx skills use fugisakimatheus/typescript-skills --skill typescript-design-patterns --agent claude-code
```

---

## Repository Structure

Designed according to the [Agent Skills specification](https://agentskills.io) and Antigravity customization guidelines:

```text
.
├── .github/
│   └── workflows/
│       ├── release.yml                 # Automated GitHub release on git tag
│       └── validate.yml                # CI validation for skill structure
├── skills/
│   └── typescript-design-patterns/
│       ├── SKILL.md                    # Core skill entry point & frontmatter
│       └── references/                 # Detailed pattern implementations
│           ├── choosing-a-pattern.md   # Symptom-based decision tree
│           ├── pattern-relations.md    # Disambiguation guide
│           └── ... (22 GoF patterns)
├── .gitignore
├── LICENSE                             # MIT License
├── package.json                        # Metadata & ecosystem keywords
└── README.md
```

---

## Catalog Overview

### Creational Patterns
How objects get created and instantiated:
- [Factory Method](skills/typescript-design-patterns/references/factory-method.md) — Creation through an overridable method; subclasses pick concrete product.
- [Abstract Factory](skills/typescript-design-patterns/references/abstract-factory.md) — Produce families of related objects guaranteed to match.
- [Builder](skills/typescript-design-patterns/references/builder.md) — Step-by-step construction of complex objects.
- [Prototype](skills/typescript-design-patterns/references/prototype.md) — Clone existing objects without depending on concrete classes.
- [Singleton](skills/typescript-design-patterns/references/singleton.md) — Single instance with global point of access.

### Structural Patterns
How classes and objects are composed into larger structures:
- [Adapter](skills/typescript-design-patterns/references/adapter.md) — Make incompatible interfaces work together.
- [Bridge](skills/typescript-design-patterns/references/bridge.md) — Decouple abstraction from implementation so both can vary independently.
- [Composite](skills/typescript-design-patterns/references/composite.md) — Treat individual objects and compositions of objects uniformly.
- [Decorator](skills/typescript-design-patterns/references/decorator.md) — Attach additional responsibilities dynamically via wrapping.
- [Facade](skills/typescript-design-patterns/references/facade.md) — Simple unified interface over a complex subsystem.
- [Flyweight](skills/typescript-design-patterns/references/flyweight.md) — Share fine-grained state to support large numbers of objects in memory.
- [Proxy](skills/typescript-design-patterns/references/proxy.md) — Provide a surrogate or placeholder to control access.

### Behavioral Patterns
How objects communicate and distribute responsibility:
- [Chain of Responsibility](skills/typescript-design-patterns/references/chain-of-responsibility.md) — Pass requests along a chain of handlers.
- [Command](skills/typescript-design-patterns/references/command.md) — Encapsulate a request as an object (undoable, queueable).
- [Iterator](skills/typescript-design-patterns/references/iterator.md) — Sequential traversal of collections without exposing internal representations.
- [Mediator](skills/typescript-design-patterns/references/mediator.md) — Centralize complex communications between components.
- [Memento](skills/typescript-design-patterns/references/memento.md) — Capture and externalize an object's internal state for restore.
- [Observer](skills/typescript-design-patterns/references/observer.md) — Subscription mechanism for notifying multiple dependents.
- [State](skills/typescript-design-patterns/references/state.md) — Alter behavior when internal state changes.
- [Strategy](skills/typescript-design-patterns/references/strategy.md) — Interchangeable family of algorithms behind a common interface.
- [Template Method](skills/typescript-design-patterns/references/template-method.md) — Skeleton of an algorithm in a base class, steps deferred to subclasses.
- [Visitor](skills/typescript-design-patterns/references/visitor.md) — Separate operations from the object structure on which they operate.

---

## Navigating the Skill

- **[choosing-a-pattern.md](skills/typescript-design-patterns/references/choosing-a-pattern.md)** — Start from the symptom: find the exact problem you have and route to the right pattern.
- **[pattern-relations.md](skills/typescript-design-patterns/references/pattern-relations.md)** — Disambiguation guide: Strategy vs. State vs. Bridge, Proxy vs. Decorator vs. Adapter, Mediator vs. Observer.
- **[SKILL.md](skills/typescript-design-patterns/SKILL.md)** — Full skill instructions and TypeScript shortcut table.

---

## Token Efficiency & Progressive Disclosure

This skill is designed specifically for AI agent context windows:
- **`SKILL.md`** serves as a lightweight routing index loaded initially into the prompt.
- Deep implementations are stored in **`references/`**, loaded on demand only when a specific pattern is needed.

---

## Releases & Publishing

To publish a new version on GitHub:

```bash
# 1. Tag a new version
git tag v1.0.0

# 2. Push the tag to GitHub
git push origin v1.0.0
```

The [GitHub Actions Release Workflow](.github/workflows/release.yml) will automatically package the `typescript-design-patterns` skill archives (`.tar.gz` and `.zip`) and create a GitHub Release in `typescript-skills` with release notes.

---

## License

This project is licensed under the [MIT License](LICENSE).
