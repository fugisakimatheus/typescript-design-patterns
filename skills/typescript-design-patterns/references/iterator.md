# Iterator

**Category:** Behavioral · **Complexity:** ★★☆ · **Popularity:** ★★★

## Intent

Traverse the elements of a collection **without exposing its underlying representation**
(list, stack, tree, …).

## Problem

A collection is a container for a group of objects. Most store elements in simple lists;
some are built on stacks, trees, graphs. Whatever the structure, there must be a way to
walk every element **without hitting the same one twice**.

Easy for a list — loop over it. But a tree? Today depth-first is fine. Tomorrow you need
breadth-first. Next week, random access. Piling traversal algorithms into the collection
**blurs its primary responsibility, which is efficient data storage**, and some algorithms
are so application-specific that putting them in a generic collection class is plain weird.

Meanwhile the client may not care how elements are stored — but since every collection
exposes access differently, the client ends up **coupled to concrete collection classes**.

## Solution

Extract the traversal behavior into a separate object: the **iterator**.

Besides the algorithm, an iterator encapsulates the **traversal state** — current position,
how many elements remain — which is what lets **several iterators walk the same collection
simultaneously and independently**.

Iterators usually expose one primary fetch method; the client keeps calling it until
nothing comes back. All iterators implement **one interface**, so client code works with any
collection type and any traversal algorithm. Need a special traversal? Add an iterator class
— the collection and the client stay untouched.

**Real-world analogy:** three ways to tour Rome — wandering at random, a smartphone guide
app, or a hired local guide. Each is an iterator over the same vast collection of sights.

## Participants

| Role | Responsibility |
|---|---|
| **Iterator** | Interface for traversal: fetch next, get current position, restart, … |
| **Concrete Iterators** | Specific traversal algorithms. Each **tracks its own progress**, which is what makes parallel iteration possible |
| **Collection** | Declares one or more methods returning iterators. The **return type must be the iterator interface** so concrete collections can return different kinds |
| **Concrete Collections** | Return a fresh concrete iterator on each request |
| **Client** | Works with collections and iterators through their interfaces. Usually gets iterators from collections, but may create its own special one |

## Use when

- **The collection has a complex data structure you want to hide** — for convenience *and*
  for safety: the iterator protects the collection from careless or malicious direct
  manipulation.
- **To reduce duplication of traversal code.** Non-trivial iteration algorithms are bulky;
  inside business logic they blur its responsibility and hurt maintainability.
- **Your code must traverse different data structures, or structures unknown beforehand.**
  Code written against the two generic interfaces keeps working when you hand it new
  collections and iterators.

## Conceptual example (TypeScript)

Canonical conceptual TypeScript implementation. Note the same iterator class serving both directions via a
`reverse` flag, and the collection exposing two factory methods.

```ts
/**
 * Iterator Design Pattern
 *
 * Intent: Lets you traverse elements of a collection without exposing its
 * underlying representation (list, stack, tree, etc.).
 */

interface Iterator<T> {
    // Return the current element.
    current(): T;

    // Return the current element and move forward to next element.
    next(): T;

    // Return the key of the current element.
    key(): number;

    // Checks if current position is valid.
    valid(): boolean;

    // Rewind the Iterator to the first element.
    rewind(): void;
}

interface Aggregator {
    // Retrieve an external iterator.
    getIterator(): Iterator<string>;
}

/**
 * Concrete Iterators implement various traversal algorithms. These classes
 * store the current traversal position at all times.
 */

class AlphabeticalOrderIterator implements Iterator<string> {
    private collection: WordsCollection;

    /**
     * Stores the current traversal position. An iterator may have a lot of
     * other fields for storing iteration state, especially when it is supposed
     * to work with a particular kind of collection.
     */
    private position: number = 0;

    /**
     * This variable indicates the traversal direction.
     */
    private reverse: boolean = false;

    constructor(collection: WordsCollection, reverse: boolean = false) {
        this.collection = collection;
        this.reverse = reverse;

        if (reverse) {
            this.position = collection.getCount() - 1;
        }
    }

    public rewind() {
        this.position = this.reverse ?
            this.collection.getCount() - 1 :
            0;
    }

    public current(): string {
        return this.collection.getItems()[this.position];
    }

    public key(): number {
        return this.position;
    }

    public next(): string {
        const item = this.collection.getItems()[this.position];
        this.position += this.reverse ? -1 : 1;
        return item;
    }

    public valid(): boolean {
        if (this.reverse) {
            return this.position >= 0;
        }

        return this.position < this.collection.getCount();
    }
}

/**
 * Concrete Collections provide one or several methods for retrieving fresh
 * iterator instances, compatible with the collection class.
 */
class WordsCollection implements Aggregator {
    private items: string[] = [];

    public getItems(): string[] {
        return this.items;
    }

    public getCount(): number {
        return this.items.length;
    }

    public addItem(item: string): void {
        this.items.push(item);
    }

    public getIterator(): Iterator<string> {
        return new AlphabeticalOrderIterator(this);
    }

    public getReverseIterator(): Iterator<string> {
        return new AlphabeticalOrderIterator(this, true);
    }
}

/**
 * The client code may or may not know about the Concrete Iterator or Collection
 * classes, depending on the level of indirection you want to keep in your
 * program.
 */
const collection = new WordsCollection();
collection.addItem('First');
collection.addItem('Second');
collection.addItem('Third');

const iterator = collection.getIterator();

console.log('Straight traversal:');
while (iterator.valid()) {
    console.log(iterator.next());
}

console.log('');
console.log('Reverse traversal:');
const reverseIterator = collection.getReverseIterator();
while (reverseIterator.valid()) {
    console.log(reverseIterator.next());
}
```

