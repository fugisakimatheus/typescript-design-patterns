# Visitor

**Category:** Behavioral · **Complexity:** ★★★ · **Popularity:** ★☆☆

> Note on applicability: *"Visitor isn't a very common pattern because of its
> complexity and narrow applicability."* Know it for ASTs, compilers and document trees;
> reach for it rarely.

## Intent

**Separate algorithms from the objects on which they operate.**

## Problem

An app models geographic information as one colossal graph. Each node type — city,
industry, sightseeing area — is its own class.

Task: export the graph to XML. The obvious plan is an export method on each node class plus
recursion. Simple, elegant, polymorphic.

The architect refuses. Three reasons:

1. The code is **in production** and he won't risk a bug in every node class.
2. XML export **doesn't belong** in classes whose job is geodata.
3. Marketing will ask for another format next month, forcing you to touch those fragile
   classes **again**.

## Solution

Put the new behavior in a separate **visitor** class. The object that needed the behavior is
now **passed to a visitor method as an argument**, giving the method access to its data.

The behavior differs per node class, so the visitor declares **several methods**, one per
element type:

```
class ExportVisitor implements Visitor is
    method doForCity(City c) { ... }
    method doForIndustry(Industry f) { ... }
    method doForSightSeeing(SightSeeing ss) { ... }
```

But how do you call the right one when walking the graph? Different signatures rule out
polymorphism, so you'd end up with a nightmare of `instanceof` checks. **Method overloading
doesn't save you either**: the node's exact class isn't known in advance, so overload
resolution falls back to the method taking the base `Node`.

Visitor solves it with **double dispatch**. Don't let the client pick the method — **delegate
that choice to the object being passed in**. Objects know their own class, so they can "accept"
a visitor and tell it which visiting method to run:

```
// Client code
foreach (Node node in graph)
    node.accept(exportVisitor)

class City is
    method accept(Visitor v) is
        v.doForCity(this)

class Industry is
    method accept(Visitor v) is
        v.doForIndustry(this)
```

So yes — the node classes *do* change after all. But the change is **trivial and happens
once**: extract a common visitor interface and every existing node works with any visitor you
ever add. New behavior = one new visitor class.

**Real-world analogy:** an insurance agent visiting every building in a neighborhood.
Residential → medical insurance. Bank → theft insurance. Coffee shop → fire and flood.

## Participants

| Role | Responsibility |
|---|---|
| **Visitor** | Declares a visiting method per concrete element class. Names may repeat where the language supports overloading, but **parameter types must differ** |
| **Concrete Visitors** | Implement several versions of the same behavior, tailored per element class |
| **Element** | Declares the `accept` method taking a visitor-interface parameter |
| **Concrete Elements** | Implement `accept`, redirecting to the visiting method matching **their own class**. Even if a base class implements it, **every subclass must override it** |
| **Client** | Usually a collection or complex object (a **Composite** tree), working with elements through an abstract interface |

## Use when

- **You need to perform an operation on all elements of a complex object structure** (an
  object tree), where elements have different classes.
- **You want to clean auxiliary behaviors out of your business logic**, keeping primary
  classes focused on their main job.
- **A behavior makes sense only for some classes of a hierarchy, not others.** Implement only
  the relevant visiting methods and leave the rest empty.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `exclusiveMethodOfConcreteComponentA` — because the
visitor knows the concrete class, it can use methods that don't exist on the base interface.
That's the other half of Visitor's power.

```ts
/**
 * The Component interface declares an `accept` method that should take the base
 * visitor interface as an argument.
 */
interface Component {
    accept(visitor: Visitor): void;
}

/**
 * Each Concrete Component must implement the `accept` method in such a way that
 * it calls the visitor's method corresponding to the component's class.
 */
class ConcreteComponentA implements Component {
    /**
     * Note that we're calling `visitConcreteComponentA`, which matches the
     * current class name. This way we let the visitor know the class of the
     * component it works with.
     */
    public accept(visitor: Visitor): void {
        visitor.visitConcreteComponentA(this);
    }

    /**
     * Concrete Components may have special methods that don't exist in their
     * base class or interface. The Visitor is still able to use these methods
     * since it's aware of the component's concrete class.
     */
    public exclusiveMethodOfConcreteComponentA(): string {
        return 'A';
    }
}

class ConcreteComponentB implements Component {
    /**
     * Same here: visitConcreteComponentB => ConcreteComponentB
     */
    public accept(visitor: Visitor): void {
        visitor.visitConcreteComponentB(this);
    }

    public specialMethodOfConcreteComponentB(): string {
        return 'B';
    }
}

/**
 * The Visitor Interface declares a set of visiting methods that correspond to
 * component classes. The signature of a visiting method allows the visitor to
 * identify the exact class of the component that it's dealing with.
 */
interface Visitor {
    visitConcreteComponentA(element: ConcreteComponentA): void;

    visitConcreteComponentB(element: ConcreteComponentB): void;
}

/**
 * Concrete Visitors implement several versions of the same algorithm, which can
 * work with all concrete component classes.
 *
 * You can experience the biggest benefit of the Visitor pattern when using it
 * with a complex object structure, such as a Composite tree. In this case, it
 * might be helpful to store some intermediate state of the algorithm while
 * executing visitor's methods over various objects of the structure.
 */
class ConcreteVisitor1 implements Visitor {
    public visitConcreteComponentA(element: ConcreteComponentA): void {
        console.log(`${element.exclusiveMethodOfConcreteComponentA()} + ConcreteVisitor1`);
    }

    public visitConcreteComponentB(element: ConcreteComponentB): void {
        console.log(`${element.specialMethodOfConcreteComponentB()} + ConcreteVisitor1`);
    }
}

class ConcreteVisitor2 implements Visitor {
    public visitConcreteComponentA(element: ConcreteComponentA): void {
        console.log(`${element.exclusiveMethodOfConcreteComponentA()} + ConcreteVisitor2`);
    }

    public visitConcreteComponentB(element: ConcreteComponentB): void {
        console.log(`${element.specialMethodOfConcreteComponentB()} + ConcreteVisitor2`);
    }
}

/**
 * The client code can run visitor operations over any set of elements without
 * figuring out their concrete classes. The accept operation directs a call to
 * the appropriate operation in the visitor object.
 */
function clientCode(components: Component[], visitor: Visitor) {
    // ...
    for (const component of components) {
        component.accept(visitor);
    }
    // ...
}

const components = [
    new ConcreteComponentA(),
    new ConcreteComponentB(),
];

console.log('The client code works with all visitors via the base Visitor interface:');
const visitor1 = new ConcreteVisitor1();
clientCode(components, visitor1);
console.log('');

console.log('It allows the same client code to work with different types of visitors:');
const visitor2 = new ConcreteVisitor2();
clientCode(components, visitor2);
```

