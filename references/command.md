# Command

**Category:** Behavioral · **Complexity:** ★☆☆ · **Popularity:** ★★★
**Also known as:** Action, Transaction

## Intent

Turn a request into a **stand-alone object** containing all information about it. That lets
you pass requests as method arguments, **delay or queue** their execution, and support
**undoable** operations.

## Problem

A text editor's toolbar needs buttons. One neat `Button` class serves the toolbar and
dialogs alike — but each button must do something different. The naive fix is a subclass
per use, holding the click code.

That's flawed twice over. There are now an enormous number of subclasses, and each one
risks breaking whenever the base `Button` changes: **GUI code has become dependent on
volatile business logic**.

Worse, some operations are invoked from several places. Copy can come from a toolbar
button, a context menu, or `Ctrl+C`. Putting the copy implementation in `CopyButton` was
fine when the toolbar was all there was; once menus and shortcuts exist you must either
**duplicate the operation's code** across classes or make the menu depend on buttons —
worse still.

## Solution

Good design separates concerns into layers — a GUI layer and a business-logic layer. The
GUI renders and captures input, then delegates real work downward: one object sends another
a **request**.

Command says: **GUI objects shouldn't send those requests directly.** Extract the request's
details — the object being called, the method name, the arguments — into a **command class
with a single trigger method**. The GUI no longer knows which business object receives the
request or how it's processed; it just triggers the command.

Then make all commands implement the **same interface**, usually a single `execute()` **with
no parameters**. That decouples the sender from concrete command classes and lets you swap
a sender's command at runtime, changing its behavior.

So where do the request parameters go? The command must be **pre-configured with that data,
or able to fetch it itself** — the parameters become fields on the command object.

Back in the editor: no more button subclasses. The base `Button` gets one field holding a
command reference and executes it on click. Menus, shortcuts, whole dialogs work the same
way, and **elements for the same operation share the same command** — duplication gone.

**Real-world analogy:** ordering in a restaurant. The written order is a command. It queues
on the kitchen wall until the chef is ready, and it carries everything needed to cook, so
the chef starts immediately instead of coming to ask you.

## Participants

| Role | Responsibility |
|---|---|
| **Sender (Invoker)** | Initiates requests. Holds a command reference and triggers it instead of calling the receiver. **Does not create** the command — it gets a pre-created one from the client |
| **Command** | Interface, usually one execution method |
| **Concrete Commands** | Implement kinds of requests. Normally they **don't do the work** — they pass the call to a business object (though merging the two is allowed to simplify). Parameters live as fields, ideally set only via the constructor so commands are **immutable** |
| **Receiver** | Holds the business logic and does the actual work. **Almost any object can be a receiver** |
| **Client** | Creates and configures concrete commands, passing all request parameters including the receiver. The resulting command may then be attached to one or several senders |

## Use when

- **You want to parameterize objects with operations.** Turning a method call into an object
  lets you pass it as an argument, store it in another object, or swap the linked command at
  runtime — e.g. a context-menu component whose items users configure.
- **You want to queue operations, schedule them, or execute them remotely.** A command can
  be **serialized** to a string, written to a file or database, and restored later. So you
  can delay, schedule, queue, log, or send commands over the network.
- **You want reversible operations.** Command is the most popular route to undo/redo: keep a
  **stack of executed commands** plus the related state backups.

  Two drawbacks of the backup approach: saving app state isn't easy when parts are private
  (mitigate with **Memento**), and backups eat RAM. The alternative is for the command to
  perform the **inverse operation** instead of restoring state — which may be hard or
  impossible to implement.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `SimpleCommand` doing its own work versus
`ComplexCommand` delegating to a receiver — both are legitimate.