Output:

```
Straight traversal:
First
Second
Third

Reverse traversal:
Third
Second
First
```

## Idiomatic TypeScript

**Don't write that class.** JavaScript has the pattern built into the language as the
**iteration protocol**, and implementing it makes your object work with `for…of`, spread,
destructuring, `Array.from`, `Map`/`Set` constructors — the whole ecosystem.

The cheapest way in is a **generator**:

```ts
class BinaryTree<T> {
  constructor(
    readonly value: T,
    readonly left?: BinaryTree<T>,
    readonly right?: BinaryTree<T>
  ) {}

  // The default traversal: `for (const v of tree)`
  *[Symbol.iterator](): Generator<T> {
    yield* this.inOrder()
  }

  *inOrder(): Generator<T> {
    if (this.left) yield* this.left.inOrder()
    yield this.value
    if (this.right) yield* this.right.inOrder()
  }

  // A second traversal over the same structure — the pattern's whole point
  *breadthFirst(): Generator<T> {
    const queue: BinaryTree<T>[] = [this]
    while (queue.length > 0) {
      const node = queue.shift()!
      yield node.value
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
  }
}

const tree = new BinaryTree(2, new BinaryTree(1), new BinaryTree(3))

for (const value of tree) console.log(value) // 1, 2, 3
console.log([...tree.breadthFirst()]) // [2, 1, 3]
```

Generators are **lazy**, so "delay an iteration and continue it later" comes for free, and
an infinite sequence is perfectly expressible.

For paginated APIs — the case you'll hit most often on a frontend — use
`Symbol.asyncIterator`, which hides the cursor bookkeeping behind `for await`:

```ts
async function* paginate<T>(fetchPage: (cursor?: string) => Promise<Page<T>>): AsyncGenerator<T> {
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    yield* page.items
    cursor = page.nextCursor
  } while (cursor)
}

for await (const account of paginate(fetchAccountsPage)) {
  // The caller never sees a cursor, a page boundary, or a request
}
```

## How to implement

1. Declare the **iterator interface** — at minimum a method fetching the next element;
   optionally previous, current position, and an end check.
2. Declare the **collection interface** with a method returning iterators, typed as the
   iterator interface. Add more methods if you plan several distinct groups of iterators.
3. Implement concrete iterators. **One iterator is linked to one collection instance**,
   usually via its constructor.
4. Implement the collection interface in your collections — the collection passes **itself**
   to the iterator's constructor.
5. Replace traversal code in clients with iterator use; the client fetches a fresh iterator
   each time it needs to walk the collection.

## Pros and cons

**Pros**

- **Single Responsibility Principle** — bulky traversal algorithms leave the collection and
  the client.
- **Open/Closed Principle** — new collections and iterators drop into existing code.
- **Parallel iteration** over one collection, since each iterator holds its own state.
- For the same reason, an iteration can be **paused and resumed**.

**Cons**

- **Overkill** if the app only works with simple collections.
- May be **less efficient** than walking a specialized collection directly.

## Identification

Navigation methods (`next`, `previous`, …). Client code using an iterator often has **no
direct access** to the collection being traversed.

## Relations with other patterns

- Use iterators to traverse **Composite** trees.
- **Factory Method** + Iterator lets collection subclasses return iterator types matching
  themselves.
- **Memento** + Iterator captures the current iteration state so it can be rolled back.
- **Visitor** + Iterator traverses a complex structure and runs an operation over elements
  of different classes.

## Anti-signals

- Hand-rolling `current()`/`next()`/`valid()` in TypeScript instead of implementing
  `Symbol.iterator` — you lose `for…of`, spread and every built-in that speaks the protocol.
- An iterator that mutates the collection mid-traversal.
- The collection is a plain array and the iterator adds nothing but ceremony.

## See also

[composite](./composite.md) · [visitor](./visitor.md) · [memento](./memento.md) · [factory-method](./factory-method.md)
