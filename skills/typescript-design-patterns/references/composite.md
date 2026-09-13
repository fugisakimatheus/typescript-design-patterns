# Composite

**Category:** Structural · **Complexity:** ★★☆ · **Popularity:** ★★☆
**Also known as:** Object Tree

## Intent

Compose objects into **tree structures** and work with those structures **as if they were
individual objects**.

## Problem

Composite only makes sense when the core model of your app **is a tree**.

`Product` and `Box`: a box holds products *and* smaller boxes, which hold products *or* yet
smaller boxes. Now compute the total price of an order. The direct approach — unwrap every
box, walk every product, sum — requires knowing the classes involved, the nesting depth,
and other nasty details in advance. In a program that's awkward at best, impossible at
worst.

## Solution

Work with products and boxes through a **common interface** declaring, say,
`getTotalPrice()`.

- A **product** returns its own price.
- A **box** walks its items, asks each for its price, and sums — and if an item is another
  box, that box does the same, all the way down. A box may add its own packaging cost.

The payoff: **the client doesn't care about concrete classes**. Call the method and the
objects pass the request down the tree themselves.

**Real-world analogy:** an army — divisions of brigades of platoons of squads of soldiers.
Orders are given at the top and passed down until every soldier knows what to do.

## Participants

| Role | Responsibility |
|---|---|
| **Component** | Interface with operations common to simple *and* complex elements |
| **Leaf** | A basic element with no sub-elements. Leaves usually do **most of the real work** — they have nobody to delegate to |
| **Container (Composite)** | Has sub-elements: leaves or other containers. Doesn't know their concrete classes; talks to them only through the component interface. Delegates, processes intermediate results, returns the final one |
| **Client** | Works with everything through the component interface, so simple and complex elements are handled identically |

## Use when

- **You have to implement a tree-like object structure.** The pattern gives you two element
  types with one interface — leaves and containers — and containers may hold either, which
  is what makes the structure recursive.
- **You want client code to treat simple and complex elements uniformly**, without
  worrying about concrete classes.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note `add`/`remove` declared on the **base** class: it lets
the client manage the tree without knowing concrete classes, at the cost of those methods
being empty on leaves.

```ts
/**
 * The base Component class declares common operations for both simple and
 * complex objects of a composition.
 */
abstract class Component {
    protected parent!: Component | null;

    /**
     * Optionally, the base Component can declare an interface for setting and
     * accessing a parent of the component in a tree structure. It can also
     * provide some default implementation for these methods.
     */
    public setParent(parent: Component | null) {
        this.parent = parent;
    }

    public getParent(): Component | null {
        return this.parent;
    }

    /**
     * In some cases, it would be beneficial to define the child-management
     * operations right in the base Component class. This way, you won't need to
     * expose any concrete component classes to the client code, even during the
     * object tree assembly. The downside is that these methods will be empty
     * for the leaf-level components.
     */
    public add(component: Component): void { }

    public remove(component: Component): void { }

    /**
     * You can provide a method that lets the client code figure out whether a
     * component can bear children.
     */
    public isComposite(): boolean {
        return false;
    }

    /**
     * The base Component may implement some default behavior or leave it to
     * concrete classes (by declaring the method containing the behavior as
     * "abstract").
     */
    public abstract operation(): string;
}

/**
 * The Leaf class represents the end objects of a composition. A leaf can't have
 * any children.
 *
 * Usually, it's the Leaf objects that do the actual work, whereas Composite
 * objects only delegate to their sub-components.
 */
class Leaf extends Component {
    public operation(): string {
        return 'Leaf';
    }
}

/**
 * The Composite class represents the complex components that may have children.
 * Usually, the Composite objects delegate the actual work to their children and
 * then "sum-up" the result.
 */
class Composite extends Component {
    protected children: Component[] = [];

    /**
     * A composite object can add or remove other components (both simple or
     * complex) to or from its child list.
     */
    public add(component: Component): void {
        this.children.push(component);
        component.setParent(this);
    }

    public remove(component: Component): void {
        const componentIndex = this.children.indexOf(component);
        this.children.splice(componentIndex, 1);

        component.setParent(null);
    }

    public isComposite(): boolean {
        return true;
    }

    /**
     * The Composite executes its primary logic in a particular way. It
     * traverses recursively through all its children, collecting and summing
     * their results. Since the composite's children pass these calls to their
     * children and so forth, the whole object tree is traversed as a result.
     */
    public operation(): string {
        const results = [];
        for (const child of this.children) {
            results.push(child.operation());
        }

        return `Branch(${results.join('+')})`;
    }
}

/**
 * The client code works with all of the components via the base interface.
 */
function clientCode(component: Component) {
    // ...

    console.log(`RESULT: ${component.operation()}`);

    // ...
}

/**
 * This way the client code can support the simple leaf components...
 */
const simple = new Leaf();
console.log('Client: I\'ve got a simple component:');
clientCode(simple);
console.log('');

/**
 * ...as well as the complex composites.
 */
const tree = new Composite();
const branch1 = new Composite();
branch1.add(new Leaf());
branch1.add(new Leaf());
const branch2 = new Composite();
branch2.add(new Leaf());
tree.add(branch1);
tree.add(branch2);
console.log('Client: Now I\'ve got a composite tree:');
clientCode(tree);
console.log('');

/**
 * Thanks to the fact that the child-management operations are declared in the
 * base Component class, the client code can work with any component, simple or
 * complex, without depending on their concrete classes.
 */
function clientCode2(component1: Component, component2: Component) {
    // ...

    if (component1.isComposite()) {
        component1.add(component2);
    }
    console.log(`RESULT: ${component1.operation()}`);

    // ...
}

console.log('Client: I don\'t need to check the components classes even when managing the tree:');
clientCode2(tree, simple);
```

