# Memento

**Category:** Behavioral · **Complexity:** ★★★ · **Popularity:** ★☆☆
**Also known as:** Snapshot

## Intent

Save and restore an object's previous state **without revealing the details of its
implementation**.

## Problem

A text editor needs undo. The direct approach: before each operation, record the state of
all objects into storage; on undo, fetch the latest snapshot and restore.

How do you produce that snapshot? Walk the object's fields and copy the values — which only
works if the object has **relaxed access to its contents**. Real objects hide their
significant data in private fields.

Suppose they didn't. You'd still be stuck: refactoring an editor class, or adding a field,
now forces a change in the classes that copy its state.

And consider the snapshot container itself. It holds the text, cursor coordinates, scroll
position… a class with almost no methods and lots of fields mirroring the editor. For other
objects to read and write it, **those fields must be public** — exposing the editor's entire
state, private parts included. Every other class becomes dependent on details that should
have been free to change behind private methods.

Dead end: expose everything and make classes fragile, or restrict access and make snapshots
impossible.

## Solution

The root cause is **broken encapsulation** — objects invading other objects' private space
to collect data, instead of asking the owner to do the work.

Memento **delegates snapshot creation to the owner of the state**, the **originator**. The
editor makes its own snapshot; it has full access to itself.

The copy lives in a **memento** object whose contents are **inaccessible to everyone but its
producer**. Other objects talk to mementos through a limited interface exposing metadata
(creation time, operation name) but **not** the state.

That restriction is what lets mementos be stored in **caretakers**. Working only through the
limited interface, the caretaker can't tamper with the state; the originator has full access
and can restore itself at will.

For the editor: a history class is the caretaker, holding a stack of mementos that grows
before each operation — you could even render it as a visible operation history. On undo,
the history hands the top memento back to the editor, which restores itself from it.

## Participants

| Role | Responsibility |
|---|---|
| **Originator** | Produces snapshots of its own state and restores itself from them |
| **Memento** | A **value object** snapshot. Conventionally **immutable**, receiving data once via the constructor |
| **Caretaker** | Knows *when* and *why* to capture state and when to restore it. Typically holds a stack of mementos |

### Three implementation shapes

