import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l2.encapsulation-invariants',
  language: 'java',
  levelId: 'java.l2',
  chapter: {
    id: 'object-boundaries',
    title: 'Encapsulation and Invariants',
  },
  sequence: 1,
  slug: 'encapsulation-invariants',
  title: 'The Inventory That Went Negative',
  deck: 'A private map, a public accessor, and one bulk correction were enough to break the rule that stock can never go below zero.',
  kind: 'incident-story',
  estimatedMinutes: 16,
  tags: ['encapsulation', 'invariants', 'collections', 'defensive-copying', 'incident'],
  concepts: [
    {
      id: 'java.l2.encapsulation',
      title: 'Encapsulation',
      kind: 'principle',
      summary: [
        'Encapsulation hides an object’s representation behind operations that preserve its rules.',
        'A private field is only the first step; every path that can change state must go through the boundary.',
        'The boundary lets callers use the object without knowing how its data is stored.',
      ],
      aliases: ['information hiding', 'object boundary', 'private state'],
      tags: ['java', 'design', 'objects'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.object-reachability',
        },
      ],
    },
    {
      id: 'java.l2.object-invariant',
      title: 'Object invariant',
      kind: 'principle',
      summary: [
        'An invariant is a condition that must hold for every valid instance, not just after a particular call.',
        'The constructor establishes it, and every public operation must preserve it.',
        'An object that can be observed in a state the invariant forbids is already broken.',
      ],
      aliases: ['class invariant', 'domain invariant', 'valid state'],
      tags: ['java', 'design', 'correctness'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.encapsulation',
        },
      ],
    },
    {
      id: 'java.l2.leaky-collection',
      title: 'Leaky collection accessor',
      kind: 'failure-mode',
      summary: [
        'Returning an internal mutable collection hands the caller a direct editing channel.',
        'The caller can add, remove, or replace elements without passing the object’s checks.',
        'A private final field does not help because the reference is copied, not the collection.',
      ],
      aliases: ['exposed collection', 'getter leak', 'aliased list'],
      tags: ['java', 'collections', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.encapsulation',
        },
      ],
    },
    {
      id: 'java.l2.defensive-copy',
      title: 'Defensive copy',
      kind: 'mechanism',
      summary: [
        'A defensive copy stores or returns a separate object so the caller cannot mutate internal state through an alias.',
        'Copy on the way in when a mutable argument is retained, and on the way out when a mutable value is exposed.',
        'A shallow copy protects the container but not the mutable objects inside it.',
      ],
      aliases: ['copy in copy out', 'defensive copying', 'snapshot'],
      tags: ['java', 'collections', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.reference-value',
        },
      ],
    },
  ],
  revisits: ['java.l0.object-reachability', 'java.l0.reference-value'],
  versionCaveats: [
    'Examples target Java 21 LTS. Access modifiers are compile-time access control; reflection, agents, and some frameworks can bypass them, so a real service still needs runtime validation and a storage constraint.',
    'Map.copyOf returns an unmodifiable copy with unspecified iteration order. Collections.unmodifiableMap returns a read-only view of the original map, so later writes through the original map remain visible.',
    'The examples are single-threaded. In a concurrent service, a check-then-update sequence such as reserve must be made atomic with a lock, a database transaction, or an atomic data structure.',
  ],
  references: [
    {
      title: 'Java SE 21 API: Map.copyOf',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html#copyOf(java.util.Map)',
      note: 'The difference between an unmodifiable copy and an unmodifiable view.',
    },
    {
      title: 'Java SE 21 API: Collections.unmodifiableMap',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#unmodifiableMap(java.util.Map)',
      note: 'A read-only view still reflects changes made through the backing collection.',
    },
    {
      title: 'Java Language Specification: Access control',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6',
      note: 'What private and package access actually restrict at compile time.',
    },
  ],
  sections: {
    problem:
      'A warehouse service keeps stock in a `HashMap<String, Integer>`. The field is `private final`, the class has `receive` and `reserve` methods, and both methods look correct in unit tests. Then an admin bulk-correction endpoint needs to write off damaged units. Rather than add a checked operation, it calls `inventory.units()` and merges a negative adjustment into the returned map.\n\nThe next reservation sees a negative available count, refuses every request, and the dashboard shows stock below zero. No test failed because every test used the public methods. The object had a boundary for the paths the team remembered and a hole for the path it forgot. The invariant existed in the methods, not in the type.',
    analogy: {
      title: 'The stockroom with a customer key',
      body:
        'A stockroom keeps its shelves behind a counter. The counter clerk follows a rule: never hand out more units than are on the shelf. A new clerk, asked for a bulk correction, is given the stockroom key so the work can be done faster. The key works. The correction writes a negative count onto the shelf card, and the next customer is told the item is unavailable.\n\nThe key was not the problem. The problem was that the rule lived at the counter while the key opened the shelf. A boundary that can be walked around is not a boundary; it is a suggestion.',
      mapping: [
        {
          technical: 'A private field holding the stock map',
          everyday: 'The shelves behind the counter',
        },
        {
          technical: 'The receive and reserve methods',
          everyday: 'The counter clerk and the stock rule',
        },
        {
          technical: 'Returning the internal map from an accessor',
          everyday: 'Handing a caller the stockroom key',
        },
        {
          technical: 'A caller mutating the returned collection',
          everyday: 'Writing a negative count directly on the shelf card',
        },
        {
          technical: 'A database CHECK constraint',
          everyday: 'A lock on the stockroom that the counter cannot bypass',
        },
      ],
      whereItBreaks:
        'A physical key is visible and can be logged, copied, or taken back. A Java reference is copied silently, and the object has no way to know who is holding it. The analogy also suggests that the counter and the shelf are separate; in code, both paths reach the same object in the same process, so the field’s privacy is the only compile-time distinction between them.',
    },
    mentalModel: {
      title: 'A boundary is only as strong as its narrowest path',
      figure: {
        width: 960,
        height: 380,
        caption:
          'The intended path validates every change. The leaked accessor gives callers a second path to the same map, so a negative adjustment never meets the invariant.',
        alt: 'A diagram with a caller entering a public API that checks the invariant before touching a private map. A second path branches from the caller through a leaked units accessor and a bulk merge that writes directly to the map, producing negative stock. Annotations mark the checked path, the bypass, and the observed result.',
        nodes: [
          {
            id: 'caller',
            label: 'caller',
            detail: 'checkout or admin job',
            x: 16,
            y: 40,
            width: 164,
            height: 84,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'api',
            label: 'receive / reserve',
            detail: 'checked operations',
            x: 220,
            y: 36,
            width: 200,
            height: 92,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'invariant',
            label: 'quantity >= 0',
            detail: 'object invariant',
            x: 460,
            y: 32,
            width: 184,
            height: 100,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'map',
            label: 'private units map',
            detail: 'the only state',
            x: 704,
            y: 36,
            width: 220,
            height: 92,
            shape: 'cylinder',
            tone: 'neutral',
          },
          {
            id: 'leak',
            label: 'units() accessor',
            detail: 'returns the live map',
            x: 220,
            y: 204,
            width: 200,
            height: 88,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'bulk',
            label: 'bulk merge',
            detail: 'no validation',
            x: 460,
            y: 204,
            width: 184,
            height: 88,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'negative',
            label: 'stock = -3',
            detail: 'every reserve fails',
            x: 704,
            y: 204,
            width: 220,
            height: 88,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'caller',
            to: 'api',
            label: 'intended path',
            kind: 'flow',
          },
          {
            from: 'api',
            to: 'invariant',
            label: 'check',
            kind: 'depends',
          },
          {
            from: 'invariant',
            to: 'map',
            label: 'checked write',
            kind: 'flow',
          },
          {
            from: 'caller',
            to: 'leak',
            label: 'shortcut',
            kind: 'flow',
          },
          {
            from: 'leak',
            to: 'bulk',
            label: 'mutate',
            kind: 'flow',
          },
          {
            from: 'bulk',
            to: 'map',
            label: 'unchecked write',
            kind: 'flow',
          },
          {
            from: 'map',
            to: 'negative',
            label: 'observed',
            kind: 'flow',
          },
          {
            from: 'leak',
            to: 'invariant',
            label: 'bypasses',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 336,
            text: 'The checked path is the one the tests exercised.',
          },
          {
            x: 460,
            y: 336,
            text: 'The shortcut reaches the same map without the check.',
          },
          {
            x: 704,
            y: 336,
            text: 'A valid negative count is a contradiction, not an empty shelf.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Encapsulation is not a keyword. It is a claim that every observable state of the object satisfies its invariant. Follow a reference from the caller to the field, then ask which paths can write through it.',
      steps: [
        {
          title: 'A returned reference is a capability',
          body:
            'A method that returns a mutable collection returns permission to change it. The caller does not need the field name or package access; it only needs the reference. `private final` prevents reassignment of the field by the class’s own code, not mutation of the object the field points at.\n\nThis is the same aliasing rule as any other reference. The collection object lives on the heap, and both the field and the caller’s variable point at it. Calling `clear()` or `add()` through either reference changes the one object.',
          code: {
            filename: 'Order.java',
            language: 'java',
            code: `import java.util.ArrayList;
import java.util.List;

final class Order {
    private final List<String> lines = new ArrayList<>();

    List<String> lines() { return lines; }

    void add(String line) { lines.add(line); }

    public static void main(String[] args) {
        Order order = new Order();
        order.add("book");
        order.lines().clear();
        System.out.println(order.lines().size());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The field is private and final, so no caller can assign a different list to it.',
              },
              {
                line: 7,
                note: 'This accessor returns the list object itself. The caller now holds an alias.',
              },
              {
                line: 9,
                note: 'The intended add path exists, but it is not the only path once the list escapes.',
              },
              {
                line: 14,
                note: 'clear runs on the same list the field points at. No Order method was called.',
              },
              {
                line: 15,
                note: 'The order is now empty even though add succeeded.',
              },
            ],
            output: `0`,
          },
        },
        {
          title: 'The constructor establishes the invariant',
          body:
            'An invariant is a predicate over the object’s state. For an inventory, the simplest form is that every stored quantity is zero or positive. The constructor is the first place that can enforce it, and it must do so before the object becomes reachable by anyone else.\n\nValidate the input, then copy it. Copying matters because the caller may keep the original map and change it later. A constructor that stores the argument directly has accepted a second owner of the same mutable state.',
          code: {
            filename: 'Inventory.java',
            language: 'java',
            code: `import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units;

    Inventory(Map<String, Integer> initial) {
        for (Map.Entry<String, Integer> entry : initial.entrySet()) {
            if (entry.getValue() < 0) {
                throw new IllegalArgumentException(
                    "negative stock for " + entry.getKey());
            }
        }
        this.units = new HashMap<>(initial);
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The map is private and final, but the constructor still has to defend its contents.',
              },
              {
                line: 7,
                note: 'Every value is checked before the object exists in a usable state.',
              },
              {
                line: 8,
                note: 'A single negative entry rejects the whole construction rather than repairing silently.',
              },
              {
                line: 13,
                note: 'The constructor stores a copy. Later changes to the caller’s map cannot reach this object.',
              },
            ],
          },
        },
        {
          title: 'Every operation must preserve the invariant',
          body:
            'A valid object can become invalid through any public method that changes state. `receive` must reject non-positive quantities, and `reserve` must check availability before subtracting. The methods also need to agree on what “available” means when a SKU is absent: `getOrDefault` makes the missing case explicit as zero.\n\nThe invariant is not a comment on a setter. It is the reason the operation exists. If a correction needs to write off stock, it should be an operation with its own rules, not a general-purpose setter that accepts any integer.',
          code: {
            filename: 'Inventory.java',
            language: 'java',
            code: `import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units = new HashMap<>();

    void receive(String sku, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        units.merge(sku, quantity, Integer::sum);
    }

    boolean reserve(String sku, int quantity) {
        if (quantity <= 0) return false;
        int available = units.getOrDefault(sku, 0);
        if (available < quantity) return false;
        units.put(sku, available - quantity);
        return true;
    }
}`,
            annotations: [
              {
                line: 8,
                note: 'Receiving zero or a negative count is rejected at the boundary.',
              },
              {
                line: 11,
                note: 'merge is safe here because the incoming quantity has already been validated.',
              },
              {
                line: 15,
                note: 'A non-positive reservation is refused rather than increasing stock.',
              },
              {
                line: 17,
                note: 'The check and the subtraction use the same value, so the result cannot go negative in this thread.',
              },
              {
                line: 18,
                note: 'Only a checked amount is written back to the map.',
              },
            ],
          },
        },
        {
          title: 'Snapshots cross the boundary, views do not',
          body:
            '`Map.copyOf` produces an unmodifiable copy. The caller can read it, and later changes to the inventory do not appear in it. `Collections.unmodifiableMap` produces a read-only view: writes are rejected through the wrapper, but the view still reflects changes made through the backing map, and anyone holding the backing map can still mutate it.\n\nChoose deliberately. A snapshot is the safer default at a boundary because it has no live connection to internal state. A live view can be useful for a read-only cache or a diagnostic endpoint, but it must be documented and the backing collection must not escape elsewhere.',
          code: {
            filename: 'Inventory.java',
            language: 'java',
            code: `import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units = new HashMap<>();

    Map<String, Integer> snapshot() {
        return Map.copyOf(units);
    }

    Map<String, Integer> liveView() {
        return Collections.unmodifiableMap(units);
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The field remains the only mutable map the class owns.',
              },
              {
                line: 8,
                note: 'The copy is independent: later inventory changes will not appear in it.',
              },
              {
                line: 9,
                note: 'Map.copyOf rejects null keys and values and returns an unmodifiable map.',
              },
              {
                line: 12,
                note: 'This view rejects writes through the wrapper but still reflects writes to units.',
              },
            ],
          },
        },
        {
          title: 'The storage layer is a backstop, not the boundary',
          body:
            'A database constraint is valuable because it catches bugs that bypass the domain object: a migration script, a repair job, a second service writing to the same table. It is not a replacement for the object’s checks because the constraint fires after the application has already made a decision, and it produces a storage error rather than a domain explanation.\n\nUse both. The object enforces the rule at the point where the operation is understood; the database enforces it for every writer, including the ones that do not use this code. The constraint should mirror the invariant, not invent a different one.',
          code: {
            filename: 'inventory.sql',
            language: 'sql',
            code: `ALTER TABLE inventory
    ADD CONSTRAINT stock_not_negative
    CHECK (quantity >= 0);`,
            annotations: [
              {
                line: 1,
                note: 'The constraint is added to the table that every writer shares.',
              },
              {
                line: 2,
                note: 'A named constraint makes the failure identifiable in logs and migrations.',
              },
              {
                line: 3,
                note: 'The predicate matches the domain invariant: stored quantity is never negative.',
              },
            ],
          },
        },
      ],
      outro:
        'An invariant survives only if every path to the state preserves it. Keep the state private, expose operations instead of setters, copy mutable inputs and outputs, and put a constraint at the storage layer for the paths that do not go through the object.',
    },
    code: {
      intro:
        'The minimal example returns the live list. The realistic example keeps the map private and exposes checked operations plus a snapshot.',
      minimal: {
        filename: 'Cart.java',
        language: 'java',
        code: `import java.util.ArrayList;
import java.util.List;

final class Cart {
    private final List<String> items = new ArrayList<>();
    List<String> items() { return items; }

    public static void main(String[] args) {
        Cart cart = new Cart();
        cart.items().add("free gift");
        System.out.println(cart.items());
    }
}`,
        annotations: [
          {
            line: 5,
            note: 'The field is private and final. Neither keyword prevents the list’s contents from changing.',
          },
          {
            line: 6,
            note: 'The accessor hands out the list itself, so the caller can bypass any Cart operation.',
          },
          {
            line: 10,
            note: 'The caller adds an item without calling a Cart method.',
          },
          {
            line: 11,
            note: 'The new element is visible because both references point at the same list.',
          },
        ],
        output: `[free gift]`,
      },
      realistic: {
        filename: 'Inventory.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units = new HashMap<>();

    void receive(String sku, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        units.merge(sku, quantity, Integer::sum);
    }

    boolean reserve(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (quantity <= 0 || available < quantity) return false;
        units.put(sku, available - quantity);
        return true;
    }

    Map<String, Integer> snapshot() {
        return Map.copyOf(units);
    }

    public static void main(String[] args) {
        Inventory inventory = new Inventory();
        inventory.receive("widget", 8);
        System.out.println(inventory.reserve("widget", 3));
        System.out.println(inventory.reserve("widget", 9));
        System.out.println(inventory.snapshot());
    }
}`,
        annotations: [
          {
            line: 5,
            note: 'The map is private, so no caller can reach it by name.',
          },
          {
            line: 7,
            note: 'The only way to add stock is receive, which validates the quantity.',
          },
          {
            line: 16,
            note: 'The only way to remove stock is reserve, which checks availability first.',
          },
          {
            line: 17,
            note: 'The combined condition rejects zero, negative, and oversized requests.',
          },
          {
            line: 23,
            note: 'Callers get a copy, not the live map, so reads cannot mutate inventory.',
          },
          {
            line: 30,
            note: 'This reservation succeeds and leaves five units.',
          },
          {
            line: 31,
            note: 'This reservation is larger than the remaining stock, so it fails without writing.',
          },
        ],
        output: `true
false
{widget=5}`,
      },
    },
    breakIt: {
      title: 'The correction that wrote a negative count',
      scenario:
        'An inventory service exposes `units()` so an admin bulk-correction job can adjust stock after a warehouse audit. The job merges a negative adjustment for damaged units directly into the returned map. The endpoint reports success, the dashboard shows a negative count, and every subsequent reservation for that SKU is refused as unavailable.',
      brokenCode: {
        filename: 'Inventory.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units = new HashMap<>();

    void receive(String sku, int quantity) {
        units.merge(sku, quantity, Integer::sum);
    }

    boolean reserve(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (available < quantity) return false;
        units.put(sku, available - quantity);
        return true;
    }

    Map<String, Integer> units() {
        return units;
    }

    public static void main(String[] args) {
        Inventory inventory = new Inventory();
        inventory.receive("widget", 8);
        inventory.units().merge("widget", -11, Integer::sum);
        System.out.println(inventory.units().get("widget"));
        System.out.println(inventory.reserve("widget", 1));
    }
}`,
      },
      predictionPrompt:
        'The correction writes a negative number. What does `reserve` do with that value, and why does the map still accept the write?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `-3`, then `false`. The SKU exists in the map, but its available count is below zero, so the reservation is rejected. The bulk job itself reports no error.',
        explanation:
          '`units()` returns the same map object the field holds. The bulk job’s `merge` call does not go through `receive`, `reserve`, or any other check, so the invariant that every quantity is non-negative is never consulted. The map is a general-purpose data structure; it has no knowledge of the inventory rule. Once the negative value is stored, `reserve` correctly refuses requests because `available < quantity`, which makes the SKU look out of stock rather than corrupt. The fix is not a stronger check inside `reserve`; it is removing the unchecked write path.',
        repair:
          'Keep the map private and expose intent-named operations. Add a `writeOff(sku, quantity)` method that validates the amount, refuses to take more than is available, and records the reason. Return `Map.copyOf(units)` when a caller needs to inspect the state. Put a database CHECK constraint on the quantity column so migrations and other writers cannot store a negative value either. If a correction genuinely must allow a negative balance for accounting reasons, model that as a separate signed ledger entry rather than overloading available stock.',
        correctedCode: {
          filename: 'Inventory.java',
          language: 'java',
          code: `import java.util.HashMap;
import java.util.Map;

final class Inventory {
    private final Map<String, Integer> units = new HashMap<>();

    void receive(String sku, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        units.merge(sku, quantity, Integer::sum);
    }

    boolean reserve(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (quantity <= 0 || available < quantity) return false;
        units.put(sku, available - quantity);
        return true;
    }

    void writeOff(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (quantity <= 0 || quantity > available) {
            throw new IllegalArgumentException("write-off exceeds available stock");
        }
        units.put(sku, available - quantity);
    }

    Map<String, Integer> snapshot() {
        return Map.copyOf(units);
    }

    public static void main(String[] args) {
        Inventory inventory = new Inventory();
        inventory.receive("widget", 8);
        inventory.writeOff("widget", 3);
        System.out.println(inventory.snapshot());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated domain classes often look encapsulated because the fields are private. The leak is usually in the accessor or the generated mutator, not in the field declaration.',
      mistakes: [
        {
          title: 'Private field, public mutable getter',
          generatedPattern:
            '“The list is private, so the object is encapsulated. I added a getter so callers can read it.”',
          whyItFails:
            'The getter returns the live collection. Any caller can add, remove, or clear elements without the object’s checks, so the invariant is no stronger than the last careful caller.',
          correction:
            'Return `List.copyOf(items)` for a snapshot, or expose intent-named operations. If a live view is genuinely required, document it and keep the backing collection private.',
          telltale:
            'A getter returns `List`, `Set`, `Map`, `Date`, or an array, and callers call a mutator on the returned value.',
        },
        {
          title: 'Treating unmodifiableMap as an immutable object',
          generatedPattern:
            '“I wrapped the map with `Collections.unmodifiableMap`, so the inventory can no longer change.”',
          whyItFails:
            'The wrapper is a view. Writes through the original map remain visible, and any code that still holds the backing map can mutate it. The wrapper only blocks writes that go through the wrapper.',
          correction:
            'Use `Map.copyOf` at the boundary, and never expose the backing map. If the view is intentional, keep the backing reference private and document the live-view semantics.',
          telltale:
            'The original mutable collection is still a field, a constructor argument, or a value returned by another accessor.',
        },
        {
          title: 'Validation only in setters',
          generatedPattern:
            '“The setter checks that quantity is non-negative, so the invariant is protected.”',
          whyItFails:
            'Objects can be created without setters, frameworks can write fields directly, and bulk operations often bypass the setter. A constructor that accepts an invalid value, or a repository that loads one, produces the same broken state.',
          correction:
            'Validate in the constructor or factory, in every mutating operation, and at the storage boundary. Keep the invariant in one named place so all paths use the same rule.',
          telltale:
            'A domain object with setters but no constructor checks, or a repository method that trusts values loaded from another system.',
        },
        {
          title: 'Generating setters for every field',
          generatedPattern:
            '“I used Lombok `@Data`/`@Setter` to reduce boilerplate. The class is still a domain object.”',
          whyItFails:
            'Generated setters expose every field independently. Callers can set a status without setting the timestamps, or change a quantity without recording the reason, and the object has no place to enforce the relationship between fields.',
          correction:
            'Use a value type or an explicit API with operations named after the domain action. If a framework needs mutable access, keep it at the persistence boundary and revalidate when loading.',
          telltale:
            'A domain class has a setter for each field and validation spread across service methods instead of the object.',
        },
      ],
      reviewChecklist: [
        'Does any public method return a mutable collection, array, or mutable value type owned by the object?',
        'Can a caller change state without calling an intent-named operation?',
        'Is the invariant checked in the constructor and in every mutating operation?',
        'Does the storage schema enforce the same invariant for writers that bypass this object?',
        'Are mutable constructor arguments copied before they are stored?',
      ],
    },
    interviewCorner: {
      intro:
        'Interviewers use encapsulation to separate people who know the keyword from people who can identify every path to the state.',
      questions: [
        {
          id: 'java.l2.encapsulation-invariants.interview.1',
          difficulty: 'junior',
          question: 'What does encapsulation protect that a private field alone does not?',
          modelAnswer:
            'A private field hides the name, but encapsulation is about the rules for changing state. The object should expose operations that preserve its invariant and keep its representation replaceable. If a getter returns a mutable collection, or a setter accepts any value, callers can still create states the class was supposed to forbid. Encapsulation is the combination of hidden representation, controlled operations, and a valid state at every observable point.',
          weakAnswer:
            'It hides the fields so other classes cannot access them. Private is the main part.',
          strongAnswer:
            'Private is access control, not state control. The meaningful boundary is the set of operations that can mutate the object. I look for leaked mutable references, setters that bypass rules, constructors that accept invalid combinations, and bulk paths that write around the object. Encapsulation also lets me change the representation later without changing callers, which is a design benefit beyond correctness.',
          followUp:
            'If a getter returns an unmodifiable view, is the object encapsulated?',
        },
        {
          id: 'java.l2.encapsulation-invariants.interview.2',
          difficulty: 'mid',
          question:
            'Why is returning an internal `List` from a getter dangerous even when the field is private and final?',
          modelAnswer:
            'The field being final only prevents the class from assigning a different list to that field. The getter returns a reference to the same list object, so the caller has an alias. The caller can add, remove, or clear elements without going through the class’s checks. If the list is part of the object’s invariant, the invariant can now be violated from outside. Return an unmodifiable copy, or expose operations that express what the caller is allowed to do.',
          weakAnswer:
            'It is dangerous because the list might be null, so I would return an empty list instead.',
          strongAnswer:
            'Final protects the reference slot; it says nothing about the object’s contents. The getter is a capability transfer. I would either return `List.copyOf(items)` for a snapshot or expose methods such as `addItem` and `removeItem` that enforce the rules. If I return a live view, I have to accept that callers see later changes and that the backing list must never escape another way.',
          followUp:
            'What is the difference between `List.copyOf` and `Collections.unmodifiableList` here?',
        },
        {
          id: 'java.l2.encapsulation-invariants.interview.3',
          difficulty: 'senior',
          question:
            'How would you keep an inventory invariant intact across a service, a database, and several background jobs?',
          modelAnswer:
            'I would make the aggregate the only place that changes stock, with operations such as receive, reserve, and writeOff that validate the rule. The service boundary would load the aggregate, call the operation, and commit in one transaction. I would add optimistic locking or a conditional update so two concurrent reservations cannot both pass the availability check. The database would have a CHECK constraint and, if needed, a ledger table for auditability. Background jobs would use the same operations or a dedicated correction workflow, never a direct table update. I would test the invariant at the object level and add an integration test that races two reservations.',
          weakAnswer:
            'Add validation annotations to the entity and let the service check the quantity before saving. The database can be fixed later if something goes wrong.',
          strongAnswer:
            'The hard part is not the check; it is making the check and the write atomic across every writer. I would define the invariant once, keep the state private, and make the storage constraint match it. I would look for bypass paths such as bulk imports, admin tools, and retries, because those are where the invariant usually dies. I would also decide whether overselling is a hard failure or a backorder state, since that changes the domain model rather than the validation code.',
          followUp:
            'What would you measure to detect a bypass before customers see negative stock?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build an inventory that cannot go negative',
      brief:
        'Write a `StockLedger` that owns a private SKU-to-quantity map. It must support receiving stock, reserving stock, writing off damaged stock, and returning a snapshot. The invariant is simple: every stored quantity is zero or positive, and a reservation never takes more than is available. Prove the boundary by trying to mutate the snapshot and by attempting an invalid write-off.',
      constraints: [
        'Keep the map private and final; do not expose a live map or a setter for quantities.',
        'Validate every operation, including zero and negative arguments.',
        'Return a snapshot that callers cannot use to change the ledger.',
        'Include a `writeOff` operation that refuses to take more than the available quantity.',
        'Print the state after a successful reservation, a failed reservation, and a rejected write-off.',
        'Do not use reflection or a framework to bypass the private field.',
      ],
      starterCode: {
        filename: 'StockLedger.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;

final class StockLedger {
    private final Map<String, Integer> units = new HashMap<>();

    // Add receive, reserve, writeOff, and snapshot.

    public static void main(String[] args) {
        StockLedger ledger = new StockLedger();
        // Prove the valid and invalid paths.
    }
}`,
      },
      referenceSolution: {
        filename: 'StockLedger.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;

final class StockLedger {
    private final Map<String, Integer> units = new HashMap<>();

    void receive(String sku, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        units.merge(sku, quantity, Integer::sum);
    }

    boolean reserve(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (quantity <= 0 || available < quantity) {
            return false;
        }
        units.put(sku, available - quantity);
        return true;
    }

    void writeOff(String sku, int quantity) {
        int available = units.getOrDefault(sku, 0);
        if (quantity <= 0 || quantity > available) {
            throw new IllegalArgumentException("write-off exceeds available stock");
        }
        units.put(sku, available - quantity);
    }

    Map<String, Integer> snapshot() {
        return Map.copyOf(units);
    }

    public static void main(String[] args) {
        StockLedger ledger = new StockLedger();
        ledger.receive("widget", 8);
        System.out.println(ledger.reserve("widget", 3));
        System.out.println(ledger.reserve("widget", 9));
        try {
            ledger.writeOff("widget", 99);
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
        }
        System.out.println(ledger.snapshot());
        try {
            ledger.snapshot().put("widget", -1);
        } catch (UnsupportedOperationException error) {
            System.out.println("snapshot is read-only");
        }
    }
}`,
        annotations: [
          {
            line: 5,
            note: 'The map is the only mutable state and never leaves the class.',
          },
          {
            line: 8,
            note: 'receive rejects zero and negative quantities before merging.',
          },
          {
            line: 16,
            note: 'reserve checks the same value it later subtracts, so it cannot go negative in this thread.',
          },
          {
            line: 24,
            note: 'writeOff is a separate operation with its own rule, not a general setter.',
          },
          {
            line: 33,
            note: 'Map.copyOf returns an independent unmodifiable snapshot.',
          },
          {
            line: 45,
            note: 'The snapshot rejects the write; the ledger state is unchanged.',
          },
        ],
      },
      rubric: [
        {
          id: 'private-state',
          check: 'Is the map private with no live accessor or quantity setter?',
          detail:
            'The incident happened because a caller could mutate the map directly. Every write must go through an operation.',
          mustPass: true,
        },
        {
          id: 'validated-operations',
          check: 'Do receive, reserve, and writeOff reject invalid amounts and preserve the invariant?',
          detail:
            'A check in only one path leaves the other paths able to create an invalid state.',
          mustPass: true,
        },
        {
          id: 'snapshot-boundary',
          check: 'Does snapshot return a copy or an unmodifiable value with no live link to the ledger?',
          detail:
            'A live view is not automatically wrong, but it must be intentional and must not allow mutation.',
          mustPass: true,
        },
        {
          id: 'failure-evidence',
          check: 'Does the output show a successful reservation, a failed reservation, and a rejected write-off?',
          detail:
            'The three cases prove that the boundary handles both normal and invalid paths.',
          mustPass: false,
        },
        {
          id: 'storage-backstop',
          check: 'Does the answer name a database or storage constraint that mirrors the invariant?',
          detail:
            'The code is in-memory, but a real service needs a backstop for writers that bypass the object.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac StockLedger.java` and `java StockLedger`. Expect `true`, `false`, a write-off error, `{widget=5}`, and a read-only message.',
        'Remove `Map.copyOf` and return the field directly. Confirm that the snapshot write succeeds, then explain which invariant path was reopened.',
        'Add a `setQuantity` method that accepts any integer and call it with `-1`. Explain why the method is a design failure even if its Javadoc says “do not use a negative value.”',
      ],
    },
    recap: [
      'Encapsulation is a boundary around state plus every operation that can change it, not just a private field.',
      'An invariant must hold at construction and after every public operation; validate all paths, including bulk corrections.',
      'A returned mutable collection is a capability. Snapshot it or expose intent-named operations instead of a live reference.',
      'A database constraint is a valuable backstop, but it should mirror a domain rule that the object already enforces.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l2.encapsulation-invariants.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l2.leaky-collection', 'java.l2.encapsulation'],
      prompt:
        'A class has a `private final List<String> items` field and a getter that returns `items`. What can a caller still do?',
      options: [
        {
          id: 'mutate-contents',
          text: 'Add or remove elements through the returned reference without calling a class method.',
        },
        {
          id: 'reassign-field',
          text: 'Assign a different list to the field from outside the class.',
        },
        {
          id: 'change-type',
          text: 'Change the field’s declared type at runtime.',
        },
        {
          id: 'nothing',
          text: 'Nothing; private and final make the object immutable.',
        },
      ],
      correctOptionId: 'mutate-contents',
      explanation:
        'The getter copies the reference, not the list. The caller and the field point at the same list object, so operations such as `add` and `clear` change the object’s state without going through its methods.',
    },
    {
      id: 'java.l2.encapsulation-invariants.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l2.leaky-collection', 'java.l2.object-invariant'],
      prompt:
        'The cart is supposed to reject more than three items, but this code lets a caller bypass the rule. Which line opens the bypass?',
      code: `import java.util.ArrayList;
import java.util.List;

final class Cart {
    private final List<String> items = new ArrayList<>();

    List<String> items() {
        return items;
    }

    void add(String item) {
        if (items.size() >= 3) throw new IllegalStateException("cart is full");
        items.add(item);
    }
}`,
      codeLanguage: 'java',
      bugLine: 8,
      bugSummary:
        'The accessor returns the live list, so callers can add items without the size check in add.',
      explanation:
        'The field is private, but the accessor gives every caller the same mutable list. `cart.items().add("fourth")` never runs the check. Return `List.copyOf(items)` or expose a read-only view, and keep the mutable list private.',
    },
    {
      id: 'java.l2.encapsulation-invariants.recall.q3',
      type: 'explain',
      concepts: ['java.l2.object-invariant', 'java.l2.defensive-copy'],
      prompt:
        'Explain why a constructor that stores a caller’s mutable `Map` directly can leave an object invalid even when the constructor checks every value.',
      keyPoints: [
        'The constructor and the caller share one map object after the assignment.',
        'The caller can mutate the map after construction, bypassing the constructor’s checks.',
        'A defensive copy breaks the alias so later caller changes cannot reach the object.',
        'Every mutating operation still has to preserve the invariant; a copy is not a substitute for checked methods.',
      ],
      modelAnswer:
        'The constructor validates the map it receives, but it then stores the same map reference. The caller still holds that reference, so it can add a negative value after construction. The object’s invariant was true only at the moment the constructor returned. Copying the map into a new private map prevents later changes through the caller’s reference. The object must also keep every mutating operation checked, because a copy protects against external aliases but not against its own methods.',
      explanation:
        'Strong answers separate the aliasing problem from the validation problem: both are necessary, and neither alone is sufficient.',
    },
  ],
});
