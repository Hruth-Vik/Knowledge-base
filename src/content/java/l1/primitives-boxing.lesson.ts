import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.primitives-boxing',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'text-and-numbers',
    title: 'Text and Numbers',
  },
  sequence: 3,
  slug: 'primitives-boxing',
  title: 'The Null That Was a Primitive',
  deck: 'Boxing lets an int travel as an object. It also lets null crash an addition and makes == mean something different.',
  kind: 'standard',
  estimatedMinutes: 15,
  tags: ['primitives', 'boxing', 'null', 'numeric-promotion', 'collections'],
  concepts: [
    {
      id: 'java.l1.primitive-types',
      title: 'Primitive types',
      kind: 'term',
      summary: [
        'A primitive variable stores a value directly and has no null state.',
        'Each type has a fixed width and range; char is an unsigned 16-bit code unit.',
        'Fields receive defaults, but local variables must be definitely assigned.',
      ],
      aliases: ['primitive values', 'int long char', 'value types'],
      tags: ['java', 'types'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.binary-representation',
        },
      ],
    },
    {
      id: 'java.l1.autoboxing',
      title: 'Autoboxing and unboxing',
      kind: 'mechanism',
      summary: [
        'The compiler converts a primitive to a wrapper with valueOf and back with intValue.',
        'Small wrapper values are cached, so == can be true for some equal values and false for others.',
        'Unboxing null throws NullPointerException at the point of use.',
      ],
      aliases: ['boxing', 'wrapper cache', 'Integer cache'],
      tags: ['java', 'types', 'collections'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.primitive-types',
        },
        {
          type: 'depends-on',
          target: 'java.l1.reference-equality',
        },
      ],
    },
    {
      id: 'java.l1.numeric-promotion',
      title: 'Numeric promotion',
      kind: 'mechanism',
      summary: [
        'byte, short, and char operands are promoted to int in most arithmetic.',
        'Integer division truncates toward zero; the remainder keeps the dividend’s sign.',
        'Compound assignment performs an implicit narrowing cast back to the left type.',
      ],
      aliases: ['binary numeric promotion', 'int division', 'implicit cast'],
      tags: ['java', 'numbers'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.primitive-types',
        },
      ],
    },
  ],
  revisits: ['java.l0.binary-representation', 'java.l1.reference-equality', 'java.l1.equals-contract'],
  versionCaveats: [
    'Examples target Java 21 LTS. The language requires wrapper caching for boolean, byte, char in the ASCII range, and short/integer values from −128 to 127; a JVM may cache a wider range, so do not use == for value equality.',
    'Wrapper classes are final and immutable. A wrapper reference can be null even though the corresponding primitive cannot.',
  ],
  references: [
    {
      title: 'Java Language Specification: Boxing Conversion',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.7',
      note: 'The required wrapper cache ranges and the valueOf conversions.',
    },
    {
      title: 'Java Language Specification: Numeric Promotion',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.6',
      note: 'How operands are widened before arithmetic and how integer division behaves.',
    },
    {
      title: 'Java SE 21 API: Integer',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html',
      note: 'The wrapper API, parsing, comparison, and the valueOf cache contract.',
    },
  ],
  sections: {
    problem:
      'A request handler looks up a count in a map and adds one. The key is missing, `get` returns null, and the addition throws `NullPointerException` on a line that says nothing about null. A test asserts that two `Integer` values are equal with `==`; it passes for 127 and fails for 1000. An average is computed with integer division and silently loses its fraction.\n\nThe common thread is the boundary between a primitive value and a wrapper object. The compiler inserts conversions that look invisible, but they introduce nullability, identity, and narrowing. Knowing exactly where those conversions happen turns three surprising bugs into three predictable rules.',
    analogy: {
      title: 'Contents and parcels',
      body:
        'A primitive is the contents themselves: a number with no wrapper and no empty state. A wrapper is a parcel that can hold one value. Generic collections and APIs that require objects need parcels, so the compiler packs a primitive when it crosses that boundary and opens the parcel when a primitive is needed again.\n\nSmall parcels are kept on a shelf and reused. Two labels for the same shelf parcel can compare equal by identity. A missing parcel is null; opening it to get the contents fails immediately.',
      mapping: [
        {
          technical: 'A primitive int',
          everyday: 'The number itself, with no packaging',
        },
        {
          technical: 'An Integer wrapper',
          everyday: 'A parcel containing one number',
        },
        {
          technical: 'Autoboxing',
          everyday: 'Packing the number into a parcel',
        },
        {
          technical: 'Unboxing',
          everyday: 'Opening the parcel to use the number',
        },
        {
          technical: 'The Integer cache',
          everyday: 'A shelf of small pre-made parcels',
        },
        {
          technical: 'null',
          everyday: 'A missing parcel',
        },
      ],
      whereItBreaks:
        'The compiler performs the conversion at compile time; there is no physical packing at runtime in the source-level sense, and the JIT may eliminate an allocation. The cache is not a universal shelf: only certain ranges are required, and a JVM may cache more. Two parcels can contain equal values and still be different objects, which the shelf analogy handles only for the cached range.',
    },
    mentalModel: {
      title: 'Boxing adds an object boundary',
      figure: {
        width: 960,
        height: 380,
        caption:
          'A primitive value can be boxed into a wrapper object, sometimes from a cache. Unboxing returns a primitive and fails on null. Using == on two wrappers compares references, not numeric values.',
        alt: 'A diagram showing an int value boxed through Integer.valueOf into a wrapper object and a cache shelf. Unboxing goes back to an int, while a null reference fails with NullPointerException. A comparison branch shows == checking references and equals checking values.',
        nodes: [
          {
            id: 'primitive',
            label: 'int value',
            detail: 'no null state',
            x: 16,
            y: 72,
            width: 168,
            height: 88,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'boxing',
            label: 'Integer.valueOf',
            detail: 'compiler inserts the call',
            x: 228,
            y: 72,
            width: 184,
            height: 88,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'cache',
            label: 'wrapper cache',
            detail: 'small values reused',
            x: 456,
            y: 24,
            width: 176,
            height: 84,
            shape: 'stack',
            tone: 'correct',
          },
          {
            id: 'wrapper',
            label: 'Integer object',
            detail: 'reference + value',
            x: 456,
            y: 148,
            width: 176,
            height: 88,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'unbox',
            label: 'intValue()',
            detail: 'unboxing',
            x: 676,
            y: 72,
            width: 160,
            height: 88,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'null',
            label: 'null',
            detail: 'no object to open',
            x: 456,
            y: 268,
            width: 176,
            height: 76,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'npe',
            label: 'NullPointerException',
            detail: 'at the unboxing use',
            x: 676,
            y: 268,
            width: 204,
            height: 76,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'primitive',
            to: 'boxing',
            label: 'box',
            kind: 'flow',
          },
          {
            from: 'boxing',
            to: 'cache',
            label: 'small range',
            kind: 'flow',
          },
          {
            from: 'boxing',
            to: 'wrapper',
            label: 'otherwise',
            kind: 'flow',
          },
          {
            from: 'wrapper',
            to: 'unbox',
            label: 'use as int',
            kind: 'flow',
          },
          {
            from: 'null',
            to: 'npe',
            label: 'unbox',
            kind: 'flow',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 330,
            text: 'A primitive cannot be null.',
          },
          {
            x: 456,
            y: 360,
            text: 'Two equal wrappers are not necessarily the same object.',
          },
          {
            x: 676,
            y: 360,
            text: 'Unboxing is where a null reference becomes an NPE.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Begin with the value types, then follow the compiler’s conversions at the object boundary. Finally, look at the arithmetic rules that promote and narrow without asking.',
      steps: [
        {
          title: 'A primitive slot has a fixed shape and no null',
          body:
            'Java has eight primitive types. `boolean` is not numeric. `byte`, `short`, `int`, and `long` are signed integers; `char` is an unsigned 16-bit UTF-16 code unit; `float` and `double` are IEEE 754 floating-point values. The width is part of the language, not the host CPU.\n\nInstance and static fields receive a default value, but a local variable must be definitely assigned before it is read. There is no primitive null. When a missing value must be represented, the program needs a sentinel, an `Optional`, or a wrapper reference that can be null.',
          code: {
            filename: 'Primitives.java',
            language: 'java',
            code: `final class Primitives {
    static int field;
    public static void main(String[] args) {
        int local;
        boolean ready = true;
        char letter = 'A';
        System.out.println(field);
        System.out.println(ready);
        System.out.println((int) letter);
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'A static field receives the default value 0.',
              },
              {
                line: 4,
                note: 'A local variable has no default; reading it before assignment is a compile-time error.',
              },
              {
                line: 6,
                note: 'char is a 16-bit unsigned code unit, not a one-byte character.',
              },
              {
                line: 9,
                note: 'Casting to int exposes the numeric code unit.',
              },
            ],
            output: `0
true
65`,
          },
        },
        {
          title: 'Boxing is a compiler conversion',
          body:
            'A generic type parameter cannot be a primitive, and many APIs accept `Object`. When a primitive is used where a wrapper is required, the compiler inserts a boxing conversion, normally `Integer.valueOf`. Going the other way, it inserts an unboxing conversion such as `intValue()`.\n\n`Integer.valueOf` may return a cached object for a small value. The language requires caching for `boolean`, `byte`, `char` in the ASCII range, and `short`/`int` in −128..127. A JVM may cache more. This is why `==` on wrappers can be true for small equal values, but it is never the correct value comparison.',
          code: {
            filename: 'Boxing.java',
            language: 'java',
            code: `import java.util.ArrayList;
import java.util.List;

final class Boxing {
    public static void main(String[] args) {
        List<Integer> values = new ArrayList<>();
        values.add(127);
        Integer first = values.get(0);
        Integer second = 127;

        System.out.println(first == second);
        System.out.println(first.equals(second));
        System.out.println(first.intValue() == second.intValue());
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'The int literal is boxed before it enters the list.',
              },
              {
                line: 10,
                note: 'Both references may point at the cached Integer for 127.',
              },
              {
                line: 11,
                note: 'equals compares the wrapped values, which is the safe rule.',
              },
              {
                line: 12,
                note: 'Explicit unboxing makes the numeric comparison unambiguous.',
              },
            ],
            output: `true
true
true`,
          },
        },
        {
          title: 'Unboxing null fails at the point of use',
          body:
            'A wrapper reference can be null. When the compiler needs a primitive, it inserts an unboxing call, and that call dereferences the reference. A null wrapper therefore throws `NullPointerException` at the line where the primitive is needed, even if the line contains no obvious method call.\n\nMap lookups are a common source because `get` returns null for a missing key. `getOrDefault`, `merge`, and `compute` express the intended handling. Do not add one to a value that might be absent; decide what absence means first.',
          code: {
            filename: 'Unbox.java',
            language: 'java',
            code: `import java.util.HashMap;
import java.util.Map;

final class Unbox {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("seen", 1);

        int seen = counts.get("seen");
        int missing = counts.get("missing");
        System.out.println(seen + missing);
    }
}`,
            annotations: [
              {
                line: 9,
                note: 'A present key unboxes successfully.',
              },
              {
                line: 10,
                note: 'A missing key returns null, and the assignment to int unboxes it.',
              },
              {
                line: 11,
                note: 'The failure is reported here, but the null originated in the map lookup.',
              },
            ],
            output: `Exception in thread "main" java.lang.NullPointerException`,
          },
        },
        {
          title: 'Promotion and division change the result',
          body:
            'When arithmetic mixes types, binary numeric promotion widens the operands to a common type. `byte`, `short`, and `char` are promoted to `int` in most expressions. That is why adding two bytes produces an int and why assigning the result back needs a cast.\n\nInteger division truncates toward zero. `7 / 2` is 3 and `-7 / 2` is −3. The remainder keeps the sign of the dividend. If the domain needs a floor or a rounded average, state it: `Math.floorDiv`, `Math.round`, or a floating/decimal type. A compound assignment such as `value += 1` also performs an implicit narrowing cast back to the left type.',
          code: {
            filename: 'Promotion.java',
            language: 'java',
            code: `final class Promotion {
    public static void main(String[] args) {
        byte small = 120;
        small += 10;
        System.out.println(small);

        int total = 7;
        int count = 2;
        System.out.println(total / count);
        System.out.println(total / 2.0);
        System.out.println(-7 / 2);
        System.out.println(Math.floorDiv(-7, 2));
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'Compound assignment adds as int and then narrows back to byte, wrapping here.',
              },
              {
                line: 5,
                note: 'The printed byte is negative even though both inputs were positive.',
              },
              {
                line: 9,
                note: 'Integer division discards the fraction.',
              },
              {
                line: 10,
                note: 'A double operand promotes the division to floating point.',
              },
              {
                line: 12,
                note: 'floorDiv rounds toward negative infinity instead of zero.',
              },
            ],
            output: `-126
3
3.5
-3
-4`,
          },
        },
      ],
      outro:
        'A primitive is a value with no null and a fixed width. Boxing adds an object boundary, a cache, and an unboxing point. Promotion and division decide the arithmetic before any assignment happens.',
    },
    code: {
      intro:
        'Start with the null that appears during unboxing, then use map operations that keep absence explicit.',
      minimal: {
        filename: 'Boxes.java',
        language: 'java',
        code: `final class Boxes {
    static int increment(Integer value) {
        return value + 1;
    }

    public static void main(String[] args) {
        System.out.println(increment(41));
        System.out.println(increment(null));
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The addition needs an int, so the compiler inserts an unboxing conversion.',
          },
          {
            line: 7,
            note: 'Autoboxing supplies an Integer for the literal 41.',
          },
          {
            line: 8,
            note: 'A null Integer has no value to unbox.',
          },
        ],
        output: `42
Exception in thread "main" java.lang.NullPointerException`,
      },
      realistic: {
        filename: 'WordCount.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class WordCount {
    public static void main(String[] args) {
        List<String> words = List.of("red", "blue", "red", "green", "red");
        Map<String, Integer> counts = new HashMap<>();

        for (String word : words) {
            counts.merge(word, 1, Integer::sum);
        }

        int total = 0;
        for (int count : counts.values()) {
            total += count;
        }

        System.out.println(counts);
        System.out.println(total);
    }
}`,
        annotations: [
          {
            line: 11,
            note: 'merge supplies 1 for a missing key and adds for an existing one, so no null is unboxed.',
          },
          {
            line: 15,
            note: 'The enhanced for unboxes each Integer value into the int variable.',
          },
          {
            line: 16,
            note: 'The total stays a primitive int; counts are small enough for this example.',
          },
          {
            line: 19,
            note: 'Printing the map shows the wrapper values without changing them.',
          },
        ],
        output: `{red=3, green=1, blue=1}
5`,
      },
    },
    breakIt: {
      title: 'The count that was missing',
      scenario:
        'A request handler counts events in a `Map<String, Integer>`. A new event type appears before the map has an entry for it. The handler reads the current count, adds one, and stores it back. The first request for the new type fails with a `NullPointerException` on a line that only performs addition.',
      brokenCode: {
        filename: 'Counters.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;

final class Counters {
    static void record(Map<String, Integer> counts, String event) {
        int current = counts.get(event);
        counts.put(event, current + 1);
    }

    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        record(counts, "signup");
    }
}`,
      },
      predictionPrompt:
        'The map has no entry for `"signup"`. Which operation actually throws, and why is the stack trace pointing at the addition?',
      failureKind: 'runtime',
      reveal: {
        observed:
          '`java.lang.NullPointerException` is thrown at the line that evaluates `current + 1`. The map lookup returned null, and the assignment to the primitive `current` unboxed it.',
        explanation:
          '`Map.get` returns null when the key is absent. Assigning that null to an `int` forces the compiler to insert `Integer.intValue()`. The call dereferences a null reference, so the failure occurs at the unboxing site, not inside the map. The map is behaving as specified; the code assumed every key was already present.',
        repair:
          'Use `merge(event, 1, Integer::sum)` to make the missing case explicit, or `getOrDefault(event, 0) + 1` when a default is truly correct. Decide whether absence means zero, an error, or a new entry. If zero is valid, say so in the code; do not let an accidental null choose for you.',
        correctedCode: {
          filename: 'Counters.java',
          language: 'java',
          code: `import java.util.HashMap;
import java.util.Map;

final class Counters {
    static void record(Map<String, Integer> counts, String event) {
        counts.merge(event, 1, Integer::sum);
    }

    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        record(counts, "signup");
        System.out.println(counts);
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Boxing bugs hide behind syntax that looks like ordinary arithmetic. These are the patterns to inspect at the type boundary.',
      mistakes: [
        {
          title: 'Comparing wrappers with ==',
          generatedPattern:
            '“`Integer` values are cached, so `a == b` works for these counters. The test with 100 passed.”',
          whyItFails:
            'The cache is a required small range, not a general value-equality mechanism. A JVM may cache a wider range, so the same source can pass on one runtime and fail on another. Two equal wrappers outside the cache are different objects.',
          correction:
            'Use `equals`, `Objects.equals`, or compare the unboxed primitives with `==` when null is impossible. Never use wrapper identity for numeric equality.',
          telltale:
            '`Integer`/`Long` values compared with `==`, especially after map lookups or arithmetic that may produce values above 127.',
        },
        {
          title: 'Believing an Integer is just an int',
          generatedPattern:
            '“I will use `Integer` everywhere so the code is object-oriented. It behaves the same as `int`.”',
          whyItFails:
            'A wrapper adds nullability, identity, allocation, and an unboxing step. Arithmetic can throw NPE, `==` changes meaning, and a hot loop may allocate or repeatedly unbox. Generics and nullable APIs need wrappers; local arithmetic usually does not.',
          correction:
            'Use primitives for local computation and performance-sensitive counters. Use wrappers at generic, nullable, or API boundaries, and unbox only after an explicit presence check.',
          telltale:
            'A loop counter or accumulator declared as `Integer`, or a method returning `Integer` where the domain cannot represent absence meaningfully.',
        },
        {
          title: 'Treating integer division as an average',
          generatedPattern:
            '“`total / count` computes the average. The result is an int, so it is already rounded.”',
          whyItFails:
            'Integer division truncates toward zero; it does not round to the nearest value. `7 / 2` is 3, and negative values truncate in the other direction. The fractional part is lost before any display or rounding code runs.',
          correction:
            'State the rounding policy. Cast to double for a measured average, use `Math.round` for nearest, or use `BigDecimal` with a scale and rounding mode for exact decimal results. Use `Math.floorDiv` when floor semantics are intended.',
          telltale:
            'An average, percentage, or rate stored in an int without a cast, scale, or rounding call.',
        },
        {
          title: 'Adding one to a map value without handling absence',
          generatedPattern:
            '“`map.put(key, map.get(key) + 1)` is the standard counter idiom.”',
          whyItFails:
            'The idiom assumes the key exists. On the first occurrence, `get` returns null and the unboxing addition throws NPE. The line looks like arithmetic, which makes the null easy to miss in review.',
          correction:
            'Use `merge(key, 1, Integer::sum)`, `compute`, or `getOrDefault(key, 0) + 1` when zero is the correct default. Make the absence policy visible at the call site.',
          telltale:
            '`get(key) + 1`, `get(key)++`, or any arithmetic directly on a map lookup that can return null.',
        },
      ],
      reviewChecklist: [
        'Are wrapper values compared with equals rather than ==?',
        'Is every unboxing point preceded by a presence check or a non-null guarantee?',
        'Does map counting use merge, compute, or an explicit default?',
        'Are averages and percentages using a documented rounding policy?',
        'Are hot loops and local accumulators using primitives where null is not meaningful?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is looking for the boundary between a value and an object. Name the conversion, the null risk, and the identity rule.',
      questions: [
        {
          id: 'java.l1.primitives-boxing.interview.1',
          difficulty: 'junior',
          question: 'What is autoboxing, and what happens when you unbox a null Integer?',
          modelAnswer:
            'Autoboxing is the compiler conversion from a primitive to its wrapper, such as `Integer.valueOf(5)`. Unboxing is the reverse, such as `integer.intValue()`. If the wrapper reference is null, unboxing dereferences null and throws `NullPointerException`. This often appears when a map lookup returns null and the result is assigned to an int or used in arithmetic.',
          weakAnswer:
            'Autoboxing puts an int in an object. Unboxing a null gives zero.',
          strongAnswer:
            'The compiler inserts a conversion at the boundary where an object is required or a primitive is required. A wrapper may be null; a primitive cannot. Unboxing null throws at the use site, which can be far from the lookup that produced it. I keep absence explicit with getOrDefault, merge, or an Optional instead of relying on an accidental null.',
          followUp: 'Why can two equal Integer values compare false with ==?',
        },
        {
          id: 'java.l1.primitives-boxing.interview.2',
          difficulty: 'mid',
          question:
            'A counter uses `map.put(key, map.get(key) + 1)` and fails on the first new key. Explain the failure and two safe alternatives.',
          modelAnswer:
            'The first lookup returns null, and the addition requires an int, so the compiler unboxes null and throws NullPointerException. `merge(key, 1, Integer::sum)` treats a missing key as the initial value and an existing key as an accumulation. `getOrDefault(key, 0) + 1` makes the default explicit. Both choose a policy for absence; the original code accidentally chose “crash.”',
          weakAnswer:
            'The map is not thread-safe, so I would wrap it in a synchronized map.',
          strongAnswer:
            'The failure is unboxing, not concurrency. The map contract returns null for an absent key, and the arithmetic forces the conversion. I would use merge or compute to make the update atomic at the map level and to state the default. If multiple threads update the map, I would choose a ConcurrentHashMap and use its atomic compute/merge operations, but that is a separate requirement.',
          followUp: 'When would getOrDefault be wrong even though it avoids the NPE?',
        },
        {
          id: 'java.l1.primitives-boxing.interview.3',
          difficulty: 'senior',
          question:
            'How do boxing and numeric promotion affect the design of a high-throughput metrics or counting service?',
          modelAnswer:
            'Wrappers are necessary at generic and nullable boundaries, but they add indirection and can allocate outside the cache. Hot counters should use primitive fields or arrays, with explicit null/absence semantics at the API edge. Numeric promotion matters because byte/short/char arithmetic happens in int, integer division truncates, and compound assignment narrows. For metrics I would keep units and widths explicit, use long for counters that can grow, and only box at serialization or map boundaries. I would measure allocation rather than assume the JIT removes every wrapper.',
          weakAnswer:
            'Boxing is optimized away, so I would use Integer maps everywhere for consistency.',
          strongAnswer:
            'The JIT can eliminate some boxing, but the source-level semantics still include null and identity, and the allocation may remain on a cold or megamorphic path. I would separate the hot representation from the external contract: primitive arrays or counters inside, wrappers or DTOs at the edge. I would also audit division and narrowing because a fast counter with the wrong rounding policy is still wrong.',
          followUp: 'What evidence would you collect before replacing a wrapper map with primitive arrays?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a word counter with explicit absence',
      brief:
        'Write a word counter that uses a `Map<String, Integer>` without ever unboxing a null. Then compute the average count per distinct word with a documented rounding policy. Include a missing-key case and an empty-input case in the demonstration.',
      constraints: [
        'Use `merge` or `compute` to update counts; do not use `get(key) + 1`.',
        'Print the map and the number of distinct words.',
        'Compute the average count per distinct word without integer truncation.',
        'Handle an empty input without dividing by zero.',
        'State whether the average is rounded or displayed with a fraction.',
      ],
      starterCode: {
        filename: 'WordStats.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class WordStats {
    public static void main(String[] args) {
        List<String> words = List.of("red", "blue", "red", "green", "red");
        Map<String, Integer> counts = new HashMap<>();

        // Count the words without unboxing a missing value.

        // Compute and print the average per distinct word.
    }
}`,
      },
      referenceSolution: {
        filename: 'WordStats.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class WordStats {
    static Map<String, Integer> count(List<String> words) {
        Map<String, Integer> counts = new HashMap<>();
        for (String word : words) {
            counts.merge(word, 1, Integer::sum);
        }
        return counts;
    }

    static double averagePerWord(Map<String, Integer> counts) {
        if (counts.isEmpty()) {
            return 0.0;
        }
        int total = 0;
        for (int count : counts.values()) {
            total += count;
        }
        return (double) total / counts.size();
    }

    public static void main(String[] args) {
        Map<String, Integer> counts = count(List.of("red", "blue", "red", "green", "red"));
        System.out.println(counts);
        System.out.printf("average: %.2f%n", averagePerWord(counts));
        System.out.println(count(List.of()));
    }
}`,
        annotations: [
          {
            line: 9,
            note: 'merge supplies the initial 1 and never unboxes a null from a missing key.',
          },
          {
            line: 17,
            note: 'The total is accumulated as a primitive int; the values are unboxed only after they exist.',
          },
          {
            line: 20,
            note: 'Casting the total before division preserves the fraction.',
          },
          {
            line: 27,
            note: 'The empty map returns zero instead of dividing by zero.',
          },
        ],
      },
      rubric: [
        {
          id: 'no-null-unbox',
          check: 'Does every map update handle a missing key explicitly?',
          detail:
            'The original bug is an unboxing NPE. merge, compute, or a default must make absence intentional.',
          mustPass: true,
        },
        {
          id: 'fractional-average',
          check: 'Does the average preserve the fractional part or state its rounding policy?',
          detail:
            'Integer division truncates. The exercise should show a deliberate choice, not an accidental one.',
          mustPass: true,
        },
        {
          id: 'empty-input',
          check: 'Does an empty input avoid division by zero?',
          detail:
            'An average over zero distinct words has no mathematical value; the code must choose a representation.',
          mustPass: true,
        },
        {
          id: 'output-evidence',
          check: 'Does the output show counts, the average, and the empty case?',
          detail:
            'The three observations make the absence and rounding decisions visible.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac WordStats.java` and `java WordStats`. Expect counts of red=3, blue=1, green=1 and an average of 1.67.',
        'Replace `merge` with `counts.get(word) + 1` and run. Explain where the first missing key throws and why the stack trace points at the addition.',
        'Change the average to `total / counts.size()` and compare the printed value. Explain the truncation and restore the explicit cast.',
      ],
    },
    recap: [
      'Primitives store values directly with fixed widths and no null state; wrappers add an object boundary.',
      'Boxing uses valueOf and may reuse cached small values; unboxing a null throws NullPointerException.',
      'Use equals or unboxed numeric comparison for wrapper values, never == on two wrappers.',
      'Integer division truncates and compound assignment narrows; state the rounding policy instead of inheriting it.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.primitives-boxing.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.autoboxing'],
      prompt: 'A map lookup returns `null` and the result is used in `count + 1`. What happens?',
      options: [
        {
          id: 'zero',
          text: 'The null is treated as zero and the result is 1.',
        },
        {
          id: 'npe',
          text: 'Unboxing the null throws `NullPointerException`.',
        },
        {
          id: 'compile',
          text: 'The code does not compile because null cannot be added.',
        },
        {
          id: 'nan',
          text: 'The result becomes `NaN`.',
        },
      ],
      correctOptionId: 'npe',
      explanation:
        'The addition needs a primitive int, so the compiler inserts an unboxing conversion. Unboxing a null reference dereferences it and throws NullPointerException at the use site.',
    },
    {
      id: 'java.l1.primitives-boxing.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l1.numeric-promotion'],
      prompt:
        'A report wants the average of 7 items across 2 groups. Which line silently loses the fraction?',
      code: `final class Average {
    public static void main(String[] args) {
        int total = 7;
        int groups = 2;
        int average = total / groups;
        System.out.println(average);
    }
}`,
      codeLanguage: 'java',
      bugLine: 5,
      bugSummary:
        'Both operands are ints, so the division truncates before the result is assigned.',
      explanation:
        'Integer division discards the fractional part. Cast one operand to double before dividing, or use a rounding method with an explicit policy. Assigning to a double after the division is too late.',
    },
    {
      id: 'java.l1.primitives-boxing.recall.q3',
      type: 'explain',
      concepts: ['java.l1.autoboxing', 'java.l1.primitive-types'],
      prompt:
        'Explain when you would use an `int` and when you would use an `Integer`, including the null, identity, and collection trade-offs.',
      keyPoints: [
        'Use int for local arithmetic and values that cannot be absent.',
        'Use Integer when a generic type, nullable API, or collection requires an object.',
        'Integer references can be null; unboxing one requires a presence check.',
        'Two Integer values compared with == compare references; equals compares the wrapped value.',
        'Boxing can allocate, though small values may come from a cache.',
      ],
      modelAnswer:
        'I use `int` for local computation, counters, and any value where absence is not meaningful. I use `Integer` at generic boundaries such as `Map<String, Integer>`, or when the API must represent “no value” with null. A wrapper adds identity and nullability: `==` compares references, so I use equals for values, and unboxing a null throws. Boxing may allocate, although small values can be cached. The choice should follow the domain and the API boundary, not a blanket preference for objects.',
      explanation:
        'Strong answers name the boundary and the consequences. A wrapper is not just an int with methods; it changes identity, nullability, and allocation.',
    },
  ],
});
