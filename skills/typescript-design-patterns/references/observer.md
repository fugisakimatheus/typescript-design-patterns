# Observer

**Category:** Behavioral · **Complexity:** ★★☆ · **Popularity:** ★★★
**Also known as:** Event-Subscriber, Listener

## Intent

Define a **subscription mechanism** to notify multiple objects about events happening to the
object they're observing.

## Problem

A `Customer` wants a particular product that a `Store` will soon stock.

- The customer could **visit the store daily** — mostly wasted trips while the product is en
  route.
- The store could **email every customer** on every new arrival — spam, upsetting everyone
  not interested.

Either the customer wastes time polling or the store wastes resources notifying the wrong
people.

## Solution

The object with the interesting state is the **subject**, or — since it notifies others —
the **publisher**. Objects tracking its changes are **subscribers**.

Add a subscription mechanism to the publisher. Concretely it's two things: **(1)** an array
field holding references to subscriber objects, and **(2)** public methods to add and remove
them. When something important happens, the publisher walks the list and calls a
notification method on each.

Real apps have dozens of subscriber classes interested in one publisher, and you don't want
the publisher coupled to any of them — you may not even know about some, if others use your
publisher class. So **all subscribers must implement the same interface**, and the publisher
talks to them only through it. That interface declares the notification method plus
parameters the publisher uses to pass contextual data.

If there are several publisher types and subscribers should work with all of them, give the
**publishers a common interface** too — just the subscription methods — so subscribers
observe without coupling to concrete publisher classes.

**Real-world analogy:** magazine subscriptions. You stop going to the store to check; the
publisher keeps a list of who wants what and mails each issue. You can leave the list
whenever you like.

## Participants

| Role | Responsibility |
|---|---|
| **Publisher** | Issues events of interest. Owns the subscription infrastructure for joining and leaving |
| **Subscriber** | The notification interface — usually a single `update` method, possibly with parameters carrying event details |
| **Concrete Subscribers** | React to notifications. All implement the same interface so the publisher stays decoupled |
| **Client** | Creates publishers and subscribers **separately**, then registers the subscribers |

Subscribers usually need context. The publisher can pass it as arguments — or **pass
itself**, letting the subscriber fetch whatever it needs.

## Use when

- **Changes to one object require changing others, and the actual set of objects is unknown
  beforehand or changes dynamically.** Classic in GUI code: a custom button class where
  clients hook their own code to a press.
- **Some objects must observe others only for a limited time or in specific cases.** The
  subscription list is dynamic — join and leave at will.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. The publisher passes **itself** to `update`, so each
observer pulls the state it cares about.

```ts
/**
 * The Subject interface declares a set of methods for managing subscribers.
 */
interface Subject {
    // Attach an observer to the subject.
    attach(observer: Observer): void;

    // Detach an observer from the subject.
    detach(observer: Observer): void;

    // Notify all observers about an event.
    notify(): void;
}

/**
 * The Subject owns some important state and notifies observers when the state
 * changes.
 */
class ConcreteSubject implements Subject {
    /**
     * @type {number} For the sake of simplicity, the Subject's state, essential
     * to all subscribers, is stored in this variable.
     */
    public state: number;

    /**
     * @type {Observer[]} List of subscribers. In real life, the list of
     * subscribers can be stored more comprehensively (categorized by event
     * type, etc.).
     */
    private observers: Observer[] = [];

    /**
     * The subscription management methods.
     */
    public attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (isExist) {
            return console.log('Subject: Observer has been attached already.');
        }

        console.log('Subject: Attached an observer.');
        this.observers.push(observer);
    }

    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log('Subject: Nonexistent observer.');
        }

        this.observers.splice(observerIndex, 1);
        console.log('Subject: Detached an observer.');
    }

    /**
     * Trigger an update in each subscriber.
     */
    public notify(): void {
        console.log('Subject: Notifying observers...');
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    /**
     * Usually, the subscription logic is only a fraction of what a Subject can
     * really do. Subjects commonly hold some important business logic, that
     * triggers a notification method whenever something important is about to
     * happen (or after it).
     */
    public someBusinessLogic(): void {
        console.log('\nSubject: I\'m doing something important.');
        this.state = Math.floor(Math.random() * (10 + 1));

        console.log(`Subject: My state has just changed to: ${this.state}`);
        this.notify();
    }
}

/**
 * The Observer interface declares the update method, used by subjects.
 */
interface Observer {
    // Receive update from subject.
    update(subject: Subject): void;
}

/**
 * Concrete Observers react to the updates issued by the Subject they had been
 * attached to.
 */
class ConcreteObserverA implements Observer {
    public update(subject: Subject): void {
        if (subject instanceof ConcreteSubject && subject.state < 3) {
            console.log('ConcreteObserverA: Reacted to the event.');
        }
    }
}

class ConcreteObserverB implements Observer {
    public update(subject: Subject): void {
        if (subject instanceof ConcreteSubject && (subject.state === 0 || subject.state >= 2)) {
            console.log('ConcreteObserverB: Reacted to the event.');
        }
    }
}

/**
 * The client code.
 */

const subject = new ConcreteSubject();

const observer1 = new ConcreteObserverA();
subject.attach(observer1);

const observer2 = new ConcreteObserverB();
subject.attach(observer2);

subject.someBusinessLogic();
subject.someBusinessLogic();

subject.detach(observer2);

subject.someBusinessLogic();
```