```ts
/**
 * The Command interface declares a method for executing a command.
 */
interface Command {
    execute(): void;
}

/**
 * Some commands can implement simple operations on their own.
 */
class SimpleCommand implements Command {
    private payload: string;

    constructor(payload: string) {
        this.payload = payload;
    }

    public execute(): void {
        console.log(`SimpleCommand: See, I can do simple things like printing (${this.payload})`);
    }
}

/**
 * However, some commands can delegate more complex operations to other objects,
 * called "receivers."
 */
class ComplexCommand implements Command {
    private receiver: Receiver;

    /**
     * Context data, required for launching the receiver's methods.
     */
    private a: string;

    private b: string;

    /**
     * Complex commands can accept one or several receiver objects along with
     * any context data via the constructor.
     */
    constructor(receiver: Receiver, a: string, b: string) {
        this.receiver = receiver;
        this.a = a;
        this.b = b;
    }

    /**
     * Commands can delegate to any methods of a receiver.
     */
    public execute(): void {
        console.log('ComplexCommand: Complex stuff should be done by a receiver object.');
        this.receiver.doSomething(this.a);
        this.receiver.doSomethingElse(this.b);
    }
}

/**
 * The Receiver classes contain some important business logic. They know how to
 * perform all kinds of operations, associated with carrying out a request. In
 * fact, any class may serve as a Receiver.
 */
class Receiver {
    public doSomething(a: string): void {
        console.log(`Receiver: Working on (${a}.)`);
    }

    public doSomethingElse(b: string): void {
        console.log(`Receiver: Also working on (${b}.)`);
    }
}

/**
 * The Invoker is associated with one or several commands. It sends a request to
 * the command.
 */
class Invoker {
    private onStart: Command;

    private onFinish: Command;

    /**
     * Initialize commands.
     */
    public setOnStart(command: Command): void {
        this.onStart = command;
    }

    public setOnFinish(command: Command): void {
        this.onFinish = command;
    }

    /**
     * The Invoker does not depend on concrete command or receiver classes. The
     * Invoker passes a request to a receiver indirectly, by executing a
     * command.
     */
    public doSomethingImportant(): void {
        console.log('Invoker: Does anybody want something done before I begin?');
        if (this.isCommand(this.onStart)) {
            this.onStart.execute();
        }

        console.log('Invoker: ...doing something really important...');

        console.log('Invoker: Does anybody want something done after I finish?');
        if (this.isCommand(this.onFinish)) {
            this.onFinish.execute();
        }
    }

    private isCommand(object): object is Command {
        return object.execute !== undefined;
    }
}

/**
 * The client code can parameterize an invoker with any commands.
 */
const invoker = new Invoker();
invoker.setOnStart(new SimpleCommand('Say Hi!'));
const receiver = new Receiver();
invoker.setOnFinish(new ComplexCommand(receiver, 'Send email', 'Save report'));

invoker.doSomethingImportant();
```

Output:

```
Invoker: Does anybody want something done before I begin?
SimpleCommand: See, I can do simple things like printing (Say Hi!)
Invoker: ...doing something really important...
Invoker: Does anybody want something done after I finish?
ComplexCommand: Complex stuff should be done by a receiver object.
Receiver: Working on (Send email.)
Receiver: Also working on (Save report.)
```

## Idiomatic TypeScript

In modern TypeScript, Command is *"most often used as
an alternative for callbacks to parameterizing UI elements with actions"*. A plain closure
covers that case — `onClick={() => deleteAccount(id)}` **is** a command object.

Reach for the explicit object when you need what a closure can't give you: **inspection,
serialization, or reversal**. Then a discriminated union is the natural shape:

