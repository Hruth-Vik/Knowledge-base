import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l2.composition-over-inheritance',
  language: 'java',
  levelId: 'java.l2',
  chapter: {
    id: 'type-relationships',
    title: 'Types, Inheritance, and Dispatch',
  },
  sequence: 3,
  slug: 'composition-over-inheritance',
  title: 'The Base Class That Called a Method Too Early',
  deck: 'The subclass was supposed to add a rate. The superclass constructor called an overridable method before the field existed, and validation saw zero.',
  kind: 'standard',
  estimatedMinutes: 17,
  tags: ['inheritance', 'composition', 'constructors', 'liskov', 'design'],
  concepts: [
    {
      id: 'java.l2.inheritance',
      title: 'Inheritance',
      kind: 'term',
      summary: [
        'Inheritance makes one class a subtype of another and lets it reuse accessible state and behavior.',
        'Overriding changes behavior through the same method signature, but the subclass remains coupled to the superclass’s implementation.',
        'A superclass must be designed for extension; otherwise a subclass can depend on details that later change.',
      ],
      aliases: ['extends', 'subclassing', 'is-a relationship'],
      tags: ['java', 'types', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.encapsulation',
        },
        {
          type: 'commonly-confused-with',
          target: 'java.l2.composition',
        },
      ],
    },
    {
      id: 'java.l2.composition',
      title: 'Composition',
      kind: 'principle',
      summary: [
        'Composition gives an object a collaborator and delegates work to it instead of inheriting its implementation.',
        'The collaborator can be replaced at construction time or at runtime, so behavior varies without a new subclass.',
        'Composition makes the dependency explicit and keeps the object’s public type independent of the reused code.',
      ],
      aliases: ['has-a relationship', 'delegation', 'strategy object'],
      tags: ['java', 'design', 'objects'],
      relations: [
        {
          type: 'contrasts-with',
          target: 'java.l2.inheritance',
        },
      ],
    },
    {
      id: 'java.l2.fragile-base-class',
      title: 'Fragile base class',
      kind: 'failure-mode',
      summary: [
        'A subclass can depend on the superclass’s self-use, method order, or protected state.',
        'A later superclass change can then break subclasses that were never recompiled or reviewed.',
        'Calling an overridable method from a constructor is a sharp version of the same coupling.',
      ],
      aliases: ['fragile superclass', 'constructor dispatch bug', 'inheritance coupling'],
      tags: ['java', 'inheritance', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.inheritance',
        },
      ],
    },
    {
      id: 'java.l2.liskov-substitution',
      title: 'Liskov substitution',
      kind: 'principle',
      summary: [
        'A subtype must be usable anywhere its supertype is expected without surprising the caller.',
        'It must honor the supertype’s behavioral contract, not merely its method signatures.',
        'Throwing an unsupported operation or weakening a postcondition breaks substitutability even when the code compiles.',
      ],
      aliases: ['LSP', 'behavioral subtyping', 'substitutability'],
      tags: ['java', 'types', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.inheritance',
        },
        {
          type: 'depends-on',
          target: 'java.l1.equals-contract',
        },
      ],
    },
  ],
  revisits: [
    'java.l2.encapsulation',
    'java.l2.object-invariant',
    'java.l1.equals-contract',
  ],
  versionCaveats: [
    'Examples target Java 21 LTS. The order of superclass construction, instance initializers, and subclass constructor bodies is specified by the Java Language Specification, not left to a particular JVM.',
    'The minimal constructor-dispatch example assigns `rate` in the constructor instead of at its declaration. A `private final int rate = 2` initializer is a constant variable and can be inlined, which would print `fee=200` and hide the partially initialized state.',
    'Default methods in interfaces add another form of behavior inheritance. The lesson uses classes so the constructor and override rules stay visible.',
    'Records and sealed types make some inheritance decisions explicit, but they do not remove the need to choose between a subtype and a collaborator.',
  ],
  references: [
    {
      title: 'Java Language Specification: Creation of class instances',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5',
      note: 'The order in which superclass constructors, instance initializers, and constructor bodies run.',
    },
    {
      title: 'Java Language Specification: Overriding and hiding',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8',
      note: 'What makes a method an override, including return-type substitutability.',
    },
    {
      title: 'Java SE 21 API: UnsupportedOperationException',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/UnsupportedOperationException.html',
      note: 'The exception that often signals an interface method a subtype cannot honestly implement.',
    },
  ],
  sections: {
    problem:
      'A reporting library has an abstract `Report` class. Its constructor stores the title and calls `validate()` so no invalid report can exist. A `SummaryReport` subclass overrides `validate()` to check its row limit. The limit is assigned in the subclass constructor, after `super()` returns. The first call therefore sees the default value zero and throws on a perfectly valid report.\n\nThe code compiles. The subclass is a reasonable is-a relationship. The failure comes from a hidden call order: the superclass constructor runs while the subclass is only partially initialized, but virtual dispatch already selects the subclass override. The base class asked the subclass a question before the subclass had finished being built.',
    analogy: {
      title: 'The inspector who arrives during the foundation',
      body:
        'A builder has a general inspection checklist. Each project customizes the checklist with its own room requirements. The inspector arrives on the first day, while only the foundation exists, and runs the customized checklist. The “three bedrooms” check fails because the bedrooms have not been built yet. The inspector followed the process correctly; the process ran the custom check at the wrong time.\n\nA constructor that calls an overridable method is that inspector. The base class is running a check supplied by a subclass whose state has not been initialized. The check is real, but its inputs are not.',
      mapping: [
        {
          technical: 'The superclass constructor',
          everyday: 'The inspector arriving on the first day',
        },
        {
          technical: 'The overridable validate method',
          everyday: 'The customized inspection checklist',
        },
        {
          technical: 'The subclass override',
          everyday: 'The project-specific room requirements',
        },
        {
          technical: 'Subclass fields assigned after super()',
          everyday: 'Rooms that are built after the foundation',
        },
        {
          technical: 'Default field values during construction',
          everyday: 'Empty rooms counted before they exist',
        },
      ],
      whereItBreaks:
        'A building inspector can come back tomorrow; a constructor runs once. A subclass override is not a separate inspector with its own copy of the checklist; it runs on the same partially constructed object. The analogy also suggests that the failure is visible to the builder. In Java, the constructor may complete without an exception and leave an object whose later behavior contradicts the validation.',
    },
    mentalModel: {
      title: 'Construction runs before the subclass exists',
      figure: {
        width: 960,
        height: 420,
        caption:
          'The superclass constructor runs first and calls validate. Virtual dispatch selects the subclass override, but the subclass field is still zero, so validation rejects a valid report.',
        alt: 'A vertical sequence showing allocation, the Report superclass constructor, a virtual validate call that dispatches to SummaryReport, the subclass field assignment, and the subclass constructor body. The validate call happens before the maxRows assignment and throws, so the later steps are never reached.',
        nodes: [
          {
            id: 'allocate',
            label: 'new SummaryReport',
            detail: 'object allocated, fields default',
            x: 24,
            y: 24,
            width: 220,
            height: 76,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'super',
            label: 'Report constructor',
            detail: 'stores title, calls validate',
            x: 24,
            y: 124,
            width: 220,
            height: 76,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'dispatch',
            label: 'validate() dispatch',
            detail: 'runtime type is SummaryReport',
            x: 292,
            y: 124,
            width: 220,
            height: 76,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'override',
            label: 'SummaryReport.validate',
            detail: 'reads maxRows',
            x: 560,
            y: 124,
            width: 200,
            height: 76,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'zero',
            label: 'maxRows = 0',
            detail: 'field initializer not run',
            x: 808,
            y: 124,
            width: 128,
            height: 76,
            shape: 'note',
            tone: 'warning',
          },
          {
            id: 'assign',
            label: 'maxRows = 10',
            detail: 'subclass constructor body',
            x: 24,
            y: 260,
            width: 220,
            height: 76,
            shape: 'box',
            tone: 'muted',
          },
          {
            id: 'throw',
            label: 'IllegalArgumentException',
            detail: 'valid report rejected',
            x: 560,
            y: 260,
            width: 200,
            height: 76,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'allocate',
            to: 'super',
            label: 'then',
            kind: 'flow',
          },
          {
            from: 'super',
            to: 'dispatch',
            label: 'calls',
            kind: 'flow',
          },
          {
            from: 'dispatch',
            to: 'override',
            label: 'virtual call',
            kind: 'flow',
          },
          {
            from: 'override',
            to: 'zero',
            label: 'reads',
            kind: 'flow',
          },
          {
            from: 'zero',
            to: 'throw',
            label: 'fails check',
            kind: 'flow',
          },
          {
            from: 'assign',
            to: 'throw',
            label: 'never reached',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 24,
            y: 376,
            text: 'The superclass runs before subclass field initializers.',
          },
          {
            x: 560,
            y: 376,
            text: 'The override sees 0, not the intended 10.',
          },
          {
            x: 808,
            y: 376,
            text: 'The object is valid in design but not yet initialized.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'The bug is not “inheritance is bad.” It is a specific order: allocation, superclass construction, then subclass initialization. Virtual dispatch is already active during that first step.',
      steps: [
        {
          title: 'Construction runs from the superclass down',
          body:
            'When a subclass instance is created, the JVM allocates the object and gives its fields their default values. It then runs the superclass constructor before the subclass’s instance initializers and constructor body. Each level of the hierarchy gets its turn, and the subclass fields are not assigned until their level is reached.\n\nThis order is why a superclass constructor cannot assume that subclass fields are initialized. The object exists, but only the superclass’s part of it is ready. A method called from the superclass constructor can still see the subclass’s default values.',
          code: {
            filename: 'Ledger.java',
            language: 'java',
            code: `class Ledger {
    Ledger() { System.out.println("base:" + value()); }
    int value() { return 1; }
}

class Child extends Ledger {
    private final int factor;

    Child() {
        factor = 10;
        System.out.println("child:" + value());
    }

    @Override int value() { return factor; }

    public static void main(String[] args) {
        new Child();
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'The superclass constructor calls value before the subclass constructor body runs.',
              },
              {
                line: 10,
                note: 'factor is assigned only after the implicit super() call returns.',
              },
              {
                line: 11,
                note: 'This is the first point where the subclass field holds its intended value.',
              },
              {
                line: 14,
                note: 'The override reads factor, which is still zero during the superclass constructor.',
              },
              {
                line: 17,
                note: 'The first print reports 0; the second reports 10.',
              },
            ],
            output: `base:0
child:10`,
          },
        },
        {
          title: 'Virtual dispatch is already active',
          body:
            'Java instance methods are dispatched by the receiver’s runtime class. During the superclass constructor, the receiver is still the subclass object, so an overridable call selects the subclass override. The compiler does not insert a “not constructed yet” guard.\n\nThis is specified language behavior, not a JVM bug. It is also why constructors should avoid calling overridable methods, publishing `this`, or starting threads. The object may be observed before its invariants are established.',
          code: {
            filename: 'Publication.java',
            language: 'java',
            code: `import java.util.ArrayList;
import java.util.List;

class Registry {
    static final List<String> NAMES = new ArrayList<>();

    Registry(String name) {
        NAMES.add(name);
        System.out.println("registered " + name);
    }

    static void print() {
        System.out.println(NAMES);
    }
}

class NamedRegistry extends Registry {
    private final String suffix;

    NamedRegistry() {
        super("service");
        suffix = "-v2";
    }

    @Override public String toString() { return "registry" + suffix; }
}`,
            annotations: [
              {
                line: 8,
                note: 'The constructor publishes a reference to the object before the subclass is initialized.',
              },
              {
                line: 9,
                note: 'Other code can now observe or use the partially constructed object.',
              },
              {
                line: 19,
                note: 'suffix is still null when the superclass publishes the object.',
              },
              {
                line: 23,
                note: 'A caller that sees the object before this point may read a null suffix.',
              },
            ],
          },
        },
        {
          title: 'A fragile base class depends on its own call graph',
          body:
            'A subclass can override a method that the superclass calls internally. The superclass author may later add a new internal call, change the order, or introduce a new helper that also uses the overridden method. The subclass’s assumptions about when its override runs can silently become false.\n\nThis is the fragile base class problem. It is not limited to constructors. Method self-use, protected fields, and “call this hook” designs all create coupling between the base class’s implementation and every subclass. If the base class is not designed and documented for extension, composition is usually the safer way to reuse behavior.',
          code: {
            filename: 'Counter.java',
            language: 'java',
            code: `import java.util.List;

class Counter {
    private int total;

    void add(String item) {
        total++;
    }

    void addAll(List<String> items) {
        for (String item : items) {
            add(item);
        }
    }

    int total() { return total; }
}

class AuditedCounter extends Counter {
    private int auditRows;

    @Override
    void add(String item) {
        auditRows++;
        super.add(item);
    }

    @Override
    void addAll(List<String> items) {
        auditRows++;
        super.addAll(items);
    }

    public static void main(String[] args) {
        AuditedCounter counter = new AuditedCounter();
        counter.addAll(List.of("a", "b"));
        System.out.println(counter.total());
        System.out.println(counter.auditRows);
    }
}`,
            annotations: [
              {
                line: 10,
                note: 'The base class implements addAll in terms of add, a self-use detail subclasses can observe.',
              },
              {
                line: 21,
                note: 'The override counts one audit row for the batch call.',
              },
              {
                line: 28,
                note: 'The override also counts one row for every element, then delegates.',
              },
              {
                line: 30,
                note: 'The base method calls add for each item, so the audit count is now three.',
              },
              {
                line: 37,
                note: 'The total is correct, but the audit count reflects the base class’s internal loop.',
              },
            ],
            output: `2
3`,
          },
        },
        {
          title: 'Liskov substitution is behavioral, not syntactic',
          body:
            'A subtype must honor the supertype’s contract. If an interface promises that `refund` works, an implementation that always throws `UnsupportedOperationException` is not a valid substitute, even though it compiles. Callers written against the interface have no way to know that one implementation is a trap.\n\nThe contract includes preconditions, postconditions, invariants, and the history of the object. A subtype may accept more, return a narrower result, or add behavior, but it must not require more from callers or produce a weaker guarantee. This is also why an `equals` implementation in a subclass must preserve symmetry and transitivity; the language core’s equality contract is a behavioral contract too.',
          code: {
            filename: 'PaymentMethod.java',
            language: 'java',
            code: `interface PaymentMethod {
    void pay(long cents);
    void refund(long cents);
}

final class CardPayment implements PaymentMethod {
    public void pay(long cents) { System.out.println("card pay " + cents); }
    public void refund(long cents) { System.out.println("card refund " + cents); }
}

final class StoreCredit implements PaymentMethod {
    public void pay(long cents) { System.out.println("credit pay " + cents); }
    public void refund(long cents) {
        throw new UnsupportedOperationException("credit cannot be refunded");
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The interface promises both operations to every caller.',
              },
              {
                line: 7,
                note: 'CardPayment honors both promises.',
              },
              {
                line: 13,
                note: 'StoreCredit accepts the type but cannot honor the refund contract.',
              },
              {
                line: 15,
                note: 'The method exists syntactically, but callers cannot rely on it.',
              },
            ],
          },
        },
        {
          title: 'Composition makes the variation explicit',
          body:
            'Composition replaces “is a specialized base” with “has a collaborator that provides this behavior.” The object’s type stays stable, the collaborator is injected, and a new variation is a new implementation rather than a new subclass. The price is one more object and an explicit delegation call.\n\nUse inheritance when the subtype genuinely satisfies the supertype’s contract and the superclass is designed for extension. Use composition when you want to reuse behavior, combine capabilities, or vary a policy independently of the object’s identity. The decision is about the relationship, not about which keyword produces less code.',
          code: {
            filename: 'Checkout.java',
            language: 'java',
            code: `interface DiscountPolicy {
    long discountCents(long subtotalCents);
}

final class NoDiscount implements DiscountPolicy {
    public long discountCents(long subtotalCents) { return 0; }
}

final class MemberDiscount implements DiscountPolicy {
    private final int percent;

    MemberDiscount(int percent) { this.percent = percent; }

    public long discountCents(long subtotalCents) {
        return subtotalCents * percent / 100;
    }
}

final class Checkout {
    private final DiscountPolicy discountPolicy;

    Checkout(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    long total(long subtotalCents) {
        return subtotalCents - discountPolicy.discountCents(subtotalCents);
    }

    public static void main(String[] args) {
        Checkout guest = new Checkout(new NoDiscount());
        Checkout member = new Checkout(new MemberDiscount(10));
        System.out.println(guest.total(2500));
        System.out.println(member.total(2500));
    }
}`,
            annotations: [
              {
                line: 1,
                note: 'The variation is a behavior contract, not a subtype of Checkout.',
              },
              {
                line: 13,
                note: 'A policy holds only the state it needs for its calculation.',
              },
              {
                line: 22,
                note: 'Checkout has a policy; it does not inherit from one.',
              },
              {
                line: 28,
                note: 'The total delegates the discount decision to the injected policy.',
              },
              {
                line: 33,
                note: 'A new policy changes behavior without editing Checkout or creating a subclass.',
              },
            ],
            output: `2500
2250`,
          },
        },
      ],
      outro:
        'Inheritance is a subtype relationship with a behavioral contract. Composition is a collaboration with an implementation. Choose the one that describes the relationship you actually need, and never let a constructor ask a subclass for state it has not initialized yet.',
    },
    code: {
      intro:
        'The minimal example shows the constructor calling an override before the subclass field is assigned. The realistic example replaces the subclass hierarchy with an injected policy.',
      minimal: {
        filename: 'Ledger.java',
        language: 'java',
        code: `class Ledger {
    Ledger() { System.out.println("fee=" + openingFee()); }
    int openingFee() { return 100; }
}
class PremiumLedger extends Ledger {
    private final int rate;
    PremiumLedger() { rate = 2; }
    @Override int openingFee() { return 100 * rate; }
    public static void main(String[] args) {
        new PremiumLedger();
    }
}`,
        annotations: [
          {
            line: 2,
            note: 'The superclass constructor calls an overridable method during construction.',
          },
          {
            line: 6,
            note: 'rate is assigned in the subclass constructor, after super() returns.',
          },
          {
            line: 7,
            note: 'The subclass constructor body runs only after the base constructor finishes.',
          },
          {
            line: 8,
            note: 'During the base constructor, this override reads rate as its default value 0.',
          },
          {
            line: 10,
            note: 'The printed fee is 0, not the intended 200.',
          },
        ],
        output: `fee=0`,
      },
      realistic: {
        filename: 'Checkout.java',
        language: 'java',
        code: `interface DiscountPolicy {
    long discountCents(long subtotalCents);
}

final class NoDiscount implements DiscountPolicy {
    public long discountCents(long subtotalCents) { return 0; }
}

final class MemberDiscount implements DiscountPolicy {
    private final int percent;

    MemberDiscount(int percent) { this.percent = percent; }

    public long discountCents(long subtotalCents) {
        return subtotalCents * percent / 100;
    }
}

final class Checkout {
    private final DiscountPolicy discountPolicy;

    Checkout(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    long total(long subtotalCents) {
        return subtotalCents - discountPolicy.discountCents(subtotalCents);
    }

    public static void main(String[] args) {
        Checkout guest = new Checkout(new NoDiscount());
        Checkout member = new Checkout(new MemberDiscount(10));
        System.out.println(guest.total(2500));
        System.out.println(member.total(2500));
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The policy interface names the behavior that varies, not a new kind of checkout.',
          },
          {
            line: 6,
            note: 'NoDiscount is a complete, substitutable policy with no unsupported operations.',
          },
          {
            line: 17,
            note: 'MemberDiscount holds only the percentage it needs.',
          },
          {
            line: 25,
            note: 'Checkout depends on the abstraction and receives it through the constructor.',
          },
          {
            line: 31,
            note: 'The total is computed by delegation, so a new policy needs no change here.',
          },
          {
            line: 34,
            note: 'The same Checkout code handles both policies; the result differs by behavior, not type.',
          },
        ],
        output: `2500
2250`,
      },
    },
    breakIt: {
      title: 'The report that failed before its limit existed',
      scenario:
        'A reporting service has a `Report` base class that validates itself in the constructor. A `SummaryReport` subclass overrides `validate()` to require a positive row limit. The limit is passed to the subclass constructor, which calls `super(title)` before assigning it. Creating a valid report with a limit of ten throws an exception instead.',
      brokenCode: {
        filename: 'SummaryReport.java',
        language: 'java',
        code: `class Report {
    private final String title;

    Report(String title) {
        this.title = title;
        validate();
    }

    void validate() {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title required");
        }
    }

    String render() { return title.toUpperCase(); }
}

class SummaryReport extends Report {
    private final int maxRows;

    SummaryReport(String title, int maxRows) {
        super(title);
        this.maxRows = maxRows;
    }

    @Override void validate() {
        if (maxRows <= 0) {
            throw new IllegalArgumentException("maxRows must be positive");
        }
    }

    public static void main(String[] args) {
        System.out.println(new SummaryReport("Weekly", 10).render());
    }
}`,
      },
      predictionPrompt:
        'The report is created with a positive limit. Which validate method runs first, what value does it see, and why does the valid construction fail?',
      failureKind: 'runtime',
      reveal: {
        observed:
          'The program throws `java.lang.IllegalArgumentException: maxRows must be positive`. The stack trace shows `SummaryReport.validate` called from `Report.<init>`. The subclass constructor body never runs.',
        explanation:
          '`Report`’s constructor calls `validate()` before `SummaryReport` assigns `maxRows`. Because instance methods are dispatched by the receiver’s runtime class, the call selects `SummaryReport.validate`. At that moment `maxRows` still has its default value, 0, so the override rejects the report. The base class’s validation hook is reasonable in isolation; calling it from the constructor is what makes the subclass’s state unavailable. This is a fragile base class bug expressed through construction order.',
        repair:
          'Do not call overridable methods from a constructor. Validate the arguments the superclass owns inside the superclass constructor, then validate the subclass’s own fields after they are assigned. Better, remove the inheritance relationship: have `Report` hold a validation policy or a `Summary` value object, and validate the fully built value before use. If the hierarchy remains, make the base class’s constructor final in effect by keeping its validation private and exposing a static factory that validates the completed object.',
        correctedCode: {
          filename: 'SummaryReport.java',
          language: 'java',
          code: `class Report {
    private final String title;

    Report(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title required");
        }
        this.title = title;
    }

    String render() { return title.toUpperCase(); }
}

final class SummaryReport extends Report {
    private final int maxRows;

    SummaryReport(String title, int maxRows) {
        super(title);
        if (maxRows <= 0) {
            throw new IllegalArgumentException("maxRows must be positive");
        }
        this.maxRows = maxRows;
    }

    public static void main(String[] args) {
        System.out.println(new SummaryReport("Weekly", 10).render());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated design advice often turns “prefer composition” into a rule and “extends” into a shortcut. Both miss the question: what relationship is being modeled?',
      mistakes: [
        {
          title: 'Subclassing to reuse code',
          generatedPattern:
            '“I need the logging and retry methods from `BaseService`, so `OrderService extends BaseService`.”',
          whyItFails:
            'The subclass inherits the base class’s state, lifecycle, and contract even though the relationship is not an is-a. Callers can pass `OrderService` anywhere `BaseService` is expected, and a base change can break the order logic.',
          correction:
            'Extract the reusable behavior into a collaborator and delegate to it, or use a small interface for the capability. Keep inheritance for a genuine subtype that honors the supertype’s contract.',
          telltale:
            'An `extends` clause where the subclass cannot be used meaningfully through the supertype, or where every public method is inherited rather than modeled.',
        },
        {
          title: 'Calling an overridable method from a constructor',
          generatedPattern:
            '“The constructor calls `validate()`/`init()`/`onCreated()` so subclasses can customize setup.”',
          whyItFails:
            'The override runs before the subclass’s fields are initialized and before its constructor body. It can read default values, publish a partially constructed object, or throw on valid input.',
          correction:
            'Validate only the state the constructor owns. Use a static factory or a separate `start()` method for hooks that need a completed object, and document that callers must invoke it.',
          telltale:
            'A constructor calls a non-private, non-final method, especially one named `init`, `validate`, `configure`, or `onCreated`.',
        },
        {
          title: 'Using UnsupportedOperationException to satisfy an interface',
          generatedPattern:
            '“`ReadOnlyList` implements `List` and throws on `add`, `remove`, and `clear`. It is still a List.”',
          whyItFails:
            'Callers written against `List` are allowed to call those methods. A subtype that always throws is not substitutable; the failure appears at runtime and depends on which implementation was injected.',
          correction:
            'Split the interface into the capabilities that are actually guaranteed, or model the read-only value with an immutable type that does not expose mutation methods. Do not implement a contract you cannot honor.',
          telltale:
            'A method body that is only `throw new UnsupportedOperationException()` in a class that claims the interface.',
        },
        {
          title: 'Treating “prefer composition” as “never inherit”',
          generatedPattern:
            '“Composition is always better, so I replaced the subtype with a wrapper that delegates every method.”',
          whyItFails:
            'A wrapper that forwards an entire interface can preserve the type but lose the subtype contract, add boilerplate, and make polymorphism harder to see. Some relationships genuinely are is-a, especially closed domain hierarchies and framework extension points.',
          correction:
            'Choose inheritance for a genuine behavioral subtype with a superclass designed for extension; choose composition for behavior reuse, policy variation, and multiple capabilities. Name the relationship before choosing the keyword.',
          telltale:
            'A class implements an interface only by delegating every call to another object with no added meaning, or a codebase bans `extends` outright.',
        },
      ],
      reviewChecklist: [
        'Does the subclass satisfy the supertype’s behavioral contract, or only its method signatures?',
        'Does any constructor call an overridable method or publish this?',
        'Is the superclass designed for extension, with documented self-use and protected state?',
        'Would composition express the variation with less coupling?',
        'Does a test through the supertype pass for every implementation?',
      ],
    },
    interviewCorner: {
      intro:
        'The interview is about design judgment, not a slogan. Strong answers name the relationship, the contract, and the failure mode.',
      questions: [
        {
          id: 'java.l2.composition-over-inheritance.interview.1',
          difficulty: 'junior',
          question: 'When should you use inheritance, and when should you use composition?',
          modelAnswer:
            'Use inheritance when the subclass genuinely is a subtype of the superclass and can honor its contract everywhere the superclass is used. Use composition when you want to reuse behavior, vary a policy, or combine capabilities without claiming a subtype relationship. Composition is usually safer for code reuse because the collaborator is explicit and replaceable. Inheritance is appropriate for a stable, designed-for-extension hierarchy, but it couples the subclass to the superclass’s implementation.',
          weakAnswer:
            'Always use composition. Inheritance is bad because it creates tight coupling.',
          strongAnswer:
            'I start by naming the relationship. If a caller should be able to treat the new type as the old type, inheritance or an interface may be right. If the new type merely uses the old behavior, composition is clearer. I also check whether the superclass is designed for extension, whether the subclass can satisfy the behavioral contract, and whether a superclass change would break subclasses. “Prefer composition” is a default, not a prohibition.',
          followUp:
            'What would make you choose an abstract class over an interface?',
        },
        {
          id: 'java.l2.composition-over-inheritance.interview.2',
          difficulty: 'mid',
          question:
            'Why is calling an overridable method from a constructor dangerous? Walk through what happens.',
          modelAnswer:
            'The superclass constructor runs before the subclass’s field initializers and constructor body. If it calls an overridable method, dynamic dispatch selects the subclass override. That override can read subclass fields that still hold default values, publish the object before it is initialized, or throw based on incomplete state. The object is partially constructed but already reachable through the method call. The fix is to keep constructor work limited to the superclass’s own state, validate subclass fields after they are assigned, or use a factory that validates the completed object.',
          weakAnswer:
            'It causes a compile error because the subclass is not initialized yet.',
          strongAnswer:
            'It is legal Java and fails at runtime, which is why it survives review. The receiver’s runtime class is already the subclass, so virtual dispatch does not wait for the subclass constructor. I would look for calls to `init`, `validate`, `onCreated`, and any non-final instance method in a constructor. I would also check whether `this` is passed to a listener or executor during construction, because that is the same partial-publication problem.',
          followUp:
            'How would you design a validation hook that subclasses can customize safely?',
        },
        {
          id: 'java.l2.composition-over-inheritance.interview.3',
          difficulty: 'senior',
          question:
            'How do you test whether a subclass is a valid Liskov substitute, and what would you do if it is not?',
          modelAnswer:
            'I would write tests against the supertype, not the concrete subclass, and run them for every implementation. The tests should cover the contract: preconditions, postconditions, invariants, exceptions, and the history rule. I would include edge cases such as empty input, duplicate calls, and operations that one implementation might want to reject. If a subtype cannot honor the contract, I would split the interface, model the capability explicitly, or use composition instead of inheritance. I would not leave an `UnsupportedOperationException` for a caller to discover in production.',
          weakAnswer:
            'If the subclass compiles and the methods have the same signatures, it is a valid substitute.',
          strongAnswer:
            'Substitutability is behavioral. I would look for strengthened preconditions, weakened postconditions, changed exception behavior, and mutable state that breaks invariants across calls. I would test through the base type and check that the subclass does not require the caller to know its concrete class. If the hierarchy is wrong, the fix is a model change, not a better comment. Composition or a smaller interface is usually clearer than a subtype that refuses part of its contract.',
          followUp:
            'What is the history rule, and how does it affect a mutable subtype?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Refactor a checkout hierarchy into a policy',
      brief:
        'The starter code uses an abstract `Checkout` with a protected `discount` method and two subclasses. Refactor it so `Checkout` is final and holds a `DiscountPolicy`. Implement guest, member, and seasonal policies. Adding a new policy must not require editing `Checkout`. Then show that the same checkout code produces different totals through the interface.',
      constraints: [
        'Make `Checkout` final and inject a `DiscountPolicy` through its constructor.',
        'Do not use `instanceof`, a type switch, or a subclass of `Checkout` to choose the discount.',
        'Implement at least three policies: no discount, a percentage member discount, and a seasonal fixed discount.',
        'Keep the policy contract small and make every implementation honor it.',
        'Print the total for each policy through the same `Checkout` type.',
        'Write one sentence explaining why the policy is a collaborator rather than a subtype of Checkout.',
      ],
      starterCode: {
        filename: 'Checkout.java',
        language: 'java',
        code: `abstract class Checkout {
    protected abstract long discount(long subtotalCents);

    long total(long subtotalCents) {
        return subtotalCents - discount(subtotalCents);
    }
}

final class GuestCheckout extends Checkout {
    protected long discount(long subtotalCents) { return 0; }
}

final class MemberCheckout extends Checkout {
    protected long discount(long subtotalCents) { return subtotalCents / 10; }
}`,
      },
      referenceSolution: {
        filename: 'Checkout.java',
        language: 'java',
        code: `interface DiscountPolicy {
    long discountCents(long subtotalCents);
}

final class NoDiscount implements DiscountPolicy {
    public long discountCents(long subtotalCents) { return 0; }
}

final class MemberDiscount implements DiscountPolicy {
    private final int percent;

    MemberDiscount(int percent) { this.percent = percent; }

    public long discountCents(long subtotalCents) {
        return subtotalCents * percent / 100;
    }
}

final class SeasonalDiscount implements DiscountPolicy {
    private final long flatCents;

    SeasonalDiscount(long flatCents) { this.flatCents = flatCents; }

    public long discountCents(long subtotalCents) {
        return Math.min(flatCents, subtotalCents);
    }
}

final class Checkout {
    private final DiscountPolicy discountPolicy;

    Checkout(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    long total(long subtotalCents) {
        return subtotalCents - discountPolicy.discountCents(subtotalCents);
    }

    public static void main(String[] args) {
        Checkout guest = new Checkout(new NoDiscount());
        Checkout member = new Checkout(new MemberDiscount(10));
        Checkout seasonal = new Checkout(new SeasonalDiscount(500));
        System.out.println(guest.total(2500));
        System.out.println(member.total(2500));
        System.out.println(seasonal.total(2500));
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The policy interface models the behavior that varies, not a kind of checkout.',
          },
          {
            line: 20,
            note: 'The seasonal policy caps the discount at the subtotal, so it cannot produce a negative total.',
          },
          {
            line: 27,
            note: 'Checkout is final and depends only on the policy abstraction.',
          },
          {
            line: 33,
            note: 'Delegation replaces the protected hook and the subclass hierarchy.',
          },
          {
            line: 40,
            note: 'The same Checkout type works with every policy; adding one requires no edit here.',
          },
        ],
      },
      rubric: [
        {
          id: 'final-checkout',
          check: 'Is Checkout final with an injected DiscountPolicy?',
          detail:
            'The refactor should remove the inheritance-based variation point, not recreate it behind a different name.',
          mustPass: true,
        },
        {
          id: 'no-type-dispatch',
          check: 'Does the solution avoid instanceof, type switches, and Checkout subclasses?',
          detail:
            'Choosing behavior by type keeps the variation closed and defeats the purpose of the policy abstraction.',
          mustPass: true,
        },
        {
          id: 'policy-contract',
          check: 'Do all three policies honor the same contract, including the seasonal cap?',
          detail:
            'A policy that can return a discount larger than the subtotal breaks the checkout total.',
          mustPass: true,
        },
        {
          id: 'same-type-evidence',
          check: 'Are all totals printed through the same Checkout type?',
          detail:
            'The output should demonstrate substitutability rather than three unrelated calculations.',
          mustPass: false,
        },
        {
          id: 'design-rationale',
          check: 'Does the answer explain why the policy is a collaborator rather than a Checkout subtype?',
          detail:
            'The point is the relationship, not the mechanical extraction of an interface.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Checkout.java` and `java Checkout`. Expect `2500`, `2250`, and `2000`.',
        'Add a `HolidayDiscount` policy without editing `Checkout`. Confirm that the new total is produced by the same `total` method.',
        'Temporarily add an `instanceof` chain to `Checkout.total`. Explain which design property was lost and why a new policy now edits the checkout.',
      ],
    },
    recap: [
      'Inheritance is a subtype relationship with a behavioral contract, not a mechanism for borrowing code.',
      'A superclass constructor runs before subclass fields and constructor bodies, but virtual dispatch already selects subclass overrides.',
      'A fragile base class couples subclasses to self-use and call order; composition makes the collaborator explicit and replaceable.',
      'Liskov substitution is behavioral: a subtype that throws an unsupported operation is not a valid substitute, even if it compiles.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l2.composition-over-inheritance.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l2.inheritance', 'java.l2.fragile-base-class'],
      prompt:
        'Why is a superclass constructor a risky place to call an overridable validation method?',
      options: [
        {
          id: 'subclass-uninitialized',
          text: 'The override runs before the subclass’s fields and constructor body are initialized.',
        },
        {
          id: 'compile-error',
          text: 'Java forbids virtual calls from constructors, so the program will not compile.',
        },
        {
          id: 'superclass-final',
          text: 'The superclass is always final during construction, so the override cannot run.',
        },
        {
          id: 'garbage-collected',
          text: 'The subclass object may be garbage-collected before validation finishes.',
        },
      ],
      correctOptionId: 'subclass-uninitialized',
      explanation:
        'Construction runs from the superclass down. A virtual call from the superclass constructor selects the subclass override, but the subclass fields still hold default values and its constructor body has not run.',
    },
    {
      id: 'java.l2.composition-over-inheritance.recall.q2',
      type: 'predict-output',
      concepts: ['java.l2.fragile-base-class', 'java.l2.inheritance'],
      prompt: 'What does this program print?',
      code: `class Ledger {
    Ledger() { System.out.println("fee=" + openingFee()); }
    int openingFee() { return 100; }
}

class PremiumLedger extends Ledger {
    private final int rate;

    PremiumLedger() {
        rate = 2;
    }

    @Override int openingFee() { return 100 * rate; }

    public static void main(String[] args) {
        new PremiumLedger();
    }
}`,
      codeLanguage: 'java',
      expectedOutput: 'fee=0',
      explanation:
        'The superclass constructor calls openingFee before PremiumLedger assigns rate. The override reads rate as 0, so the fee is 0. The intended value 2 is assigned only after super() returns.',
    },
    {
      id: 'java.l2.composition-over-inheritance.recall.q3',
      type: 'explain',
      concepts: ['java.l2.composition', 'java.l2.liskov-substitution'],
      prompt:
        'Explain why a subtype that throws UnsupportedOperationException for an interface method violates Liskov substitution, and how composition or a smaller interface can repair the design.',
      keyPoints: [
        'A caller holding the supertype is entitled to use every method in its contract.',
        'A subtype that always throws makes a valid caller fail based on the implementation it received.',
        'The subtype must honor preconditions, postconditions, invariants, and expected exceptions, not just the method signature.',
        'Split the interface into the capabilities that are actually guaranteed, or use composition to supply only the behavior the object supports.',
      ],
      modelAnswer:
        'Liskov substitution says a subtype must be usable wherever the supertype is expected. If the interface promises a refund method, a caller can call refund without knowing the concrete type. A subtype that always throws UnsupportedOperationException breaks that promise, so the caller cannot treat all implementations uniformly. The repair is to model the contract honestly: split the interface into payable and refundable capabilities, or use composition so an object holds only the collaborators it actually supports. A method that exists only to throw is a design signal, not an implementation detail.',
      explanation:
        'Strong answers connect the runtime failure to the caller’s contract and propose a model change rather than a try/catch around the unsupported call.',
    },
  ],
});
