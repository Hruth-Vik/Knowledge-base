import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.bits-and-numbers',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'data-in-the-machine',
    title: 'Data in the Machine',
  },
  sequence: 2,
  slug: 'bits-and-numbers',
  title: 'What a Number Costs in Memory',
  deck: 'An int is not a number. It is 32 bits with a fixed range, a signed interpretation, and a set of silent overflows.',
  kind: 'standard',
  estimatedMinutes: 15,
  tags: ['bits', 'integers', 'overflow', 'floating-point', 'money'],
  concepts: [
    {
      id: 'java.l0.binary-representation',
      title: 'Binary representation',
      kind: 'term',
      summary: [
        'A fixed-width integer stores a pattern of bits, not an abstract number.',
        'Two’s complement gives one sign bit and a range that is asymmetric around zero.',
        'The width of the type decides the range before any arithmetic happens.',
      ],
      aliases: ['two’s complement', 'bit patterns', 'integer range'],
      tags: ['java', 'numbers'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-and-heap',
        },
      ],
    },
    {
      id: 'java.l0.integer-overflow',
      title: 'Integer overflow',
      kind: 'failure-mode',
      summary: [
        'Java integer arithmetic wraps modulo 2³² for int and 2⁶⁴ for long.',
        'Overflow does not throw; the result silently becomes a valid but wrong value.',
        'Exact arithmetic needs a wider type or Math.addExact and Math.multiplyExact.',
      ],
      aliases: ['wraparound', 'silent overflow', 'negative counter'],
      tags: ['java', 'numbers', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.binary-representation',
        },
      ],
    },
    {
      id: 'java.l0.floating-point',
      title: 'Floating-point approximation',
      kind: 'term',
      summary: [
        'A double stores sign, exponent, and a binary fraction, not a decimal value.',
        'Most decimal fractions have no exact binary representation, so they round.',
        'Comparison and money need a tolerance or an exact integer/decimal type.',
      ],
      aliases: ['IEEE 754', 'double rounding', '0.1 + 0.2'],
      tags: ['java', 'numbers'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.binary-representation',
        },
        {
          type: 'commonly-confused-with',
          target: 'java.l0.integer-overflow',
        },
      ],
    },
  ],
  revisits: ['java.l0.stack-and-heap', 'java.l0.bytecode'],
  versionCaveats: [
    'Examples target Java 21 LTS. Integer overflow behavior is specified by the Java Language Specification, not left to the CPU.',
    'Floating-point arithmetic follows IEEE 754. Java 17 removed the strictfp modifier because all floating-point expressions are now strict, but that does not make decimal fractions exact.',
    'BigDecimal is exact for decimal values you construct from strings or integers. Constructing it from a double preserves the double’s approximation, not the decimal you meant.',
  ],
  references: [
    {
      title: 'Java Language Specification: Integer Operations',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.1',
      note: 'The defined ranges and the two’s-complement representation of Java integers.',
    },
    {
      title: 'Java SE 21 API: Math.multiplyExact',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#multiplyExact(int,int)',
      note: 'The standard-library alternative that turns overflow into an ArithmeticException.',
    },
    {
      title: 'Java SE 21 API: BigDecimal',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html',
      note: 'Exact decimal arithmetic, scale, and explicit rounding modes.',
    },
  ],
  sections: {
    problem:
      'A loyalty counter passes two billion points and is suddenly negative. A checkout charges `19.99` and a refund of `0.30` leaves the ledger a cent short. A timer starts reporting negative latency after about thirty-five minutes.\n\nNone of these programs threw an exception at the moment the value became wrong. Each one stored a number in a slot that was too narrow, or asked a binary fraction to behave like a decimal one. The failure appeared later, somewhere else, wearing a different symptom. To debug it you need to know what the type can hold and what the machine actually stores.',
    analogy: {
      title: 'A fixed-width odometer',
      body:
        'A car odometer has a fixed number of wheels. Drive past the largest reading and it rolls over to zero, then starts climbing again. The display is always valid; it is just no longer related to the true distance.\n\nA signed integer splits that same wheel into two halves. One half is read as positive and the other as negative. A floating-point number is a different instrument: scientific notation with a binary mantissa, like a lab meter that shows eight significant digits and rounds everything after that.',
      mapping: [
        {
          technical: 'A fixed-width int or long',
          everyday: 'A fixed number of odometer wheels',
        },
        {
          technical: 'The sign bit and two’s complement',
          everyday: 'Reading the upper half of the wheel as negative',
        },
        {
          technical: 'Integer overflow',
          everyday: 'The odometer rolling from its maximum back to zero',
        },
        {
          technical: 'A double’s significand',
          everyday: 'The number of digits the lab meter can show before rounding',
        },
      ],
      whereItBreaks:
        'A real odometer makes a visible mechanical jump. Java overflow is defined and silent: the expression produces a wrapped value with no signal at all. The meter analogy also implies that a double stores decimal digits. It stores binary fractions and rounds to the nearest representable value, which is why `0.1` cannot be represented exactly even though the display looks familiar.',
    },
    mentalModel: {
      title: 'Ranges wrap; fractions round',
      figure: {
        width: 960,
        height: 380,
        caption:
          'An int is a fixed 32-bit pattern with a signed range. Going past the maximum wraps to the minimum. A double stores an approximation, so decimal fractions and money need explicit handling.',
        alt: 'A diagram showing a 32-bit int feeding its signed range and an overflow path from MAX_VALUE to MIN_VALUE. Beside it, a 64-bit double feeds an approximate binary fraction, with a repair path to integer cents for money.',
        nodes: [
          {
            id: 'int-box',
            label: 'int',
            detail: '32 bits: sign + value',
            x: 16,
            y: 24,
            width: 224,
            height: 100,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'range',
            label: '−2,147,483,648 … 2,147,483,647',
            detail: 'the complete int range',
            x: 16,
            y: 156,
            width: 224,
            height: 96,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'wrap',
            label: 'MAX_VALUE + 1',
            detail: 'wraps to MIN_VALUE',
            x: 300,
            y: 24,
            width: 204,
            height: 100,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'float-box',
            label: 'double',
            detail: 'sign + exponent + fraction',
            x: 564,
            y: 24,
            width: 224,
            height: 100,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'approx',
            label: '0.1 is not exact',
            detail: 'nearest binary fraction',
            x: 564,
            y: 156,
            width: 224,
            height: 96,
            shape: 'note',
            tone: 'warning',
          },
          {
            id: 'money',
            label: 'long cents',
            detail: 'exact until the long limit',
            x: 828,
            y: 156,
            width: 116,
            height: 96,
            shape: 'box',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'int-box',
            to: 'range',
            label: 'holds',
            kind: 'flow',
          },
          {
            from: 'int-box',
            to: 'wrap',
            label: 'past the edge',
            kind: 'flow',
          },
          {
            from: 'float-box',
            to: 'approx',
            label: 'rounds to',
            kind: 'flow',
          },
          {
            from: 'approx',
            to: 'money',
            label: 'repair',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 300,
            text: 'Addition wraps modulo 2³²; no exception is raised.',
          },
          {
            x: 564,
            y: 300,
            text: 'A double is binary scientific notation, not decimal.',
          },
          {
            x: 828,
            y: 300,
            text: 'Count money in integer cents or BigDecimal.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Start with the width of the slot, then see how the sign is encoded, what happens when arithmetic leaves the range, and why a floating-point slot rounds instead of wrapping.',
      steps: [
        {
          title: 'The type fixes the width before the value exists',
          body:
            'A Java `int` is always 32 bits and a `long` is always 64 bits, regardless of the operating system. Eight primitive types cover boolean, four integer widths, two floating-point widths, and char. There is no unsigned `int` type in the language; some library methods interpret the same bits as unsigned when that is useful.\n\nThe maximum `int` is `2_147_483_647`. The minimum is `-2_147_483_648`, one step farther from zero. That asymmetry is not an accident; it falls out of the two’s-complement encoding, where the sign bit carries a negative weight.',
          code: {
            filename: 'Ranges.java',
            language: 'java',
            code: `final class Ranges {
    public static void main(String[] args) {
        System.out.println(Integer.BYTES);
        System.out.println(Integer.MIN_VALUE);
        System.out.println(Integer.MAX_VALUE);
        System.out.println(Long.MAX_VALUE);
        System.out.println(1 << 31);
        System.out.println((1 << 31) - 1);
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The width is a property of the type, not of the machine running the JVM.',
              },
              {
                line: 4,
                note: 'The minimum is one larger in magnitude than the maximum.',
              },
              {
                line: 7,
                note: 'Shifting into the sign bit produces the minimum int value.',
              },
              {
                line: 8,
                note: 'Subtracting one reaches the maximum. The wraparound is visible in the arithmetic.',
              },
            ],
            output: `4
-2147483648
2147483647
9223372036854775807
-2147483648
2147483647`,
          },
        },
        {
          title: 'Two’s complement makes the sign part of the number',
          body:
            'In two’s complement, the most significant bit has a negative weight. For a 32-bit value, the bits contribute `-2³¹`, `2³⁰`, down to `2⁰`. A pattern with the top bit set is negative; flip every bit and add one to get its magnitude.\n\nThis encoding is why one negative value has no positive counterpart. `Math.abs(Integer.MIN_VALUE)` returns `Integer.MIN_VALUE`, because positive `2_147_483_648` cannot be represented in an `int`. It is also why negation, subtraction, and bitwise operations fit the same arithmetic unit as addition.',
          code: {
            filename: 'Negation.java',
            language: 'java',
            code: `final class Negation {
    public static void main(String[] args) {
        int smallest = Integer.MIN_VALUE;
        System.out.println(-smallest);
        System.out.println(Math.abs(smallest));
        System.out.println(Integer.toBinaryString(-1));
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'This is the one int value whose positive counterpart does not fit.',
              },
              {
                line: 4,
                note: 'Negating it wraps back to the same bit pattern.',
              },
              {
                line: 5,
                note: 'Math.abs cannot invent a representable positive value, so it returns the input.',
              },
              {
                line: 6,
                note: 'All 32 bits set represents −1 in two’s complement.',
              },
            ],
            output: `-2147483648
-2147483648
11111111111111111111111111111111`,
          },
        },
        {
          title: 'Overflow is defined, silent wraparound',
          body:
            'When integer addition, subtraction, or multiplication leaves the type’s range, Java wraps modulo `2³²` for `int` and modulo `2⁶⁴` for `long`. The result is a valid value of the same type. No flag, exception, or warning is produced.\n\nThe library offers exact alternatives. `Math.addExact`, `Math.subtractExact`, and `Math.multiplyExact` throw `ArithmeticException` instead of wrapping. `Math.toIntExact` refuses a `long` that does not fit. Use exact methods at boundaries where a wrong value would corrupt money, counts, indexes, or time.',
          code: {
            filename: 'Exact.java',
            language: 'java',
            code: `final class Exact {
    public static void main(String[] args) {
        int wrapped = Integer.MAX_VALUE + 1;
        System.out.println(wrapped);

        try {
            int stopped = Math.addExact(Integer.MAX_VALUE, 1);
            System.out.println(stopped);
        } catch (ArithmeticException error) {
            System.out.println(error.getMessage());
        }
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The compiler evaluates this with int arithmetic and stores the wrapped result.',
              },
              {
                line: 4,
                note: 'The printed value is the minimum int, not an error.',
              },
              {
                line: 7,
                note: 'addExact checks the mathematical result and refuses to wrap.',
              },
              {
                line: 11,
                note: 'The failure is explicit and can be handled at a boundary.',
              },
            ],
            output: `-2147483648
integer overflow`,
          },
        },
        {
          title: 'Floating point is binary scientific notation',
          body:
            'A `double` uses one sign bit, eleven exponent bits, and fifty-two fraction bits. Normal values have an implicit leading one, giving 53 bits of significand precision. The exponent lets the same type represent very large and very small magnitudes, at the cost of exactness in the last digits.\n\nDecimal fractions such as `0.1` are repeating fractions in base two, just as `1/3` repeats in base ten. The stored value is the nearest representable double. Adding two of those approximations can land on a third value that is not the decimal answer you expected. That is why `0.1 + 0.2 == 0.3` is false, and why money should be counted in integer cents or with an explicit decimal type and rounding policy.',
          code: {
            filename: 'Fractions.java',
            language: 'java',
            code: `import java.math.BigDecimal;

final class Fractions {
    public static void main(String[] args) {
        double tenth = 0.1;
        double sum = tenth + 0.2;

        System.out.println(sum);
        System.out.println(sum == 0.3);
        System.out.println(new BigDecimal(tenth));
        System.out.println(new BigDecimal("0.1"));
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The literal is rounded to the nearest double before any addition happens.',
              },
              {
                line: 8,
                note: 'The result is the nearest double to the exact sum of two approximations.',
              },
              {
                line: 9,
                note: 'Decimal comparison fails because the two sides are different binary values.',
              },
              {
                line: 10,
                note: 'Constructing from a double exposes the full stored approximation.',
              },
              {
                line: 11,
                note: 'Constructing from a string preserves the decimal you intended.',
              },
            ],
            output: `0.30000000000000004
false
0.1000000000000000055511151231257827021181583404541015625
0.1`,
          },
        },
      ],
      outro:
        'The width decides the range. Two’s complement explains the sign and the one missing positive value. Wrapping is the defined integer failure; rounding is the defined floating-point trade-off. Neither is a runtime bug until the program assumes the wrong one.',
    },
    code: {
      intro:
        'First watch an int and a double fail in the smallest possible program. Then count money in cents so the arithmetic stays exact.',
      minimal: {
        filename: 'Numbers.java',
        language: 'java',
        code: `final class Numbers {
    public static void main(String[] args) {
        int max = Integer.MAX_VALUE;
        int next = max + 1;
        double tenth = 0.1;
        double sum = tenth + 0.2;

        System.out.println(next);
        System.out.println(sum);
        System.out.println(0.1 + 0.2 == 0.3);
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'The addition is performed as int arithmetic, so the result wraps.',
          },
          {
            line: 6,
            note: 'The literal 0.1 is already an approximation before the addition.',
          },
          {
            line: 10,
            note: 'The two sides are close but not the same double, so equality is false.',
          },
        ],
        output: `-2147483648
0.30000000000000004
false`,
      },
      realistic: {
        filename: 'Invoice.java',
        language: 'java',
        code: `import java.math.BigDecimal;

final class Invoice {
    public static void main(String[] args) {
        int units = 250_000;
        int unitCents = 10_000;
        int intTotal = units * unitCents;

        long safeTotal = Math.multiplyExact((long) units, unitCents);

        System.out.println(intTotal);
        System.out.println(safeTotal);
        System.out.println(BigDecimal.valueOf(safeTotal, 2));
    }
}`,
        annotations: [
          {
            line: 7,
            note: 'Both operands are int, so the multiplication happens in 32 bits and wraps.',
          },
          {
            line: 9,
            note: 'Casting one operand to long widens the operation before multiplying.',
          },
          {
            line: 10,
            note: 'multiplyExact rejects a result that would not fit in a long.',
          },
          {
            line: 12,
            note: 'The long still counts cents. The scale of 2 turns it into a decimal display without using a double for the arithmetic.',
          },
        ],
        output: `-1794967296
2500000000
25000000.00`,
      },
    },
    breakIt: {
      title: 'The loyalty balance that went negative',
      scenario:
        'A campaign sums awarded points in an `int`. Each euro is worth 100 points, and the campaign reports 25 million euros of eligible spend. The total is stored as an `int` and written to the customer ledger. No exception appears. Support sees a negative balance and assumes the account was hacked.',
      brokenCode: {
        filename: 'Loyalty.java',
        language: 'java',
        code: `final class Loyalty {
    public static void main(String[] args) {
        int pointsPerEuro = 100;
        int euros = 25_000_000;
        int points = pointsPerEuro * euros;

        System.out.println("points=" + points);
    }
}`,
      },
      predictionPrompt:
        'The mathematical total is 2,500,000,000. What does the int expression store, and why is there no exception?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `points=-1794967296`. The mathematical total exceeds `Integer.MAX_VALUE` by 352,516,353.',
        explanation:
          'The multiplication is evaluated with 32-bit int arithmetic. The exact result is 2,500,000,000; 2,500,000,000 minus 2³² (4,294,967,296) is −1,794,967,296. Java defines this wraparound, so the JVM has no reason to throw. The variable is then widened to a string for printing, but widening happens after the damage is done.',
        repair:
          'Choose the type from the domain range, not from habit. A long can hold this total. If the calculation must fail rather than wrap, use `Math.multiplyExact` and handle the exception at the boundary. Add a boundary test with the largest realistic campaign, not only a small fixture.',
        correctedCode: {
          filename: 'Loyalty.java',
          language: 'java',
          code: `final class Loyalty {
    public static void main(String[] args) {
        long pointsPerEuro = 100L;
        long euros = 25_000_000L;
        long points = Math.multiplyExact(pointsPerEuro, euros);

        System.out.println("points=" + points);
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated code usually gets the syntax right and the range wrong. These patterns are specific enough to spot in a diff.',
      mistakes: [
        {
          title: 'Using double for money',
          generatedPattern:
            '“I will store the price as a `double` and round it when displaying the total. Two decimal places is enough.”',
          whyItFails:
            'The stored value is a binary approximation before the display code runs. Multiplying, adding tax, or splitting a payment can move the result to the wrong side of a cent boundary. Rounding at the end cannot recover the decimal that was never stored.',
          correction:
            'Store integer cents in a `long`, or use `BigDecimal` with an explicit scale and rounding mode. Decide where rounding happens once, at the domain boundary, and test half-cent cases.',
          telltale:
            'A money field declared as `double` or `float`, or a total that needs `Math.round(... * 100) / 100.0` after every operation.',
        },
        {
          title: 'Assuming int is enough for counters and time',
          generatedPattern:
            '“An `int` is fine for a counter or a duration. Four bytes are plenty, and it avoids a cast.”',
          whyItFails:
            'An int tops out at about 2.1 billion. Milliseconds overflow in about 24.8 days; microseconds in about 35.8 minutes when the value is interpreted as signed. A long-lived counter can wrap without any warning.',
          correction:
            'Use `long` for epoch milliseconds, nanoseconds, byte counts, and counters that can grow without a proven bound. Use `Math.toIntExact` only when an API truly requires an int, so a bad conversion fails loudly.',
          telltale:
            '`int` fields named `timestamp`, `duration`, `bytes`, or `total`, especially beside an API that returns `long`.',
        },
        {
          title: 'Casting to int to make the compiler happy',
          generatedPattern:
            '“The method returns a long but this variable is an int, so I added `(int)`.”',
          whyItFails:
            'A narrowing cast discards the high bits. Values above `Integer.MAX_VALUE` become negative or unrelated numbers. The cast documents that the programmer considered the range, but generated code often adds it only to silence a type error.',
          correction:
            'Keep the wider type through the calculation, or use `Math.toIntExact` and handle the failure. If the protocol requires an int, validate the range before converting.',
          telltale:
            'An explicit `(int)` around a value derived from time, file size, database identity, or arithmetic on user-supplied quantities.',
        },
        {
          title: 'Believing Math.abs always returns a positive number',
          generatedPattern:
            '“I normalized the hash with `Math.abs(hashCode())` before taking the modulus, so the index is always positive.”',
          whyItFails:
            '`Integer.MIN_VALUE` has no positive int counterpart. `Math.abs` returns it unchanged, and the modulus can still be negative, producing an invalid array index.',
          correction:
            'Use `Math.floorMod(hash, length)` for a non-negative remainder, or mask the sign bit when that is the intended operation. Test the minimum value explicitly.',
          telltale:
            '`Math.abs(...) % n` on an int, especially when the result indexes an array or selects a shard.',
        },
      ],
      reviewChecklist: [
        'Is every money value stored as integer cents or BigDecimal rather than double?',
        'Do counters, byte counts, and durations use a width that cannot plausibly overflow?',
        'Are narrowing casts replaced with Math.toIntExact or an explicit range check?',
        'Are overflow and rounding tested at the boundary, not only with small positive values?',
        'Does any index calculation use Math.floorMod instead of Math.abs(...) % n?',
      ],
    },
    interviewCorner: {
      intro:
        'These questions test whether you can state the range, explain the failure, and choose an exact representation without hand-waving.',
      questions: [
        {
          id: 'java.l0.bits-and-numbers.interview.1',
          difficulty: 'junior',
          question: 'What is the range of a Java `int`, and what happens when you add one to `Integer.MAX_VALUE`?',
          modelAnswer:
            'An `int` is 32 bits, so its range is −2,147,483,648 to 2,147,483,647. The values are stored in two’s complement. Adding one to the maximum produces the minimum value because the arithmetic wraps modulo 2³². Java defines this behavior, so no exception is thrown. If the program needs to detect the overflow, it should use `Math.addExact` or a wider type.',
          weakAnswer:
            'It becomes a long automatically, or Java throws an overflow exception.',
          strongAnswer:
            'The range is fixed by the language: 32 signed bits. `MAX_VALUE + 1` wraps to `MIN_VALUE` because int arithmetic is modular. That is a language guarantee, not an accident of the CPU. I would choose a long or `Math.addExact` when the domain can reach the boundary, and I would test the boundary rather than assuming small inputs generalize.',
          followUp: 'Why is the magnitude of the minimum one larger than the maximum?',
        },
        {
          id: 'java.l0.bits-and-numbers.interview.2',
          difficulty: 'mid',
          question: 'Why is `0.1 + 0.2 == 0.3` false, and how would you calculate a monetary total?',
          modelAnswer:
            '`0.1` and `0.2` are stored as the nearest binary floating-point values, not as exact decimal fractions. Their sum is the nearest double to the sum of those approximations, which is `0.30000000000000004`. Comparing it with the double for `0.3` is false. For money I would store integer cents in a `long`, or use `BigDecimal` constructed from strings or integers with an explicit scale and rounding mode. I would not compare doubles for exact equality.',
          weakAnswer:
            'Floating point is imprecise, so add an epsilon. For money, round the final answer to two decimals.',
          strongAnswer:
            'The issue is representation, not arithmetic quality. Most decimal fractions are repeating in base two, so each literal is rounded before the operation. An epsilon is fine for measurements with a known tolerance, but it is the wrong tool for exact money. Integer cents preserve the unit; BigDecimal preserves decimal scale and makes rounding policy explicit. I would also decide whether to round per line or on the total, because that changes the result.',
          followUp: 'When would `BigDecimal.valueOf(0.1)` still be the wrong constructor?',
        },
        {
          id: 'java.l0.bits-and-numbers.interview.3',
          difficulty: 'senior',
          question:
            'How would you audit a service for numeric overflow and rounding risk before a high-volume launch?',
          modelAnswer:
            'I would inventory the domains where exactness matters: money, quantities, identifiers, byte counts, timestamps, durations, and shard or bucket indexes. For each, I would check the storage type, the widest realistic value, and every multiplication or accumulation. I would look for int time and size fields, double money, narrowing casts, and `Math.abs(...) % n`. Then I would add boundary tests, exact arithmetic where the domain requires it, and metrics or assertions at conversion boundaries. Database column widths and JSON number handling belong in the same review, because a correct Java type can still be truncated at the edge.',
          weakAnswer:
            'Java is memory-safe, so overflow is not a security issue. I would rely on unit tests with normal values.',
          strongAnswer:
            'I would treat it as a data-contract review, not a language trivia check. The dangerous cases are the ones that fail silently: a wrapped counter, a rounded cent, a truncated timestamp, a negative shard. I would trace the value from input to storage to output, verify each type can hold the realistic maximum, and make failures explicit with exact arithmetic. Boundary tests and production assertions at external interfaces catch the cases that ordinary fixtures miss.',
          followUp: 'Where would you place an exactness check so it does not add cost to every request?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a cents-safe invoice total',
      brief:
        'Write a small invoice calculator that keeps money in integer cents, multiplies quantity by unit price without silent overflow, and formats the result with two decimal places. Then prove the boundary behavior with a value that would overflow an int.',
      constraints: [
        'Store money as `long` cents. Do not use `double` or `float` anywhere in the calculation.',
        'Use `Math.multiplyExact` and `Math.addExact` for the line total and grand total.',
        'Accept a quantity and a unit price in cents, then print the line total and grand total as decimal amounts.',
        'Catch `ArithmeticException` at the top level and print a clear message instead of a wrapped number.',
        'Include one normal case and one case whose mathematical total exceeds `Integer.MAX_VALUE`.',
        'Format the output with `BigDecimal.valueOf(cents, 2)` rather than dividing by 100.0.',
      ],
      starterCode: {
        filename: 'InvoiceTotals.java',
        language: 'java',
        code: `import java.math.BigDecimal;

final class InvoiceTotals {
    static long lineTotal(int quantity, long unitCents) {
        // Use exact arithmetic and return the line total in cents.
        return 0L;
    }

    static String formatCents(long cents) {
        // Return a decimal string with exactly two fraction digits.
        return "";
    }

    public static void main(String[] args) {
        // Print a normal invoice and an overflowing invoice.
    }
}`,
      },
      referenceSolution: {
        filename: 'InvoiceTotals.java',
        language: 'java',
        code: `import java.math.BigDecimal;

final class InvoiceTotals {
    static long lineTotal(int quantity, long unitCents) {
        return Math.multiplyExact((long) quantity, unitCents);
    }

    static long grandTotal(long... lineTotals) {
        long total = 0L;
        for (long line : lineTotals) {
            total = Math.addExact(total, line);
        }
        return total;
    }

    static String formatCents(long cents) {
        return BigDecimal.valueOf(cents, 2).toPlainString();
    }

    static void printInvoice(String label, int quantity, long unitCents) {
        try {
            long line = lineTotal(quantity, unitCents);
            long total = grandTotal(line);
            System.out.println(label + ": " + formatCents(total));
        } catch (ArithmeticException error) {
            System.out.println(label + ": refused (" + error.getMessage() + ")");
        }
    }

    public static void main(String[] args) {
        printInvoice("normal", 3, 1_999L);
        printInvoice("large", 250_000, 1_000_000L);
    }
}`,
        annotations: [
          {
            line: 5,
            note: 'Widening the quantity before multiplying keeps the product in long arithmetic.',
          },
          {
            line: 12,
            note: 'addExact makes a total that cannot fit a long fail at the boundary instead of wrapping.',
          },
          {
            line: 18,
            note: 'The scale of 2 formats cents without introducing a binary floating-point value.',
          },
          {
            line: 25,
            note: 'The catch is at the top-level boundary, so the rest of the calculation stays exact.',
          },
        ],
      },
      rubric: [
        {
          id: 'integer-money',
          check: 'Is every monetary value a long count of cents?',
          detail:
            'A single double in the calculation reintroduces binary rounding. Formatting may use BigDecimal, but the stored amount must stay exact.',
          mustPass: true,
        },
        {
          id: 'exact-arithmetic',
          check: 'Do multiplication and addition use exact methods or a proven wider range?',
          detail:
            'The boundary case must fail loudly or produce the correct wider result. Silent wraparound is the bug this exercise is meant to prevent.',
          mustPass: true,
        },
        {
          id: 'boundary-evidence',
          check: 'Does the program include a case above the int range and print the correct refusal or total?',
          detail:
            'A normal invoice alone does not prove the type choice. The boundary case is the evidence.',
          mustPass: true,
        },
        {
          id: 'formatting',
          check: 'Does formatting preserve exactly two decimal places without dividing by 100.0?',
          detail:
            '`BigDecimal.valueOf(cents, 2)` keeps the value exact. Dividing a long by a double creates the representation problem again.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac InvoiceTotals.java` and `java InvoiceTotals`. The normal invoice should print `59.97`, and the large one should be refused because its cents total exceeds the long range used by the test.',
        'Temporarily replace `multiplyExact` with a plain `*` and an `int` cast. Explain where the value wraps and why the printed result is plausible but wrong.',
        'Change the formatting to `cents / 100.0` and compare the output for a value such as `1_005` cents. Explain why the exact path is safer even when the display happens to match.',
      ],
    },
    recap: [
      'An integer type is a fixed-width bit pattern; the width decides its range before arithmetic begins.',
      'Two’s complement makes the sign part of the value and gives the minimum one extra negative step.',
      'Java integer overflow is defined wraparound, so use a wider type or exact methods when the domain can reach the edge.',
      'A double stores a binary approximation, so exact decimal comparisons and money need integer cents or BigDecimal with explicit rounding.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.bits-and-numbers.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l0.binary-representation', 'java.l0.integer-overflow'],
      prompt: 'What happens when a Java `int` addition exceeds `Integer.MAX_VALUE`?',
      options: [
        {
          id: 'throws',
          text: 'The JVM throws `ArithmeticException` automatically.',
        },
        {
          id: 'promotes',
          text: 'The result is promoted to `long` before the addition.',
        },
        {
          id: 'wraps',
          text: 'The result wraps to a negative value in the int range.',
        },
        {
          id: 'saturates',
          text: 'The result is clamped to `Integer.MAX_VALUE`.',
        },
      ],
      correctOptionId: 'wraps',
      explanation:
        'Java integer arithmetic is modular. The result wraps modulo 2³², producing a valid int that is usually negative. Exact methods must be requested explicitly.',
    },
    {
      id: 'java.l0.bits-and-numbers.recall.q2',
      type: 'predict-output',
      concepts: ['java.l0.integer-overflow'],
      prompt: 'What does this program print?',
      code: `final class Total {
    public static void main(String[] args) {
        int total = 1_000_000;
        total *= 3_000;
        System.out.println(total);
    }
}`,
      codeLanguage: 'java',
      expectedOutput: '-1294967296',
      acceptedOutputs: ['-1294967296'],
      explanation:
        'The mathematical product is 3,000,000,000, which is greater than `Integer.MAX_VALUE`. Subtracting 2³² gives −1,294,967,296. Compound assignment performs the multiplication as an int, so the narrowing happens as part of the defined wraparound.',
    },
    {
      id: 'java.l0.bits-and-numbers.recall.q3',
      type: 'explain',
      concepts: ['java.l0.floating-point'],
      prompt:
        'Explain why `0.1 + 0.2` is not exactly `0.3` in Java, and describe how you would calculate a refund in cents safely.',
      keyPoints: [
        '`0.1` and `0.2` are rounded to the nearest binary floating-point values before the addition.',
        'The sum is another approximation, so comparing it with the double for `0.3` fails.',
        'Money should be stored as integer cents in a long, or as BigDecimal with an explicit scale and rounding mode.',
        'Rounding should happen once at a defined boundary, not repeatedly during the calculation.',
      ],
      modelAnswer:
        'A double stores a sign, a binary exponent, and a binary fraction. Most decimal fractions, including 0.1 and 0.2, have no exact finite representation in base two, so each literal is rounded when it is created. Adding the two stored values produces the nearest double to their sum, which is 0.30000000000000004 rather than the double for 0.3. For a refund I would keep the amount in integer cents and use exact arithmetic, or use BigDecimal constructed from strings or integers. I would choose a scale and rounding mode explicitly and round once at the boundary where the business rule applies.',
      explanation:
        'The strong answer separates representation from arithmetic and names a concrete exact type. An epsilon is acceptable for measurements with a tolerance, but it is not a money policy.',
    },
  ],
});