Output:

```
Client: I've got a simple component:
RESULT: Leaf

Client: Now I've got a composite tree:
RESULT: Branch(Branch(Leaf+Leaf)+Branch(Leaf))

Client: I don't need to check the components classes even when managing the tree:
RESULT: Branch(Branch(Leaf+Leaf)+Branch(Leaf)+Leaf)
```

## Idiomatic TypeScript

A **discriminated union** expresses the leaf/container split without an inheritance
hierarchy, and gives exhaustiveness checking for free:

```ts
type MenuNode = MenuItem | MenuGroup

interface MenuItem {
  kind: 'item'
  id: string
  label: string
  href: string
}

interface MenuGroup {
  kind: 'group'
  id: string
  label: string
  children: MenuNode[] // leaves and groups alike — this is what makes it a composite
}

// The recursive operation: same call shape for a leaf and for a whole subtree
export const countItems = (node: MenuNode): number =>
  node.kind === 'item' ? 1 : node.children.reduce((total, child) => total + countItems(child), 0)

// Exhaustive by construction: a new node kind breaks the build here
export const findById = (node: MenuNode, id: string): MenuNode | undefined => {
  if (node.id === id) return node
  if (node.kind === 'item') return undefined
  for (const child of node.children) {
    const found = findById(child, id)
    if (found) return found
  }
  return undefined
}
```

Prefer the union for **data** trees (menus, file systems, org charts, rich-text documents,
permission trees). Prefer the class form when nodes carry **behavior and identity** — a
scene graph, a rules engine.

React itself is the most familiar Composite you'll use: a component renders children that
may be components, and `<Layout>` treats one `<Button>` and a whole nested subtree the same
way.

Two practical cautions for recursive trees in TypeScript: guard against **cycles** (a
`Set` of visited ids) and against **deep recursion** on user-supplied data — an explicit
stack beats a stack overflow.

## How to implement

1. Confirm the core model really **is a tree**: simple elements and containers, where
   containers hold both.
2. Declare the component interface with methods that make sense for **both** simple and
   complex components.
3. Create the leaf class(es) for simple elements.
4. Create the container class with an array field for sub-elements, **typed as the
   component interface** so it can hold leaves and containers alike. Container methods
   delegate most work to sub-elements.
5. Define add/remove for children. Declaring them on the **component interface** violates
   the Interface Segregation Principle — they'll be empty on leaves — but lets the client
   treat all elements equally while composing the tree. That trade-off is yours to make.

## Pros and cons

**Pros**

- Work with complex tree structures conveniently, using polymorphism and recursion.
- **Open/Closed Principle** — new element types don't break existing code.

**Cons**

- Hard to provide a common interface for classes whose functionality differs too much.
  You may end up **overgeneralizing** the component interface, making it harder to
  comprehend.

## Identification

An object tree where every node belongs to the same class hierarchy, and node methods
delegate to child objects **through the base class/interface**. If both hold, it's a
composite.

## Relations with other patterns

- **Builder** helps construct complex Composite trees — its steps can recurse.
- **Chain of Responsibility** is often combined with Composite: a leaf passes a request up
  through its parents toward the root.
- **Iterator** traverses Composite trees.
- **Visitor** executes an operation over the whole tree.
- Shared leaf nodes can be implemented as **Flyweights** to save RAM.
- **Decorator** has a similar diagram — both use recursive composition — but a Decorator
  has exactly **one child** and **adds responsibilities**, while a Composite **sums up**
  its children. They cooperate: decorate a specific node inside a Composite tree.
- Designs heavy in Composite and Decorator benefit from **Prototype**: clone complex
  structures instead of rebuilding them.

## Anti-signals

- The structure is a flat list with one level of grouping — an array of groups is clearer
  than a recursive interface.
- Leaves and containers share almost no meaningful operations, so the component interface
  becomes a bag of optional methods.
- Half the client code still checks `isComposite()` before acting — the uniformity the
  pattern promises has not materialized.

## See also

[decorator](./decorator.md) · [iterator](./iterator.md) · [visitor](./visitor.md) · [flyweight](./flyweight.md) · [chain-of-responsibility](./chain-of-responsibility.md) · [builder](./builder.md)
