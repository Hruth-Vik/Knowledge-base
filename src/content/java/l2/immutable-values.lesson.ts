import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l2.immutable-values',
  language: 'java',
  levelId: 'java.l2',
  chapter: {
    id: 'object-boundaries',
    title: 'Encapsulation and Invariants',
  },
  sequence: 2,
  slug: 'immutable-values',
  title: 'The Booking That Changed After It Was Confirmed',
  deck: 'Final fields froze the references, not the dates. A helper mutated a confirmed booking through an accessor and the cancellation math went backwards.',
  kind: 'incident-story',
  estimatedMinutes: 16,
  tags: ['immutability', 'value-objects', 'defensive-copying', 'java-time', 'incident'],
  concepts: [
    {
      id: 'java.l2.immutability',
      title: 'Immutability',
      kind: 'principle',
      summary: [
        'An immutable object’s observable state cannot change after construction.',
        'Final fields are necessary but not sufficient: every referenced object must also be unable to change through the object.',
        'Immutable values can be shared freely because no caller can alter what another caller sees.',
      ],
      aliases: ['immutable object', 'frozen state', 'read-only value'],
      tags: ['java', 'design', 'correctness'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.defensive-copy',
        },
      ],
    },
    {
      id: 'java.l2.value-object',
      title: 'Value object',
      kind: 'term',
      summary: [
        'A value object is defined by its values, not by a unique identity or lifecycle.',
        'Two instances with the same components should be interchangeable and equal.',
        'Value objects are usually immutable, which makes them safe to share, cache, and use as map keys.',
      ],
      aliases: ['value type', 'immutable value', 'domain value'],
      tags: ['java', 'design', 'equality'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.equals-contract',
        },
        {
          type: 'contrasts-with',
          target: 'java.l1.reference-equality',
        },
      ],
    },
    {
      id: 'java.l2.shallow-copy-trap',
      title: 'Shallow immutability trap',
      kind: 'failure-mode',
      summary: [
        'A final field can point at a mutable object, so the holder’s state still changes when that object changes.',
        'Copying the reference into the field, or returning it from an accessor, preserves the alias.',
        'The object looks immutable at the field level while its observable value drifts.',
      ],
      aliases: ['shallow immutability', 'mutable component leak', 'final is not immutable'],
      tags: ['java', 'immutability', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.immutability',
        },
      ],
    },
  ],
  revisits: [
    'java.l2.defensive-copy',
    'java.l1.string-immutability',
    'java.l0.reference-value',
  ],
  versionCaveats: [
    'Examples target Java 21 LTS. java.util.Date is mutable and is used here only to make the aliasing visible; new code should prefer java.time types such as LocalDate and Instant.',
    'A record’s fields are final, but a record with a mutable component is only shallowly immutable. The records lesson revisits this constraint.',
    'Final field semantics also have a concurrency dimension covered later; this lesson is about aliasing and observable state, not safe publication.',
  ],
  references: [
    {
      title: 'Java SE 21 API: LocalDate',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html',
      note: 'A date without a time zone. Its methods return new instances instead of mutating the receiver.',
    },
    {
      title: 'Java SE 21 API: Date',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Date.html',
      note: 'The legacy mutable date type, including setTime, which changes the same object.',
    },
    {
      title: 'Java SE 21 API: List.copyOf',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection)',
      note: 'An unmodifiable snapshot that also rejects null elements.',
    },
  ],
  sections: {
    problem:
      'A booking service confirms a stay and stores a `BookingWindow` with a start and end date. The constructor checks that the start is before the end. Later, an admin helper extends a stay by calling `window.end().setTime(...)`. The object’s fields are `private final`, no setter exists, and the code still compiles.\n\nThe cancellation calculator then computes a negative number of nights, and the refund formula turns into a charge. The constructor’s check is not wrong; it ran once, in the past, against values that no longer describe the object. The booking did not become invalid because someone assigned a new date to the field. It became invalid because the field pointed at a date object that someone else could still change.',
    analogy: {
      title: 'The laminated contract with a whiteboard date',
      body:
        'A contract is laminated so nobody can cross out the terms. The date is written on a small whiteboard clipped to the contract, so it can be updated when a meeting moves. The signature page stays intact, but the effective date can be rewritten by anyone holding the marker.\n\nThe booking is the contract. The final field is the lamination. The mutable `Date` is the whiteboard. Immutability requires the date itself to be fixed, not just the clip that holds it.',
      mapping: [
        {
          technical: 'The final field holding a Date reference',
          everyday: 'The clip that holds the whiteboard',
        },
        {
          technical: 'The Date object and its setTime method',
          everyday: 'The whiteboard and the marker',
        },
        {
          technical: 'An accessor that returns the Date',
          everyday: 'Handing the marker to a visitor',
        },
        {
          technical: 'Constructor validation',
          everyday: 'Checking the date when the contract is signed',
        },
        {
          technical: 'Using LocalDate instead of Date',
          everyday: 'Printing the date into the laminated page',
        },
      ],
      whereItBreaks:
        'A whiteboard is visibly separate from the contract, and a visitor has to be given the marker. In Java, the accessor returns a reference silently, and the caller may already have the same object from the constructor argument. The analogy also implies that someone would notice the change; the object has no notification mechanism and no audit trail.',
    },
    mentalModel: {
      title: 'Final freezes the slot, not the object in it',
      figure: {
        width: 960,
        height: 400,
        caption:
          'The booking holds final references to two Date objects. Validation runs at construction, but the accessor returns an alias, so a helper can change the end date and invalidate the window.',
        alt: 'A diagram showing a BookingWindow with final start and end references pointing at two mutable Date objects. A constructor validation checks the order once. An admin helper receives the end Date through an accessor and changes its time, producing a negative night count. Annotations distinguish the frozen reference slot from the mutable date object.',
        nodes: [
          {
            id: 'booking',
            label: 'BookingWindow',
            detail: 'final start, final end',
            x: 24,
            y: 40,
            width: 204,
            height: 96,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'start',
            label: 'Date start',
            detail: 'mutable object',
            x: 292,
            y: 24,
            width: 180,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'end',
            label: 'Date end',
            detail: 'mutable object',
            x: 292,
            y: 148,
            width: 180,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'validation',
            label: 'constructor check',
            detail: 'start < end once',
            x: 540,
            y: 40,
            width: 180,
            height: 88,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'helper',
            label: 'shiftEnd()',
            detail: 'admin helper',
            x: 540,
            y: 196,
            width: 180,
            height: 88,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'state',
            label: 'nights = -2',
            detail: 'refund becomes a charge',
            x: 784,
            y: 196,
            width: 156,
            height: 88,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'booking',
            to: 'start',
            label: 'final ref',
            kind: 'flow',
          },
          {
            from: 'booking',
            to: 'end',
            label: 'final ref',
            kind: 'flow',
          },
          {
            from: 'booking',
            to: 'validation',
            label: 'runs once',
            kind: 'depends',
          },
          {
            from: 'helper',
            to: 'end',
            label: 'mutates',
            kind: 'flow',
          },
          {
            from: 'end',
            to: 'state',
            label: 'negative span',
            kind: 'flow',
          },
          {
            from: 'validation',
            to: 'state',
            label: 'no longer true',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 24,
            y: 352,
            text: 'The reference slot cannot be reassigned.',
          },
          {
            x: 292,
            y: 352,
            text: 'The Date object can still change.',
          },
          {
            x: 784,
            y: 352,
            text: 'The invariant was true only at construction.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Immutability is a property of the whole reachable value, not a keyword on a field. Start with the reference, then the object it points at, then the types you choose to put inside.',
      steps: [
        {
          title: 'final freezes the reference slot',
          body:
            'A `final` field can be assigned once, during construction. After that, the field always holds the same reference value. That guarantee is about the slot, not the object in the slot. If the reference points at a mutable `Date`, `setTime` changes the object while the field still points at it.\n\nThis is why a class can look immutable in a code review and still drift. The compiler enforces reassignment, but it does not enforce that the referenced object’s methods are read-only.',
          code: {
            filename: 'Stay.java',
            language: 'java',
            code: `import java.util.Date;

final class Stay {
    private final Date checkOut;

    Stay(Date checkOut) { this.checkOut = checkOut; }

    Date checkOut() { return checkOut; }

    public static void main(String[] args) {
        Stay stay = new Stay(new Date(2_000));
        stay.checkOut().setTime(500);
        System.out.println(stay.checkOut().getTime());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The field is final, so Stay cannot point it at a different Date after construction.',
              },
              {
                line: 7,
                note: 'The constructor stores the caller’s Date reference. The caller still has the same object.',
              },
              {
                line: 9,
                note: 'The accessor returns that same reference, giving every caller a mutation path.',
              },
              {
                line: 13,
                note: 'setTime changes the Date object in place. No Stay field was reassigned.',
              },
              {
                line: 14,
                note: 'The stay now reports a different check-out time than the one it was constructed with.',
              },
            ],
            output: `500`,
          },
        },
        {
          title: 'Copy at both boundaries',
          body:
            'A defensive copy breaks the alias. Copy on the way in so the caller cannot mutate the retained object, and copy on the way out so the caller cannot mutate the object through an accessor. For `Date`, the copy constructor that takes milliseconds or `clone()` produces an independent object with the same instant.\n\nCopying only on the way in is a common half-fix. The constructor protects the object from the original argument, but the getter hands out the internal reference and the caller can still change it. Copying only on the way out has the mirror problem: the caller’s original argument remains an alias.',
          code: {
            filename: 'Stay.java',
            language: 'java',
            code: `import java.util.Date;

final class Stay {
    private final Date checkOut;

    Stay(Date checkOut) {
        this.checkOut = new Date(checkOut.getTime());
    }

    Date checkOut() {
        return new Date(checkOut.getTime());
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The constructor reads the caller’s Date but stores a new Date with the same instant.',
              },
              {
                line: 7,
                note: 'A new object means later changes to the argument cannot reach the field.',
              },
              {
                line: 10,
                note: 'The accessor returns another new Date, so callers cannot mutate the field through the result.',
              },
              {
                line: 11,
                note: 'The copy has the same time value but a separate identity.',
              },
            ],
          },
        },
        {
          title: 'Prefer types that are already immutable',
          body:
            'The most reliable defensive copy is no copy at all. `java.time.LocalDate`, `LocalTime`, `Instant`, `String`, and the boxed primitive classes are immutable. Their methods return new instances, so storing and sharing them is safe by construction.\n\nReplacing `Date` with `LocalDate` removes the mutable-component problem rather than defending against it. It also makes the domain clearer: a hotel stay has calendar dates, not millisecond instants. The trade-off is a type migration at the boundary, especially if a framework or database driver still speaks `Date`.',
          code: {
            filename: 'Dates.java',
            language: 'java',
            code: `import java.time.LocalDate;

final class Dates {
    public static void main(String[] args) {
        LocalDate checkIn = LocalDate.of(2026, 3, 2);
        LocalDate nextDay = checkIn.plusDays(1);

        System.out.println(checkIn);
        System.out.println(nextDay);
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'LocalDate is immutable; this variable holds a value, not a mutable date object.',
              },
              {
                line: 6,
                note: 'plusDays returns a new LocalDate. It does not change checkIn.',
              },
              {
                line: 8,
                note: 'The original value is unchanged, which is what makes sharing safe.',
              },
              {
                line: 9,
                note: 'The new value is a separate immutable object.',
              },
            ],
            output: `2026-03-02
2026-03-03`,
          },
        },
        {
          title: 'A value object is defined by its values',
          body:
            'A value object has no meaningful identity apart from its components. Two `LocalDate` objects for the same day are interchangeable; neither is “the real” date. That is why value objects can be shared, cached, compared with `equals`, and used as hash keys without coordination.\n\nWhen you write your own, make the components final, implement `equals` and `hashCode` from those components, and avoid exposing mutable internals. The equality contract from the language core is what makes the object safe to use as a key; immutability is what keeps the key stable after insertion.',
          code: {
            filename: 'Money.java',
            language: 'java',
            code: `import java.util.Objects;

final class Money {
    private final String currency;
    private final long cents;

    Money(String currency, long cents) {
        this.currency = Objects.requireNonNull(currency, "currency");
        this.cents = cents;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Money money)) return false;
        return cents == money.cents && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(currency, cents);
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'Both components are final and immutable. The value cannot drift after construction.',
              },
              {
                line: 7,
                note: 'The constructor validates the non-null component and stores the values.',
              },
              {
                line: 14,
                note: 'Equality compares the components, not the object identity.',
              },
              {
                line: 15,
                note: 'A pattern match rejects null and unrelated types before narrowing.',
              },
              {
                line: 21,
                note: 'hashCode uses exactly the fields that equals compares, so equal values share a hash.',
              },
            ],
          },
        },
        {
          title: 'Immutability has costs and boundaries',
          body:
            'Immutable objects allocate on every change. A large document, a hot loop, or a deep object graph can make copying expensive. The design answer is not “make everything immutable”; it is to put immutable value objects at the boundaries where sharing and correctness matter, and keep large mutable structures behind a controlled owner.\n\nPersistence adds another boundary. A framework may expect a mutable entity with a no-argument constructor and setters. Keep that mutability inside the persistence layer, revalidate when loading, and expose immutable values to the rest of the application. The goal is a clear ownership rule, not a religious one.',
          code: {
            filename: 'Stay.java',
            language: 'java',
            code: `import java.time.LocalDate;
import java.util.Objects;

final class Stay {
    private final LocalDate checkIn;
    private final LocalDate checkOut;

    Stay(LocalDate checkIn, LocalDate checkOut) {
        this.checkIn = Objects.requireNonNull(checkIn, "checkIn");
        this.checkOut = Objects.requireNonNull(checkOut, "checkOut");
        if (!checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException("check-in must precede check-out");
        }
    }

    LocalDate checkIn() { return checkIn; }
    LocalDate checkOut() { return checkOut; }
}`,
            annotations: [
              {
                line: 5,
                note: 'Both components use an immutable type, so no defensive copy is required.',
              },
              {
                line: 9,
                note: 'The constructor rejects null before the date comparison.',
              },
              {
                line: 11,
                note: 'The invariant is established once, at the only point where the state can be set.',
              },
              {
                line: 16,
                note: 'Returning the fields is safe because LocalDate cannot be mutated.',
              },
            ],
          },
        },
      ],
      outro:
        'An immutable object fixes every reachable value, not just its field slots. Use immutable component types where possible, copy at both boundaries when a mutable type is unavoidable, and decide deliberately where a large mutable object is allowed to live.',
    },
    code: {
      intro:
        'The minimal example shows a final field leaking a mutable Date. The realistic example replaces it with an immutable LocalDate and validates the booking window.',
      minimal: {
        filename: 'Stay.java',
        language: 'java',
        code: `import java.util.Date;

final class Stay {
    private final Date checkOut;
    Stay(Date checkOut) { this.checkOut = checkOut; }

    Date checkOut() { return checkOut; }

    public static void main(String[] args) {
        Stay stay = new Stay(new Date(2_000));
        stay.checkOut().setTime(500);
        System.out.println(stay.checkOut().getTime());
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'The field is final, so the reference cannot be reassigned.',
          },
          {
            line: 5,
            note: 'The constructor stores the caller’s Date object, creating an alias.',
          },
          {
            line: 7,
            note: 'The accessor returns the same object, so the caller can mutate it.',
          },
          {
            line: 11,
            note: 'setTime changes the Date in place; no Stay method is involved.',
          },
          {
            line: 12,
            note: 'The Stay now observes a check-out time it never validated.',
          },
        ],
        output: `500`,
      },
      realistic: {
        filename: 'Stay.java',
        language: 'java',
        code: `import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

final class Stay {
    private final LocalDate checkIn;
    private final LocalDate checkOut;

    Stay(LocalDate checkIn, LocalDate checkOut) {
        this.checkIn = Objects.requireNonNull(checkIn, "checkIn");
        this.checkOut = Objects.requireNonNull(checkOut, "checkOut");
        if (!checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException("check-in must precede check-out");
        }
    }

    LocalDate checkIn() { return checkIn; }
    LocalDate checkOut() { return checkOut; }

    long nights() {
        return ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    public static void main(String[] args) {
        Stay stay = new Stay(LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 5));
        System.out.println(stay.nights());
        try {
            new Stay(LocalDate.of(2026, 3, 5), LocalDate.of(2026, 3, 2));
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
        }
    }
}`,
        annotations: [
          {
            line: 6,
            note: 'LocalDate is immutable, so storing and returning it requires no defensive copy.',
          },
          {
            line: 10,
            note: 'requireNonNull rejects a missing date before the comparison.',
          },
          {
            line: 12,
            note: 'The constructor establishes the ordering invariant for every instance.',
          },
          {
            line: 17,
            note: 'The accessor returns an immutable value, so the caller cannot change the stay.',
          },
          {
            line: 21,
            note: 'ChronoUnit.DAYS counts calendar days between the two dates.',
          },
          {
            line: 26,
            note: 'A valid stay reports three nights.',
          },
          {
            line: 28,
            note: 'The reversed range is rejected; the exception is part of the contract.',
          },
        ],
        output: `3
check-in must precede check-out`,
      },
    },
    breakIt: {
      title: 'The confirmed booking that moved backwards',
      scenario:
        'A booking tool confirms a three-night stay and passes it to the cancellation service. An admin helper extends the stay by shifting the end date through the accessor. The object was validated when it was created, but the helper changes the Date object in place. The cancellation calculator now sees an end date before the start date and produces a negative night count.',
      brokenCode: {
        filename: 'BookingWindow.java',
        language: 'java',
        code: `import java.util.Date;

final class BookingWindow {
    private final Date start;
    private final Date end;

    BookingWindow(Date start, Date end) {
        if (!start.before(end)) {
            throw new IllegalArgumentException("start must precede end");
        }
        this.start = start;
        this.end = end;
    }

    Date start() { return start; }
    Date end() { return end; }

    long nights() {
        return (end.getTime() - start.getTime()) / 86_400_000L;
    }

    public static void main(String[] args) {
        BookingWindow window = new BookingWindow(
            new Date(1_000_000_000_000L),
            new Date(1_000_000_000_000L + 3 * 86_400_000L));
        window.end().setTime(window.start().getTime() - 2 * 86_400_000L);
        System.out.println(window.nights());
    }
}`,
      },
      predictionPrompt:
        'The constructor checked the order of the dates. What does `nights()` return after the helper changes the end date, and which check should have caught it?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `-2`. No exception is thrown. The booking still has the same two Date references it was constructed with, but the end Date now represents an instant before the start.',
        explanation:
          'The constructor validated the objects it received. It then stored the same references, and the accessor returned the end reference to the admin helper. `setTime` changed that Date object in place. The final keyword prevents the field from pointing at a different Date, but it cannot make the Date’s millis immutable. The invariant “start is before end” was true at construction and false afterward. Nothing revalidates it because no Stay or BookingWindow method was called.',
        repair:
          'Use immutable date types such as LocalDate, or copy the Date on the way in and on the way out. If a stay can be extended, make that an operation on the booking that validates the new range and returns a new value or updates a controlled aggregate. Do not expose a mutable component and rely on callers to preserve the invariant. Add a test that mutates the original argument and the returned value, then confirms the booking is unchanged.',
        correctedCode: {
          filename: 'BookingWindow.java',
          language: 'java',
          code: `import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

final class BookingWindow {
    private final LocalDate start;
    private final LocalDate end;

    BookingWindow(LocalDate start, LocalDate end) {
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("start must precede end");
        }
        this.start = start;
        this.end = end;
    }

    LocalDate start() { return start; }
    LocalDate end() { return end; }

    long nights() {
        return ChronoUnit.DAYS.between(start, end);
    }

    BookingWindow extendTo(LocalDate newEnd) {
        return new BookingWindow(start, newEnd);
    }

    public static void main(String[] args) {
        BookingWindow window = new BookingWindow(
            LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 5));
        BookingWindow extended = window.extendTo(LocalDate.of(2026, 3, 8));
        System.out.println(window.nights());
        System.out.println(extended.nights());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated “immutable” classes usually freeze the fields and miss the objects those fields point at. Check the component types before accepting the claim.',
      mistakes: [
        {
          title: 'Treating final fields as immutability',
          generatedPattern:
            '“All fields are private final and there are no setters, so this class is immutable.”',
          whyItFails:
            'A final field can hold a mutable Date, array, or collection. The field cannot be reassigned, but its contents can change through the accessor or through an alias the caller kept.',
          correction:
            'Use immutable component types, or copy mutable components on the way in and out. State the copy policy in the class documentation and test it.',
          telltale:
            'A final field whose type is Date, an array, List, Set, Map, or another class with setters.',
        },
        {
          title: 'Assuming records are deeply immutable',
          generatedPattern:
            '“It is a record, so the compiler generated final fields and the value cannot change.”',
          whyItFails:
            'Record components are final references. A record with a mutable List component can still see the list change, and the generated accessor returns the same list. Records give shallow immutability, not a deep freeze.',
          correction:
            'Copy mutable components in a compact constructor and decide whether accessors should return the internal immutable copy or another copy. A record is a good carrier, not an automatic guarantee.',
          telltale:
            'A record component whose type is a mutable collection, array, Date, or mutable domain object.',
        },
        {
          title: 'Copying only on the way in',
          generatedPattern:
            '“The constructor copies the list, so callers cannot change the object after construction.”',
          whyItFails:
            'The accessor may still return the internal list. A caller can then add or remove elements through the getter, so the copy protected one boundary and left the other open.',
          correction:
            'Copy on the way in when retaining a mutable argument and on the way out when returning a mutable value, or return an unmodifiable snapshot.',
          telltale:
            'The constructor has a copy but the getter returns the field directly.',
        },
        {
          title: 'Using an unmodifiable wrapper as a deep freeze',
          generatedPattern:
            '“The list is wrapped with `Collections.unmodifiableList`, so the value is immutable.”',
          whyItFails:
            'The wrapper blocks writes through the wrapper, but the backing list can still change. If the original list is reachable, the “immutable” object’s contents change without any write to the object.',
          correction:
            'Copy the collection and store the copy, or never let the backing collection escape. If the component elements are mutable, copy them too or use immutable element types.',
          telltale:
            'An unmodifiable wrapper created around a collection that is also a constructor argument, a field, or another accessor’s return value.',
        },
      ],
      reviewChecklist: [
        'Does every field use an immutable type, or is every mutable component copied on the way in and out?',
        'Can a caller mutate the object through a returned reference?',
        'Do accessors return a snapshot rather than a live mutable component?',
        'Does the test mutate the original constructor argument and the returned value, then recheck the object?',
        'Is the copy deep enough for the elements, not just the container?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is testing whether “immutable” means final fields to you or “no reachable mutation” to you.',
      questions: [
        {
          id: 'java.l2.immutable-values.interview.1',
          difficulty: 'junior',
          question: 'What makes a class immutable in Java?',
          modelAnswer:
            'An immutable class has no way for a caller to change its observable state after construction. That usually means private final fields, no setters, and constructors that validate and copy mutable inputs. It also means accessors must not return mutable internal objects, and the class must not let `this` escape during construction. Final fields alone are not enough if a field points at a mutable Date or collection.',
          weakAnswer:
            'Make every field private final and do not add setters. Then the object cannot change.',
          strongAnswer:
            'I define immutability by reachable state, not syntax. Every field is final, every referenced component is either immutable or defensively copied, and no accessor leaks a mutable alias. I also consider subclassing: a non-final class can add mutable state or override behavior, so many value classes are final. The test is simple: after construction, no caller action can change what another caller observes.',
          followUp:
            'Does a class with a final `List` field and no setters qualify?',
        },
        {
          id: 'java.l2.immutable-values.interview.2',
          difficulty: 'mid',
          question:
            'A record has a `List<String>` component. Is it immutable? What would you change?',
          modelAnswer:
            'Only shallowly. The generated field is final, so the record cannot point at a different list, but the list contents can change and the generated accessor returns the same list. A caller can add or remove elements. In a compact constructor I would store `List.copyOf(guests)`, which creates an unmodifiable snapshot. Returning that stored list is then safe because it cannot be mutated. If the elements were mutable, I would need to copy or freeze them too.',
          weakAnswer:
            'Yes. Record components are final and records do not have setters, so the value is immutable.',
          strongAnswer:
            'The record gives me a final reference, not a frozen collection. I would copy the list in the compact constructor, reject nulls if the domain requires it, and make the accessor return the immutable copy. I would also check whether the element type is mutable. A record is a transparent carrier; it does not add deep-copy behavior to its components.',
          followUp:
            'What is the difference between `List.copyOf` and `Collections.unmodifiableList` in this constructor?',
        },
        {
          id: 'java.l2.immutable-values.interview.3',
          difficulty: 'senior',
          question:
            'When is immutability too expensive, and how would you decide where to stop copying?',
          modelAnswer:
            'Immutability costs allocation and copying, especially for large graphs or high-frequency updates. I would not freeze an entire document model on every keystroke. I would put immutable value objects at API and domain boundaries, keep large mutable working state behind one owner, and use persistent or copy-on-write structures where sharing makes updates cheap. I would measure allocation and latency rather than assume. The decision is about ownership: who is allowed to mutate, and which boundaries need snapshot isolation.',
          weakAnswer:
            'Immutability is always better. Copy everything; the garbage collector will handle it.',
          strongAnswer:
            'The trade-off is copy cost versus aliasing risk. Small values, identifiers, money, dates, and messages are cheap to copy and dangerous to share mutably. Large buffers and documents may need a controlled mutable owner or a persistent data structure. I would define the boundary where data becomes shared, make that boundary immutable, and keep the hot path mutable inside one component. Then I would test the boundary rather than rely on discipline.',
          followUp:
            'How would you design a large configuration object that changes rarely but is read on every request?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a stay that cannot be changed after confirmation',
      brief:
        'Write a `Stay` value type with a check-in date, a check-out date, and a list of guest names. The constructor must reject a missing or reversed date range and must copy the guest list so later changes to the caller’s list cannot alter the stay. Provide `nights()` and a guest-count accessor. Then prove that mutating the original list and the returned list cannot change the confirmed stay.',
      constraints: [
        'Use `LocalDate` for both dates and keep every field private final.',
        'Reject null dates, a null guest list, an empty guest list, and a check-out that is not after check-in.',
        'Copy the guest list at construction with `List.copyOf`.',
        'Do not expose a mutable list or a setter.',
        'Print the night count and guest count, then try to mutate the original list and the returned list.',
        'Keep the output honest: show the exception messages for invalid constructions.',
      ],
      starterCode: {
        filename: 'Stay.java',
        language: 'java',
        code: `import java.time.LocalDate;
import java.util.List;

final class Stay {
    // Add fields, a validating constructor, accessors, and nights().

    public static void main(String[] args) {
        // Build a valid stay and prove the copies hold.
    }
}`,
      },
      referenceSolution: {
        filename: 'Stay.java',
        language: 'java',
        code: `import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

final class Stay {
    private final LocalDate checkIn;
    private final LocalDate checkOut;
    private final List<String> guests;

    Stay(LocalDate checkIn, LocalDate checkOut, List<String> guests) {
        this.checkIn = Objects.requireNonNull(checkIn, "checkIn");
        this.checkOut = Objects.requireNonNull(checkOut, "checkOut");
        if (!checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException("check-in must precede check-out");
        }
        this.guests = List.copyOf(Objects.requireNonNull(guests, "guests"));
        if (this.guests.isEmpty()) {
            throw new IllegalArgumentException("at least one guest is required");
        }
    }

    LocalDate checkIn() { return checkIn; }
    LocalDate checkOut() { return checkOut; }

    long nights() {
        return ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    int guestCount() {
        return guests.size();
    }

    List<String> guests() {
        return guests;
    }

    public static void main(String[] args) {
        List<String> original = new java.util.ArrayList<>(List.of("ana", "bo"));
        Stay stay = new Stay(
            LocalDate.of(2026, 3, 2),
            LocalDate.of(2026, 3, 5),
            original);

        original.add("cleo");
        System.out.println("nights=" + stay.nights());
        System.out.println("guests=" + stay.guestCount());

        try {
            new Stay(LocalDate.of(2026, 3, 5), LocalDate.of(2026, 3, 2), original);
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
        }

        try {
            stay.guests().add("drew");
        } catch (UnsupportedOperationException error) {
            System.out.println("guest list is read-only");
        }
    }
}`,
        annotations: [
          {
            line: 14,
            note: 'The constructor validates the date ordering before the object becomes usable.',
          },
          {
            line: 17,
            note: 'List.copyOf creates an unmodifiable snapshot, so the caller’s later add cannot reach the stay.',
          },
          {
            line: 18,
            note: 'The empty-list rule is part of the invariant, not a presentation concern.',
          },
          {
            line: 26,
            note: 'The night count is derived from immutable dates and cannot drift.',
          },
          {
            line: 45,
            note: 'Mutating the original list after construction does not change the confirmed stay.',
          },
          {
            line: 56,
            note: 'The copied list rejects mutation through the accessor as well.',
          },
        ],
      },
      rubric: [
        {
          id: 'copy-on-construction',
          check: 'Does the constructor copy the guest list with List.copyOf or an equivalent independent snapshot?',
          detail:
            'Without the copy, the caller’s list remains an alias and the stay can change after confirmation.',
          mustPass: true,
        },
        {
          id: 'validated-range',
          check: 'Does the constructor reject null, empty, and reversed date ranges?',
          detail:
            'The invariant has to hold for every instance, not only for the happy path used in the demo.',
          mustPass: true,
        },
        {
          id: 'no-mutable-leak',
          check: 'Do all accessors return immutable values or safe copies?',
          detail:
            'A read-only value is the point of the exercise; returning a mutable list would reopen the incident.',
          mustPass: true,
        },
        {
          id: 'evidence',
          check: 'Does the output show the night count, guest count, rejected range, and read-only list?',
          detail:
            'The output should prove the boundary instead of merely claiming it.',
          mustPass: false,
        },
        {
          id: 'documented-tradeoff',
          check: 'Does the answer name one place where copying would be too expensive and explain the boundary?',
          detail:
            'Immutability is a design choice with costs; a strong answer knows where the value-object boundary ends.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Stay.java` and `java Stay`. Expect `nights=3`, `guests=2`, the reversed-range message, and the read-only list message.',
        'Remove `List.copyOf` and store the argument directly. Rerun and confirm that the guest count becomes three after the caller mutates the original list.',
        'Replace the constructor copy with `Collections.unmodifiableList(guests)`. Explain why the caller’s later `add` can still be visible through the view.',
      ],
    },
    recap: [
      'A final field freezes the reference slot, not the object the reference points at.',
      'Copy mutable components on the way in and on the way out, or use immutable component types and skip the copy.',
      'A value object is defined by its values; immutability keeps those values stable enough to share, cache, and use as keys.',
      'Immutability has allocation and copying costs, so place immutable values at boundaries instead of freezing every large structure.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l2.immutable-values.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l2.immutability', 'java.l2.shallow-copy-trap'],
      prompt:
        'A class has `private final Date deadline` and no setter. Which statement is true?',
      options: [
        {
          id: 'reference-fixed-object-mutable',
          text: 'The field cannot point at a different Date, but the Date object can still be changed through an accessor.',
        },
        {
          id: 'fully-immutable',
          text: 'The class is immutable because the field is private and final.',
        },
        {
          id: 'cannot-observe',
          text: 'Callers cannot observe a change to the Date because the reference is final.',
        },
        {
          id: 'compile-error',
          text: 'The code does not compile unless Date is also final.',
        },
      ],
      correctOptionId: 'reference-fixed-object-mutable',
      explanation:
        'Final prevents reassignment of the field. It does not make the referenced Date immutable. If an accessor returns the Date, callers can call `setTime` and change what the object observes.',
    },
    {
      id: 'java.l2.immutable-values.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l2.shallow-copy-trap', 'java.l2.defensive-copy'],
      prompt:
        'The stay validates its date range, but a caller can still make the range invalid after construction. Which line returns the alias?',
      code: `import java.util.Date;

final class Stay {
    private final Date checkIn;
    private final Date checkOut;

    Stay(Date in, Date out) {
        if (!in.before(out)) throw new IllegalArgumentException("bad range");
        checkIn = in;
        checkOut = out;
    }

    Date checkOut() { return checkOut; }
}`,
      codeLanguage: 'java',
      bugLine: 13,
      bugSummary:
        'The accessor returns the internal mutable Date, so a caller can change the check-out time after validation.',
      explanation:
        'The constructor also stores the caller’s Date references, so there are two aliases. The accessor is the direct path to the field’s object. Copy on the way in and out, or replace Date with LocalDate.',
    },
    {
      id: 'java.l2.immutable-values.recall.q3',
      type: 'explain',
      concepts: ['java.l2.immutability', 'java.l2.value-object'],
      prompt:
        'Explain the difference between a final field and an immutable object, using a mutable component as the example.',
      keyPoints: [
        'A final field can be assigned once, so the reference value cannot change after construction.',
        'The object the field points at can still be mutable, so its state can change through any alias.',
        'Immutability requires every reachable component to be immutable or defensively copied.',
        'Value objects should be safe to share; a mutable component breaks that guarantee even when the field is final.',
      ],
      modelAnswer:
        'A final field is a promise about the slot: the class will not assign a different reference to it after construction. It says nothing about the object in the slot. If the field holds a Date, a caller with the same reference can call setTime and change the value the field observes. The class is not immutable because its observable state changed. To make it immutable, use an immutable type such as LocalDate, or copy the Date on the way in and on the way out so no caller shares the internal object.',
      explanation:
        'Strong answers distinguish reassignment from mutation and then connect the distinction to sharing and value semantics.',
    },
  ],
});
