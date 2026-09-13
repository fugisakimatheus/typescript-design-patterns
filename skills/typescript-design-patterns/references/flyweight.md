# Flyweight

**Category:** Structural · **Complexity:** ★★★ · **Popularity:** ☆☆☆
**Also known as:** Cache

> **Flyweight is an optimization, nothing else.** Pattern guidance is blunt about it: *"If
> your program doesn't struggle with a shortage of RAM, then you might just ignore this
> pattern for a while."* Apply it only after you've measured the problem and ruled out
> simpler fixes.

## Intent

Fit **more objects into the available RAM** by sharing common parts of state between
objects instead of keeping all the data in each one.

## Problem

A game with a realistic particle system — bullets, missiles, shrapnel flying everywhere.
It runs fine on your machine and crashes on your friend's weaker one after a few minutes:
out of RAM. Each particle is a separate object carrying plenty of data, and at peak carnage
new particles no longer fit.

## Solution

Look at the `Particle` class: **color** and **sprite** eat far more memory than anything
else, and they're nearly identical across particles — all bullets share them. Coordinates,
movement vector and speed *are* unique, and they change over time.

- **Intrinsic state** — the constant data living inside the object. Other objects can read
  it, never change it.
- **Extrinsic state** — the rest, usually altered from the outside.

Flyweight says: **stop storing the extrinsic state inside the object**; pass it into the
methods that need it. Only intrinsic state stays, so the object is reusable across
contexts, and you need far fewer objects — three would cover every particle in the game:
bullet, missile, shrapnel.

### Where the extrinsic state goes

To the **container** that aggregated the objects — the `Game` holding `particles`. You
could keep parallel arrays for coordinates, vectors, speeds plus one for flyweight
references, all index-aligned. More elegant: a **context class** holding the extrinsic
state *and* a reference to the flyweight, so the container keeps a single array.

Yes, you still have as many context objects as before — but they're **much smaller**: a
thousand tiny contexts now share one heavy flyweight instead of carrying a thousand copies
of its data.

### Immutability

Because one flyweight serves many contexts, its state **must not be modifiable**. Initialize
it once via constructor parameters; expose no setters and no public fields.

### Flyweight factory

A factory method manages the **pool**: the client passes the desired intrinsic state, the
factory returns a matching existing flyweight or creates and pools a new one. It can live
in the flyweight container, in a dedicated factory class, or as a static method on the
flyweight class itself.

## Participants

| Role | Responsibility |
|---|---|
| **Flyweight** | The shareable portion of state — **intrinsic**. State passed into its methods is **extrinsic** |
| **Context** | The unique, extrinsic state. Context + flyweight = the full state of one original object |
| **Flyweight Factory** | Manages the pool; clients never construct flyweights directly |
| **Client** | Calculates or stores extrinsic state. From here a flyweight is a *template* configured at call time |

Behavior usually stays in the flyweight (callers pass the extrinsic bits as parameters);
alternatively it moves to the context, treating the flyweight as a pure data object.

## Use when

Only when your program must support a **huge number of objects that barely fit in RAM**.
The payoff depends on all three holding:

- the app spawns a huge number of similar objects,
- that drains available RAM on the target device,
- the objects contain **duplicate state that can be extracted and shared**.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. The factory keys the pool by a string hash of the intrinsic
state.

```ts
/**
 * The Flyweight stores a common portion of the state (also called intrinsic
 * state) that belongs to multiple real business entities. The Flyweight accepts
 * the rest of the state (extrinsic state, unique for each entity) via its
 * method parameters.
 */
class Flyweight {
    private sharedState: any;

    constructor(sharedState: any) {
        this.sharedState = sharedState;
    }

    public operation(uniqueState): void {
        const s = JSON.stringify(this.sharedState);
        const u = JSON.stringify(uniqueState);
        console.log(`Flyweight: Displaying shared (${s}) and unique (${u}) state.`);
    }
}

/**
 * The Flyweight Factory creates and manages the Flyweight objects. It ensures
 * that flyweights are shared correctly. When the client requests a flyweight,
 * the factory either returns an existing instance or creates a new one, if it
 * doesn't exist yet.
 */
class FlyweightFactory {
    private flyweights: {[key: string]: Flyweight} = <any>{};

    constructor(initialFlyweights: string[][]) {
        for (const state of initialFlyweights) {
            this.flyweights[this.getKey(state)] = new Flyweight(state);
        }
    }

    /**
     * Returns a Flyweight's string hash for a given state.
     */
    private getKey(state: string[]): string {
        return state.join('_');
    }

    /**
     * Returns an existing Flyweight with a given state or creates a new one.
     */
    public getFlyweight(sharedState: string[]): Flyweight {
        const key = this.getKey(sharedState);

        if (!(key in this.flyweights)) {
            console.log('FlyweightFactory: Can\'t find a flyweight, creating new one.');
            this.flyweights[key] = new Flyweight(sharedState);
        } else {
            console.log('FlyweightFactory: Reusing existing flyweight.');
        }

        return this.flyweights[key];
    }

    public listFlyweights(): void {
        const count = Object.keys(this.flyweights).length;
        console.log(`\nFlyweightFactory: I have ${count} flyweights:`);
        for (const key in this.flyweights) {
            console.log(key);
        }
    }
}

/**
 * The client code usually creates a bunch of pre-populated flyweights in the
 * initialization stage of the application.
 */
const factory = new FlyweightFactory([
    ['Chevrolet', 'Camaro2018', 'pink'],
    ['Mercedes Benz', 'C300', 'black'],
    ['Mercedes Benz', 'C500', 'red'],
    ['BMW', 'M5', 'red'],
    ['BMW', 'X6', 'white'],
    // ...
]);
factory.listFlyweights();

// ...

function addCarToPoliceDatabase(
    ff: FlyweightFactory, plates: string, owner: string,
    brand: string, model: string, color: string,
) {
    console.log('\nClient: Adding a car to database.');
    const flyweight = ff.getFlyweight([brand, model, color]);

    // The client code either stores or calculates extrinsic state and passes it
    // to the flyweight's methods.
    flyweight.operation([plates, owner]);
}

addCarToPoliceDatabase(factory, 'CL234IR', 'James Doe', 'BMW', 'M5', 'red');

addCarToPoliceDatabase(factory, 'CL234IR', 'James Doe', 'BMW', 'X1', 'red');

factory.listFlyweights();
```

