# State

**Category:** Behavioral · **Complexity:** ★☆☆ · **Popularity:** ★★☆

## Intent

Let an object **alter its behavior when its internal state changes** — so much that it
appears to have changed its class.

## Problem

State is closely related to the **Finite-State Machine**: at any moment a program is in one
of a finite number of states, behaves differently in each, and switches between them
instantaneously — but only along a finite, predetermined set of **transitions**.

A `Document` can be `Draft`, `Moderation` or `Published`, and `publish()` differs in each:

- **Draft** → move to moderation.
- **Moderation** → make public, but only if the current user is an administrator.
- **Published** → do nothing.

The usual implementation is conditionals over a state field:

```
class Document is
    field state: string
    method publish() is
        switch (state)
            "draft":      state = "moderation"; break
            "moderation": if (currentUser.role == "admin") state = "published"; break
            "published":  break
```

The weakness shows as states and state-dependent behavior accumulate: **most methods grow
monstrous conditionals**, and any change to the transition logic means editing the state
conditionals in **every** method. You can't predict all states and transitions at design
time, so a lean state machine turns into a bloated mess as the project evolves.

## Solution

Create a class per state and move the state-specific behavior into it.

The original object — the **context** — keeps a reference to one state object representing
its current state and **delegates all state-related work to it**. To transition, replace the
active state object with another. That works only if all state classes follow the same
interface and the context speaks to them through it.

**This looks like Strategy, with one key difference:** in State, the concrete states **may
know about each other and initiate transitions**; strategies almost never know about each
other.

**Real-world analogy:** your phone's buttons. Unlocked, they run functions. Locked, any
button opens the unlock screen. Low battery, any button shows the charging screen.

## Participants

| Role | Responsibility |
|---|---|
| **Context** | Holds a reference to a concrete state and delegates state-specific work to it, through the state interface. Exposes a setter for a new state |
| **State** | Declares the state-specific methods. They should **make sense for every concrete state** — you don't want states carrying methods that are never called |
| **Concrete States** | Implement those methods. Intermediate abstract classes can hold behavior common to several states |

State objects often keep a **back-reference to the context**, to fetch data from it and to
initiate transitions. **Both** the context and the concrete states can set the next state.

## Use when

- **An object behaves differently depending on its state, the number of states is enormous,
  and the state-specific code changes frequently.** States can then be added and changed
  independently.
- **A class is polluted with massive conditionals** that alter behavior based on field
  values. Extract the branches into state classes — and clean the temporary fields and
  helper methods out of the main class while you're there.
- **There's a lot of duplicate code across similar states and transitions** in a
  condition-based state machine. Compose a hierarchy of state classes and pull the common
  code into abstract bases.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `ConcreteStateA` calling `this.context.transitionTo(…)`
— a state driving the transition, which is exactly what distinguishes State from Strategy.

```ts
/**
 * The Context defines the interface of interest to clients. It also maintains a
 * reference to an instance of a State subclass, which represents the current
 * state of the Context.
 */
class Context {
    /**
     * @type {State} A reference to the current state of the Context.
     */
    private state: State;

    constructor(state: State) {
        this.transitionTo(state);
    }

    /**
     * The Context allows changing the State object at runtime.
     */
    public transitionTo(state: State): void {
        console.log(`Context: Transition to ${(<any>state).constructor.name}.`);
        this.state = state;
        this.state.setContext(this);
    }

    /**
     * The Context delegates part of its behavior to the current State object.
     */
    public request1(): void {
        this.state.handle1();
    }

    public request2(): void {
        this.state.handle2();
    }
}

/**
 * The base State class declares methods that all Concrete State should
 * implement and also provides a backreference to the Context object, associated
 * with the State. This backreference can be used by States to transition the
 * Context to another State.
 */
abstract class State {
    protected context: Context;

    public setContext(context: Context) {
        this.context = context;
    }

    public abstract handle1(): void;

    public abstract handle2(): void;
}

/**
 * Concrete States implement various behaviors, associated with a state of the
 * Context.
 */
class ConcreteStateA extends State {
    public handle1(): void {
        console.log('ConcreteStateA handles request1.');
        console.log('ConcreteStateA wants to change the state of the context.');
        this.context.transitionTo(new ConcreteStateB());
    }

    public handle2(): void {
        console.log('ConcreteStateA handles request2.');
    }
}

class ConcreteStateB extends State {
    public handle1(): void {
        console.log('ConcreteStateB handles request1.');
    }

    public handle2(): void {
        console.log('ConcreteStateB handles request2.');
        console.log('ConcreteStateB wants to change the state of the context.');
        this.context.transitionTo(new ConcreteStateA());
    }
}

/**
 * The client code.
 */
const context = new Context(new ConcreteStateA());
context.request1();
context.request2();
```

