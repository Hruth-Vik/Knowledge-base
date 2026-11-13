import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.equality-contracts',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'language-core',
    title: 'Values, References, and Equality',
  },
  sequence: 1,
  slug: 'equality-contracts',
  title: 'Why Equal Objects Still Go Missing',
  deck: 'Identity, equals, hashCode, and mutation are one contract. Break one clause and HashMap stops finding keys you know are there.',
  kind: 'standard',
  estimatedMinutes: 17,
  tags: ['equals', 'hashcode', 'hashmap', 'identity', 'immutability'],
  concepts: [
    {
      id: 'java.l1.reference-equality',
      title: 'Reference equality',
      kind: 'term',
      summary: [
        'The == operator compares the values stored in two variable slots.',
        'For references, those values are addresses of objects, not the objects’ contents.',
        'Two variables can point at different objects that represent the same value.',
      ],
      aliases: ['identity equality', 'the == operator'],
      tags: ['java', 'equality'],
      relations: [
        {
          type: 'contrasts-with',
          target: 'java.l1.equals-contract',
        },
      ],
    },
    {
      id: 'java.l1.equals-contract',
      title: 'equals contract',
      kind: 'principle',
      summary: [
        'equals defines value equality between two objects, not object identity.',
        'It must be reflexive, symmetric, transitive, consistent, and false for null.',
        'The default Object.equals implementation is reference equality.',
      ],
      aliases: ['value equality', 'equals method'],
      tags: ['java', 'equality'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.reference-equality',
        },
      ],
    },
    {
      id: 'java.l1.hashcode-contract',
      title: 'hashCode contract',
      kind: 'principle',
      summary: [
        'Equal objects must return the same hash code.',
        'Unequal objects may share a hash; hash-based collections then use equals.',
        'A hash code must stay stable while an object is a key in a hash-based collection.',
      ],
      aliases: ['hashing contract', 'hash consistency'],
      tags: ['java', 'collections'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.equals-contract',
        },
      ],
    },
    {
      id: 'java.l1.mutable-keys',
      title: 'Mutable hash keys',
      kind: 'failure-mode',
      summary: [
        'Changing a field used by equals or hashCode moves an entry’s logical bucket.',
        'The map does not rehash an entry when the key object changes.',
        'The entry remains in the old bucket, so lookups can miss it entirely.',
      ],
      aliases: ['mutated key bug', 'vanishing map entry'],
      tags: ['java', 'collections', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.hashcode-contract',
        },
      ],
    },
  ],
  revisits: ['java.l0.stack-and-heap'],
  versionCaveats: [
    'Examples target Java 21 LTS. String literal interning is specified by the JLS, but identity comparisons between strings from other sources are never a safe substitute for equals.',
    'Records generate equals and hashCode from their components. A record with mutable component objects can still break hash-based collections.',
  ],
  references: [
    {
      title: 'Java SE 21 API: Object.equals',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)',
      note: 'The five clauses of the equals contract, stated by the platform itself.',
    },
    {
      title: 'Java SE 21 API: Object.hashCode',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#hashCode()',
      note: 'The relationship between equals, hashCode, and hash-based collections.',
    },
    {
      title: 'Java Language Specification: String literals',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5',
      note: 'Why two identical string literals can be the same object, and why that is a trap.',
    },
  ],
  sections: {
    problem:
      'A `HashMap` contains a key. You can print the map and see the entry. Then `map.get(key)` returns `null`. Or a `HashSet` accepts two objects that print identically, so deduplication quietly fails.\n\nNeither problem is a bug in `HashMap`. Both come from treating three separate ideas as one: object identity, value equality, and hash stability. Java lets you choose value equality by overriding `equals`, but a hash-based collection needs the matching `hashCode` too. And it needs both to stay stable while the key is stored. Once you see the three-part contract, the failures become predictable rather than spooky.',
    analogy: {
      title: 'The library catalogue',
      body:
        'A library has two copies of the same book. They are different physical objects, but a reader asking for “the book” usually means the work, not that particular copy. The catalogue assigns a shelf based on a label derived from the title and edition.\n\nIf two copies represent the same edition, they must share that label. If someone retitles a book after it has been shelved, the catalogue still points at the old shelf. The book exists, but the lookup path no longer reaches it.',
      mapping: [
        {
          technical: 'A reference value',
          everyday: 'Which physical copy you are holding',
        },
        {
          technical: '`equals`',
          everyday: 'Whether two copies are the same edition',
        },
        {
          technical: '`hashCode`',
          everyday: 'The shelf label computed from title and edition',
        },
        {
          technical: 'A `HashMap` bucket',
          everyday: 'The shelf named by that label',
        },
        {
          technical: 'Mutating a key after insertion',
          everyday: 'Retitling a book after it was filed',
        },
      ],
      whereItBreaks:
        'A catalogue can relabel a book when its metadata changes. A `HashMap` does not know the key object changed, so it never moves the entry. The analogy also hides collisions: two different books can share a shelf label, and the catalogue still has to compare them directly.',
    },
    mentalModel: {
      title: 'Identity points; equals compares; hashCode routes',
      figure: {
        width: 960,
        height: 360,
        caption:
          'Two references can point at distinct objects that are equal by value. A hash-based collection uses hashCode to pick a bucket, then equals to confirm the key.',
        alt: 'A diagram with two reference variables pointing to two separate Money objects with the same fields. Both objects feed an equals and hashCode contract, which routes to a HashMap bucket. An annotation explains that == compares the reference values while equals compares object contents.',
        nodes: [
          {
            id: 'ref-a',
            label: 'variable a',
            detail: 'reference A',
            x: 16,
            y: 28,
            width: 164,
            height: 72,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'ref-b',
            label: 'variable b',
            detail: 'reference B',
            x: 16,
            y: 124,
            width: 164,
            height: 72,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'object-a',
            label: 'new Money(10, USD)',
            detail: 'object #1',
            x: 228,
            y: 20,
            width: 196,
            height: 108,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'object-b',
            label: 'new Money(10, USD)',
            detail: 'object #2',
            x: 228,
            y: 148,
            width: 196,
            height: 108,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'contract',
            label: 'equals + hashCode',
            detail: 'value contract',
            x: 492,
            y: 52,
            width: 200,
            height: 112,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'bucket',
            label: 'HashMap bucket',
            detail: 'same hash, one route',
            x: 748,
            y: 52,
            width: 184,
            height: 176,
            shape: 'stack',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'ref-a',
            to: 'object-a',
            label: 'points to',
            kind: 'flow',
          },
          {
            from: 'ref-b',
            to: 'object-b',
            label: 'points to',
            kind: 'flow',
          },
          {
            from: 'object-a',
            to: 'contract',
            label: 'compare',
            kind: 'depends',
          },
          {
            from: 'object-b',
            to: 'contract',
            label: 'compare',
            kind: 'depends',
          },
          {
            from: 'contract',
            to: 'bucket',
            label: 'route lookup',
            kind: 'flow',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 300,
            text: '== compares references.',
          },
          {
            x: 228,
            y: 300,
            text: 'Same fields, new object.',
          },
          {
            x: 492,
            y: 300,
            text: 'Equal values share a hash.',
          },
          {
            x: 748,
            y: 300,
            text: 'Mutation moves the route.',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'The contract only makes sense once you separate what is stored in a variable from what an object contains. Start with identity, then add value equality, then see how a hash-based collection uses both.',
      steps: [
        {
          title: '== reads the value in each slot',
          body:
            'A primitive variable stores its value directly, so `left == right` compares two numbers. A reference variable stores a reference value. `first == second` asks whether both references point at the same object, not whether two arrays contain the same elements.\n\nThis is why `==` is correct for primitives and dangerous for value objects. It is also why string literals can mislead you: identical literals may be interned to one object, so `==` appears to work until a string arrives from input, concatenation, or a different loader.',
          code: {
            filename: 'References.java',
            language: 'java',
            code: `final class References {
    public static void main(String[] args) {
        int left = 7;
        int right = 7;
        int[] first = { 7 };
        int[] second = { 7 };

        System.out.println(left == right);
        System.out.println(first == second);
        System.out.println(first[0] == second[0]);
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'Each primitive variable stores the number itself, so copying the variable copies the value.',
              },
              {
                line: 5,
                note: 'The array variable stores a reference. The array object lives on the heap.',
              },
              {
                line: 6,
                note: 'Two array creations produce two distinct objects, even with identical contents.',
              },
              {
                line: 9,
                note: 'This compares references, not the elements inside the arrays.',
              },
              {
                line: 10,
                note: 'Reading an element produces an int, so this comparison is about values again.',
              },
            ],
            output: `true
false
true`,
          },
        },
        {
          title: 'equals defines value equality',
          body:
            '`Object.equals` starts as identity comparison. Overriding it lets two distinct objects describe the same value. The method must be reflexive, symmetric, transitive, and consistent, and it must return `false` for `null`.\n\nThe common shape is: identity fast path, type check, then compare the fields that define the value. Use `Objects.equals` for nullable fields and compare primitives directly. If you override `equals`, you must override `hashCode` from the same fields; otherwise equal objects can land in different buckets.',
          code: {
            filename: 'Badge.java',
            language: 'java',
            code: `import java.util.Objects;

final class Badge {
    private final String owner;
    private final int number;

    Badge(String owner, int number) {
        this.owner = owner;
        this.number = number;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Badge badge)) return false;
        return number == badge.number
            && Objects.equals(owner, badge.owner);
    }

    @Override
    public int hashCode() {
        return Objects.hash(owner, number);
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'These are the fields that define the badge’s value. Keep the equality decision here, not in callers.',
              },
              {
                line: 14,
                note: 'The identity fast path avoids field work when both references point at the same object.',
              },
              {
                line: 15,
                note: 'A pattern match rejects null and unrelated types, then binds the narrowed value.',
              },
              {
                line: 16,
                note: 'Compare the same fields that hashCode uses. A mismatch breaks the contract.',
              },
              {
                line: 22,
                note: 'Objects.hash combines the same fields. Equal badges now produce equal hash codes.',
              },
            ],
          },
        },
        {
          title: 'A hash collection routes, then compares',
          body:
            '`HashMap` does not scan every key. It computes `key.hashCode()`, maps that to a bucket, then compares candidate keys with `equals`. The hash narrows the search; `equals` makes the final decision.\n\nThis two-stage lookup explains collisions: unequal keys may share a bucket, and that is fine because `equals` separates them. It also explains the failure when `hashCode` is missing or inconsistent: the map looks in the wrong bucket and never runs the `equals` check that would have found the entry.',
          code: {
            filename: 'Lookup.java',
            language: 'java',
            code: `import java.util.HashMap;
import java.util.Map;

final class Lookup {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("alpha", 1);

        Integer found = counts.get(new String("alpha"));

        System.out.println(found);
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'The literal key is stored in the bucket selected by its hash code.',
              },
              {
                line: 9,
                note: 'This is a different String object, but it has the same value and therefore the same hash.',
              },
              {
                line: 11,
                note: 'The lookup finds the bucket, then equals confirms the key. The result is 1, not null.',
              },
            ],
            output: `1`,
          },
        },
        {
          title: 'A key must stay stable while it is stored',
          body:
            'The hash code is computed when the entry is inserted. The map does not keep a live subscription to the key’s fields. If a field used by `hashCode` changes afterward, the entry stays in its original bucket while future lookups route to a different one.\n\nThis is why hash-based keys should be immutable, or at least why the fields used for equality must never change while the object is a key. Removing the entry before mutation and reinserting it afterward is a repair, not a design. Prefer a value type whose identity is fixed at construction.',
          code: {
            filename: 'MutableKey.java',
            language: 'java',
            code: `import java.util.HashMap;
import java.util.Map;

final class MutableKey {
    private String name;

    MutableKey(String name) { this.name = name; }

    void rename(String next) { this.name = next; }

    @Override public boolean equals(Object other) {
        return other instanceof MutableKey key && name.equals(key.name);
    }

    @Override public int hashCode() { return name.hashCode(); }

    public static void main(String[] args) {
        Map<MutableKey, String> map = new HashMap<>();
        MutableKey key = new MutableKey("alpha");
        map.put(key, "first");
        key.rename("beta");
        System.out.println(map.get(key));
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'A mutable field is about to become part of the object’s hash identity.',
              },
              {
                line: 12,
                note: 'equals reads the current name, so the object’s value changes when the field changes.',
              },
              {
                line: 15,
                note: 'hashCode reads the same field. Insertion and lookup can now disagree about the bucket.',
              },
              {
                line: 21,
                note: 'The entry was filed under hash("alpha") and is never moved by this assignment.',
              },
              {
                line: 22,
                note: 'The lookup hashes "beta", searches a different bucket, and returns null.',
              },
            ],
            output: `null`,
          },
        },
      ],
      outro:
        'A hash-based collection is a routing table plus an equality check. Equal values must share a route, and the route must not change while the entry is stored.',
    },
    code: {
      intro:
        'Start with identity and value equality side by side, then use an immutable value object as a real map key.',
      minimal: {
        filename: 'Identity.java',
        language: 'java',
        code: `final class Identity {
    public static void main(String[] args) {
        String literalA = "java";
        String literalB = "java";
        String allocated = new String("java");

        System.out.println(literalA == literalB);
        System.out.println(literalA == allocated);
        System.out.println(literalA.equals(allocated));
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'String literals with the same contents are interned, so these two variables can point at one object.',
          },
          {
            line: 4,
            note: 'This line looks identical to the previous one. The identity result is a language detail, not a general equality rule.',
          },
          {
            line: 5,
            note: 'new String always creates a distinct object, even when the characters match an existing literal.',
          },
          {
            line: 7,
            note: 'True here because of interning. Do not generalize this to strings from input or concatenation.',
          },
          {
            line: 9,
            note: 'equals compares contents, which is what application code almost always wants.',
          },
        ],
        output: `true
false
true`,
      },
      realistic: {
        filename: 'MoneyKey.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

final class Money {
    private final String currency;
    private final long cents;

    Money(String currency, long cents) {
        this.currency = currency;
        this.cents = cents;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Money money)) return false;
        return cents == money.cents
            && Objects.equals(currency, money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(currency, cents);
    }

    public static void main(String[] args) {
        Map<Money, String> labels = new HashMap<>();
        labels.put(new Money("USD", 1000), "ten dollars");

        System.out.println(labels.get(new Money("USD", 1000)));
    }
}`,
        annotations: [
          {
            line: 6,
            note: 'The fields are final. A Money value cannot change after it becomes a map key.',
          },
          {
            line: 17,
            note: 'The type check prevents ClassCastException and rejects null in one step.',
          },
          {
            line: 18,
            note: 'Both fields participate in equality; neither is allowed to drift.',
          },
          {
            line: 24,
            note: 'hashCode combines exactly the fields used by equals.',
          },
          {
            line: 29,
            note: 'The inserted key is one object. The lookup key below is a different object with the same value.',
          },
          {
            line: 31,
            note: 'The lookup succeeds because hashCode routes to the bucket and equals confirms the value.',
          },
        ],
        output: `ten dollars`,
      },
    },
    breakIt: {
      title: 'The key that disappeared after a rename',
      scenario:
        'A service indexes jobs by a mutable `JobKey`. A retry handler renames the key in place after the job is queued. The map still contains the entry and the dashboard still lists it, but every lookup for that job now returns `null`. A second lookup using the old name also returns `null`.',
      brokenCode: {
        filename: 'JobIndex.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

final class JobKey {
    private String name;

    JobKey(String name) { this.name = name; }

    void rename(String next) { this.name = next; }

    @Override public boolean equals(Object other) {
        return other instanceof JobKey key && name.equals(key.name);
    }

    @Override public int hashCode() { return Objects.hash(name); }
}

final class JobIndex {
    public static void main(String[] args) {
        Map<JobKey, String> index = new HashMap<>();
        JobKey key = new JobKey("nightly-report");
        index.put(key, "queued");

        key.rename("nightly-report-v2");

        System.out.println(index.get(key));
        System.out.println(index.get(new JobKey("nightly-report")));
    }
}`,
      },
      predictionPrompt:
        'Both lookups print null. Which one failed because of the hash route, and which one failed because equals no longer matched?',
      failureKind: 'logic',
      reveal: {
        observed:
          '`index.get(key)` prints `null` and `index.get(new JobKey("nightly-report"))` prints `null`. The entry itself was never removed.',
        explanation:
          'Insertion filed the entry under `hash("nightly-report")`. Renaming the key changed its hash code, but the map did not rehash or move the entry. The first lookup hashes `"nightly-report-v2"` and searches the wrong bucket. The second lookup hashes the original name and reaches the right bucket, but `equals` compares `"nightly-report-v2"` with `"nightly-report"` and rejects the candidate. The entry is stranded in a bucket that no current key value can reach.',
        repair:
          'Make the key immutable. If a job can be renamed, keep a stable identifier as the key and store the display name as a value. If mutation is unavoidable, remove the entry before changing the key and reinsert it afterward, but treat that as a workaround rather than a contract.',
        correctedCode: {
          filename: 'JobIndex.java',
          language: 'java',
          code: `import java.util.HashMap;
import java.util.Map;

record JobKey(String id) {}

record Job(String id, String name) {}

final class JobIndex {
    public static void main(String[] args) {
        Map<JobKey, Job> index = new HashMap<>();
        JobKey key = new JobKey("job-1042");
        index.put(key, new Job("job-1042", "nightly-report"));

        Job renamed = new Job("job-1042", "nightly-report-v2");
        index.put(key, renamed);

        System.out.println(index.get(new JobKey("job-1042")).name());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Equality bugs survive code review because each individual line looks reasonable. These are the three patterns generated code most often repeats.',
      mistakes: [
        {
          title: 'Overriding equals but not hashCode',
          generatedPattern:
            '“I added an `equals` method so these objects compare by value. The `HashMap` should work now.”',
          whyItFails:
            'The map routes by `hashCode` before it calls `equals`. Two equal objects with identity hash codes land in different buckets, so the map never compares them.',
          correction:
            'Override both methods from the same fields. Prefer a record for simple value types, and add a test that inserts one instance and looks up an equal but distinct instance.',
          telltale:
            '`equals` returns true in a unit test, but `HashSet.add` still keeps both objects or `map.get` returns null.',
        },
        {
          title: 'Using == because two literals happened to match',
          generatedPattern:
            '“String comparison works with `==` here. I tested it and the branch executes.”',
          whyItFails:
            'String literals are interned, so the tested variables may point at one object. Input, concatenation, and deserialization often produce distinct objects with identical contents.',
          correction:
            'Use `equals`, or `Objects.equals` when either side may be null. Reserve `==` for primitives, enum constants, and deliberate identity checks.',
          telltale:
            'The comparison passes with hard-coded literals and fails when the same value comes from a request, file, or database.',
        },
        {
          title: 'Using a mutable entity as a hash key',
          generatedPattern:
            '“The entity already has `equals` and `hashCode`, so I can use it directly as the cache key.”',
          whyItFails:
            'Generated equality often reads mutable fields such as a name or status. Changing one after insertion changes the hash without moving the entry, so later lookups miss.',
          correction:
            'Use an immutable identifier or a dedicated immutable key type. If the entity must be a key, freeze the fields used in equality and document that constraint.',
          telltale:
            'A cache or map works until an update changes a field, then starts missing entries that are still visible in a dump.',
        },
      ],
      reviewChecklist: [
        'Are equals and hashCode overridden together, using the same fields?',
        'Does every hash key type keep its equality fields immutable while stored?',
        'Do tests look up an equal but separately constructed key, not just the inserted instance?',
        'Are string comparisons using equals rather than ==?',
      ],
    },
    interviewCorner: {
      intro:
        'Interviewers use equality to test whether you can separate language rules from collection behavior. Answer with the lookup sequence, not a slogan.',
      questions: [
        {
          id: 'java.l1.equality-contracts.interview.1',
          difficulty: 'junior',
          question: 'What is the difference between `==` and `equals` in Java?',
          modelAnswer:
            '`==` compares the values stored in the variables. For primitives that is the number itself; for references it is the reference value, so `==` asks whether both variables point at the same object. `equals` is a method that can define value equality. The default implementation in `Object` is identity comparison, but classes such as `String`, `List`, and records override it to compare contents. Application code should use `equals` for value comparisons, with `Objects.equals` when null is possible.',
          weakAnswer:
            '`==` checks the address and `equals` checks the value. Always use `equals` for strings.',
          strongAnswer:
            'The operator is fixed by the language: identity for references. `equals` is polymorphic and its meaning is defined by the class. That is why a class can decide that two distinct objects represent the same value, and why overriding `equals` brings the hashCode contract into play. I use `==` for primitives, enum constants, and intentional identity checks.',
          followUp:
            'Why can two string literals compare equal with `==` while two strings from user input do not?',
        },
        {
          id: 'java.l1.equality-contracts.interview.2',
          difficulty: 'mid',
          question:
            'Walk through what `HashMap.get(key)` does. Why do equals and hashCode both matter?',
          modelAnswer:
            'The map computes the key’s hash code, spreads it, and selects a bucket. It then compares candidate keys in that bucket using `equals`, with an identity check first. `hashCode` narrows the search and `equals` makes the decision. If equal objects return different hash codes, the lookup searches the wrong bucket and never reaches the equal entry. If hashCode is consistent but equals is missing, the map cannot distinguish value-equal keys from unrelated ones.',
          weakAnswer:
            'It hashes the key and returns the value. equals is only used for lists.',
          strongAnswer:
            'It is a two-stage lookup: route by hash, confirm by equals. Collisions are expected and handled by comparing within the bucket. The contract requires equal objects to share a hash, but unequal objects may collide. I would verify both methods in a test that uses a distinct equal key and would inspect the key’s mutability if lookups start failing after updates.',
          followUp:
            'What happens if a key’s hash code changes after insertion but equals still matches its old value?',
        },
        {
          id: 'java.l1.equality-contracts.interview.3',
          difficulty: 'senior',
          question:
            'A production cache built on `ConcurrentHashMap` starts missing entries after an entity update. How do you investigate and prevent it?',
          modelAnswer:
            'I would first confirm the key type and whether its equals or hashCode reads mutable fields. A miss after an update is consistent with a key whose hash changed while the entry stayed in its original bucket. I would inspect the update path, compare the key’s fields before and after, and reproduce with a small map test. The durable fix is a stable immutable key, usually an identifier, with mutable display data stored in the value. I would also add a regression test that inserts, mutates the entity, and verifies lookups by the stable key.',
          weakAnswer:
            'ConcurrentHashMap has a concurrency bug, so I would replace it with a synchronized map.',
          strongAnswer:
            'The container is doing exactly what its contract says. I would trace key identity across the update, check whether hashCode depends on a changed field, and look for code that mutates an object already used as a key. Replacing the map would not fix a broken key contract. I would introduce an immutable key, migrate the cache entries, and add contract tests plus a review rule for hash-key types.',
          followUp:
            'How would you detect this class of bug before it reaches production?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a value type that survives a hash lookup',
      brief:
        'Write an immutable `Coordinate` value type with a correct equals/hashCode pair, then prove the contract with a `HashSet` and a `HashMap`. The important evidence is a lookup using a separately constructed but equal key, plus the behavior when you deliberately break the contract.',
      constraints: [
        'Use Java 21 and keep both coordinate fields `private final` with no setters.',
        'Override `equals` and `hashCode` from the same two fields.',
        'Insert one instance into a `HashSet` and add a second equal instance; the set must keep one element.',
        'Put one instance into a `HashMap`, then look up the value with a different but equal instance.',
        'Print the equality result and the hash comparison before the collection checks.',
      ],
      starterCode: {
        filename: 'Coordinate.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

final class Coordinate {
    // Add final fields, a constructor, equals, hashCode, and a toString.

    public static void main(String[] args) {
        Coordinate a = new Coordinate(3, 4);
        Coordinate b = new Coordinate(3, 4);

        // Prove equality, set deduplication, and map lookup.
    }
}`,
      },
      referenceSolution: {
        filename: 'Coordinate.java',
        language: 'java',
        code: `import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

final class Coordinate {
    private final int x;
    private final int y;

    Coordinate(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Coordinate point)) return false;
        return x == point.x && y == point.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "(" + x + ", " + y + ")";
    }

    public static void main(String[] args) {
        Coordinate a = new Coordinate(3, 4);
        Coordinate b = new Coordinate(3, 4);

        System.out.println("equal: " + a.equals(b));
        System.out.println("same hash: " + (a.hashCode() == b.hashCode()));

        Set<Coordinate> seen = new HashSet<>();
        seen.add(a);
        seen.add(b);
        System.out.println("set size: " + seen.size());

        Map<Coordinate, String> labels = new HashMap<>();
        labels.put(a, "origin-ish");
        System.out.println("lookup: " + labels.get(b));
    }
}`,
        annotations: [
          {
            line: 8,
            note: 'Final fields freeze the value, so the hash cannot change while the object is a key.',
          },
          {
            line: 20,
            note: 'Both fields define equality. The identity check and type check come first.',
          },
          {
            line: 25,
            note: 'hashCode uses exactly the fields that equals compares.',
          },
          {
            line: 43,
            note: 'A second equal instance is added; a correct HashSet keeps only one element.',
          },
          {
            line: 47,
            note: 'The lookup key is a different object from the inserted key. Success proves the contract in practice.',
          },
        ],
      },
      rubric: [
        {
          id: 'immutable-value',
          check: 'Are both fields private final with no mutation path?',
          detail:
            'Immutability is what keeps the hash stable while the object is stored in a hash-based collection.',
          mustPass: true,
        },
        {
          id: 'matching-contract',
          check: 'Do equals and hashCode use the same fields?',
          detail:
            'A correct pair is the minimum requirement. One without the other is a broken contract, not a partial solution.',
          mustPass: true,
        },
        {
          id: 'distinct-key-lookup',
          check: 'Does the map lookup use a separately constructed equal key?',
          detail:
            'Using the inserted instance only proves identity. The distinct equal key proves the value contract.',
          mustPass: true,
        },
        {
          id: 'evidence',
          check: 'Does the output show equality, hash equality, set size, and lookup value?',
          detail:
            'The four observations make the contract visible instead of merely asserting that it works.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Coordinate.java` and `java Coordinate`; expect `equal: true`, `same hash: true`, `set size: 1`, and `lookup: origin-ish`.',
        'Temporarily remove `hashCode` and rerun. The lookup should fail or the set should keep both elements, demonstrating why both methods are required.',
        'Change `equals` to compare only `x` and rerun. Explain why the set may now drop distinct points, then restore the correct field comparison.',
      ],
    },
    recap: [
      '`==` compares the value in each slot: primitives by value, references by identity.',
      '`equals` defines value equality and must satisfy reflexivity, symmetry, transitivity, consistency, and non-null behavior.',
      'Equal objects must return equal hash codes; hash-based collections route by hashCode and confirm by equals.',
      'A key’s equality fields must stay stable while it is stored, which usually means the key should be immutable.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.equality-contracts.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.reference-equality'],
      prompt: 'What does `first == second` compare when both variables are object references?',
      options: [
        {
          id: 'field-values',
          text: 'Every field of the two objects, recursively.',
        },
        {
          id: 'reference-values',
          text: 'Whether both references point at the same object.',
        },
        {
          id: 'hash-codes',
          text: 'The result of calling `hashCode` on each object.',
        },
        {
          id: 'string-forms',
          text: 'The result of calling `toString` on each object.',
        },
      ],
      correctOptionId: 'reference-values',
      explanation:
        'The operator compares the reference values stored in the variables. Content comparison requires `equals`, which a class may override.',
    },
    {
      id: 'java.l1.equality-contracts.recall.q2',
      type: 'order-the-steps',
      concepts: ['java.l1.hashcode-contract'],
      prompt: 'Put a successful `HashMap.get(equalButDistinctKey)` lookup in order.',
      items: [
        {
          id: 'hash',
          text: 'Compute the lookup key’s hash code.',
        },
        {
          id: 'bucket',
          text: 'Select the bucket that hash routes to.',
        },
        {
          id: 'equals',
          text: 'Compare candidate keys in that bucket using equals.',
        },
        {
          id: 'value',
          text: 'Return the value stored under the matching key.',
        },
      ],
      correctOrder: ['hash', 'bucket', 'equals', 'value'],
      explanation:
        'The hash narrows the search and equals makes the final decision. Missing or unstable hashes prevent the map from reaching the equals check.',
    },
    {
      id: 'java.l1.equality-contracts.recall.q3',
      type: 'explain',
      concepts: ['java.l1.mutable-keys', 'java.l1.hashcode-contract'],
      prompt:
        'A key is inserted into a HashMap, then a field used by hashCode is changed. Explain why both the old value and the new value can fail to find the entry.',
      keyPoints: [
        'The entry stays in the bucket chosen at insertion time.',
        'The new field value hashes to a different bucket, so the map searches there and does not see the entry.',
        'The old field value reaches the original bucket, but equals compares against the changed object and rejects it.',
        'The map never observes the field change, so it cannot rehash or move the entry.',
      ],
      modelAnswer:
        'Insertion computes a hash from the key’s fields and stores the entry in that bucket. Changing a field afterward changes the key’s current hash, but the map does not rehash stored entries. A lookup using the new value routes to a different bucket and misses. A lookup using the old value reaches the original bucket, but the stored key now reports the new value, so equals rejects the candidate. The entry is unreachable through either value until it is removed or the map is rebuilt.',
      explanation:
        'Strong answers separate routing from equality and state that the map has no notification mechanism for key mutation.',
    },
  ],
});