Output:

```
FlyweightFactory: I have 5 flyweights:
Chevrolet_Camaro2018_pink
Mercedes Benz_C300_black
Mercedes Benz_C500_red
BMW_M5_red
BMW_X6_white

Client: Adding a car to database.
FlyweightFactory: Reusing existing flyweight.
Flyweight: Displaying shared (["BMW","M5","red"]) and unique (["CL234IR","James Doe"]) state.

Client: Adding a car to database.
FlyweightFactory: Can't find a flyweight, creating new one.
Flyweight: Displaying shared (["BMW","X1","red"]) and unique (["CL234IR","James Doe"]) state.

FlyweightFactory: I have 6 flyweights:
Chevrolet_Camaro2018_pink
Mercedes Benz_C300_black
Mercedes Benz_C500_red
BMW_M5_red
BMW_X6_white
BMW_X1_red
```

> That example uses `any` and `<any>{}`. Don't carry that into real code — type the pool.

## Idiomatic TypeScript

A typed pool keyed by the intrinsic state, with the extrinsic state passed per call:

```ts
// Intrinsic: shared, immutable, expensive
interface GlyphStyle {
  readonly fontFamily: string
  readonly weight: number
  readonly sizePx: number
}

// Extrinsic: unique per occurrence, passed in
interface GlyphPosition {
  x: number
  y: number
  char: string
}

const styleKey = ({ fontFamily, weight, sizePx }: GlyphStyle) => `${fontFamily}|${weight}|${sizePx}`

const stylePool = new Map<string, GlyphStyle>()

export const getGlyphStyle = (style: GlyphStyle): GlyphStyle => {
  const key = styleKey(style)
  const existing = stylePool.get(key)
  if (existing) return existing
  const frozen = Object.freeze({ ...style }) // immutability is not optional here
  stylePool.set(key, frozen)
  return frozen
}

// Context objects stay tiny: a position plus one shared reference
export const draw = (ctx: CanvasRenderingContext2D, style: GlyphStyle, at: GlyphPosition) => {
  ctx.font = `${style.weight} ${style.sizePx}px ${style.fontFamily}`
  ctx.fillText(at.char, at.x, at.y)
}
```

Where this genuinely pays off in a JS/TS codebase: canvas/WebGL scenes, virtualized grids
with tens of thousands of cells, parsers holding millions of tokens, and interning repeated
strings or option objects.

Where the runtime already solves it for you — **don't hand-roll a flyweight**: React
element identity and `memo`, module-level frozen constants shared by every importer, and
JS engines already interning string literals.

One caveat the original doesn't mention but matters in JS: an unbounded pool is a **memory
leak**. Bound it (LRU) or key it weakly (`WeakMap`) when the intrinsic state is derived from
objects with a lifetime.

## How to implement

1. Split the future flyweight's fields into **intrinsic** (unchanging, duplicated across
   objects) and **extrinsic** (contextual, unique per object).
2. Keep the intrinsic fields in the class and make them **immutable** — values assigned only
   in the constructor.
3. For every method using an extrinsic field, **add a parameter** and use it instead of the
   field.
4. Optionally add a **factory** managing the pool; once it exists, clients request
   flyweights only through it, describing the one they want by its intrinsic state.
5. The client stores or calculates the extrinsic state. For convenience, move it plus the
   flyweight reference into a **context class**.

## Pros and cons

**Pros**

- Saves lots of RAM when the program has tons of similar objects.

**Cons**

- You may be **trading RAM for CPU** when context data has to be recalculated on every call.
- The code becomes **much more complicated** — new team members will keep asking why an
  entity's state was split this way.

## Identification

A creation method that **returns cached objects instead of creating new ones**.

## Relations with other patterns

- Shared leaf nodes of a **Composite** tree can be implemented as flyweights.
- **Flyweight** makes many little objects; **Facade** makes a single object standing for a
  whole subsystem.
- Resembles **Singleton** if all shared state collapses into one object, but: a Singleton
  has exactly **one** instance while a Flyweight class has **many** with different intrinsic
  states, and a Singleton **may be mutable** while flyweights **must not be**.

## Anti-signals

- You haven't profiled. Memory isn't actually the bottleneck.
- The "shared" state turns out to be mutable, and one context's change leaks into every
  other.
- The pool grows without bound and becomes the leak you were trying to avoid.
- The split makes the domain model incomprehensible for a saving that a simpler change
  (pagination, virtualization, streaming) would have delivered.

## See also

[composite](./composite.md) · [facade](./facade.md) · [singleton](./singleton.md) · [proxy](./proxy.md)