Output:

```
The client code works with all visitors via the base Visitor interface:
A + ConcreteVisitor1
B + ConcreteVisitor1

It allows the same client code to work with different types of visitors:
A + ConcreteVisitor2
B + ConcreteVisitor2
```

## Idiomatic TypeScript

**Double dispatch is a workaround for a limitation TypeScript doesn't have.** A discriminated
union plus an exhaustive `switch` gives you the same dispatch, statically checked, with no
`accept` method and no change to the element types:

```ts
type Node =
  | { kind: 'city'; name: string; population: number }
  | { kind: 'industry'; name: string; sector: string }
  | { kind: 'sightseeing'; name: string; rating: number }

// The visitor: a record of handlers, one per element kind
type NodeVisitor<R> = {
  [K in Node['kind']]: (node: Extract<Node, { kind: K }>) => R
}

// The dispatcher, written once for every visitor that will ever exist
export const visit = <R,>(node: Node, visitor: NodeVisitor<R>): R =>
  (visitor[node.kind] as (n: Node) => R)(node)

// A new behavior = a new object literal. Element types are untouched.
const toXml: NodeVisitor<string> = {
  city: ({ name, population }) => `<city name="${name}" pop="${population}"/>`,
  industry: ({ name, sector }) => `<industry name="${name}" sector="${sector}"/>`,
  sightseeing: ({ name, rating }) => `<sight name="${name}" rating="${rating}"/>`
}

const xml = nodes.map(node => visit(node, toXml)).join('')
```

The **mapped type is the key move**: adding a member to `Node` makes **every** existing
visitor fail to typecheck until it handles the new kind — turning the pattern's worst con
("you must update all visitors when a class is added") from a runtime surprise into a compile
error.

Add an **accumulator** when the visitor gathers state while walking a tree:

```ts
interface WalkVisitor {
  enter?(node: Node, depth: number): void
  exit?(node: Node, depth: number): void
}

export const walk = (node: TreeNode, visitor: WalkVisitor, depth = 0): void => {
  visitor.enter?.(node, depth)
  node.children?.forEach(child => walk(child, visitor, depth + 1))
  visitor.exit?.(node, depth)
}
```

That enter/exit shape is exactly how ESLint rules, Babel plugins and TypeScript's own
compiler API traverse an AST — the places where Visitor genuinely earns its complexity.

Prefer **classes + `accept`** when elements are real classes with private state a visitor
must reach, or when you're extending a hierarchy you don't own. Prefer the **union + handler
record** for data trees, which is nearly always the frontend case.

## How to implement

1. Declare the **visitor interface** with one visiting method per concrete element class.
2. Declare the **element interface** — or add the abstract `accept` method to the base class
   of an existing hierarchy.
3. Implement `accept` in every concrete element, redirecting to the matching visiting method.
4. Element classes work with visitors **only through the visitor interface**; visitors, by
   contrast, **must know all concrete element classes** — they're the parameter types.
5. For each behavior that can't live in the element hierarchy, add a concrete visitor
   implementing every visiting method.

   If a visitor needs an element's **private members**, you either make them public (breaking
   encapsulation) or **nest the visitor inside the element class**, where the language allows.
6. The client creates visitors and passes them into elements via `accept`.

## Pros and cons

**Pros**

- **Open/Closed Principle** — new behavior across objects of different classes without
  changing those classes.
- **Single Responsibility Principle** — several versions of one behavior live together.
- A visitor can **accumulate information** while working through a structure — very handy when
  traversing an object tree.

**Cons**

- **You must update every visitor** whenever a class is added to or removed from the element
  hierarchy.
- Visitors **may lack access to private fields and methods** of the elements they work on.

## Identification

An `accept(visitor)` method on elements that immediately calls a visitor method named after
the element's own class — double dispatch.

## Relations with other patterns

- Visitor can be treated as a **powerful version of Command**: its objects execute operations
  over objects of many different classes.
- Use Visitor to run an operation over an entire **Composite** tree.
- Use Visitor with **Iterator** to traverse a complex structure and operate on elements even
  when they all have different classes.

## Anti-signals

- The element hierarchy changes often — every change ripples through every visitor.
- Only one visitor exists and only one ever will; a plain function over the union is
  clearer.
- The visitor needs private element state and you're about to make fields public to get it.
- You reached for `accept`/`visit` ceremony in TypeScript where a discriminated union and an
  exhaustive `switch` would have been checked by the compiler.

## See also

[composite](./composite.md) · [iterator](./iterator.md) · [command](./command.md)
