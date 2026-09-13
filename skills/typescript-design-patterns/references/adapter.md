# Adapter

**Category:** Structural · **Complexity:** ★☆☆ · **Popularity:** ★★★
**Also known as:** Wrapper

## Intent

Allow objects with **incompatible interfaces** to collaborate.

## Problem

A stock market app downloads data in **XML** and renders charts. You want to plug in a
smart third-party analytics library — but it only accepts **JSON**. Changing the library to
read XML would break existing code that depends on it, and you may not even have its
source.

## Solution

Create an **adapter**: an object that converts the interface of one object so another can
understand it. The adapter wraps one object and hides the conversion; the wrapped object
isn't even aware it exists.

How it works:

- The adapter gets an interface **compatible with one of the existing objects**.
- Through that interface, the existing object safely calls the adapter's methods.
- On each call, the adapter forwards the request to the second object **in the format and
  order that object expects**.

Sometimes a **two-way adapter** converts calls in both directions.

For the stock app: build XML-to-JSON adapters for every analytics class you touch, and talk
to the library only through them.

**Real-world analogy:** a US plug won't fit a German socket. A travel power adapter has the
American socket on one side and the European plug on the other.

## Participants

**Object adapter** (composition — works in every language, and the one to use in TypeScript):

| Role | Responsibility |
|---|---|
| **Client** | Holds the existing business logic |
| **Client Interface** | The protocol other classes must follow to collaborate with the client |
| **Service** | The useful class (third-party or legacy) whose interface is incompatible |
| **Adapter** | Implements the client interface *and* wraps the service, translating calls |

As long as the client works through the **client interface**, it never couples to a
concrete adapter — so new adapters can be introduced, or an adapter rewritten when the
service changes, without touching client code.

**Class adapter** (inheritance): the adapter inherits from both client and service, and
adaptation happens in overridden methods. Requires **multiple inheritance**, so C++ but not
TypeScript.

## Use when

- **You want to use an existing class whose interface doesn't fit your code.** The adapter
  is a translator layer between your code and a legacy, third-party, or just weird
  interface.
- **You want to reuse several existing subclasses that lack some common functionality that
  can't be added to the superclass.** Extending each subclass duplicates the code; putting
  the missing behavior in an adapter and wrapping the objects gains it dynamically. (This
  use looks a lot like **Decorator** — the difference is in what happens to the interface.)

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. `Adapter extends Target` (the client interface) and holds
an `Adaptee` — composition inside, client interface outside.

```ts
/**
 * The Target defines the domain-specific interface used by the client code.
 */
class Target {
    public request(): string {
        return 'Target: The default target\'s behavior.';
    }
}

/**
 * The Adaptee contains some useful behavior, but its interface is incompatible
 * with the existing client code. The Adaptee needs some adaptation before the
 * client code can use it.
 */
class Adaptee {
    public specificRequest(): string {
        return '.eetpadA eht fo roivaheb laicepS';
    }
}

/**
 * The Adapter makes the Adaptee's interface compatible with the Target's
 * interface.
 */
class Adapter extends Target {
    private adaptee: Adaptee;

    constructor(adaptee: Adaptee) {
        super();
        this.adaptee = adaptee;
    }

    public request(): string {
        const result = this.adaptee.specificRequest().split('').reverse().join('');
        return `Adapter: (TRANSLATED) ${result}`;
    }
}

/**
 * The client code supports all classes that follow the Target interface.
 */
function clientCode(target: Target) {
    console.log(target.request());
}

console.log('Client: I can work just fine with the Target objects:');
const target = new Target();
clientCode(target);

console.log('');

const adaptee = new Adaptee();
console.log('Client: The Adaptee class has a weird interface. See, I don\'t understand it:');
console.log(`Adaptee: ${adaptee.specificRequest()}`);

console.log('');

console.log('Client: But I can work with it via the Adapter:');
const adapter = new Adapter(adaptee);
clientCode(adapter);
```