Output:

```
Context: Transition to ConcreteStateA.
ConcreteStateA handles request1.
ConcreteStateA wants to change the state of the context.
Context: Transition to ConcreteStateB.
ConcreteStateB handles request2.
ConcreteStateB wants to change the state of the context.
Context: Transition to ConcreteStateA.
```

## Idiomatic TypeScript

The conditional state machine isn't the only alternative to state classes — a **transition
table over a discriminated union** gets you the pattern's benefits with exhaustiveness
checking the class version can't offer:

```ts
type DocumentState = 'draft' | 'moderation' | 'published' | 'rejected'
type DocumentAction = 'submit' | 'approve' | 'reject' | 'retract'

// The whole machine as data: every illegal transition is simply absent
const transitions = {
  draft: { submit: 'moderation' },
  moderation: { approve: 'published', reject: 'rejected' },
  published: { retract: 'draft' },
  rejected: { submit: 'moderation' }
} as const satisfies Partial<Record<DocumentState, Partial<Record<DocumentAction, DocumentState>>>>

export const next = (state: DocumentState, action: DocumentAction): DocumentState =>
  (transitions[state] as Record<string, DocumentState | undefined>)[action] ?? state
```

**Making illegal states unrepresentable** is the move that pays off most in TypeScript —
carry the data each state actually has, and the compiler stops you reading fields that don't
exist yet:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T } // `data` exists only here
  | { status: 'error'; error: Error } // `error` exists only here

const render = <T,>(state: RequestState<T>) => {
  switch (state.status) {
    case 'idle':
      return <Placeholder />
    case 'loading':
      return <Spinner />
    case 'success':
      return <List items={state.data} /> // no optional chaining, no non-null assertion
    case 'error':
      return <ErrorBanner message={state.error.message} />
  }
}
```

Keep **state classes** when each state carries substantial behavior across several methods
(the media player: lock/play/next/previous behave differently in each of three states).
Use the **union + transition table** when states differ mainly in *what data they hold* and
*which transitions are legal* — the common frontend case. For anything genuinely complex
(nested states, parallel regions, guards, delayed transitions), reach for a statechart
library rather than hand-rolling.

## How to implement

1. Decide what class is the **context** — an existing class with state-dependent code, or a
   new one if that code is spread across several classes.
2. Declare the **state interface**, covering only methods that may hold state-specific
   behavior.
3. Create a class per state and move the matching code into it. When the extracted code
   depends on the context's private members, your options are: make them public; turn the
   behavior into a public method on the context and call it from the state ("ugly but quick,
   and you can always fix it later"); or nest the state classes inside the context if your
   language allows.
4. Add a state-interface reference field plus a public setter on the context.
5. Replace the state conditionals in the context's methods with calls to the state object.
6. Transition by instantiating a state class and passing it to the context — from the
   context, from a state, or from the client. Whoever does it **becomes dependent on that
   concrete state class**.

## Pros and cons

**Pros**

- **Single Responsibility Principle** — per-state code in its own class.
- **Open/Closed Principle** — new states without touching existing states or the context.
- The context's bulky state-machine conditionals disappear.

**Cons**

- **Overkill** when a state machine has only a few states or rarely changes.

## Identification

Methods whose behavior changes depending on the object's state, where that state is
**controlled externally** — held in a replaceable object rather than a flag.

## Relations with other patterns

- **Bridge**, State, **Strategy** (and to a degree **Adapter**) share a structure — all are
  composition-based delegation — but solve different problems.
- **State can be read as an extension of Strategy.** Both change the context's behavior by
  delegating to helper objects. Strategy makes those objects **completely independent and
  unaware of each other**; State lets concrete states depend on one another and **alter the
  context's state at will**.

## Anti-signals

- Three states that never change — a boolean or a small switch is honest and shorter.
- State classes that all implement the same method as a no-op, because the interface covers
  methods only some states need.
- Transitions scattered across states with no single place to read the machine — draw it or
  table it.
- Optional fields everywhere (`data?`, `error?`) because the state isn't modeled as a union.

## See also

[strategy](./strategy.md) · [bridge](./bridge.md) · [observer](./observer.md) · [command](./command.md)
