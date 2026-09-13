# Proxy

**Category:** Structural · **Complexity:** ★★☆ · **Popularity:** ★☆☆

## Intent

Provide a **substitute or placeholder** for another object, controlling access to it so you
can do something **before or after** the request reaches the original.

## Problem

You have a massive object that consumes a lot of system resources and you need it only
occasionally. **Lazy initialization** would fix that — but then every client has to run the
deferred-init code, which means duplication everywhere. Ideally the code lives inside the
object's own class, and that isn't always possible: the class may belong to a closed
third-party library.

## Solution

Create a **proxy class with the same interface as the service object** and pass the proxy
to all the original object's clients. On receiving a request, the proxy creates the real
service and delegates the work to it.

Because the proxy implements the same interface, it can go anywhere a real service is
expected — so you can run logic before or after the primary behavior **without changing the
service class**.

**Real-world analogy:** a credit card is a proxy for a bank account, which is a proxy for a
bundle of cash. All three share the interface "can be used to pay". The consumer doesn't
carry cash; the shop owner gets the money electronically without the risk of being robbed
on the way to the bank.

## Participants

| Role | Responsibility |
|---|---|
| **Service Interface** | The interface the proxy must follow to disguise itself as the service |
| **Service** | The class with the actual business logic |
| **Proxy** | Holds a reference to the service; after its own processing (lazy init, logging, access control, caching) it passes the request along. **Usually manages the service's full life cycle** |
| **Client** | Works with services and proxies through the same interface |

## Use when

The classic catalogue of proxy flavors:

| Flavor | Purpose |
|---|---|
| **Virtual proxy** | **Lazy initialization** — a heavyweight service shouldn't be up all the time when it's needed only occasionally |
| **Protection proxy** | **Access control** — pass the request only if the client's credentials match. (OS resources vs. arbitrary, possibly malicious, applications) |
| **Remote proxy** | **Local execution of a remote service** — the proxy handles all the nasty network details |
| **Logging proxy** | Keep a history of requests; log each one before passing it on |
| **Caching proxy** | Cache results and manage the cache's life cycle, using request parameters as keys |
| **Smart reference** | Dismiss a heavyweight object when no client uses it. The proxy tracks clients, periodically checks whether they're still active, and frees the service when the list empties. It can also track whether a client modified the service, so unchanged objects can be reused |

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation.

```ts
/**
 * The Subject interface declares common operations for both RealSubject and the
 * Proxy. As long as the client works with RealSubject using this interface,
 * you'll be able to pass it a proxy instead of a real subject.
 */
interface Subject {
    request(): void;
}

/**
 * The RealSubject contains some core business logic. Usually, RealSubjects are
 * capable of doing some useful work which may also be very slow or sensitive -
 * e.g. correcting input data. A Proxy can solve these issues without any
 * changes to the RealSubject's code.
 */
class RealSubject implements Subject {
    public request(): void {
        console.log('RealSubject: Handling request.');
    }
}

/**
 * The Proxy has an interface identical to the RealSubject.
 */
class Proxy implements Subject {
    private realSubject: RealSubject;

    /**
     * The Proxy maintains a reference to an object of the RealSubject class. It
     * can be either lazy-loaded or passed to the Proxy by the client.
     */
    constructor(realSubject: RealSubject) {
        this.realSubject = realSubject;
    }

    /**
     * The most common applications of the Proxy pattern are lazy loading,
     * caching, controlling the access, logging, etc. A Proxy can perform one of
     * these things and then, depending on the result, pass the execution to the
     * same method in a linked RealSubject object.
     */
    public request(): void {
        if (this.checkAccess()) {
            this.realSubject.request();
            this.logAccess();
        }
    }

    private checkAccess(): boolean {
        // Some real checks should go here.
        console.log('Proxy: Checking access prior to firing a real request.');

        return true;
    }

    private logAccess(): void {
        console.log('Proxy: Logging the time of request.');
    }
}

/**
 * The client code is supposed to work with all objects (both subjects and
 * proxies) via the Subject interface in order to support both real subjects and
 * proxies. In real life, however, clients mostly work with their real subjects
 * directly. In this case, to implement the pattern more easily, you can extend
 * your proxy from the real subject's class.
 */
function clientCode(subject: Subject) {
    // ...

    subject.request();

    // ...
}

console.log('Client: Executing the client code with a real subject:');
const realSubject = new RealSubject();
clientCode(realSubject);

console.log('');

console.log('Client: Executing the same client code with a proxy:');
const proxy = new Proxy(realSubject);
clientCode(proxy);
```

