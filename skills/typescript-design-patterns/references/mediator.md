# Mediator

**Category:** Behavioral · **Complexity:** ★★☆ · **Popularity:** ☆☆☆
**Also known as:** Intermediary, Controller

## Intent

Reduce chaotic dependencies between objects by **forbidding direct communication** and
making them collaborate only through a **mediator** object.

## Problem

A dialog for creating and editing customer profiles: text fields, checkboxes, buttons.
Some elements interact — checking "I have a dog" reveals a text field for the dog's name;
the submit button must validate every field before saving.

Put that logic inside the elements and their classes become **impossible to reuse**. The
checkbox is coupled to the dog's text field, so you can't use it in another form. It's all
the profile-form classes or none of them.

## Solution

**Stop all direct communication** between the components you want independent. They call a
mediator instead, which redirects to the right components. Each component now depends on a
**single mediator class** rather than a dozen colleagues.

For the profile form, the **dialog itself** is the mediator — it already knows all its
sub-elements, so no new dependency is introduced.

The change lands on the elements. The submit button used to validate every field; now its
only job is to **notify the dialog of the click**. The dialog validates, or delegates the
validation. The button depends on the dialog, and nothing else.

Loosen it further by extracting a **common interface for all dialogs**, declaring the
notification method. Now the submit button works with **any** dialog implementing it.

**Real-world analogy:** air traffic control. Pilots near an airport don't negotiate landing
order with each other — they talk to the tower. Without it, every pilot would need to know
every plane in the vicinity. Note the tower doesn't control the whole flight: it enforces
constraints only in the terminal area, where the number of actors would overwhelm a pilot.

## Participants

| Role | Responsibility |
|---|---|
| **Components** | Business-logic classes. Each holds a reference typed as the **mediator interface**, not a concrete mediator, so the component can be reused with a different one |
| **Mediator** | Declares the communication protocol — usually a single notification method. Components may pass any context as arguments, **as long as no coupling to the sender's class results** |
| **Concrete Mediators** | Encapsulate the relations between components. Often hold references to all of them, sometimes managing their life cycle |

**Components must not be aware of other components.** When something important happens, a
component notifies **only** the mediator; the mediator identifies the sender and decides
what to trigger in return.

From a component's view it's a black box: the sender doesn't know who will handle its
request, and the receiver doesn't know who sent it.

## Use when

- **Some classes are hard to change because they're tightly coupled to a bunch of others.**
  The relationships move into one class, isolating changes to a component from the rest.
- **A component can't be reused in another program because it depends on too many others.**
  Afterwards, reusing it means supplying a new mediator class.
- **You're creating tons of component subclasses just to reuse basic behavior in different
  contexts.** With relations held in the mediator, a new way of collaborating is a new
  mediator — the components don't change.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Every component action funnels into `mediator.notify(this,
event)`; only the mediator's `notify` knows what follows what.

```ts
/**
 * The Mediator interface declares a method used by components to notify the
 * mediator about various events. The Mediator may react to these events and
 * pass the execution to other components.
 */
interface Mediator {
    notify(sender: object, event: string): void;
}

/**
 * Concrete Mediators implement cooperative behavior by coordinating several
 * components.
 */
class ConcreteMediator implements Mediator {
    private component1: Component1;

    private component2: Component2;

    constructor(c1: Component1, c2: Component2) {
        this.component1 = c1;
        this.component1.setMediator(this);
        this.component2 = c2;
        this.component2.setMediator(this);
    }

    public notify(sender: object, event: string): void {
        if (event === 'A') {
            console.log('Mediator reacts on A and triggers following operations:');
            this.component2.doC();
        }

        if (event === 'D') {
            console.log('Mediator reacts on D and triggers following operations:');
            this.component1.doB();
            this.component2.doC();
        }
    }
}

/**
 * The Base Component provides the basic functionality of storing a mediator's
 * instance inside component objects.
 */
class BaseComponent {
    protected mediator: Mediator;

    constructor(mediator?: Mediator) {
        this.mediator = mediator!;
    }

    public setMediator(mediator: Mediator): void {
        this.mediator = mediator;
    }
}

/**
 * Concrete Components implement various functionality. They don't depend on
 * other components. They also don't depend on any concrete mediator classes.
 */
class Component1 extends BaseComponent {
    public doA(): void {
        console.log('Component 1 does A.');
        this.mediator.notify(this, 'A');
    }

    public doB(): void {
        console.log('Component 1 does B.');
        this.mediator.notify(this, 'B');
    }
}

class Component2 extends BaseComponent {
    public doC(): void {
        console.log('Component 2 does C.');
        this.mediator.notify(this, 'C');
    }