Output (state values are random):

```
Subject: Attached an observer.
Subject: Attached an observer.

Subject: I'm doing something important.
Subject: My state has just changed to: 6
Subject: Notifying observers...
ConcreteObserverB: Reacted to the event.

Subject: I'm doing something important.
Subject: My state has just changed to: 1
Subject: Notifying observers...
ConcreteObserverA: Reacted to the event.
Subject: Detached an observer.

Subject: I'm doing something important.
Subject: My state has just changed to: 5
Subject: Notifying observers...
```

## Idiomatic TypeScript

The article makes the shortcut explicit: *"If your programming language supports functional
types, you can replace the whole subscriber hierarchy with a set of functions."* TypeScript
does. So a typed emitter, with the **unsubscribe returned from subscribe** — the single most
important ergonomic upgrade over the classic shape:

```ts
type EventMap = {
  fileOpened: { name: string }
  fileSaved: { name: string; bytes: number }
}

type Listener<E> = (payload: E) => void

export class TypedEmitter<Events extends Record<string, unknown>> {
  readonly #listeners = new Map<keyof Events, Set<Listener<never>>>()

  // Returning the disposer makes cleanup impossible to get wrong
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = this.#listeners.get(event) ?? new Set()
    set.add(listener as Listener<never>)
    this.#listeners.set(event, set)
    return () => set.delete(listener as Listener<never>)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // Copy before iterating: a listener may unsubscribe during emit
    for (const listener of [...(this.#listeners.get(event) ?? [])]) {
      ;(listener as Listener<Events[K]>)(payload)
    }
  }
}

const editorEvents = new TypedEmitter<EventMap>()
const unsubscribe = editorEvents.on('fileSaved', ({ name, bytes }) => log.info(name, bytes))
```

In React the pattern is everywhere, and you rarely implement it by hand:

| Need | Use |
|---|---|
| Subscribe to an external store | `useSyncExternalStore` (tear-free, concurrent-safe) |
| Component-local subscription | `useEffect` returning the unsubscribe function |
| DOM / browser events | `addEventListener` + `AbortController` for bulk cleanup |
| Streams of events over time | RxJS `Observable`, or async iterators |

**Three failure modes to design against:**

1. **Leaks** — a subscriber that never unsubscribes keeps its whole closure alive. Always
   return and call a disposer.
2. **Ordering** — the article is explicit that *subscribers are notified in random order*.
   Never encode an ordering assumption between listeners.
3. **Re-entrancy** — a listener that emits during `emit`, or unsubscribes mid-iteration.
   Iterate over a copy; consider queueing.

## How to implement

1. Split the business logic in two: the **core, independent functionality** becomes the
   publisher; the rest becomes subscriber classes.
2. Declare the **subscriber interface** — at minimum an `update` method.
3. Declare the **publisher interface** with add/remove methods. Publishers work with
   subscribers **only through the subscriber interface**.
4. Decide where the subscription list lives. Usually identical for all publishers, so an
   **abstract class** deriving from the publisher interface is the obvious home. When
   retrofitting an existing hierarchy, use **composition** instead: a separate subscription
   object that every publisher uses.
5. Create concrete publishers; each notifies all subscribers when something important
   happens.
6. Implement `update` in concrete subscribers. Pass context as arguments, or have the
   publisher **pass itself** so subscribers fetch what they need. (Permanently linking a
   publisher via the subscriber's constructor is the least flexible option.)
7. The client creates all subscribers and registers them with the right publishers.

## Pros and cons

**Pros**

- **Open/Closed Principle** — new subscriber classes without changing the publisher (and
  vice versa, with a publisher interface).
- Relations between objects can be established **at runtime**.

**Cons**

- **Subscribers are notified in random order.**

## Identification

Subscription methods that store objects in a list, plus calls to an update method issued to
every object in that list.

## Relations with other patterns

**CoR, Command, Mediator and Observer connect senders and receivers differently:**

- **Chain of Responsibility** passes a request along a dynamic chain until one handles it.
- **Command** establishes unidirectional sender→receiver connections.
- **Mediator** eliminates direct connections entirely.
- **Observer** lets receivers **subscribe and unsubscribe dynamically**.

**Mediator vs. Observer** is often elusive. Mediator's goal is removing mutual dependencies
among components; Observer's is establishing **dynamic one-way connections**. A popular
Mediator implementation *uses* Observer — the mediator is the publisher and components
subscribe — making the two look alike. But Mediator can also permanently link components,
resembling Observer not at all. And when *every* component is a publisher with dynamic
connections, there's no central mediator left, only a distributed set of observers.

## Anti-signals

- No unsubscribe path, or one nobody calls — the classic memory leak.
- Listeners that depend on running before or after another listener.
- A cascade of events triggering events, with no way to trace the chain. A
  [Mediator](./mediator.md) that owns the sequence explicitly is often clearer.
- Two objects, one relationship, known at compile time — a direct call is simpler.

## See also

[mediator](./mediator.md) · [command](./command.md) · [chain-of-responsibility](./chain-of-responsibility.md) · [state](./state.md)