Output:

```
Client: Executing the client code with a real subject:
RealSubject: Handling request.

Client: Executing the same client code with a proxy:
Proxy: Checking access prior to firing a real request.
RealSubject: Handling request.
Proxy: Logging the time of request.
```

## Idiomatic TypeScript

JavaScript has a **built-in `Proxy`** that intercepts property access, so you can wrap an
object without writing one method per member:

```ts
// A logging proxy over any service — no per-method boilerplate
export const withCallLogging = <T extends object>(target: T, name: string): T =>
  new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver)
      if (typeof value !== 'function') return value
      return (...args: unknown[]) => {
        log.debug(`${name}.${String(prop)}`, { args })
        return value.apply(obj, args)
      }
    }
  })
```

Powerful, but it defeats engine optimizations and hides behavior from anyone reading the
call site. For most application code the **hand-written proxy class** is the better choice —
explicit, typed, and greppable:

```ts
class LazyReportService implements ReportService {
  private instance?: ReportService

  // Virtual proxy: the expensive service is built on first use, not at startup
  private get service(): ReportService {
    return (this.instance ??= new HeavyReportService(this.config))
  }

  constructor(private readonly config: ReportConfig) {}

  generate(params: ReportParams) {
    return this.service.generate(params)
  }
}
```

You already use proxies constantly without naming them: a **service worker** intercepting
`fetch`, a **CDN** in front of an origin, an **API route** fronting a third-party service to
hide its key, and a React Query cache layer standing in for the network.

## How to implement

1. If there's no service interface, **create one** so proxy and service are interchangeable.
   Extracting it isn't always possible — it means changing all the service's clients.
   Plan B: make the proxy a **subclass of the service** and inherit its interface.
2. Create the proxy class with a field for the service reference. Proxies usually **create
   and manage** the service's whole life cycle; occasionally the client passes it in.
3. Implement the proxy methods: do the proxy's work, then delegate to the service.
4. Consider a **creation method** deciding whether a client gets a proxy or the real
   service — a static method on the proxy, or a full factory method.
5. Consider **lazy initialization** for the service object.

## Pros and cons

**Pros**

- Control the service object without clients knowing.
- Manage the service's life cycle when clients don't care about it.
- Works even when the service isn't ready or isn't available.
- **Open/Closed Principle** — new proxies without changing service or clients.

**Cons**

- More classes, more complexity.
- The service's **response may get delayed**.

## Identification

A class that **delegates all the real work to another object**; every proxy method
ultimately refers to the service object — unless the proxy is a subclass of the service.

## Relations with other patterns

- **Adapter** gives a *different* interface · **Proxy** keeps the **same** interface ·
  **Decorator** gives an *enhanced* interface.
- **Facade** also buffers a complex entity and initializes it itself, but Proxy has the
  **same interface** as its service, so the two are interchangeable.
- **Decorator** shares the structure, not the intent: a Proxy usually **manages its service's
  life cycle**, while decorator composition is always **controlled by the client**.

## Anti-signals

- The proxy changes the interface — that's an Adapter, name it so.
- Silent caching with no invalidation story; stale data becomes a debugging nightmare
  precisely because the client can't tell it's talking to a proxy.
- A JS `Proxy` used for something a plain wrapper would do — the indirection is invisible at
  the call site, which is exactly what makes it hard to debug.

## See also

[adapter](./adapter.md) · [decorator](./decorator.md) · [facade](./facade.md) · [flyweight](./flyweight.md)