```ts
// Commands as data: serializable, loggable, replayable, undoable
type EditorCommand =
  | { type: 'insertText'; at: number; text: string }
  | { type: 'deleteRange'; from: number; to: number; removed: string }
  | { type: 'setBold'; from: number; to: number; previous: boolean }

const apply = (doc: Document, command: EditorCommand): Document => {
  switch (command.type) {
    case 'insertText':
      return spliceText(doc, command.at, 0, command.text)
    case 'deleteRange':
      return spliceText(doc, command.from, command.to - command.from, '')
    case 'setBold':
      return setMark(doc, command.from, command.to, 'bold', true)
  }
}

// The inverse operation — the cheaper alternative to snapshotting the whole document
const invert = (command: EditorCommand): EditorCommand => {
  switch (command.type) {
    case 'insertText':
      return { type: 'deleteRange', from: command.at, to: command.at + command.text.length, removed: command.text }
    case 'deleteRange':
      return { type: 'insertText', at: command.from, text: command.removed }
    case 'setBold':
      return { ...command, previous: !command.previous }
  }
}

// The history is just two stacks
class History {
  private readonly past: EditorCommand[] = []
  private readonly future: EditorCommand[] = []

  execute(doc: Document, command: EditorCommand) {
    this.past.push(command)
    this.future.length = 0 // a new action invalidates the redo branch
    return apply(doc, command)
  }

  undo(doc: Document) {
    const command = this.past.pop()
    if (!command) return doc
    this.future.push(command)
    return apply(doc, invert(command))
  }
}
```

Note the `removed` and `previous` fields: **a command that must be undoable has to carry
what it overwrote**. That's the single most common bug in a hand-rolled undo stack.

Same pattern, other names you'll recognize: Redux actions (a reducer is `apply`), a job
queue payload, and an optimistic mutation with its rollback.

## How to implement

1. Declare the **command interface** with a single execution method.
2. Extract requests into concrete command classes: fields for the request arguments plus a
   reference to the receiver, **all initialized via the constructor**.
3. Identify the **senders**; give them command fields. Senders talk to commands **only
   through the interface** and usually receive commands from the client rather than creating
   them.
4. Change senders to **execute the command** instead of calling the receiver.
5. The client initializes in order: **receivers → commands (associated with receivers) →
   senders (associated with commands)**.

## Pros and cons

**Pros**

- **Single Responsibility Principle** — invoking classes decoupled from performing classes.
- **Open/Closed Principle** — new commands without touching existing client code.
- Enables **undo/redo**.
- Enables **deferred execution**.
- Simple commands can be **assembled into a complex one** (a macro).

**Cons**

- More complexity: a whole new layer between senders and receivers.

## Identification

Behavioral methods on a sender type that invoke a method on a **different** interface type
(the receiver), which the command **encapsulated at creation time**. Command classes are
usually limited to one specific action.

## Relations with other patterns

**CoR, Command, Mediator and Observer connect senders and receivers differently:**

- **Chain of Responsibility** passes a request along a dynamic chain until one handles it.
- **Command** establishes **unidirectional** sender→receiver connections.
- **Mediator** removes direct connections entirely.
- **Observer** lets receivers subscribe and unsubscribe dynamically.

Also:

- **CoR handlers can be Commands** (many operations over one context), or the **request
  itself can be a Command** (one operation across a chain of contexts).
- **Command + Memento** for undo: commands perform the operations, mementos save the target's
  state just before each one executes.
- **Strategy** also parameterizes an object with an action, but the intents differ: Command
  turns *any* operation into an object so it can be deferred, queued, historied or sent
  remotely; Strategy describes **different ways of doing the same thing**, swapped within one
  context.
- **Prototype** helps when copies of commands go into history.
- **Visitor** can be read as a **powerful version of Command**, executing operations across
  objects of many classes.

## Anti-signals

- A command object wrapping a single function call that nothing inspects, queues or
  reverses — a closure says the same thing in one line.
- Commands that mutate shared state directly, making undo impossible to define.
- An undo stack where commands don't record what they replaced.

## See also

[memento](./memento.md) · [strategy](./strategy.md) · [chain-of-responsibility](./chain-of-responsibility.md) · [visitor](./visitor.md) · [prototype](./prototype.md) · [observer](./observer.md)
