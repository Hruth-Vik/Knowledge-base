import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.rounding-refund',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'text-and-numbers',
    title: 'Text and Numbers',
  },
  sequence: 5,
  slug: 'rounding-refund',
  title: 'The Refund That Lost a Cent',
  deck: 'Three equal refunds of 6.66 add up to 19.98. The missing cent was not lost in the database; it was lost when each share was rounded in isolation.',
  kind: 'incident-story',
  estimatedMinutes: 13,
  tags: ['money', 'rounding', 'bigdecimal', 'floating-point', 'incident'],
  concepts: [
    {
      id: 'java.l1.binary-fraction',
      title: 'Binary fraction approximation',
      kind: 'term',
      summary: [
        'A double stores a binary fraction, so most decimal amounts are not exact.',
        'The stored value is the nearest representable double, slightly above or below the decimal.',
        'Two exact-looking decimals can compare unequal after arithmetic on their approximations.',
      ],
      aliases: ['0.1 + 0.2', 'IEEE 754 money bug', 'decimal approximation'],
      tags: ['java', 'numbers', 'money'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.floating-point',
        },
        {
          type: 'commonly-confused-with',
          target: 'java.l1.decimal-scale',
        },
      ],
    },
    {
      id: 'java.l1.decimal-scale',
      title: 'Decimal scale and rounding mode',
      kind: 'mechanism',
      summary: [
        'BigDecimal stores an unscaled integer plus a scale, so decimal values can stay exact.',
        'Rounding requires an explicit scale and RoundingMode; the policy is part of the result.',
        'Construct from a string or an integer when the decimal value is what you mean.',
      ],
      aliases: ['BigDecimal', 'RoundingMode', 'HALF_UP', 'scale'],
      tags: ['java', 'numbers', 'money'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.binary-fraction',
        },
      ],
    },
    {
      id: 'java.l1.penny-allocation',
      title: 'Penny allocation',
      kind: 'failure-mode',
      summary: [
        'Rounding each share independently can make the parts miss the total by a cent or more.',
        'Allocate integer cents: floor each share, then distribute the remainder deterministically.',
        'The invariant is exact: the allocated parts must sum to the original total.',
      ],
      aliases: ['remainder allocation', 'largest remainder', 'split rounding'],
      tags: ['java', 'money', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.decimal-scale',
        },
      ],
    },
  ],
  revisits: [
    'java.l0.floating-point',
    'java.l0.integer-overflow',
    'java.l1.numeric-promotion',
  ],
  versionCaveats: [
    'Examples target Java 21 LTS. BigDecimal is exact for decimal values constructed from strings or integers, but every division needs a scale and rounding mode or it can throw ArithmeticException for a non-terminating expansion.',
    'HALF_UP is common for customer-facing money, while HALF_EVEN is common in financial and statistical systems. The correct mode is a business rule; this lesson does not claim one is universally right.',
    'The examples keep amounts in long cents or BigDecimal. They do not model tax, currency conversion, or accounting rules, which need their own documented policy.',
  ],
  references: [
    {
      title: 'Java SE 21 API: BigDecimal',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html',
      note: 'Scale, unscaled value, the string constructor, and the division methods that require a rounding mode.',
    },
    {
      title: 'Java SE 21 API: RoundingMode',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/RoundingMode.html',
      note: 'The defined rounding policies, including HALF_UP and HALF_EVEN.',
    },
    {
      title: 'Java Language Specification: Floating-Point Types',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.3',
      note: 'The IEEE 754 representation that makes most decimal fractions approximate.',
    },
  ],
  sections: {
    problem:
      'A customer returns an order worth €19.99 and asks for the refund to be split equally across three payment methods. The service computes one third, rounds it to two decimals, and issues 6.66 to each method. The customer receives 19.98. Reconciliation flags a one-cent shortfall, and the support agent cannot explain where it went.\n\nA second service refunds a percentage of each line item and rounds every line before summing. Depending on the basket, the refund is a cent high or a cent low. Both programs use ordinary rounding, and both are locally reasonable. The defect is treating a rounded share as if it were exact, and treating a double as if it stored a decimal amount.',
    analogy: {
      title: 'Splitting a bill in coins',
      body:
        'You owe 19.99 and three people split it equally. Each person’s mathematical share is 6.6633…, but the smallest coin is one cent. You hand out 6.66 to each person and keep the remaining cent on the table. Someone has to take it, or the bill is not settled.\n\nA fair rule is to give the leftover cents to the shares with the largest discarded fractions, with a deterministic tie-break. The total never changes; only the distribution of the indivisible remainder does.',
      mapping: [
        {
          technical: 'A decimal amount such as 19.99',
          everyday: 'A bill that must be settled in whole cents',
        },
        {
          technical: 'The exact quotient 19.99 / 3',
          everyday: 'The mathematical share before coins',
        },
        {
          technical: 'Rounding to two decimals',
          everyday: 'Handing out whole cents',
        },
        {
          technical: 'The leftover cent',
          everyday: 'The coin left on the table',
        },
        {
          technical: 'Remainder allocation',
          everyday: 'A deterministic rule for who takes the extra cent',
        },
      ],
      whereItBreaks:
        'Coins are physical and the group can see the leftover cent. A program rounds each share in a separate calculation and often has no place where the total is checked. The analogy also assumes equal weights; real refunds are weighted by line price or tax, so the remainder rule has to use those weights or a documented tie-break.',
    },
    mentalModel: {
      title: 'Split the total, then reconcile the remainder',
      figure: {
        width: 960,
        height: 380,
        caption:
          'A total in integer cents is split by weight. Floor shares leave a remainder, which is distributed one cent at a time so the parts sum exactly to the original total.',
        alt: 'A diagram showing 1999 cents split into three floor shares of 666 cents, a remainder of one cent, and a final allocation of 667, 666, 666. A separate branch shows double arithmetic producing an approximate decimal instead of an exact cent total.',
        nodes: [
          {
            id: 'total',
            label: '1999 cents',
            detail: 'the exact refund total',
            x: 16,
            y: 72,
            width: 180,
            height: 88,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'weights',
            label: 'weights 1 : 1 : 1',
            detail: 'three equal shares',
            x: 232,
            y: 72,
            width: 180,
            height: 88,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'floor',
            label: 'floor shares',
            detail: '666 + 666 + 666',
            x: 448,
            y: 72,
            width: 180,
            height: 88,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'remainder',
            label: 'remainder 1',
            detail: 'unassigned cent',
            x: 448,
            y: 196,
            width: 180,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'final',
            label: '667 · 666 · 666',
            detail: 'sum = 1999',
            x: 664,
            y: 72,
            width: 200,
            height: 88,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'double',
            label: 'double path',
            detail: '6.663333… per share',
            x: 232,
            y: 196,
            width: 180,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'short',
            label: '19.98',
            detail: 'one cent short',
            x: 664,
            y: 196,
            width: 200,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'total',
            to: 'weights',
            label: 'apply',
            kind: 'flow',
          },
          {
            from: 'weights',
            to: 'floor',
            label: 'divide',
            kind: 'flow',
          },
          {
            from: 'floor',
            to: 'remainder',
            label: 'subtract',
            kind: 'flow',
          },
          {
            from: 'floor',
            to: 'final',
            label: 'allocate',
            kind: 'flow',
          },
          {
            from: 'remainder',
            to: 'final',
            label: 'one cent each',
            kind: 'flow',
          },
          {
            from: 'double',
            to: 'short',
            label: 'round each',
            kind: 'contrast',
          },
          {
            from: 'total',
            to: 'double',
            label: 'if stored as double',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 344,
            text: 'Keep the total in integer cents or BigDecimal from the start.',
          },
          {
            x: 448,
            y: 344,
            text: 'The remainder is cents, not an error to discard.',
          },
          {
            x: 664,
            y: 344,
            text: 'The invariant: allocated parts equal the original total.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Follow one decimal amount from its binary storage into a rounded share, then replace per-share rounding with an allocation that reconciles the remainder.',
      steps: [
        {
          title: 'A double does not store a decimal amount',
          body:
            'A `double` stores a binary significand and exponent. The literal `19.99` is rounded to the nearest representable binary value, which is not exactly 19.99. Adding tax, multiplying by a percentage, or dividing by three operates on that approximation. The final printed value may look right because `Double.toString` chooses the shortest text that round-trips, not because the stored number is the decimal you wrote.\n\nThis matters most at exact boundaries. A value that should be exactly 6.00 can be 5.999999999999999, and a comparison or a floor operation then lands on the wrong side. Floating point is appropriate for measurements with a tolerance, not for money with a required scale.',
          code: {
            filename: 'Fractions.java',
            language: 'java',
            code: `import java.math.BigDecimal;

final class Fractions {
    public static void main(String[] args) {
        double sum = 0.1 + 0.2;
        System.out.println(sum);
        System.out.println(new BigDecimal(0.1));
        System.out.println(new BigDecimal("0.1"));
        System.out.println(new BigDecimal("19.99").add(new BigDecimal("0.30")));
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'Each literal is already an approximation before the addition runs.',
              },
              {
                line: 6,
                note: 'The sum is the nearest double to the sum of two approximations.',
              },
              {
                line: 7,
                note: 'The double constructor exposes the full stored approximation.',
              },
              {
                line: 8,
                note: 'The string constructor preserves the decimal value 0.1 exactly.',
              },
              {
                line: 9,
                note: 'Decimal arithmetic on strings keeps the scale exact.',
              },
            ],
            output: `0.30000000000000004
0.1000000000000000055511151231257827021181583404541015625
0.1
20.29`,
          },
        },
        {
          title: 'Scale and rounding mode are part of the answer',
          body:
            'A `BigDecimal` is an unscaled integer and a scale: `19.99` is 1999 with scale 2. It can represent that decimal exactly. It does not guess what to do with a non-terminating quotient, so division requires a scale and a rounding mode. `setScale` likewise requires a policy when digits are discarded.\n\n`HALF_UP` rounds a half away from zero; `HALF_EVEN` rounds to the nearest even digit. The choice is a business rule, not a formatting detail. The same values can produce different customer-facing totals under different modes. Make the mode explicit and test the half-cent cases.',
          code: {
            filename: 'Scales.java',
            language: 'java',
            code: `import java.math.BigDecimal;
import java.math.RoundingMode;

final class Scales {
    public static void main(String[] args) {
        BigDecimal amount = new BigDecimal("19.985");
        System.out.println(amount.setScale(2, RoundingMode.HALF_UP));
        System.out.println(amount.setScale(2, RoundingMode.HALF_EVEN));
        System.out.println(new BigDecimal("19.99").multiply(new BigDecimal("0.30")));
        System.out.println(new BigDecimal("19.99")
                .multiply(new BigDecimal("0.30"))
                .setScale(2, RoundingMode.HALF_UP));
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The string constructor keeps the three decimal digits exactly.',
              },
              {
                line: 7,
                note: 'HALF_UP rounds the half away from zero, giving 19.99.',
              },
              {
                line: 8,
                note: 'HALF_EVEN rounds to the even digit, giving 19.98.',
              },
              {
                line: 9,
                note: 'Multiplication adds the scales, so the exact product keeps four decimal places.',
              },
              {
                line: 12,
                note: 'A scale and mode turn the exact product into a policy-driven money amount.',
              },
            ],
            output: `19.99
19.98
5.9970
6.00`,
          },
        },
        {
          title: 'Rounding each share breaks the total',
          body:
            'If a total is divided into three shares and each share is rounded to two decimals, the three rounded shares do not necessarily add back to the total. The mathematical quotient has a repeating fraction; rounding shortens every copy independently. The missing part is not a floating-point anomaly. It is the expected consequence of rounding a part instead of allocating the total.\n\nThe same thing happens with percentages: each line is rounded on its own, then the lines are summed. The fix is to compute in the smallest indivisible unit, allocate floor shares, and distribute the remainder. Keep the sum check in code, not in a comment.',
          code: {
            filename: 'Thirds.java',
            language: 'java',
            code: `import java.math.BigDecimal;
import java.math.RoundingMode;

final class Thirds {
    public static void main(String[] args) {
        BigDecimal total = new BigDecimal("19.99");
        BigDecimal part = total.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);
        System.out.println(part);
        System.out.println(part.multiply(new BigDecimal("3")));
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The total is exact because it was constructed from a string.',
              },
              {
                line: 7,
                note: 'Divisions need an explicit scale and rounding mode.',
              },
              {
                line: 9,
                note: 'Multiplying the rounded part back reveals the one-cent gap.',
              },
            ],
            output: `6.66
19.98`,
          },
        },
        {
          title: 'Allocate the remainder, then assert the sum',
          body:
            'Work in integer cents. For each share, compute the floor of its weighted portion and subtract the assigned cents from the total. The difference is a small number of cents. Distribute those cents by a deterministic rule, such as largest discarded fraction with a stable tie-break. The parts now sum to the original total by construction.\n\nFor equal shares the rule is simple: give the first `remainder` shares one extra cent. For weighted shares, compute the exact fractional remainder for each line, sort by it, and allocate until it is gone. Whatever rule you choose, write the invariant check and a test with a total that does not divide evenly.',
          code: {
            filename: 'Allocate.java',
            language: 'java',
            code: `import java.util.Arrays;

final class Allocate {
    static long[] split(long totalCents, int parts) {
        long base = totalCents / parts;
        long remainder = totalCents % parts;
        long[] shares = new long[parts];
        Arrays.fill(shares, base);
        for (int index = 0; index < remainder; index++) {
            shares[index]++;
        }
        return shares;
    }

    public static void main(String[] args) {
        long[] shares = split(1999, 3);
        long sum = 0;
        for (long share : shares) {
            sum += share;
        }
        System.out.println(Arrays.toString(shares));
        System.out.println(sum);
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'Integer division gives every share its floor amount in cents.',
              },
              {
                line: 6,
                note: 'The remainder is the number of cents still unassigned.',
              },
              {
                line: 10,
                note: 'The first shares receive the extra cents; the rule is deterministic.',
              },
              {
                line: 20,
                note: 'The explicit sum is the invariant that per-share rounding cannot guarantee.',
              },
            ],
            output: `[667, 666, 666]
1999`,
          },
        },
      ],
      outro:
        'Decimal amounts need an exact representation. Rounding needs an explicit scale and mode. A split needs an allocation rule for the remainder and a check that the parts still sum to the whole.',
    },
    code: {
      intro:
        'First see the binary approximation, then compute an exact refund with a documented rounding policy.',
      minimal: {
        filename: 'Refund.java',
        language: 'java',
        code: `import java.math.BigDecimal;
import java.math.RoundingMode;

final class Refund {
    public static void main(String[] args) {
        double approximate = 0.1 + 0.2;
        BigDecimal exact = new BigDecimal("19.99").multiply(new BigDecimal("0.30"));
        BigDecimal rounded = exact.setScale(2, RoundingMode.HALF_UP);
        System.out.println(approximate);
        System.out.println(exact);
        System.out.println(rounded);
    }
}`,
        annotations: [
          {
            line: 6,
            note: 'The double path produces the familiar representation artifact.',
          },
          {
            line: 7,
            note: 'The string-based BigDecimal path keeps the decimal amount and the scale.',
          },
          {
            line: 8,
            note: 'The rounding policy is explicit: two decimal places, half away from zero.',
          },
        ],
        output: `0.30000000000000004
5.9970
6.00`,
      },
      realistic: {
        filename: 'SplitRefund.java',
        language: 'java',
        code: `import java.math.BigDecimal;

final class SplitRefund {
    static long[] allocate(long totalCents, int[] weights) {
        long weightTotal = 0;
        for (int weight : weights) {
            weightTotal += weight;
        }

        long[] shares = new long[weights.length];
        long assigned = 0;
        for (int index = 0; index < weights.length; index++) {
            shares[index] = totalCents * weights[index] / weightTotal;
            assigned += shares[index];
        }

        long remainder = totalCents - assigned;
        for (int index = 0; index < remainder; index++) {
            shares[index % shares.length]++;
        }
        return shares;
    }

    public static void main(String[] args) {
        long[] shares = allocate(1999, new int[] { 1, 1, 1 });
        long sum = 0;
        for (long share : shares) {
            sum += share;
            System.out.println(BigDecimal.valueOf(share, 2));
        }
        System.out.println("sum=" + BigDecimal.valueOf(sum, 2));
    }
}`,
        annotations: [
          {
            line: 12,
            note: 'Each weighted share is floored in integer cents; no double enters the calculation.',
          },
          {
            line: 17,
            note: 'The remainder is exactly the number of cents not yet assigned.',
          },
          {
            line: 19,
            note: 'The extra cents are distributed deterministically, so a rerun produces the same split.',
          },
          {
            line: 29,
            note: 'BigDecimal.valueOf(cents, 2) formats the exact cent count without dividing by 100.0.',
          },
          {
            line: 31,
            note: 'The printed sum is the invariant: it must equal the original 19.99.',
          },
        ],
        output: `6.67
6.66
6.66
sum=19.99`,
      },
    },
    breakIt: {
      title: 'The refund that was a cent short',
      scenario:
        'A return is refunded equally across three payment methods. The service rounds one third to two decimals and sends that amount to each method. Finance reconciles the three refunds against the original charge and finds a one-cent shortfall. The code is correct at every individual step; the total is checked only after the money has moved.',
      brokenCode: {
        filename: 'Thirds.java',
        language: 'java',
        code: `import java.math.BigDecimal;
import java.math.RoundingMode;

final class Thirds {
    static BigDecimal third(BigDecimal total) {
        return total.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);
    }

    public static void main(String[] args) {
        BigDecimal total = new BigDecimal("19.99");
        BigDecimal part = third(total);
        System.out.println(part);
        System.out.println(part.multiply(new BigDecimal("3")));
    }
}`,
      },
      predictionPrompt:
        'The division is exact to two decimals and uses HALF_UP. Why does multiplying the result by three not reproduce 19.99?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `6.66` and then `19.98`. The refund total is one cent less than the charge, even though every line was rounded with a valid policy.',
        explanation:
          'The exact quotient 19.99 / 3 is 6.66333…; rounding it to two decimals gives 6.66. Three copies of 6.66 are 19.98. The missing cent is the accumulated discarded fraction, and rounding each share independently cannot recover it. No exception is thrown because every operation is valid for its own inputs.',
        repair:
          'Keep the total in integer cents and allocate: 1999 / 3 is 666 with remainder 1. Give the extra cent to one share by a documented rule, producing 667 + 666 + 666 = 1999. If the split is weighted, compute the floor shares and distribute the remainder by largest discarded fraction with a stable tie-break. Assert the sum before sending any refund.',
        correctedCode: {
          filename: 'Allocate.java',
          language: 'java',
          code: `import java.math.BigDecimal;

final class Allocate {
    static long[] split(long totalCents, int parts) {
        long base = totalCents / parts;
        long remainder = totalCents % parts;
        long[] shares = new long[parts];
        java.util.Arrays.fill(shares, base);
        for (int index = 0; index < remainder; index++) {
            shares[index]++;
        }
        return shares;
    }

    public static void main(String[] args) {
        long[] shares = split(1999, 3);
        long sum = 0;
        for (long share : shares) {
            sum += share;
        }
        System.out.println(java.util.Arrays.toString(shares));
        System.out.println(BigDecimal.valueOf(sum, 2));
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated money code often looks careful because it rounds explicitly. These patterns round the wrong thing or at the wrong boundary.',
      mistakes: [
        {
          title: 'Using double for an amount',
          generatedPattern:
            '“Store the price as a double and round the final total to two decimals. The display will look right.”',
          whyItFails:
            'The stored value is a binary approximation before any rounding. A sum, a percentage, or a split can land just below a cent boundary, and `Math.round` then produces the wrong cent. The display may hide the problem while the ledger keeps it.',
          correction:
            'Use long integer cents or BigDecimal constructed from strings or integers. Choose the scale and rounding mode once, at the domain boundary, and test values around .005.',
          telltale:
            'A money field typed as double or float, or a total that is repeatedly multiplied by 100, rounded, and divided by 100.0.',
        },
        {
          title: 'Constructing BigDecimal from a double',
          generatedPattern:
            '“I converted the double to BigDecimal with `new BigDecimal(amount)` so the calculation is exact.”',
          whyItFails:
            'The constructor takes the exact binary value of the double, including its approximation, and preserves all of it. The result is exact arithmetic on the wrong number, often with a long tail of digits.',
          correction:
            'Construct from a string or from integer cents: `new BigDecimal("19.99")` or `BigDecimal.valueOf(cents, 2)`. Use `BigDecimal.valueOf(double)` only when the double’s shortest decimal representation is the intended value.',
          telltale:
            '`new BigDecimal(` applied to a double variable, or amounts with long non-decimal tails after conversion.',
        },
        {
          title: 'Rounding every line and assuming the total',
          generatedPattern:
            '“I round each line item to two decimals, then sum them. The total is just the sum.”',
          whyItFails:
            'Each line’s discarded fraction is gone before the sum. The sum of rounded parts need not equal the rounded sum of exact parts. The gap grows with the number of lines and can go in either direction.',
          correction:
            'Allocate the exact total in cents and distribute the remainder, or round the total once and reconcile the line amounts against it. Make the invariant explicit and fail the operation if it does not hold.',
          telltale:
            'A loop that rounds each line and immediately accumulates the result, with no reconciliation step.',
        },
        {
          title: 'Using Math.round as a money policy',
          generatedPattern:
            '“`Math.round(value * 100) / 100.0` gives me two decimal places. It is standard Java rounding.”',
          whyItFails:
            'The multiplication and division are double operations, so the value is still approximate. `Math.round` rounds to the nearest long, not to a decimal scale, and it has no mode for half-even or other policies. Negative amounts and large values add their own edge cases.',
          correction:
            'Use BigDecimal with an explicit scale and RoundingMode, or integer cents with a documented allocation rule. Treat the policy as a domain decision and test half-cent positives, negatives, and zero.',
          telltale:
            '`Math.round(... * 100) / 100.0` or `Math.round(... * 100.0) / 100.0` in a money path.',
        },
      ],
      reviewChecklist: [
        'Is every monetary amount stored as integer cents or BigDecimal rather than double?',
        'Is every BigDecimal constructed from a string or integer, not from a double?',
        'Does every division and setScale call name a scale and rounding mode?',
        'Is there an allocation step and an assertion that the parts sum to the total?',
        'Are half-cent and non-dividing totals covered by tests?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is checking whether you can separate representation, rounding policy, and allocation. A slogan about BigDecimal is only the start.',
      questions: [
        {
          id: 'java.l1.rounding-refund.interview.1',
          difficulty: 'junior',
          question: 'Why is `0.1 + 0.2` not equal to `0.3` in Java?',
          modelAnswer:
            'The literals are stored as the nearest binary floating-point values, not as exact decimal fractions. Adding those approximations produces another double that is close to 0.3 but not identical to the double for 0.3. The comparison with `==` is therefore false. For exact decimal values I would use BigDecimal constructed from strings or integer cents, not a double.',
          weakAnswer:
            'Floating point is imprecise, so I add a small epsilon and compare that way. For money it is fine after rounding.',
          strongAnswer:
            'The issue is representation: most decimal fractions are repeating in base two, so each literal is rounded before the operation. An epsilon can be reasonable for measurements with a known tolerance, but it is not an exact money policy. BigDecimal or integer cents keeps the decimal amount and makes the rounding boundary explicit.',
          followUp: 'What does `new BigDecimal(0.1)` print, and why is it different from `new BigDecimal("0.1")`?',
        },
        {
          id: 'java.l1.rounding-refund.interview.2',
          difficulty: 'mid',
          question:
            'A refund is split three ways and each share is rounded to two decimals. Why can the total be off by a cent, and how would you fix it?',
          modelAnswer:
            'Rounding each share independently discards a fraction from every share. The sum of the rounded shares is not guaranteed to equal the rounded total. I would allocate integer cents: divide the total by three, keep the remainder, and distribute the remaining cents by a deterministic rule. Then I would assert that the shares sum to the original total before issuing them.',
          weakAnswer:
            'Add the missing cent to the last share, or use a bigger scale internally and round at the end.',
          strongAnswer:
            'A bigger internal scale reduces display error but does not solve indivisible cents unless the final allocation reconciles. I would make the total the authority, floor the shares in cents, and distribute the remainder. If the split is weighted, I would use the largest discarded fractions with a stable tie-break. The invariant check is part of the operation, not a later reconciliation report.',
          followUp: 'How would you make the tie-break deterministic across two service instances?',
        },
        {
          id: 'java.l1.rounding-refund.interview.3',
          difficulty: 'senior',
          question:
            'How would you establish a money-handling standard for a team that has several services using doubles?',
          modelAnswer:
            'I would define the representation, scale, rounding modes, and allocation rules as a shared contract. Amounts at rest become integer minor units or BigDecimal with a known scale; doubles are banned at the boundary. I would provide shared value types or utilities for parsing, formatting, splitting, and reconciling, and test them with half-cent, negative, large, and non-dividing cases. Migration would start at the external edges, with reconciliation checks comparing old and new calculations before switching traffic.',
          weakAnswer:
            'Tell everyone to use BigDecimal and round with HALF_UP. That solves the precision problem.',
          strongAnswer:
            'BigDecimal alone does not decide scale, division behavior, or how a remainder is allocated, and a mixed codebase can still convert through double at an adapter. I would make the invariants executable: amount types that reject doubles, a documented rounding policy per currency, allocation helpers with sum checks, and property-based tests. I would also inspect database column types, JSON serialization, and reporting exports, because precision can be lost outside Java.',
          followUp: 'What would you monitor after the migration to catch a regression in production?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a refund allocator that never loses a cent',
      brief:
        'Write a method that allocates a refund total in integer cents across weighted line items. Floor each weighted share, distribute the remaining cents deterministically, and prove that the shares always sum to the original total. Include a total that does not divide evenly and a weighted case.',
      constraints: [
        'Accept a total in long cents and a non-empty array of positive integer weights.',
        'Use integer arithmetic only; do not use double or float.',
        'Floor each weighted share, then distribute the remainder by a documented rule.',
        'Assert or return an error if the allocated shares do not sum to the total.',
        'Format the result with BigDecimal.valueOf(cents, 2), not division by 100.0.',
        'Test an equal split of 1999 cents and at least one uneven weighted split.',
      ],
      starterCode: {
        filename: 'RefundAllocator.java',
        language: 'java',
        code: `import java.math.BigDecimal;

final class RefundAllocator {
    static long[] allocate(long totalCents, int[] weights) {
        // Floor the weighted shares and distribute the remainder.
        return new long[weights.length];
    }

    public static void main(String[] args) {
        // Print an equal split, a weighted split, and the sum of each.
    }
}`,
      },
      referenceSolution: {
        filename: 'RefundAllocator.java',
        language: 'java',
        code: `import java.math.BigDecimal;
import java.util.Arrays;

final class RefundAllocator {
    static long[] allocate(long totalCents, int[] weights) {
        if (weights.length == 0) {
            throw new IllegalArgumentException("at least one weight is required");
        }

        long weightTotal = 0;
        for (int weight : weights) {
            if (weight <= 0) {
                throw new IllegalArgumentException("weights must be positive");
            }
            weightTotal += weight;
        }

        long[] shares = new long[weights.length];
        long assigned = 0;
        for (int index = 0; index < weights.length; index++) {
            shares[index] = totalCents * weights[index] / weightTotal;
            assigned += shares[index];
        }

        long remainder = totalCents - assigned;
        for (int index = 0; index < remainder; index++) {
            shares[index % shares.length]++;
        }
        return shares;
    }

    static void print(String label, long totalCents, int[] weights) {
        long[] shares = allocate(totalCents, weights);
        long sum = 0;
        for (long share : shares) {
            sum += share;
        }
        if (sum != totalCents) {
            throw new IllegalStateException(label + " does not reconcile");
        }
        System.out.println(label + ": " + Arrays.toString(shares)
                + " -> " + BigDecimal.valueOf(totalCents, 2));
    }

    public static void main(String[] args) {
        print("equal", 1999, new int[] { 1, 1, 1 });
        print("weighted", 1000, new int[] { 3, 1 });
    }
}`,
        annotations: [
          {
            line: 21,
            note: 'The weighted share is floored in integer cents; no floating-point value is involved.',
          },
          {
            line: 25,
            note: 'The remainder is the exact number of cents still unassigned.',
          },
          {
            line: 27,
            note: 'The documented rule gives extra cents in index order, which is deterministic.',
          },
          {
            line: 41,
            note: 'The sum check turns the allocation invariant into an executable failure.',
          },
          {
            line: 42,
            note: 'Formatting uses the exact cent count, so the display cannot reintroduce a double error.',
          },
        ],
      },
      rubric: [
        {
          id: 'integer-cents',
          check: 'Does the computation stay in integer cents for the entire allocation?',
          detail:
            'A single double or float in the split reintroduces the representation problem this exercise is meant to remove.',
          mustPass: true,
        },
        {
          id: 'sum-invariant',
          check: 'Does the program verify that the shares sum exactly to the requested total?',
          detail:
            'The invariant is the whole point: locally valid rounding can still leave the parts short or over.',
          mustPass: true,
        },
        {
          id: 'deterministic-remainder',
          check: 'Is the remainder distributed by a documented, repeatable rule?',
          detail:
            'A nondeterministic split makes reconciliation and retries disagree even when the total is right.',
          mustPass: true,
        },
        {
          id: 'weighted-case',
          check: 'Does the demonstration include an uneven weighted split, not only equal shares?',
          detail:
            'Equal splits are the simplest case; weights expose floor and remainder behavior that equal shares hide.',
          mustPass: false,
        },
        {
          id: 'formatting',
          check: 'Are amounts formatted with BigDecimal.valueOf(cents, 2) rather than division by 100.0?',
          detail:
            'Formatting is part of the money boundary and should not reintroduce binary floating point.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac RefundAllocator.java` and `java RefundAllocator`. The equal case should print `[667, 666, 666]` and 19.99; the weighted case should sum to 10.00.',
        'Change the total to 1000 cents with weights 1:1:1 and confirm the split sums to 1000 even though the remainder is 1.',
        'Temporarily replace the integer division with `Math.round(totalCents * 1.0 / weights.length)` and show how a double becomes part of the money path.',
      ],
    },
    recap: [
      'A double stores a binary approximation, so decimal money needs integer cents or BigDecimal from strings.',
      'BigDecimal rounding requires an explicit scale and mode; HALF_UP and HALF_EVEN can disagree at a half cent.',
      'Rounding each share independently can make the parts miss the total.',
      'Allocate integer cents, distribute the remainder deterministically, and assert that the parts sum to the whole.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.rounding-refund.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.binary-fraction', 'java.l1.decimal-scale'],
      prompt: 'Which constructor preserves the decimal value `0.1` exactly?',
      options: [
        {
          id: 'double',
          text: '`new BigDecimal(0.1)`',
        },
        {
          id: 'string',
          text: '`new BigDecimal("0.1")`',
        },
        {
          id: 'float',
          text: '`new BigDecimal(0.1f)`',
        },
        {
          id: 'value',
          text: '`BigDecimal.valueOf(0.1).doubleValue()`',
        },
      ],
      correctOptionId: 'string',
      explanation:
        'The string constructor parses the decimal text directly. A double or float constructor preserves the binary approximation already stored in the primitive, so the BigDecimal is exact about the wrong number.',
    },
    {
      id: 'java.l1.rounding-refund.recall.q2',
      type: 'predict-output',
      concepts: ['java.l1.penny-allocation'],
      prompt: 'What does this program print?',
      code: `import java.math.BigDecimal;\nimport java.math.RoundingMode;\n\nfinal class Third {\n    public static void main(String[] args) {\n        BigDecimal part = new BigDecimal("19.99")\n                .divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);\n        System.out.println(part.multiply(new BigDecimal("3")));\n    }\n}`,
      codeLanguage: 'java',
      expectedOutput: '19.98',
      acceptedOutputs: ['19.98'],
      explanation:
        '19.99 / 3 is 6.66333…, rounded to 6.66. Multiplying the rounded share by three gives 19.98, one cent short. The exact total must be allocated, not reconstructed from rounded shares.',
    },
    {
      id: 'java.l1.rounding-refund.recall.q3',
      type: 'explain',
      concepts: ['java.l1.penny-allocation', 'java.l1.decimal-scale'],
      prompt:
        'Explain why rounding each line item of a refund can make the sum wrong, and describe the allocation rule you would use instead.',
      keyPoints: [
        'Each line’s discarded fraction is removed before the lines are summed, so the parts need not add up to the rounded total.',
        'The error can be a cent or more and can go in either direction as the number of lines grows.',
        'Work in integer cents: floor each weighted share and keep the unassigned remainder.',
        'Distribute the remainder by a deterministic rule, such as largest discarded fraction with a stable tie-break, and assert the sum.',
      ],
      modelAnswer:
        'Rounding is not additive. If I round each line independently, I discard a fraction from every line, and the sum of the rounded lines can differ from the rounded sum of the exact values. I would keep the refund total as an exact integer number of cents, compute each line’s floor share, subtract the assigned cents, and distribute the remaining cents by a documented rule. Then I would assert that the shares sum to the total before issuing them. The rule makes the split reproducible and keeps the ledger balanced.',
      explanation:
        'Strong answers explain the non-additivity and name an exact allocation invariant. “Add the cent to the last line” can work as a rule, but only if it is deterministic and the sum is checked.',
    },
  ],
});