    public doD(): void {
        console.log('Component 2 does D.');
        this.mediator.notify(this, 'D');
    }
}

/**
 * The client code.
 */
const c1 = new Component1();
const c2 = new Component2();
const mediator = new ConcreteMediator(c1, c2);

console.log('Client triggers operation A.');
c1.doA();

console.log('');
console.log('Client triggers operation D.');
c2.doD();
```

Output:

```
Client triggers operation A.
Component 1 does A.
Mediator reacts on A and triggers following operations:
Component 2 does C.

Client triggers operation D.
Component 2 does D.
Mediator reacts on D and triggers following operations:
Component 1 does B.
Component 2 does C.
```

## Idiomatic TypeScript

In architectural terms: **"The synonym of the Mediator is the
Controller part of MVC."** On a frontend, the mediator is typically a **store, a reducer,
or a container component** — the one place that knows how the parts relate.

A typed event union keeps the `notify` switch exhaustive:

```ts
type FormEvent =
  | { type: 'hasDogToggled'; checked: boolean }
  | { type: 'submitClicked' }
  | { type: 'fieldChanged'; field: keyof ProfileForm; value: string }

// The mediator: the only place that knows how the fields relate to each other
const reduce = (state: FormState, event: FormEvent): FormState => {
  switch (event.type) {
    case 'hasDogToggled':
      // The checkbox knows nothing about the dog-name field — this does
      return { ...state, hasDog: event.checked, dogNameVisible: event.checked }
    case 'fieldChanged':
      return { ...state, values: { ...state.values, [event.field]: event.value } }
    case 'submitClicked':
      return { ...state, errors: validateProfile(state.values) }
  }
}

// A component's entire outward contract: report what happened to it
const DogCheckbox = ({ checked, notify }: { checked: boolean; notify: (e: FormEvent) => void }) => (
  <Checkbox checked={checked} onChange={next => notify({ type: 'hasDogToggled', checked: next })} />
)
```

Components report **what happened to them** (`hasDogToggled`), never **what should happen
next** (`showDogNameField`). That distinction is the whole pattern — get it wrong and the
coupling moves into the event names.

Other mediators you already use: a Zustand/Redux store coordinating slices, a form library
orchestrating field dependencies, an event bus in front of independent modules.

## How to implement

1. Identify a group of **tightly coupled classes** that would benefit from independence.
2. Declare the **mediator interface** and the communication protocol — usually one method
   for receiving notifications. This interface is what lets components be reused in other
   contexts.
3. Implement the concrete mediator, typically holding references to all its components.
4. Optionally let the mediator **create and destroy** the components too — at which point it
   starts to resemble a factory or a facade.
5. Components store a mediator reference, usually passed into their constructor.
6. Replace every cross-component call with a **notification to the mediator**, and move the
   code that called other components **into** the mediator, executed when it receives the
   matching notification.

## Pros and cons

**Pros**

- **Single Responsibility Principle** — all the communication lives in one comprehensible
  place.
- **Open/Closed Principle** — new mediators without changing components.
- Reduces coupling between components.
- Components become far easier to reuse.

**Cons**

- Over time a mediator can grow into a **God Object**.

## Identification

A class that holds references to many components, receives notifications from all of them,
and is the only place where one component's event triggers another's method.

## Relations with other patterns

**CoR, Command, Mediator and Observer connect senders and receivers differently:**

- **Chain of Responsibility** passes a request along a dynamic chain until one handles it.
- **Command** establishes unidirectional sender→receiver connections.
- **Mediator** eliminates direct connections entirely.
- **Observer** lets receivers subscribe and unsubscribe dynamically.

**Facade vs. Mediator** — both organize collaboration among tightly coupled classes, but a
Facade only **simplifies access** to a subsystem that remains unaware of it and whose objects
still talk directly; a Mediator **centralizes** communication and components know nothing but
the mediator.

**Mediator vs. Observer** is the genuinely elusive one. Mediator's goal is to remove mutual
dependencies among components; Observer's is to establish dynamic one-way connections. A
popular Mediator implementation **uses Observer**: the mediator is the publisher, components
subscribe to its events — and then the two look almost identical. But you can also implement
Mediator by permanently linking components to one mediator, which resembles Observer not at
all and is still Mediator. And if *every* component becomes a publisher with dynamic
connections, there is no central mediator left — only a distributed set of observers.

## Anti-signals

- The mediator has become the God Object: hundreds of lines of `if (sender === … && event
  === …)`. Split it by concern.
- Components emit events named after what the mediator should do — the coupling just moved.
- Only two components are involved and they'd be perfectly fine talking directly.

## See also

[observer](./observer.md) · [facade](./facade.md) · [command](./command.md) · [chain-of-responsibility](./chain-of-responsibility.md)
