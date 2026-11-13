import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.strings',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'text-and-numbers',
    title: 'Text and Numbers',
  },
  sequence: 2,
  slug: 'strings',
  title: 'Strings Are Immutable, Not Free',
  deck: 'Every change creates a new String. Interning explains the identity surprises; immutability explains the safety and the cost.',
  kind: 'standard',
  estimatedMinutes: 16,
  tags: ['strings', 'immutability', 'interning', 'stringbuilder', 'performance'],
  concepts: [
    {
      id: 'java.l1.string-immutability',
      title: 'String immutability',
      kind: 'principle',
      summary: [
        'A String’s contents never change after construction.',
        'Operations such as replace, substring, and concat return another String.',
        'Immutability makes sharing safe and lets a String cache its hash code.',
      ],
      aliases: ['immutable text', 'String value object'],
      tags: ['java', 'strings'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.reference-equality',
        },
      ],
    },
    {
      id: 'java.l1.string-pool',
      title: 'String interning',
      kind: 'mechanism',
      summary: [
        'String literals and compile-time constants share interned instances.',
        'new String always creates a distinct object, even with equal contents.',
        'Interning saves memory for repeated values but retains them for the process lifetime.',
      ],
      aliases: ['intern pool', 'string literal pool', 'intern()'],
      tags: ['java', 'strings', 'memory'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.string-immutability',
        },
        {
          type: 'depends-on',
          target: 'java.l1.reference-equality',
        },
      ],
    },
    {
      id: 'java.l1.string-building',
      title: 'String building',
      kind: 'mechanism',
      summary: [
        'Repeated concatenation creates a new String and copies the accumulated text.',
        'A loop can therefore do quadratic copying and allocation.',
        'StringBuilder appends into a mutable buffer and materializes one String.',
      ],
      aliases: ['StringBuilder', 'concatenation cost', 'quadratic string building'],
      tags: ['java', 'strings', 'performance'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.string-immutability',
        },
      ],
    },
  ],
  revisits: ['java.l1.reference-equality', 'java.l1.equals-contract', 'java.l0.stack-and-heap'],
  versionCaveats: [
    'Examples target Java 21 LTS. Since Java 9, String uses a compact byte array plus a coder for Latin-1 or UTF-16; the internal representation is not part of the public contract.',
    'String literals and compile-time constant expressions are interned by the language. Runtime-created strings are not automatically interned merely because their contents match a literal.',
    'The compiler lowers string concatenation to invokedynamic and StringConcatFactory in modern Java. The observable result is still a new String unless the expression is a compile-time constant.',
  ],
  references: [
    {
      title: 'Java SE 21 API: String',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html',
      note: 'The immutable String API, including intern and the methods that return new strings.',
    },
    {
      title: 'Java Language Specification: String Literals',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5',
      note: 'How literals are interned and why identical literals can be the same object.',
    },
    {
      title: 'Java SE 21 API: StringBuilder',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html',
      note: 'The mutable buffer designed for repeated appends.',
    },
  ],
  sections: {
    problem:
      'A string comparison passes in a unit test and fails in production. The test used two literals; production compares a literal with a value read from JSON. Another service builds a nightly export with `report += row` inside a loop. At ten thousand rows it is slow; at a million rows it spends most of its time copying text that already exists.\n\nBoth problems come from forgetting that a `String` is an immutable object. The variable is a reference, the text is shared and never edited in place, and every apparent edit produces another object. Identity and allocation follow from that one rule.',
    analogy: {
      title: 'Printed pages and a binder',
      body:
        'A printed page cannot be edited. If you need a corrected sentence, you print a new page. Two people can safely read the same page at once because neither can change it under the other.\n\nA binder is different. You can add pages to one binder, move them, and print the finished stack once at the end. Using a fresh printout for every added sentence is the `+=` loop. Using one binder is `StringBuilder`.',
      mapping: [
        {
          technical: 'An immutable String',
          everyday: 'A printed page that cannot be edited',
        },
        {
          technical: 'A method such as replace or substring',
          everyday: 'Printing a corrected page',
        },
        {
          technical: 'A string literal',
          everyday: 'A shared master copy kept in the archive',
        },
        {
          technical: 'StringBuilder',
          everyday: 'A binder you can add pages to',
        },
        {
          technical: 'toString() on the builder',
          everyday: 'Printing the finished binder once',
        },
      ],
      whereItBreaks:
        'A printed page is a separate physical object for every reader. The JVM can share one String object among many references, and it may store the characters in a compact byte array rather than a page-shaped structure. The binder analogy also implies that `StringBuilder` is always faster; for two or three fragments, the compiler’s concatenation can be just as good. The cost matters when the number of copies grows with the input.',
    },
    mentalModel: {
      title: 'One immutable value, many references',
      figure: {
        width: 960,
        height: 380,
        caption:
          'A literal can be interned and shared, while new String creates a distinct object. Concatenation produces another String; StringBuilder accumulates characters before one final String.',
        alt: 'A diagram showing two variables pointing at one interned literal, a separate new String object with the same contents, and a concatenation path that creates new strings. A StringBuilder branch appends into one buffer and produces a final String.',
        nodes: [
          {
            id: 'literal-a',
            label: 'a = "java"',
            detail: 'reference A',
            x: 16,
            y: 28,
            width: 160,
            height: 72,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'literal-b',
            label: 'b = "java"',
            detail: 'reference B',
            x: 16,
            y: 124,
            width: 160,
            height: 72,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'pool',
            label: 'interned "java"',
            detail: 'one shared object',
            x: 220,
            y: 72,
            width: 188,
            height: 96,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'new-string',
            label: 'new String("java")',
            detail: 'distinct object',
            x: 220,
            y: 220,
            width: 188,
            height: 96,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'concat',
            label: 'a + suffix',
            detail: 'new String each time',
            x: 468,
            y: 72,
            width: 184,
            height: 96,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'builder',
            label: 'StringBuilder',
            detail: 'append in place',
            x: 468,
            y: 220,
            width: 184,
            height: 96,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'final',
            label: 'one final String',
            detail: 'toString() once',
            x: 716,
            y: 146,
            width: 196,
            height: 96,
            shape: 'box',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'literal-a',
            to: 'pool',
            label: 'points to',
            kind: 'flow',
          },
          {
            from: 'literal-b',
            to: 'pool',
            label: 'points to',
            kind: 'flow',
          },
          {
            from: 'concat',
            to: 'final',
            label: 'copies',
            kind: 'flow',
          },
          {
            from: 'builder',
            to: 'final',
            label: 'materializes',
            kind: 'flow',
          },
          {
            from: 'new-string',
            to: 'pool',
            label: 'same text, different identity',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 330,
            text: '== compares references, not text.',
          },
          {
            x: 468,
            y: 330,
            text: 'A loop of + copies the accumulated text every iteration.',
          },
          {
            x: 716,
            y: 330,
            text: 'Immutable values are safe to share and cache.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Start with the object that never changes, then see how interning creates identity surprises and how repeated concatenation turns one small operation into quadratic work.',
      steps: [
        {
          title: 'A String is a final object with no mutators',
          body:
            'A `String` is a final class. Its public API has no method that changes the characters of an existing instance: `substring`, `replace`, `toUpperCase`, and `trim` all return a String. In modern Java the contents are stored in a compact byte array plus a coder, but the representation is deliberately hidden. Code should depend on immutability, not on the field layout.\n\nImmutability makes safe sharing possible. Two threads can read one String without synchronization, a map key cannot change underneath the hash, and the class can cache its hash code after the first computation. The cost is that every apparent edit needs another object.',
          code: {
            filename: 'Immutable.java',
            language: 'java',
            code: `final class Immutable {
    public static void main(String[] args) {
        String original = "  java  ";
        String trimmed = original.trim();
        String upper = trimmed.toUpperCase();

        System.out.println("[" + original + "]");
        System.out.println("[" + trimmed + "]");
        System.out.println("[" + upper + "]");
        System.out.println(original == trimmed);
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The original object keeps its spaces; trim cannot edit it in place.',
              },
              {
                line: 4,
                note: 'trim returns a different String, or the same instance when no change is needed.',
              },
              {
                line: 5,
                note: 'toUpperCase returns another object. The earlier values remain valid.',
              },
              {
                line: 10,
                note: 'The references are different because a new value was produced.',
              },
            ],
            output: `[  java  ]
[java]
[JAVA]
false`,
          },
        },
        {
          title: 'Literals are interned; new String is not',
          body:
            'A string literal is loaded from the class file’s constant pool and interned. Identical literals in the same program can therefore be the same object, and a compile-time constant expression such as `"ja" + "va"` is also a literal from the language’s point of view. This is an optimization, not a general equality rule.\n\n`new String("java")` explicitly creates a distinct object, even though its contents are equal. A string built at runtime from input, concatenation, or deserialization is normally distinct too. `intern()` asks the pool for the canonical instance, but it adds or retains an entry; it is not a free memory optimization.',
          code: {
            filename: 'Interning.java',
            language: 'java',
            code: `final class Interning {
    public static void main(String[] args) {
        String literal = "java";
        String sameLiteral = "java";
        String allocated = new String("java");
        String joined = "ja" + "va";

        System.out.println(literal == sameLiteral);
        System.out.println(literal == allocated);
        System.out.println(literal == joined);
        System.out.println(literal.equals(allocated));
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'Both literals can refer to the same interned object.',
              },
              {
                line: 5,
                note: 'new String creates a distinct object with equal contents.',
              },
              {
                line: 6,
                note: 'A constant expression is folded at compile time and is also interned.',
              },
              {
                line: 9,
                note: 'This identity comparison is false because the objects are different.',
              },
              {
                line: 11,
                note: 'equals compares the text, which is what application code wants.',
              },
            ],
            output: `true
false
true
true`,
          },
        },
        {
          title: 'Concatenation creates another String',
          body:
            'The `+` operator produces a new String when the expression is not a compile-time constant. In a loop, each iteration creates a new object, copies the previous characters, and appends the next fragment. The total copying is proportional to 1 + 2 + … + n, which is quadratic in the number of fragments.\n\nA `StringBuilder` keeps a mutable buffer and appends into it. It grows the buffer occasionally and produces one String at `toString()`. `String.join` and `Collectors.joining` are appropriate when the pieces already form a collection.',
          code: {
            filename: 'Building.java',
            language: 'java',
            code: `final class Building {
    static String slow(String[] rows) {
        String report = "";
        for (String row : rows) {
            report += row + "\\n";
        }
        return report;
    }

    static String fast(String[] rows) {
        StringBuilder report = new StringBuilder();
        for (String row : rows) {
            report.append(row).append('\\n');
        }
        return report.toString();
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'Each assignment creates a new String; the old one becomes garbage.',
              },
              {
                line: 5,
                note: 'The accumulated text is copied again on every iteration.',
              },
              {
                line: 12,
                note: 'The builder appends into one growing buffer.',
              },
              {
                line: 16,
                note: 'Only the final toString creates the immutable result.',
              },
            ],
          },
        },
        {
          title: 'Text blocks are constants, not mutable templates',
          body:
            'A text block is a multi-line string literal. The compiler removes incidental indentation and produces a constant String. It is useful for SQL, JSON fixtures, and readable test data, but it is still immutable: formatting a value into it creates another String.\n\nUse `formatted` or a builder when the content depends on runtime values. Do not build SQL by concatenating untrusted input; use a prepared statement. Immutability protects the text object, not the system that receives it.',
          code: {
            filename: 'Blocks.java',
            language: 'java',
            code: `final class Blocks {
    public static void main(String[] args) {
        String query = """
                select id, name
                from customer
                where id = ?
                """;
        System.out.println(query.lines().count());
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The text block is a compile-time constant with normalized indentation.',
              },
              {
                line: 4,
                note: 'The question mark is a placeholder for a prepared statement, not string interpolation.',
              },
              {
                line: 8,
                note: 'The resulting String is still immutable; formatting would create another one.',
              },
            ],
            output: `3`,
          },
        },
      ],
      outro:
        'Immutability is the rule; interning is one sharing optimization; concatenation is the cost of producing a new value. Choose `StringBuilder` when the number of pieces grows with the input, and use `equals` for text.',
    },
    code: {
      intro:
        'Watch identity and value equality diverge, then build a row with a mutable buffer instead of repeated concatenation.',
      minimal: {
        filename: 'Identity.java',
        language: 'java',
        code: `final class Identity {
    public static void main(String[] args) {
        String literal = "java";
        String allocated = new String("java");
        String joined = "ja" + "va";

        System.out.println(literal == allocated);
        System.out.println(literal == joined);
        System.out.println(literal.equals(allocated));
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'new String creates a separate object even though the text matches the literal.',
          },
          {
            line: 5,
            note: 'A constant expression is folded and interned, so this reference can match the literal.',
          },
          {
            line: 7,
            note: 'Identity is false for the allocated string.',
          },
          {
            line: 9,
            note: 'Value equality is true for both comparisons.',
          },
        ],
        output: `false
true
true`,
      },
      realistic: {
        filename: 'CsvRow.java',
        language: 'java',
        code: `final class CsvRow {
    static String escape(String value) {
        if (value.indexOf(',') < 0 && value.indexOf('"') < 0) {
            return value;
        }
        return '"' + value.replace("\\"", "\\"\\"") + '"';
    }

    static String row(String... cells) {
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < cells.length; index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(escape(cells[index]));
        }
        return builder.toString();
    }

    public static void main(String[] args) {
        System.out.println(row("Ada", "Lovelace, countess", "notes"));
    }
}`,
        annotations: [
          {
            line: 8,
            note: 'A builder holds the growing result without creating an intermediate String per cell.',
          },
          {
            line: 12,
            note: 'The separator is appended only between cells, not before the first one.',
          },
          {
            line: 14,
            note: 'Escaping can return the original String when no special character is present.',
          },
          {
            line: 21,
            note: 'The final immutable String is created once, after all appends.',
          },
        ],
        output: `Ada,"Lovelace, countess",notes`,
      },
    },
    breakIt: {
      title: 'The export that slowed down as it grew',
      scenario:
        'A nightly CSV export starts with fifty thousand rows and grows with the customer base. The builder uses `report += row` inside the loop. Small runs finish quickly. At a few hundred thousand rows the job spends most of its time copying text, the heap fills with short-lived intermediate strings, and the export occasionally misses its window.',
      brokenCode: {
        filename: 'Export.java',
        language: 'java',
        code: `final class Export {
    static String render(String[] rows) {
        String report = "";
        for (String row : rows) {
            report += row;
            report += "\\n";
        }
        return report;
    }

    public static void main(String[] args) {
        System.out.println(render(new String[] { "a", "b", "c" }).length());
    }
}`,
      },
      predictionPrompt:
        'The final text is only a few megabytes. Why does the runtime cost grow much faster than the output size?',
      failureKind: 'resource',
      reveal: {
        observed:
          'The final export is correct, but allocation and CPU grow sharply with row count. A profiler shows many intermediate `String` and `byte[]` objects, and the heap spends time collecting them.',
        explanation:
          'Each `+=` creates a new String containing all the text so far plus the next fragment. Iteration k copies roughly k fragments, so the total copying is quadratic. The old strings become garbage, which adds allocation pressure and GC work. The final output size does not reveal the total work because most of the copied strings were temporary.',
        repair:
          'Use one `StringBuilder`, append each row and newline, and call `toString()` once. If the rows already form a collection, use `String.join` or a stream collector. Size the builder when a good estimate is available, but correctness does not depend on it.',
        correctedCode: {
          filename: 'Export.java',
          language: 'java',
          code: `final class Export {
    static String render(String[] rows) {
        StringBuilder report = new StringBuilder();
        for (String row : rows) {
            report.append(row).append('\\n');
        }
        return report.toString();
    }

    public static void main(String[] args) {
        System.out.println(render(new String[] { "a", "b", "c" }).length());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'String advice is full of rules that are true only for literals or only for short inputs. These are the patterns that break at the edges.',
      mistakes: [
        {
          title: 'Using == because the literals matched in a test',
          generatedPattern:
            '“String comparison with `==` works here; I ran it and the branch executed.”',
          whyItFails:
            'Identical literals are interned, so a test can compare the same object. Input from HTTP, JSON, a database, or a runtime concatenation is normally a distinct object with equal contents. The branch then fails in production.',
          correction:
            'Use `equals` or `Objects.equals` for text. Reserve `==` for primitives, enum constants, and deliberate identity checks.',
          telltale:
            'A string comparison that passes with hard-coded values and fails when the same value comes from a request or file.',
        },
        {
          title: 'Describing String as a char array',
          generatedPattern:
            '“A String is just a `char[]`, so you can mutate it through the backing array if you get a reference.”',
          whyItFails:
            'The representation is private and has changed across Java versions; modern Java uses a compact byte array plus a coder. There is no supported way to mutate a String’s contents. Code that relies on a particular field layout breaks across releases and may be blocked by module access.',
          correction:
            'Treat String as an immutable value with a public API. Use a char array or StringBuilder when mutation is required, and convert back with a copy.',
          telltale:
            'Reflection into String internals, or an explanation that depends on `value` being a `char[]`.',
        },
        {
          title: 'Replacing every concatenation with StringBuilder',
          generatedPattern:
            '“StringBuilder is always faster, so I will rewrite every `a + b + c` as a builder.”',
          whyItFails:
            'For a fixed, small number of fragments, the compiler’s concatenation is compact and may be optimized. A builder adds mutable state and a final copy. The important case is a loop or a variable number of pieces, where repeated concatenation copies the accumulated text.',
          correction:
            'Use a builder for loops, large or unbounded inputs, and conditional assembly. Keep simple one-line concatenation when it is clearer and measured to be fine.',
          telltale:
            'A builder created for two literals, or a performance claim made without a measurement or a loop.',
        },
        {
          title: 'Interning every string to save memory',
          generatedPattern:
            '“Call `intern()` on all incoming strings so equal values share one copy.”',
          whyItFails:
            'Interning moves or retains the string in a shared pool for the life of the process. For high-cardinality input such as request IDs or free text, that increases retention instead of reducing it. It also adds lookup cost.',
          correction:
            'Intern only known low-cardinality values that repeat heavily, such as a fixed set of status codes or language tags. Measure the live set before and after. Prefer a bounded cache or an enum for a fixed vocabulary.',
          telltale:
            '`intern()` applied to user input, request identifiers, or an unbounded stream of values.',
        },
      ],
      reviewChecklist: [
        'Are strings compared with equals or Objects.equals rather than ==?',
        'Is repeated concatenation inside a loop replaced with a builder or join?',
        'Is intern() limited to a known low-cardinality vocabulary?',
        'Does the explanation avoid depending on String’s private representation?',
        'Are large exports tested at a realistic row count, not only with a few fixtures?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is testing whether you can separate identity, value, and allocation. A slogan about the string pool is not enough.',
      questions: [
        {
          id: 'java.l1.strings.interview.1',
          difficulty: 'junior',
          question: 'Why can `==` appear to work for strings in a test but fail in production?',
          modelAnswer:
            '`==` compares references. String literals are interned, so two identical literals in a test can be the same object. A string from a request, file, database, or runtime concatenation is usually a different object with the same contents. The test passes because of identity, not because `==` compares text. Application code should use `equals`, or `Objects.equals` when null is possible.',
          weakAnswer:
            '`==` works for strings because Java caches them. It fails in production because the cache is smaller there.',
          strongAnswer:
            'The operator never compares text. It compares the reference values in the two slots. Interning makes some equal literals share an object, which is a language optimization, not an equality rule. The safe rule is `equals` for value comparison and `==` only for identity or enum constants. A test that uses only literals can accidentally hide the bug.',
          followUp: 'When is a compile-time string concatenation treated like a literal?',
        },
        {
          id: 'java.l1.strings.interview.2',
          difficulty: 'mid',
          question:
            'Why is `result += line` inside a loop expensive, and what would you use instead?',
          modelAnswer:
            'A String is immutable, so each `+=` creates a new String containing all the previous characters plus the new line, then discards the old one. The total copying is quadratic in the number of lines, and the temporary strings create garbage. A `StringBuilder` appends into a mutable buffer and creates one final String. For an existing collection, `String.join` or `Collectors.joining` is often clearer.',
          weakAnswer:
            'It creates a lot of objects, so I would add more heap or call System.gc() after the loop.',
          strongAnswer:
            'The cost is repeated copying, not just object count. Iteration k copies k fragments, so the work grows with the square of the input. A builder makes the append amortized and materializes once. I would measure with a realistic row count, because small fixtures finish quickly under either version. I would also watch for encoding and escaping work inside the loop, which can dominate if done naively.',
          followUp: 'When would a builder still be a poor choice?',
        },
        {
          id: 'java.l1.strings.interview.3',
          difficulty: 'senior',
          question:
            'How would you review a service for string-related memory and identity bugs?',
          modelAnswer:
            'I would look for three classes of problem: identity comparisons on strings that can come from outside the process, unbounded concatenation or formatting in loops, and interning or caching of high-cardinality text. I would trace where strings cross an input boundary, verify `equals` and normalization, and measure allocation on realistic payloads. For large outputs, I would use a builder or streaming writer and test the growth curve, not just the final size. For interning, I would require a bounded vocabulary and evidence that retention improves.',
          weakAnswer:
            'Strings are immutable and garbage-collected, so I would focus on other data structures.',
          strongAnswer:
            'Immutability makes them safe to share, but it also means every transformation allocates. I would inspect the data flow: request parsing, normalization, key construction, logging, and export. Identity bugs hide in literals and caches; allocation bugs hide in loops and repeated formatting. I would use a profiler or allocation measurement on a production-shaped input and add tests that use runtime-created strings rather than only literals.',
          followUp: 'What would you measure to decide whether interning a set of values is worthwhile?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a CSV row without quadratic concatenation',
      brief:
        'Write a method that joins a variable number of cells into one CSV row. Escape commas and quotes correctly, use one StringBuilder for the row, and prove that an empty input, a quoted field, and a large row all produce the expected text. Do not use `+=` inside the loop.',
      constraints: [
        'Accept a variable number of String cells and return one String.',
        'Wrap a cell in double quotes when it contains a comma or a double quote.',
        'Double each internal double quote when escaping.',
        'Use one StringBuilder and append separators only between cells.',
        'Include a large-row case that would expose repeated copying in a loop.',
        'Do not use a String `+=` inside the row-building loop.',
      ],
      starterCode: {
        filename: 'CsvRow.java',
        language: 'java',
        code: `final class CsvRow {
    static String escape(String value) {
        // Return the value, quoted and escaped if needed.
        return value;
    }

    static String row(String... cells) {
        // Build one row with a StringBuilder.
        return "";
    }

    public static void main(String[] args) {
        // Print a normal row, an escaped row, and a large row.
    }
}`,
      },
      referenceSolution: {
        filename: 'CsvRow.java',
        language: 'java',
        code: `final class CsvRow {
    static String escape(String value) {
        boolean needsQuotes = value.indexOf(',') >= 0 || value.indexOf('"') >= 0;
        if (!needsQuotes) {
            return value;
        }
        return '"' + value.replace("\\"", "\\"\\"") + '"';
    }

    static String row(String... cells) {
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < cells.length; index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(escape(cells[index]));
        }
        return builder.toString();
    }

    public static void main(String[] args) {
        System.out.println(row());
        System.out.println(row("Ada", "Lovelace, countess"));
        System.out.println(row("say \\"hello\\"", "plain"));

        String[] many = new String[100_000];
        for (int index = 0; index < many.length; index++) {
            many[index] = "row-" + index;
        }
        System.out.println(row(many).length());
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'Only cells containing a comma or quote need the quoted form.',
          },
          {
            line: 8,
            note: 'The escaped quotes are doubled before the cell is wrapped.',
          },
          {
            line: 13,
            note: 'One builder accumulates the whole row; each cell is appended once.',
          },
          {
            line: 17,
            note: 'The final String is materialized after all appends.',
          },
          {
            line: 31,
            note: 'The large case exercises the growth path that a small fixture would miss.',
          },
        ],
      },
      rubric: [
        {
          id: 'correct-escaping',
          check: 'Are commas and internal double quotes escaped according to CSV rules?',
          detail:
            'A row that merely joins with commas corrupts the file when a field contains a separator or quote.',
          mustPass: true,
        },
        {
          id: 'single-builder',
          check: 'Does the loop append to one StringBuilder rather than concatenating Strings?',
          detail:
            'The point of the exercise is to avoid copying the accumulated row on every iteration.',
          mustPass: true,
        },
        {
          id: 'separator-placement',
          check: 'Is the comma added only between cells, including for an empty row?',
          detail:
            'Separator bugs show up at the boundaries: first cell, last cell, and zero cells.',
          mustPass: true,
        },
        {
          id: 'large-case',
          check: 'Does the verification include a large row and report a plausible length?',
          detail:
            'A large case makes the growth behavior visible and catches accidental quadratic code.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac CsvRow.java` and `java CsvRow`. Confirm that the empty row prints an empty line, the comma field is quoted, and internal quotes are doubled.',
        'Replace the builder with `result += cell` inside the loop and run the large case. Compare the time and allocation behavior, then restore the builder.',
        'Add a field containing both a comma and a quote. Check that the escaping and the surrounding quotes are both present.',
      ],
    },
    recap: [
      'A String is immutable: operations return new values, and the original stays safe to share.',
      'Literals and compile-time constants are interned; `new String` and runtime results are usually distinct objects.',
      'Use equals for text and == only for deliberate identity checks.',
      'Repeated concatenation copies the accumulated text; a StringBuilder or join avoids quadratic work.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.strings.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.string-immutability', 'java.l1.string-pool'],
      prompt: 'What is true about `new String("java")` compared with the literal `"java"`?',
      options: [
        {
          id: 'same-object',
          text: 'It always returns the same interned object.',
        },
        {
          id: 'distinct-equal',
          text: 'It creates a distinct object whose contents are equal.',
        },
        {
          id: 'mutates-literal',
          text: 'It changes the literal’s contents in place.',
        },
        {
          id: 'compile-error',
          text: 'It is a compile-time error because String is final.',
        },
      ],
      correctOptionId: 'distinct-equal',
      explanation:
        'The constructor creates a distinct String object. `equals` returns true because the text matches, but identity comparison with the literal is false.',
    },
    {
      id: 'java.l1.strings.recall.q2',
      type: 'predict-output',
      concepts: ['java.l1.string-pool'],
      prompt: 'What does this program print?',
      code: `final class Compare {
    public static void main(String[] args) {
        String word = "java";
        String left = "ja";
        String right = "va";
        System.out.println(word == left + right);
        System.out.println(word == "ja" + "va");
    }
}`,
      codeLanguage: 'java',
      expectedOutput: `false
true`,
      acceptedOutputs: ['false\ntrue'],
      explanation:
        '`left + right` is computed at runtime, so it creates a new String and identity is false. `"ja" + "va"` is a compile-time constant expression, folded and interned, so identity is true. Both comparisons would be true with `equals`.',
    },
    {
      id: 'java.l1.strings.recall.q3',
      type: 'explain',
      concepts: ['java.l1.string-building', 'java.l1.string-immutability'],
      prompt:
        'Explain why building a large report with `report += line` in a loop is slower than using a StringBuilder, even though the final text is the same.',
      keyPoints: [
        'Each += creates a new immutable String containing the accumulated text plus the new line.',
        'The previous String becomes garbage, so allocation and collection work grow with the number of fragments.',
        'Iteration k copies about k fragments, making the total copying quadratic.',
        'StringBuilder appends into one mutable buffer and creates the final String once.',
      ],
      modelAnswer:
        'A String cannot be edited in place. Every `+=` allocates a new String, copies the old characters, and appends the new line. The old String is discarded. After n iterations the program has copied roughly 1 + 2 + … + n fragments, which is quadratic, and it has created n intermediate objects. A StringBuilder keeps a mutable buffer, grows it occasionally, and calls `toString()` once at the end. The final text is identical, but the amount of copying and temporary garbage is very different.',
      explanation:
        'Strong answers describe the repeated copying and the discarded intermediate objects. “More objects” alone misses the quadratic growth that makes the loop scale badly.',
    },
  ],
});
