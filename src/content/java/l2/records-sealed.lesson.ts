import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l2.records-sealed',
  language: 'java',
  levelId: 'java.l2',
  chapter: {
    id: 'modern-value-types',
    title: 'Records and Sealed Types',
  },
  sequence: 5,
  slug: 'records-sealed',
  title: 'The Switch That Finally Became Exhaustive',
  deck: 'A default branch turned every new event into “ignore.” Sealing the hierarchy moved the missing case from production to the compiler.',
  kind: 'standard',
  estimatedMinutes: 18,
  tags: ['records', 'sealed-types', 'pattern-matching', 'exhaustiveness', 'value-objects'],
  concepts: [
    {
      id: 'java.l2.record',
      title: 'Record',
      kind: 'term',
      summary: [
        'A record is a final, transparent carrier for a fixed set of components.',
        'The compiler generates the canonical constructor, accessors, equals, hashCode, and toString from those components.',
        'The generated fields are final, but a mutable component still makes the record only shallowly immutable.',
      ],
      aliases: ['record class', 'data carrier', 'transparent carrier'],
      tags: ['java', 'records', 'value-objects'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.equals-contract',
        },
        {
          type: 'depends-on',
          target: 'java.l1.hashcode-contract',
        },
      ],
    },
    {
      id: 'java.l2.compact-constructor',
      title: 'Compact constructor',
      kind: 'mechanism',
      summary: [
        'A compact constructor declares only the record’s name and runs before the generated field assignments.',
        'It validates or normalizes the parameters; reassigning a parameter changes the value that will be stored.',
        'It cannot assign the fields directly, and it does not replace the canonical constructor’s signature.',
      ],
      aliases: ['record validation constructor', 'canonical constructor body'],
      tags: ['java', 'records', 'validation'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.record',
        },
      ],
    },
    {
      id: 'java.l2.sealed-type',
      title: 'Sealed type',
      kind: 'term',
      summary: [
        'A sealed class or interface names the subtypes that are allowed to extend or implement it.',
        'Each permitted subtype must be final, sealed, or non-sealed.',
        'Sealing closes the hierarchy so the compiler can reason about every possible case.',
      ],
      aliases: ['sealed interface', 'permits clause', 'closed hierarchy'],
      tags: ['java', 'types', 'pattern-matching'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.inheritance',
        },
        {
          type: 'contrasts-with',
          target: 'java.l2.open-closed-principle',
        },
      ],
    },
    {
      id: 'java.l2.exhaustive-switch',
      title: 'Exhaustive switch',
      kind: 'principle',
      summary: [
        'A switch over a sealed type is exhaustive when it handles every permitted subtype.',
        'The compiler checks completeness, so adding a permitted subtype breaks every incomplete switch at compile time.',
        'An exhaustive switch needs no default; a default over a closed domain hides exactly the case the compiler could have found.',
      ],
      aliases: ['exhaustiveness checking', 'total switch', 'sealed switch'],
      tags: ['java', 'pattern-matching', 'correctness'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.sealed-type',
        },
      ],
    },
  ],
  revisits: [
    'java.l2.immutability',
    'java.l2.value-object',
    'java.l2.open-closed-principle',
    'java.l1.equals-contract',
    'java.l1.hashcode-contract',
  ],
  versionCaveats: [
    'Examples target Java 21 LTS. Records are final since Java 16 (JEP 395), sealed classes and interfaces since Java 17 (JEP 409), and pattern matching for switch and record patterns since Java 21 (JEP 441 and JEP 440).',
    'A permitted subtype of a sealed class must be in the same module if the sealed type is in a named module, or in the same package if it is in the unnamed module. A subtype must be final, sealed, or non-sealed.',
    'Adding a permitted subtype and not recompiling an exhaustive switch can produce a MatchException at runtime. Java 21’s MatchException documents this separate-compilation case. Recompiling the switch turns the omission into a compile-time error.',
    'A record is only shallowly immutable. A record with a mutable list, array, or domain object still needs a defensive copy or an immutable component type.',
  ],
  references: [
    {
      title: 'JEP 395: Records',
      url: 'https://openjdk.org/jeps/395',
      note: 'The design and semantics of record classes, including the canonical constructor and generated members.',
    },
    {
      title: 'JEP 409: Sealed Classes',
      url: 'https://openjdk.org/jeps/409',
      note: 'The permits clause, permitted subclasses, and the same-module or same-package rule.',
    },
    {
      title: 'JEP 441: Pattern Matching for switch',
      url: 'https://openjdk.org/jeps/441',
      note: 'Exhaustiveness, dominance, and the synthetic default that can throw MatchException.',
    },
    {
      title: 'JEP 440: Record Patterns',
      url: 'https://openjdk.org/jeps/440',
      note: 'Deconstructing records in switch cases and instanceof patterns.',
    },
    {
      title: 'Java SE 21 API: MatchException',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/MatchException.html',
      note: 'Why an apparently exhaustive switch can still fail at runtime after a hierarchy change.',
    },
  ],
  sections: {
    problem:
      'An event processor handles `Created` and `Updated` events and has a `default` branch that returns the string `"ignore"`. A new `Deleted` event is added to the system. The event interface is open, so the new class compiles, and the switch still compiles because the default covers it.\n\nIn production, every deletion is silently ignored. The default was added to satisfy the compiler, but it made the switch total over all inputs rather than complete over the domain. The type system knew the set of events; the code threw that knowledge away with an open interface and a catch-all branch.',
    analogy: {
      title: 'The customs desk with a fixed set of lanes',
      body:
        'A border has one lane for each kind of vehicle it expects. When a new vehicle arrives, the driver must use the “anything else” lane, which waves them through without inspection. The manifest for that vehicle exists, but no lane was built for it.\n\nA sealed hierarchy is the fixed set of lanes. Every permitted vehicle has a lane, and adding a new vehicle forces the border to build a lane before the gate opens. A record is the standardized manifest: the vehicle’s data is visible and named, not hidden behind getters and mutable fields.',
      mapping: [
        {
          technical: 'A sealed interface and its permits clause',
          everyday: 'The fixed set of customs lanes',
        },
        {
          technical: 'A permitted record subtype',
          everyday: 'One kind of vehicle with a standard manifest',
        },
        {
          technical: 'An exhaustive switch',
          everyday: 'A checkpoint that handles every lane',
        },
        {
          technical: 'A default branch',
          everyday: 'The “anything else” lane that waves vehicles through',
        },
        {
          technical: 'Adding a new permitted subtype',
          everyday: 'A new vehicle that requires a new lane',
        },
      ],
      whereItBreaks:
        'A border can stop a vehicle at runtime and inspect it manually. The compiler stops the build before deployment, which is earlier and cheaper. The analogy also implies that the set of lanes is always closed; sealing is a deliberate design choice, and an open plugin system may genuinely need an extension point that this border does not have.',
    },
    mentalModel: {
      title: 'Sealing closes the set; the switch checks the set',
      figure: {
        width: 960,
        height: 420,
        caption:
          'A sealed Event permits three records. The exhaustive switch handles all three and has no default. Adding a fourth permitted type makes the switch fail to compile until it is handled.',
        alt: 'A diagram with a sealed Event interface above three record nodes: Created, Updated, and Deleted. The records point into an exhaustive switch with three cases and no default. A dashed new-type node is rejected by the permits clause and by the compiler, with an annotation explaining that the missing case becomes a build error instead of a runtime ignore.',
        nodes: [
          {
            id: 'event',
            label: 'sealed Event',
            detail: 'permits Created, Updated, Deleted',
            x: 344,
            y: 24,
            width: 272,
            height: 80,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'created',
            label: 'record Created',
            detail: 'id',
            x: 40,
            y: 156,
            width: 200,
            height: 76,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'updated',
            label: 'record Updated',
            detail: 'id',
            x: 344,
            y: 156,
            width: 200,
            height: 76,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'deleted',
            label: 'record Deleted',
            detail: 'id',
            x: 648,
            y: 156,
            width: 200,
            height: 76,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'switch',
            label: 'exhaustive switch',
            detail: 'three cases, no default',
            x: 272,
            y: 288,
            width: 344,
            height: 76,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'newtype',
            label: 'record Archived',
            detail: 'not permitted yet',
            x: 680,
            y: 288,
            width: 220,
            height: 76,
            shape: 'note',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'created',
            to: 'event',
            label: 'implements',
            kind: 'flow',
          },
          {
            from: 'updated',
            to: 'event',
            label: 'implements',
            kind: 'flow',
          },
          {
            from: 'deleted',
            to: 'event',
            label: 'implements',
            kind: 'flow',
          },
          {
            from: 'event',
            to: 'switch',
            label: 'every case',
            kind: 'depends',
          },
          {
            from: 'newtype',
            to: 'switch',
            label: 'compile error',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 40,
            y: 388,
            text: 'Permitted subtypes must be final, sealed, or non-sealed.',
          },
          {
            x: 344,
            y: 388,
            text: 'No default means a missing case is a build failure.',
          },
          {
            x: 680,
            y: 388,
            text: 'New case must be added to permits and to every switch.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Records and sealed types solve different halves of the same design. Records make each case a transparent value; sealing makes the set of cases closed enough for the compiler to check.',
      steps: [
        {
          title: 'A record names its data and generates the boilerplate',
          body:
            'A record declaration lists its components. The compiler creates a final class with a private final field for each component, a canonical constructor, an accessor named exactly like the component, and implementations of `equals`, `hashCode`, and `toString` derived from the components.\n\nThe record is transparent: its state is the component list, and callers can read it without a getter convention. That makes it a good fit for messages, results, coordinates, and other values whose meaning is the data itself. It is a poor fit for an entity with a hidden lifecycle or a mutable identity.',
          code: {
            filename: 'Point.java',
            language: 'java',
            code: `record Point(int x, int y) {}

final class Main {
    public static void main(String[] args) {
        Point a = new Point(3, 4);
        Point b = new Point(3, 4);
        System.out.println(a.x() + "," + a.y());
        System.out.println(a.equals(b));
        System.out.println(a.hashCode() == b.hashCode());
    }
}`,
            annotations: [
              {
                line: 1,
                note: 'The component list is the record’s state: two ints named x and y.',
              },
              {
                line: 5,
                note: 'The canonical constructor takes the components in declaration order.',
              },
              {
                line: 6,
                note: 'Accessors are named x() and y(), not getX() and getY().',
              },
              {
                line: 7,
                note: 'Generated equals compares the components, so two distinct points are equal by value.',
              },
              {
                line: 8,
                note: 'Generated hashCode uses the same components, so equal points share a hash.',
              },
            ],
            output: `3,4
true
true`,
          },
        },
        {
          title: 'The compact constructor validates before assignment',
          body:
            'A compact constructor has no parameter list and no explicit field assignments. Its parameters are the record components, and its body runs before the compiler-generated assignments. Reassigning a parameter changes the value that will be stored; this is how normalization works.\n\nThe body cannot assign the fields directly. It can throw, transform a parameter, or call a static factory. Use it for the invariant that every instance must satisfy, not for expensive work that can fail after the object is already visible.',
          code: {
            filename: 'Range.java',
            language: 'java',
            code: `record Range(int start, int end) {
    Range {
        if (start > end) {
            throw new IllegalArgumentException("start must not exceed end");
        }
    }
}`,
            annotations: [
              {
                line: 1,
                note: 'The record has two int components and a canonical constructor supplied by the compiler.',
              },
              {
                line: 2,
                note: 'The compact constructor declares only the record name; the parameters are implicit.',
              },
              {
                line: 3,
                note: 'Validation runs before the generated field assignments.',
              },
              {
                line: 4,
                note: 'Throwing here prevents an invalid Range from being constructed.',
              },
            ],
          },
        },
        {
          title: 'Sealing closes the set of subtypes',
          body:
            'A sealed interface or class declares a `permits` clause naming the types that may extend or implement it. Each permitted subtype must itself be `final`, `sealed`, or `non-sealed`. The restriction is checked at compile time and, for named modules, at run time as well.\n\nSealing does not make the subtypes immutable, and it does not make the hierarchy small. It makes the set of direct subtypes known. That is the property the compiler needs for exhaustiveness, and the property a reader needs to understand the domain. The cost is that extension outside the permitted set is no longer possible.',
          code: {
            filename: 'Shape.java',
            language: 'java',
            code: `sealed interface Shape permits Circle, Rectangle {}

record Circle(double radius) implements Shape {}

record Rectangle(double width, double height) implements Shape {}`,
            annotations: [
              {
                line: 1,
                note: 'The permits clause names every direct subtype of Shape.',
              },
              {
                line: 3,
                note: 'Circle is a final record, so it cannot be extended further.',
              },
              {
                line: 5,
                note: 'Rectangle is another permitted case with a different component list.',
              },
            ],
          },
        },
        {
          title: 'The compiler checks every case',
          body:
            'A switch over a sealed type is exhaustive when it covers every permitted subtype. The compiler knows the full set, so it can reject a missing case without a default. This is the difference between “the code compiles for the inputs I remembered” and “the code handles the domain.”\n\nA default branch is still required for a non-sealed type, and it can be useful for an open interface. Over a sealed type it is usually a mistake: it makes the switch total while hiding the case the compiler would have flagged. If a new subtype is added and the switch is not recompiled, the synthetic default throws `MatchException` at runtime; recompiling turns the omission into a compile-time error.',
          code: {
            filename: 'Area.java',
            language: 'java',
            code: `sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

final class Area {
    static double area(Shape shape) {
        return switch (shape) {
            case Circle(double radius) -> Math.PI * radius * radius;
            case Rectangle(double width, double height) -> width * height;
        };
    }
}`,
            annotations: [
              {
                line: 1,
                note: 'The sealed interface supplies the complete set of cases.',
              },
              {
                line: 7,
                note: 'The switch expression has no default because Shape is sealed.',
              },
              {
                line: 8,
                note: 'A record pattern deconstructs Circle into its radius component.',
              },
              {
                line: 9,
                note: 'The Rectangle pattern binds both components and computes the area.',
              },
            ],
          },
        },
        {
          title: 'Records are shallowly immutable',
          body:
            'The generated fields are final, but a component can point at a mutable list or object. A record with a `List` component is only shallowly immutable: the list reference cannot change, but the list contents can, and the generated accessor returns the same list.\n\nCopy mutable components in the compact constructor, as the language core’s immutable-value lesson described. If the elements are mutable, a shallow `List.copyOf` is not enough; copy the elements or use immutable element types. The record removes boilerplate, not the need to think about reachability.',
          code: {
            filename: 'Order.java',
            language: 'java',
            code: `import java.util.List;

record Order(List<String> lines) {
    Order {
        lines = List.copyOf(lines);
    }

    public static void main(String[] args) {
        java.util.ArrayList<String> input = new java.util.ArrayList<>(List.of("a"));
        Order order = new Order(input);
        input.add("b");
        System.out.println(order.lines().size());
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The component is a mutable List type, so the record alone does not guarantee immutability.',
              },
              {
                line: 5,
                note: 'The compact constructor replaces the parameter with an unmodifiable snapshot.',
              },
              {
                line: 6,
                note: 'List.copyOf copies the contents and rejects null elements.',
              },
              {
                line: 11,
                note: 'The caller keeps its original list and mutates it after construction.',
              },
              {
                line: 12,
                note: 'The record still reports one line, so the copy protected its state.',
              },
            ],
            output: `1`,
          },
        },
      ],
      outro:
        'A record is a transparent value; a sealed interface is a closed set of those values. Together they let the compiler check that every case is handled, while keeping each case’s data visible and simple.',
    },
    code: {
      intro:
        'The minimal example seals two payment forms and switches over them without a default. The realistic example adds validation to each record and computes area through an exhaustive switch.',
      minimal: {
        filename: 'Payment.java',
        language: 'java',
        code: `sealed interface Payment permits Card, Cash {}
record Card(String lastFour) implements Payment {}
record Cash(int cents) implements Payment {}
final class Main {
    static String describe(Payment payment) {
        return switch (payment) {
            case Card card -> "card ending " + card.lastFour();
            case Cash cash -> "cash " + cash.cents();
        };
    }
    public static void main(String[] args) {
        System.out.println(describe(new Card("4242")));
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The sealed interface closes the set of payment forms.',
          },
          {
            line: 2,
            note: 'Card is a permitted record case with one component.',
          },
          {
            line: 3,
            note: 'Cash is the other permitted case, with a different component type.',
          },
          {
            line: 7,
            note: 'The switch has a case for every permitted subtype and no default.',
          },
          {
            line: 13,
            note: 'The call dispatches to the Card case and prints its component.',
          },
        ],
        output: `card ending 4242`,
      },
      realistic: {
        filename: 'ShapeReport.java',
        language: 'java',
        code: `sealed interface Shape permits Circle, Rectangle {
    double area();
}
record Circle(double radius) implements Shape {
    Circle {
        if (radius <= 0) throw new IllegalArgumentException("radius must be positive");
    }
    public double area() { return Math.PI * radius * radius; }
}
record Rectangle(double width, double height) implements Shape {
    Rectangle {
        if (width <= 0 || height <= 0) throw new IllegalArgumentException("sides must be positive");
    }
    public double area() { return width * height; }
}
final class ShapeReport {
    static String describe(Shape shape) {
        return switch (shape) {
            case Circle circle -> "circle r=" + circle.radius();
            case Rectangle rectangle -> "rectangle " + rectangle.width() + "x" + rectangle.height();
        };
    }
    public static void main(String[] args) {
        Shape shape = new Circle(2);
        System.out.printf("%s area=%.2f%n", describe(shape), shape.area());
        System.out.println(describe(new Rectangle(3, 4)));
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The sealed interface declares the contract and closes the set of shapes.',
          },
          {
            line: 5,
            note: 'Circle validates its radius in a compact constructor before the field is assigned.',
          },
          {
            line: 11,
            note: 'Rectangle validates both sides independently of the switch.',
          },
          {
            line: 19,
            note: 'The switch handles every permitted shape and has no default branch.',
          },
          {
            line: 20,
            note: 'A type pattern binds the Circle so its component can be read.',
          },
          {
            line: 26,
            note: 'The area call dispatches through the interface to the record implementation.',
          },
        ],
        output: `circle r=2.0 area=12.57
rectangle 3.0x4.0`,
      },
    },
    breakIt: {
      title: 'The deletion that the default branch ignored',
      scenario:
        'An event processor handles `Created` and `Updated` events. The `Event` interface is open, and the switch has a `default` branch that returns `"ignore"`. A `Deleted` event is added and published by the write path. The processor compiles and runs, but every deletion is reported as ignored.',
      brokenCode: {
        filename: 'Handler.java',
        language: 'java',
        code: `interface Event {}
record Created(String id) implements Event {}
record Updated(String id) implements Event {}
record Deleted(String id) implements Event {}

final class Handler {
    static String handle(Event event) {
        return switch (event) {
            case Created created -> "create " + created.id();
            case Updated updated -> "update " + updated.id();
            default -> "ignore";
        };
    }
    public static void main(String[] args) {
        System.out.println(handle(new Created("a")));
        System.out.println(handle(new Deleted("b")));
    }
}`,
      },
      predictionPrompt:
        'The Deleted event exists and is published. What does the switch do with it, and why did the compiler not warn about the missing case?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `create a`, then `ignore`. The Deleted event is accepted by the Event parameter and silently handled by the default branch.',
        explanation:
          '`Event` is not sealed, so the compiler cannot know the complete set of implementations and requires a default (or an equivalent total pattern). The default makes the switch total over every possible Event, including future ones. That total behavior is not the same as a complete domain behavior: Deleted is a real case with its own meaning, but the default collapses it into “ignore.” No exception is thrown because the code is doing exactly what it says.',
        repair:
          'Seal Event and list every permitted subtype. Remove the default and add a case for each one. Adding a new event then fails to compile at every switch that has not handled it, which is the review signal you want. If the hierarchy must stay open, make the default fail loudly with an explicit unsupported-event error and a metric, rather than silently ignoring the value.',
        correctedCode: {
          filename: 'Handler.java',
          language: 'java',
          code: `sealed interface Event permits Created, Updated, Deleted {}
record Created(String id) implements Event {}
record Updated(String id) implements Event {}
record Deleted(String id) implements Event {}

final class Handler {
    static String handle(Event event) {
        return switch (event) {
            case Created created -> "create " + created.id();
            case Updated updated -> "update " + updated.id();
            case Deleted deleted -> "delete " + deleted.id();
        };
    }
    public static void main(String[] args) {
        System.out.println(handle(new Created("a")));
        System.out.println(handle(new Deleted("b")));
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated record and sealed-type code often stops at the syntax. The bugs live in shallow immutability, a default branch that hides a case, and assumptions about who may extend the hierarchy.',
      mistakes: [
        {
          title: 'Treating a record as deeply immutable',
          generatedPattern:
            '“It is a record with final components, so the value is immutable and safe to share.”',
          whyItFails:
            'A record component can be a mutable List, array, or domain object. The generated accessor returns that object, so a caller can change the record’s observable state. The record only freezes the references.',
          correction:
            'Copy mutable components in a compact constructor and decide whether accessors should return the internal immutable copy. If the elements are mutable, deep-copy or use immutable element types.',
          telltale:
            'A record component whose type is a mutable collection, array, Date, or a class with setters.',
        },
        {
          title: 'Adding default to an exhaustive switch',
          generatedPattern:
            '“The compiler wanted a default, so I added `default -> throw new IllegalStateException()`. That makes it exhaustive.”',
          whyItFails:
            'A default makes the switch total, but it also stops the compiler from telling you when a new permitted subtype is missing. The failure moves from build time to runtime, and the default may return a placeholder instead of failing at all.',
          correction:
            'Over a sealed type, list every permitted subtype and remove the default. Recompile the switch when a subtype is added; the compiler will point at every incomplete switch.',
          telltale:
            'A switch over a sealed type with a `default` branch, especially one that returns a neutral value such as “unknown” or “ignore.”',
        },
        {
          title: 'Assuming sealed means final or immutable',
          generatedPattern:
            '“The interface is sealed, so no one can add a subtype and the values cannot change.”',
          whyItFails:
            'Sealing restricts direct subtypes; it does not make them immutable, and a permitted subtype can itself be sealed or non-sealed. A non-sealed subtype can have further extensions. Sealing is about the set of cases, not about state.',
          correction:
            'Use records or immutable classes for the cases when you want immutable values. Choose final, sealed, or non-sealed deliberately for each permitted subtype, and document whether the hierarchy is closed at one level or all the way down.',
          telltale:
            'A sealed interface with a `non-sealed` implementation, or a sealed hierarchy whose cases still have setters.',
        },
        {
          title: 'Writing JavaBean getters for record components',
          generatedPattern:
            '“I added `getX()` and `getY()` methods so the record works with frameworks that expect getters.”',
          whyItFails:
            'Records already expose `x()` and `y()`. Adding bean-style getters duplicates the API, confuses callers about which accessor is canonical, and may still not satisfy a framework that requires a no-argument constructor and mutable properties.',
          correction:
            'Use the record accessors as the API. If a framework requires a JavaBean, use a separate adapter or a mutable class at that boundary instead of distorting the record.',
          telltale:
            'A record with `getX()` methods, a no-argument constructor, or setters added for a framework.',
        },
      ],
      reviewChecklist: [
        'Does every record with a mutable component copy it in the compact constructor?',
        'Does every switch over a sealed type list all permitted subtypes and omit the default?',
        'Is each permitted subtype final, sealed, or non-sealed deliberately?',
        'Does the code avoid bean-style getters and setters on records?',
        'If the hierarchy is open, does the default branch fail loudly instead of returning a neutral placeholder?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is looking for the trade-off: records remove boilerplate, sealed types close a domain, and both change what the compiler can prove.',
      questions: [
        {
          id: 'java.l2.records-sealed.interview.1',
          difficulty: 'junior',
          question: 'What does a record generate, and when would you use one?',
          modelAnswer:
            'A record generates a final class with a private final field for each component, a canonical constructor, accessors named after the components, and equals, hashCode, and toString derived from the components. I use one for a small transparent value whose meaning is its data, such as a point, a range, a result, or an event. I would not use one for an entity with a mutable lifecycle or a type that needs a hidden representation.',
          weakAnswer:
            'A record is a class with getters and setters. It saves boilerplate for DTOs.',
          strongAnswer:
            'A record is a transparent carrier: the component list is the state and the API. The generated equals and hashCode use the same components, so it is a good value type and a good map key when the components are immutable. It is final and cannot extend another class. It is not a JavaBean, and its fields are only shallowly immutable, so mutable components still need defensive copies.',
          followUp:
            'Why can a record not extend another class, and what can it still implement?',
        },
        {
          id: 'java.l2.records-sealed.interview.2',
          difficulty: 'mid',
          question:
            'How does a compact constructor work, and what does it not protect?',
          modelAnswer:
            'A compact constructor has no parameter list and no explicit field assignments. Its implicit parameters are the components, and its body runs before the generated assignments. It can validate, normalize by reassigning a parameter, or throw. It cannot assign the fields directly. It does not protect against mutable components: a record with a List still shares that list unless the constructor copies it and the accessor does not leak a mutable alias.',
          weakAnswer:
            'It is a shorter constructor. You put validation in it and the compiler fills in the assignments.',
          strongAnswer:
            'The compact constructor is the canonical constructor’s body before the implicit field writes. Reassigning a parameter changes what gets stored, which is useful for normalization. It runs once per construction, so it establishes the invariant but does not enforce it against later mutation of a referenced object. I would combine it with List.copyOf or immutable component types, and test that mutating the original argument cannot change the record.',
          followUp:
            'Can a compact constructor call another constructor with `this(...)`?',
        },
        {
          id: 'java.l2.records-sealed.interview.3',
          difficulty: 'senior',
          question:
            'What do sealed types buy you, what do they cost, and what happens when a new permitted subtype is added to a running system?',
          modelAnswer:
            'Sealed types give a closed, known set of direct subtypes. That enables exhaustive switches without a default, makes the domain readable, and turns a missing case into a compile-time error when the hierarchy changes. The cost is that extension is restricted: a permitted subtype must be final, sealed, or non-sealed, and external modules cannot add cases. If a new permitted subtype is added and a switch is not recompiled, the synthetic default can throw MatchException at runtime; recompiling the switch restores the compile-time check. Sealing is a good fit for a closed algebra, not for a plugin API that must accept implementations from other teams.',
          weakAnswer:
            'Sealed types are just final classes with a list. They make the code safer and faster.',
          strongAnswer:
            'The benefit is exhaustiveness and a closed domain; the cost is the loss of open extension and a new maintenance obligation at every switch. I would use them when the set of cases is genuinely under this codebase’s control and operations are added more often than cases. I would not use them for a public extension point. I would also consider binary compatibility: adding a permitted subtype can break an exhaustive switch that was compiled earlier, producing MatchException until the switch is rebuilt. That is a deployment concern, not just a language feature.',
          followUp:
            'How would you design a plugin system that needs both a closed core and third-party implementations?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a sealed result with exhaustive rendering',
      brief:
        'Write a sealed `Result` type with `Ok`, `Err`, and `Pending` record cases. Validate the payloads in compact constructors, then render every case with an exhaustive switch that has no default. Add a fourth case, `Cancelled`, and confirm that the renderer fails to compile until the new case is handled.',
      constraints: [
        'Use a sealed interface with a permits clause and three record implementations.',
        'Validate non-blank payloads in compact constructors; reject invalid values before construction.',
        'Write an exhaustive switch with a case for every permitted subtype and no default branch.',
        'Print one successful, one failed, and one pending result.',
        'Add a fourth permitted record and observe the compiler error before adding its case.',
        'Do not add bean-style getters or setters to the records.',
      ],
      starterCode: {
        filename: 'ResultView.java',
        language: 'java',
        code: `sealed interface Result permits Ok, Err, Pending {}
record Ok(String value) implements Result {}
record Err(String message) implements Result {}
record Pending(String operationId) implements Result {}

final class ResultView {
    static String describe(Result result) {
        // Add an exhaustive switch and return a description.
        return "";
    }

    public static void main(String[] args) {
        // Print the three cases and one validation failure.
    }
}`,
      },
      referenceSolution: {
        filename: 'ResultView.java',
        language: 'java',
        code: `sealed interface Result permits Ok, Err, Pending {}
record Ok(String value) implements Result {
    Ok {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("value must not be blank");
        }
    }
}
record Err(String message) implements Result {
    Err {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message must not be blank");
        }
    }
}
record Pending(String operationId) implements Result {
    Pending {
        if (operationId == null || operationId.isBlank()) {
            throw new IllegalArgumentException("operationId must not be blank");
        }
    }
}

final class ResultView {
    static String describe(Result result) {
        return switch (result) {
            case Ok ok -> "ok: " + ok.value();
            case Err err -> "error: " + err.message();
            case Pending pending -> "pending: " + pending.operationId();
        };
    }

    public static void main(String[] args) {
        System.out.println(describe(new Ok("saved")));
        System.out.println(describe(new Err("timeout")));
        System.out.println(describe(new Pending("op-1")));
        try {
            new Ok(" ");
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
        }
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The sealed interface closes the set of result cases.',
          },
          {
            line: 4,
            note: 'The compact constructor validates before the generated field assignment.',
          },
          {
            line: 10,
            note: 'A second case has its own invariant, independent of the renderer.',
          },
          {
            line: 31,
            note: 'The switch handles every permitted subtype and has no default.',
          },
          {
            line: 40,
            note: 'A blank value is rejected at construction, not at rendering time.',
          },
        ],
      },
      rubric: [
        {
          id: 'sealed-hierarchy',
          check: 'Is Result sealed with a permits clause and three record cases?',
          detail:
            'The closed set is what makes the switch exhaustiveness check possible.',
          mustPass: true,
        },
        {
          id: 'validated-cases',
          check: 'Do the compact constructors reject blank payloads before construction?',
          detail:
            'A record’s generated constructor does not add domain validation; the compact constructor is the place for it.',
          mustPass: true,
        },
        {
          id: 'exhaustive-no-default',
          check: 'Does the switch cover every permitted subtype without a default branch?',
          detail:
            'A default would make the switch total while hiding a future missing case.',
          mustPass: true,
        },
        {
          id: 'new-case-error',
          check: 'Does the answer show the compiler error after adding a fourth permitted case?',
          detail:
            'The error is the evidence that the design moved the omission from runtime to build time.',
          mustPass: false,
        },
        {
          id: 'output-evidence',
          check: 'Does the output show ok, error, pending, and the rejected blank value?',
          detail:
            'The four observations prove both the happy path and the invariant.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac ResultView.java` and `java ResultView`. Expect `ok: saved`, `error: timeout`, `pending: op-1`, and `value must not be blank`.',
        'Add `record Cancelled(String reason) implements Result {}` to the permits clause. Compile and confirm that the switch fails with “does not cover all possible input values.”',
        'Add the Cancelled case and recompile. Then add a default branch and explain what check the compiler stops performing.',
      ],
    },
    recap: [
      'A record is a final transparent carrier; the compiler generates the canonical constructor, accessors, equals, hashCode, and toString from the components.',
      'A compact constructor validates or normalizes before assignment, but records remain only shallowly immutable when components are mutable.',
      'A sealed type names its permitted subtypes, giving the compiler a closed set for exhaustiveness checks.',
      'An exhaustive switch over a sealed type needs no default; a default hides the missing case that sealing was meant to expose.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l2.records-sealed.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l2.record'],
      prompt: 'Which members does the compiler generate for a record?',
      options: [
        {
          id: 'canonical-accessors-equals',
          text: 'A canonical constructor, component-named accessors, equals, hashCode, and toString.',
        },
        {
          id: 'getters-setters',
          text: 'JavaBean getters and setters for every component.',
        },
        {
          id: 'no-arg-constructor',
          text: 'A public no-argument constructor and a clone method.',
        },
        {
          id: 'none',
          text: 'Nothing; every member must be written by hand.',
        },
      ],
      correctOptionId: 'canonical-accessors-equals',
      explanation:
        'A record generates the canonical constructor, accessors named after the components, and equals, hashCode, and toString derived from the component list. It does not generate bean-style getters or setters.',
    },
    {
      id: 'java.l2.records-sealed.recall.q2',
      type: 'predict-output',
      concepts: ['java.l2.sealed-type', 'java.l2.exhaustive-switch'],
      prompt: 'What does this program print?',
      code: `sealed interface Payment permits Card, Cash {}
record Card(String lastFour) implements Payment {}
record Cash(int cents) implements Payment {}
final class Main {
    static String describe(Payment payment) {
        return switch (payment) {
            case Card card -> "card ending " + card.lastFour();
            case Cash cash -> "cash " + cash.cents();
        };
    }
    public static void main(String[] args) {
        System.out.println(describe(new Card("4242")));
    }
}`,
      codeLanguage: 'java',
      expectedOutput: 'card ending 4242',
      explanation:
        'The switch is exhaustive over the sealed Payment type. The Card pattern binds the record and reads its lastFour component.',
    },
    {
      id: 'java.l2.records-sealed.recall.q3',
      type: 'explain',
      concepts: ['java.l2.exhaustive-switch', 'java.l2.sealed-type'],
      prompt:
        'Why does a default branch defeat the benefit of an exhaustive switch over a sealed type, and what should replace it?',
      keyPoints: [
        'A default makes the switch total for any input, so the compiler no longer reports a missing permitted subtype.',
        'The new case is then handled by the default, often silently, instead of forcing a decision.',
        'Removing the default lets the compiler reject an incomplete switch when a permitted subtype is added.',
        'If the hierarchy is genuinely open, the default should fail loudly or route to an explicit unknown case rather than return a neutral value.',
      ],
      modelAnswer:
        'Sealing gives the compiler a complete set of permitted subtypes. An exhaustive switch without a default is checked against that set, so adding a case produces a compile error at every switch that has not handled it. A default makes the switch accept every value, including a new subtype, so the compiler has nothing to report. The new case falls into the default and may be silently ignored. The replacement is to list every permitted case and omit the default. If the hierarchy must remain open, make the default an explicit failure with a metric, because the compiler cannot prove completeness.',
      explanation:
        'Strong answers distinguish “total over all inputs” from “complete over the domain,” and connect the default to where the failure moves.',
    },
  ],
});