Output:

```
Client: I can work just fine with the Target objects:
Target: The default target's behavior.

Client: The Adaptee class has a weird interface. See, I don't understand it:
Adaptee: .eetpadA eht fo roivaheb laicepS

Client: But I can work with it via the Adapter:
Adapter: (TRANSLATED) Special behavior of the Adaptee.
```

## Idiomatic TypeScript

This is one of the **most useful patterns in a TypeScript app**, and most of the time it's
a function, not a class. Two shapes dominate:

**1. Mapping an external payload to a domain model** — the anti-corruption layer that keeps
a vendor's field names out of your components:

```ts
// The domain type the app is written against
interface Account {
  id: string
  legalName: string
  createdAt: Date
}

// The service's shape — snake_case, string dates, extra noise
interface VendorAccountDto {
  account_id: string
  legal_name: string
  created_at: string
  _internal_flags: unknown
}

// The adapter: one place to change when the vendor renames a field
export const toAccount = (dto: VendorAccountDto): Account => ({
  id: dto.account_id,
  legalName: dto.legal_name,
  createdAt: new Date(dto.created_at)
})
```

**2. Making two service implementations interchangeable** behind one port:

```ts
interface FileStorage {
  put(key: string, body: Blob): Promise<void>
  url(key: string): string
}

// S3Client's API is nothing like FileStorage — the adapter absorbs the mismatch
export class S3StorageAdapter implements FileStorage {
  constructor(private readonly s3: S3Client, private readonly bucket: string) {}

  async put(key: string, body: Blob) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body }))
  }

  url(key: string) {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`
  }
}
```

Keep adapters **thin**: convert shapes, don't add business rules. The moment an adapter
starts deciding things, it has become a service and the seam stops being trustworthy.

## How to implement

1. Confirm you have at least two classes with incompatible interfaces: a **service** you
   can't change, and one or more **clients** that would benefit from it.
2. Declare the **client interface** describing how clients talk to the service.
3. Create the adapter class implementing that interface, methods empty for now.
4. Add a field holding the service object — usually set in the constructor, sometimes
   passed per method call.
5. Implement each client-interface method, **delegating the real work to the service** and
   handling only interface/data-format conversion.
6. Clients use the adapter **through the client interface**, so adapters can change without
   touching them.

## Pros and cons

**Pros**

- **Single Responsibility Principle** — conversion code is separated from business logic.
- **Open/Closed Principle** — new adapter types don't break existing clients.

**Cons**

- Overall complexity rises with the new interfaces and classes. Sometimes it's simpler to
  just change the service class to match the rest of your code.

## Identification

A constructor that takes an instance of a **different** abstract/interface type. When the
adapter receives a call on any of its methods, it translates the parameters and forwards to
one or several methods of the wrapped object.

## Relations with other patterns

- **Bridge** is designed **up-front** so parts can be developed independently; Adapter is
  applied to an **existing** app to make incompatible classes work together.
- **Adapter** gives a *completely different* interface to an existing object. **Decorator**
  keeps the interface the same or extends it, and supports **recursive composition** —
  impossible with Adapter.
- Quick discriminator: Adapter → *different* interface · **Proxy** → *same* interface ·
  Decorator → *enhanced* interface.
- **Facade** defines a *new* interface over an entire subsystem; Adapter makes an
  *existing* interface usable and usually wraps **one** object.
- **Bridge**, **State**, **Strategy** (and to a degree Adapter) share a structure — all are
  composition-based delegation — but solve different problems. Naming the pattern
  communicates the problem, not just the shape.

## Anti-signals

- You own the service and can just change it — do that instead of adding a layer.
- The adapter grows business logic, validation, or caching; split those out.
- One adapter per call site, each mapping slightly differently — centralize the mapping.

## See also

[bridge](./bridge.md) · [decorator](./decorator.md) · [facade](./facade.md) · [proxy](./proxy.md) · [strategy](./strategy.md)