1. **Nested classes** (C++, C#, Java): the memento is nested inside the originator, which
   can therefore read its private members while the caretaker can only store it.
2. **Intermediate interface** (languages without nested classes): a convention — caretakers
   see the memento only through an interface declaring metadata methods, while originators
   use the class directly. Downside: all memento members must be public.
3. **Strictest encapsulation**: multiple originator/memento type pairs, neither exposing
   state to anyone. The **restoration method moves into the memento**, each memento is linked
   to the originator that created it (the originator passes itself to the memento's
   constructor), and the caretaker becomes independent of the originator.

## Use when

- **You want snapshots of an object's state to restore it later.** Undo is the famous case,
  but the pattern is equally indispensable for **transactions** — rolling back an operation
  on error.
- **Direct access to an object's fields/getters/setters violates its encapsulation.** The
  object becomes responsible for its own snapshot, and no one else can read it.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. The `Memento` interface is what the caretaker sees;
`ConcreteMemento` is what the originator uses.

```ts
/**
 * The Originator holds some important state that may change over time. It also
 * defines a method for saving the state inside a memento and another method for
 * restoring the state from it.
 */
class Originator {
    /**
     * For the sake of simplicity, the originator's state is stored inside a
     * single variable.
     */
    private state: string;

    constructor(state: string) {
        this.state = state;
        console.log(`Originator: My initial state is: ${state}`);
    }

    /**
     * The Originator's business logic may affect its internal state. Therefore,
     * the client should backup the state before launching methods of the
     * business logic via the save() method.
     */
    public doSomething(): void {
        console.log('Originator: I\'m doing something important.');
        this.state = this.generateRandomString(30);
        console.log(`Originator: and my state has changed to: ${this.state}`);
    }

    private generateRandomString(length: number = 10): string {
        const charSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        return Array
            .apply(null, { length })
            .map(() => charSet.charAt(Math.floor(Math.random() * charSet.length)))
            .join('');
    }

    /**
     * Saves the current state inside a memento.
     */
    public save(): Memento {
        return new ConcreteMemento(this.state);
    }

    /**
     * Restores the Originator's state from a memento object.
     */
    public restore(memento: Memento): void {
        this.state = memento.getState();
        console.log(`Originator: My state has changed to: ${this.state}`);
    }
}

/**
 * The Memento interface provides a way to retrieve the memento's metadata, such
 * as creation date or name. However, it doesn't expose the Originator's state.
 */
interface Memento {
    getState(): string;

    getName(): string;

    getDate(): string;
}

/**
 * The Concrete Memento contains the infrastructure for storing the Originator's
 * state.
 */
class ConcreteMemento implements Memento {
    private state: string;

    private date: string;

    constructor(state: string) {
        this.state = state;
        this.date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    /**
     * The Originator uses this method when restoring its state.
     */
    public getState(): string {
        return this.state;
    }

    /**
     * The rest of the methods are used by the Caretaker to display metadata.
     */
    public getName(): string {
        return `${this.date} / (${this.state.substr(0, 9)}...)`;
    }

    public getDate(): string {
        return this.date;
    }
}

/**
 * The Caretaker doesn't depend on the Concrete Memento class. Therefore, it
 * doesn't have access to the originator's state, stored inside the memento. It
 * works with all mementos via the base Memento interface.
 */
class Caretaker {
    private mementos: Memento[] = [];

    private originator: Originator;

    constructor(originator: Originator) {
        this.originator = originator;
    }

    public backup(): void {
        console.log('\nCaretaker: Saving Originator\'s state...');
        this.mementos.push(this.originator.save());
    }

    public undo(): void {
        if (!this.mementos.length) {
            return;
        }
        const memento = this.mementos.pop();

        console.log(`Caretaker: Restoring state to: ${memento.getName()}`);
        this.originator.restore(memento);
    }

    public showHistory(): void {
        console.log('Caretaker: Here\'s the list of mementos:');
        for (const memento of this.mementos) {
            console.log(memento.getName());
        }
    }
}

/**
 * Client code.
 */
const originator = new Originator('Super-duper-super-puper-super.');
const caretaker = new Caretaker(originator);

caretaker.backup();
originator.doSomething();

caretaker.backup();
originator.doSomething();

caretaker.backup();
originator.doSomething();

console.log('');
caretaker.showHistory();

console.log('\nClient: Now, let\'s rollback!\n');
caretaker.undo();

console.log('\nClient: Once more!\n');
caretaker.undo();
```

Output (abridged — the state strings are random):

```
Originator: My initial state is: Super-duper-super-puper-super.

Caretaker: Saving Originator's state...
Originator: I'm doing something important.
Originator: and my state has changed to: qXqxgTcLSCeLYdcgElOghOFhPGfMxo
…
Caretaker: Here's the list of mementos:
2019-02-17 15:14:05 / (Super-dup...)
2019-02-17 15:14:05 / (qXqxgTcLS...)
2019-02-17 15:14:05 / (iaVCJVryJ...)

Client: Now, let's rollback!

Caretaker: Restoring state to: 2019-02-17 15:14:05 / (iaVCJVryJ...)
Originator: My state has changed to: iaVCJVryJwWwbipieensfodeMSWvUY
```

## Idiomatic TypeScript

Practical TypeScript note: *"The Memento's principle can be achieved using
serialization."* And the caveat it states plainly in the cons — **dynamic languages,
JavaScript included, can't guarantee the state inside a memento stays untouched**. TypeScript
gives you compile-time guarantees, not runtime ones; `#private` fields and `Object.freeze`
narrow the gap.

The workable shape: an **opaque snapshot type** the caretaker can hold but not read into.

```ts
// The caretaker can store and label this; it cannot reach the fields.
declare const snapshotBrand: unique symbol
export interface EditorSnapshot {
  readonly [snapshotBrand]: true
  readonly label: string
  readonly createdAt: Date
}

interface EditorState {
  text: string
  cursor: { x: number; y: number }
  selectionWidth: number
}

export class Editor {
  #state: EditorState = { text: '', cursor: { x: 0, y: 0 }, selectionWidth: 0 }

  // The originator makes its own snapshot — nobody reaches inside it
  save(label: string): EditorSnapshot {
    const snapshot = {
      label,
      createdAt: new Date(),
      state: structuredClone(this.#state)
    }
    return Object.freeze(snapshot) as unknown as EditorSnapshot
  }

  restore(snapshot: EditorSnapshot) {
    this.#state = structuredClone((snapshot as unknown as { state: EditorState }).state)
  }
}

// The caretaker sees only metadata
export class History {
  readonly #snapshots: EditorSnapshot[] = []

  constructor(private readonly editor: Editor, private readonly limit = 50) {}

  backup(label: string) {
    this.#snapshots.push(this.editor.save(label))
    if (this.#snapshots.length > this.limit) this.#snapshots.shift() // bound the RAM
  }

  undo() {
    const snapshot = this.#snapshots.pop()
    if (snapshot) this.editor.restore(snapshot)
  }

  list() {
    return this.#snapshots.map(({ label, createdAt }) => ({ label, createdAt }))
  }
}
```

**When a full snapshot is the wrong trade:** in an immutable-state codebase (Redux, Zustand
with immer), an old state object *is* already a memento — keeping references costs nothing
extra thanks to structural sharing. And when state is large, prefer storing the **inverse
command** ([Command](./command.md)) over the whole snapshot.

## How to implement

1. Decide which class is the **originator** — and whether the program has one central
   instance or many small ones.
2. Create the memento class with fields mirroring the originator's.
3. Make it **immutable**: data in once, via the constructor; no setters.
4. **Nest** it inside the originator if the language allows; otherwise extract a blank
   interface for everyone else to use, optionally with metadata operations but nothing that
   exposes state.
5. Add a snapshot-producing method to the originator, passing its state through the memento's
   constructor. Its return type is the extracted interface; internally it works with the
   concrete class.
6. Add a restore method taking a memento. If you extracted an interface, the parameter is
   typed as it and the originator **casts** to the concrete class for full access.
7. The caretaker — command object, history, whatever — decides when to request mementos, how
   to store them, and when to restore.
8. Optionally move the originator link **into** the memento, along with the restore method.
   That only makes sense if the memento is nested in the originator, or the originator
   exposes enough setters.

## Pros and cons

**Pros**

- Snapshots **without violating encapsulation**.
- Simplifies the originator by letting the caretaker own the history.

**Cons**

- The app may consume **lots of RAM** if clients snapshot too often.
- Caretakers must track the originator's **life cycle** to destroy obsolete mementos.
- **Dynamic languages — PHP, Python, JavaScript — can't guarantee** the memento's state stays
  untouched.

## Identification

An object that produces opaque snapshot objects of itself and accepts them back to restore;
a separate object holds a stack of those snapshots but can only read their metadata.

## Relations with other patterns

- **Command + Memento** for undo: commands perform operations, mementos save the target's
  state just before each executes.
- **Iterator + Memento** captures and rolls back the current iteration state.
- **Prototype** is sometimes a simpler alternative — when the state is straightforward and
  has no links to external resources (or links that are easy to re-establish).

## Anti-signals

- Snapshotting on every keystroke without bounding the history.
- The memento is a plain public object anyone can mutate — encapsulation, the entire point,
  is gone.
- The state is already immutable: keeping a reference is cheaper and simpler than copying.
- Snapshots contain non-serializable handles (sockets, DOM nodes) that won't survive restore.

## See also

[command](./command.md) · [prototype](./prototype.md) · [iterator](./iterator.md)
