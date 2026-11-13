import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.memory-in-motion',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'memory-and-execution',
    title: 'Memory and Execution',
  },
  sequence: 3,
  slug: 'memory-in-motion',
  title: 'Where Your Variables Actually Live',
  deck: 'A local variable is a slot in a stack frame. An object is a heap allocation. Copying the slot does not copy the object.',
  kind: 'standard',
  estimatedMinutes: 16,
  tags: ['stack', 'heap', 'references', 'garbage-collection', 'recursion'],
  concepts: [
    {
      id: 'java.l0.stack-frame',
      title: 'Stack frame',
      kind: 'mechanism',
      summary: [
        'Every method invocation gets a frame on its thread’s stack.',
        'A frame holds local variable slots, an operand stack, and return state.',
        'Frames are pushed on call and popped on return or exception.',
      ],
      aliases: ['call frame', 'activation record', 'method stack'],
      tags: ['java', 'memory'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-and-heap',
        },
      ],
    },
    {
      id: 'java.l0.reference-value',
      title: 'Reference value',
      kind: 'term',
      summary: [
        'An object variable stores a reference value, not the object’s fields.',
        'Assignment and argument passing copy that reference value.',
        'Copies can point at one object, so mutation through either copy is visible.',
      ],
      aliases: ['pass by value', 'reference copy', 'object variable'],
      tags: ['java', 'memory', 'semantics'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-frame',
        },
      ],
    },
    {
      id: 'java.l0.object-reachability',
      title: 'Object reachability',
      kind: 'mechanism',
      summary: [
        'A heap object stays alive while a GC root can reach it through references.',
        'Tracing collectors follow references; they do not count them one by one.',
        'Unreachable means eligible for collection, not collected immediately.',
      ],
      aliases: ['GC roots', 'reachable objects', 'object lifetime'],
      tags: ['java', 'memory', 'gc'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-frame',
        },
        {
          type: 'depends-on',
          target: 'java.l0.jvm',
        },
      ],
    },
    {
      id: 'java.l0.stack-overflow',
      title: 'Stack overflow',
      kind: 'failure-mode',
      summary: [
        'Deep or unbounded recursion exhausts the thread’s fixed stack space.',
        'The JVM throws StackOverflowError; the heap may be almost empty.',
        'The repair is a base case, bounded depth, or an iterative algorithm.',
      ],
      aliases: ['StackOverflowError', 'recursion depth', 'call stack exhausted'],
      tags: ['java', 'memory', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-frame',
        },
      ],
    },
  ],
  revisits: ['java.l0.stack-and-heap', 'java.l0.jvm'],
  versionCaveats: [
    'Examples target Java 21 LTS. The exact stack size depends on the JVM, the platform, and the -Xss setting; do not hard-code a maximum recursion depth from one machine.',
    'Escape analysis and scalar replacement can remove a heap allocation in optimized code. That is an implementation optimization; the language semantics still treat objects as heap-allocated values with identity.',
  ],
  references: [
    {
      title: 'Java Virtual Machine Specification: Frames',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6',
      note: 'What a frame contains and when it is created and destroyed.',
    },
    {
      title: 'Java Virtual Machine Specification: The Heap',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.3',
      note: 'The heap as the runtime area for class instances and arrays.',
    },
    {
      title: 'Java SE 21 API: StackOverflowError',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StackOverflowError.html',
      note: 'The error thrown when an application recurses too deeply.',
    },
  ],
  sections: {
    problem:
      'A method receives an order and adds a line item; the caller sees the new item. Another method receives the same order, assigns a new one to its parameter, and the caller sees no change. A parser recurses one level per nested expression and dies with `StackOverflowError` while the heap is nearly empty.\n\nThese are not three unrelated quirks. They come from one model: variables live in stack frames, object variables hold references, and objects live on the heap until they become unreachable. Once you can draw that picture, passing, mutation, recursion, and garbage collection stop being folklore.',
    analogy: {
      title: 'The kitchen counter and the pantry',
      body:
        'Each cook has a counter for the recipe currently in progress. A new step gets a tray with labeled bowls: the ingredients and the location of anything fetched from the pantry. When the step finishes, the tray is cleared and the counter space returns to the cook.\n\nThe pantry is shared. A label on a tray points to a container on a shelf; copying the label gives another cook the same container, not a duplicate of its contents. Clearing a tray does not empty the pantry. The pantry is cleaned by tracing which containers are still reachable from active trays and fixed shelves.',
      mapping: [
        {
          technical: 'A thread’s call stack',
          everyday: 'One cook’s counter space',
        },
        {
          technical: 'A stack frame',
          everyday: 'The tray for one recipe invocation',
        },
        {
          technical: 'A local variable slot',
          everyday: 'A labeled bowl on the tray',
        },
        {
          technical: 'A reference value',
          everyday: 'A label that names a pantry container',
        },
        {
          technical: 'The heap',
          everyday: 'The shared pantry shelves',
        },
        {
          technical: 'Tracing garbage collection',
          everyday: 'Clearing containers no active tray can reach',
        },
      ],
      whereItBreaks:
        'The counter is not shared between cooks in the way the analogy suggests: each thread has its own stack, and a frame cannot be read by another thread. The pantry is not one tidy shelf, and a tracing collector does not use reference counts; it follows reachable references from roots. The analogy also hides optimization: a JVM may prove an object never escapes and avoid allocating it at all, even though the source code still describes an object.',
    },
    mentalModel: {
      title: 'Frames point into a shared heap',
      figure: {
        width: 960,
        height: 420,
        caption:
          'Each call adds a frame to its thread’s stack. Frame slots hold primitives and reference values. Objects live on the heap; a reference from any live frame or root keeps an object reachable.',
        alt: 'A vertical stack with main, parse, and total frames. Arrows from local reference slots point to Order and List objects on a shared heap. A separate unreachable object is marked for collection, while a garbage collector traces the reachable ones.',
        nodes: [
          {
            id: 'thread',
            label: 'Thread stack',
            detail: 'frames are per thread',
            x: 16,
            y: 24,
            width: 180,
            height: 240,
            shape: 'stack',
            tone: 'muted',
          },
          {
            id: 'frame-main',
            label: 'main frame',
            detail: 'locals + operand stack',
            x: 220,
            y: 36,
            width: 212,
            height: 82,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'frame-parse',
            label: 'parse frame',
            detail: 'called by main',
            x: 220,
            y: 144,
            width: 212,
            height: 82,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'frame-total',
            label: 'total frame',
            detail: 'called by parse',
            x: 220,
            y: 252,
            width: 212,
            height: 82,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'order',
            label: 'Order object',
            detail: 'fields live on the heap',
            x: 548,
            y: 36,
            width: 176,
            height: 92,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'items',
            label: 'ArrayList object',
            detail: 'shared through references',
            x: 548,
            y: 158,
            width: 176,
            height: 92,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'old',
            label: 'unreachable object',
            detail: 'eligible, not gone yet',
            x: 548,
            y: 280,
            width: 176,
            height: 92,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'gc',
            label: 'garbage collector',
            detail: 'traces roots',
            x: 788,
            y: 158,
            width: 148,
            height: 92,
            shape: 'circle',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'frame-main',
            to: 'frame-parse',
            label: 'calls',
            kind: 'flow',
          },
          {
            from: 'frame-parse',
            to: 'frame-total',
            label: 'calls',
            kind: 'flow',
          },
          {
            from: 'frame-main',
            to: 'order',
            label: 'local ref',
            kind: 'flow',
          },
          {
            from: 'frame-total',
            to: 'items',
            label: 'parameter ref',
            kind: 'flow',
          },
          {
            from: 'gc',
            to: 'old',
            label: 'reclaim',
            kind: 'contrast',
          },
          {
            from: 'gc',
            to: 'items',
            label: 'reachable',
            kind: 'depends',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 388,
            text: 'Frames pop on return; the objects they referenced may remain.',
          },
          {
            x: 548,
            y: 388,
            text: 'Scope is not reachability: a field, cache, or another thread can keep an object alive.',
          },
          {
            x: 788,
            y: 388,
            text: 'Unreachable means eligible, not instantly collected.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Follow one call from invocation to return. Then follow the reference out of the frame into the heap, and finally see what happens when the call chain itself runs out of room.',
      steps: [
        {
          title: 'A call pushes a frame',
          body:
            'Each thread starts with a stack. Invoking a method pushes a new frame containing space for local variables, an operand stack for intermediate values, and the information needed to return to the caller. The frame is private to that thread.\n\nWhen the method returns normally, its frame is popped and execution resumes in the caller. When it throws, the JVM unwinds frames until it finds a matching handler. A local variable lives only as long as its frame; that is why it cannot be read after the method that declared it returns.',
          code: {
            filename: 'Frames.java',
            language: 'java',
            code: `final class Frames {
    static int add(int left, int right) {
        int sum = left + right;
        return sum;
    }

    public static void main(String[] args) {
        int first = add(2, 3);
        int second = add(first, 4);
        System.out.println(second);
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'The call creates a frame with slots for left, right, and sum.',
              },
              {
                line: 3,
                note: 'sum is a local primitive in this frame, not an object on the heap.',
              },
              {
                line: 8,
                note: 'The returned int is copied into main’s frame; add’s frame is gone.',
              },
              {
                line: 9,
                note: 'This is a separate invocation with a fresh frame.',
              },
            ],
            output: `9`,
          },
        },
        {
          title: 'A reference slot is copied by value',
          body:
            'A primitive slot contains the value itself. An object variable contains a reference value: a way to reach an object. Assigning one object variable to another copies that reference, not the object. Passing an object to a method copies the reference into the new frame’s parameter slot.\n\nThis has two consequences that look contradictory until you separate the slot from the object. Reassigning the parameter changes only the parameter slot, so the caller’s variable still points where it did. Mutating the object through the copied reference changes the shared object, so the caller sees it. Java is always pass-by-value; for objects, the value being passed is a reference.',
          code: {
            filename: 'Passing.java',
            language: 'java',
            code: `final class Passing {
    static void mutate(int[] values) {
        values[0] = 9;
    }

    static void reassign(int[] values) {
        values = new int[] { 7 };
    }

    public static void main(String[] args) {
        int[] data = { 1 };
        mutate(data);
        reassign(data);
        System.out.println(data[0]);
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The parameter points at the caller’s array, so changing an element is visible.',
              },
              {
                line: 7,
                note: 'This assigns a new array to the parameter slot only; the caller’s slot is unchanged.',
              },
              {
                line: 12,
                note: 'mutate ran first and changed the shared array.',
              },
              {
                line: 13,
                note: 'reassign did not change which array data points at.',
              },
            ],
            output: `9`,
          },
        },
        {
          title: 'Objects outlive the frame that created them',
          body:
            '`new` allocates an object on the heap. The constructor initializes its fields, and the expression returns a reference to that object. Arrays are objects too. The object does not live inside the local variable; the variable only holds a route to it.\n\nA method can return a reference to an object it created. The frame disappears, but the returned reference becomes part of the caller’s frame. The object remains reachable for as long as any live reference chain leads to it. This is also how a collection can keep an object alive long after the request that created it has finished.',
          code: {
            filename: 'Escaping.java',
            language: 'java',
            code: `import java.util.ArrayList;
import java.util.List;

final class Escaping {
    static List<String> load() {
        List<String> rows = new ArrayList<>();
        rows.add("A-1");
        return rows;
    }

    public static void main(String[] args) {
        List<String> first = load();
        List<String> second = first;
        second.add("A-2");
        System.out.println(first.size());
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The ArrayList is allocated on the heap, not in the local slot.',
              },
              {
                line: 8,
                note: 'Returning the reference lets the object escape load’s frame.',
              },
              {
                line: 13,
                note: 'This copies the reference. first and second now point at the same object.',
              },
              {
                line: 14,
                note: 'Mutating through second is visible through first because there is one list.',
              },
            ],
            output: `2`,
          },
        },
        {
          title: 'Reachability decides lifetime, not scope',
          body:
            'A tracing garbage collector starts from roots such as live thread stacks, static fields, and JVM-internal references. It follows every reference and marks the objects it can reach. Anything left unmarked is eligible for collection; it is not necessarily reclaimed at that instant.\n\nThis is why nulling a local variable does not guarantee immediate collection, and why an object can stay alive after its creating method returns: a static cache, a listener list, or another live object may still reference it. It is also why a long-lived collection is a common leak shape. Reachability is a graph property, not a lexical-scope property.',
          code: {
            filename: 'Reachability.java',
            language: 'java',
            code: `import java.util.ArrayList;
import java.util.List;

final class Reachability {
    static final List<byte[]> CACHE = new ArrayList<>();

    static void remember() {
        CACHE.add(new byte[1_000_000]);
    }

    public static void main(String[] args) {
        remember();
        System.out.println(CACHE.size());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'A static field is a GC root, so the list and everything it references stay reachable.',
              },
              {
                line: 8,
                note: 'The array is allocated in remember’s frame but immediately stored in the static list.',
              },
              {
                line: 13,
                note: 'remember has returned, yet the array is still reachable through CACHE.',
              },
            ],
            output: `1`,
          },
        },
        {
          title: 'Recursion spends stack, not heap',
          body:
            'Every recursive call is another frame. The stack has a fixed maximum size for each thread, set by the JVM and optionally by `-Xss`. If the call chain exceeds it, the JVM throws `StackOverflowError`. The heap can be almost empty; increasing `-Xmx` will not help.\n\nThe repair depends on the algorithm. A missing base case needs one. A legitimately deep traversal may need an explicit stack or an iterative formulation. Raising the stack size can buy room for a bounded workload, but it turns the limit into a configuration assumption instead of a design decision.',
          code: {
            filename: 'Depth.java',
            language: 'java',
            code: `final class Depth {
    static int count(int n) {
        return count(n + 1) + 1;
    }

    public static void main(String[] args) {
        System.out.println(count(0));
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'Each invocation creates a frame with its own copy of the parameter n.',
              },
              {
                line: 3,
                note: 'There is no base case, so every call adds another frame and never returns.',
              },
              {
                line: 7,
                note: 'The first call is ordinary; the failure comes from unbounded depth.',
              },
            ],
          },
        },
      ],
      outro:
        'A frame is a temporary workspace. A reference is a copied route into the shared heap. Reachability is what keeps an object alive, and recursion consumes stack frames rather than heap objects.',
    },
    code: {
      intro:
        'Start with a reference copied into a method, then watch an object escape the frame that created it.',
      minimal: {
        filename: 'Refs.java',
        language: 'java',
        code: `final class Refs {
    static void add(int[] values) {
        values[0] = 9;
    }
    static void replace(int[] values) {
        values = new int[] { 7 };
    }
    public static void main(String[] args) {
        int[] data = { 1 };
        add(data);
        replace(data);
        System.out.println(data[0]);
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The copied reference still points at the caller’s array, so the element changes.',
          },
          {
            line: 6,
            note: 'The parameter is reassigned to a new array. The caller’s reference is untouched.',
          },
          {
            line: 12,
            note: 'Only the mutation is visible; the replacement never escaped the method.',
          },
        ],
        output: `9`,
      },
      realistic: {
        filename: 'Orders.java',
        language: 'java',
        code: `import java.util.ArrayList;
import java.util.List;

final class Orders {
    static List<String> load() {
        List<String> rows = new ArrayList<>();
        rows.add("A-1");
        return rows;
    }

    public static void main(String[] args) {
        List<String> first = load();
        List<String> second = first;
        second.add("A-2");
        System.out.println(first.size());
    }
}`,
        annotations: [
          {
            line: 6,
            note: 'The list object is allocated on the heap; rows holds a reference to it.',
          },
          {
            line: 8,
            note: 'The return value carries the reference out of load’s frame.',
          },
          {
            line: 13,
            note: 'This copies the reference value, so both variables name the same list.',
          },
          {
            line: 14,
            note: 'The mutation is visible through either reference; there is no second list.',
          },
        ],
        output: `2`,
      },
    },
    breakIt: {
      title: 'The recursion that never reached its base case',
      scenario:
        'A nested-expression parser calls itself once per level of nesting. A malformed input contains a long run of opening brackets, and the service dies with `StackOverflowError`. The heap dashboard shows plenty of free space, so the team tries increasing `-Xmx`. The service still dies at roughly the same input size.',
      brokenCode: {
        filename: 'Depth.java',
        language: 'java',
        code: `final class Depth {
    static int count(int n) {
        return count(n + 1) + 1;
    }

    public static void main(String[] args) {
        System.out.println(count(0));
    }
}`,
      },
      predictionPrompt:
        'The heap has free space and the recursion uses no collections. Which resource is exhausted, and what would increasing `-Xmx` change?',
      failureKind: 'resource',
      reveal: {
        observed:
          'The program prints a repeating stack trace and ends with `java.lang.StackOverflowError` at `Depth.count(Depth.java:3)`. The heap is not exhausted.',
        explanation:
          'Each call to `count` pushes a new frame. Since there is no base case, the chain grows until the thread’s stack limit is reached. The JVM cannot allocate another frame and throws `StackOverflowError`. `-Xmx` controls the maximum heap, not the per-thread stack. The frame limit is a different resource, configured by `-Xss` and constrained by the platform.',
        repair:
          'Add a base case that stops the recursion, or convert the traversal to an explicit stack or loop when the input depth is not bounded. If deep recursion is genuinely required and bounded, raise `-Xss` deliberately and document the limit. Do not treat a larger heap as a fix for stack exhaustion.',
        correctedCode: {
          filename: 'Depth.java',
          language: 'java',
          code: `final class Depth {
    static int count(int n, int limit) {
        if (n >= limit) {
            return n;
        }
        return count(n + 1, limit) + 1;
    }

    public static void main(String[] args) {
        System.out.println(count(0, 10));
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Reference and stack questions attract confident slogans. These are the patterns that produce wrong fixes even when the code compiles.',
      mistakes: [
        {
          title: 'Saying Java passes objects by reference',
          generatedPattern:
            '“Objects are passed by reference, so reassigning the parameter should update the caller’s variable.”',
          whyItFails:
            'The argument is a reference value, and Java copies it into the parameter slot. Reassigning the parameter replaces the copy. Mutation through the copy is visible because both copies point at the same object, but the caller’s slot never changes.',
          correction:
            'Describe Java as pass-by-value for every argument. For objects, the value is a reference. Mutate the object or return the new reference explicitly instead of expecting parameter reassignment to propagate.',
          telltale:
            'A helper method that assigns a new object to its parameter and relies on the caller seeing the replacement.',
        },
        {
          title: 'Claiming every local object lives on the stack',
          generatedPattern:
            '“The object is created inside the method, so the JVM stores it on the stack and frees it when the method returns.”',
          whyItFails:
            'Objects have identity and are modeled as heap allocations. An optimizing JIT may scalar-replace a non-escaping object, but that is an invisible optimization, not a lifetime rule. The object can escape through a return value, field, collection, or another thread.',
          correction:
            'Reason from escape and reachability: a local reference does not keep an object alive after the frame disappears if no other reference exists, but the object itself is not owned by the frame. Treat stack allocation as a possible optimization, not a semantic guarantee.',
          telltale:
            'An explanation that uses “on the stack” to justify object identity, synchronization, or when a finalizer runs.',
        },
        {
          title: 'Using null or System.gc() as a memory fix',
          generatedPattern:
            '“Set the local to null after use and call `System.gc()`; that will release the memory immediately.”',
          whyItFails:
            'Setting one reference to null only removes one route to the object. Another field, collection, or thread may still reach it. `System.gc()` is a suggestion, not a command, and forcing collections in application code usually trades latency for no correctness benefit.',
          correction:
            'Find the retaining reference. Fix the lifetime of the cache, listener, static field, or collection that keeps the object reachable. Let the collector choose when to run; use heap analysis to confirm what is actually retained.',
          telltale:
            'A memory fix that adds `System.gc()`, null assignments, or a larger `-Xmx` without identifying the retaining path.',
        },
        {
          title: 'Treating StackOverflowError as a heap leak',
          generatedPattern:
            '“The service ran out of memory, so I increased the heap. StackOverflowError is just another OutOfMemoryError.”',
          whyItFails:
            '`StackOverflowError` means the thread’s call stack reached its depth limit. `OutOfMemoryError: Java heap space` means the heap could not satisfy an allocation. They use different resources and need different evidence and repairs.',
          correction:
            'Read the error and the stack trace. For stack exhaustion, inspect recursion depth and base cases; for heap exhaustion, inspect live-set retention and allocation rate. Change the resource that actually ran out.',
          telltale:
            'A larger `-Xmx` proposed for a stack trace that repeats the same recursive method.',
        },
      ],
      reviewChecklist: [
        'Does the explanation distinguish a copied reference from a copied object?',
        'Is every claim about object lifetime tied to reachability from a root?',
        'Are stack depth and heap size treated as separate resources?',
        'Does a helper that replaces a parameter return the new value explicitly?',
        'Is any "stack allocation" claim presented as an optimization rather than a guarantee?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer is checking whether you can draw the frames and references, not whether you memorized a slogan about the stack.',
      questions: [
        {
          id: 'java.l0.memory-in-motion.interview.1',
          difficulty: 'junior',
          question: 'What is the difference between the stack and the heap in Java?',
          modelAnswer:
            'Each thread has a stack of frames. A frame is created for a method call and holds local variable slots, intermediate values, and return state. Frames are popped when the method returns or throws. Objects and arrays are allocated on the heap, which is shared by threads and managed by the garbage collector. A local object variable is a slot in a frame that holds a reference to a heap object; the object is not stored inside the slot.',
          weakAnswer:
            'Primitives go on the stack and objects go on the heap, and the stack is faster.',
          strongAnswer:
            'The stack is per-thread call state with a fixed maximum depth. The heap is shared storage for objects with identity. Local primitive values live in frame slots; local object variables hold reference values that point into the heap. The distinction matters for lifetime and sharing: popping a frame ends its locals, but a heap object survives if another reference still reaches it. Escape analysis may optimize an allocation, but that does not change the language model.',
          followUp: 'Where does the object referenced by a local variable live after the method returns?',
        },
        {
          id: 'java.l0.memory-in-motion.interview.2',
          difficulty: 'mid',
          question:
            'A method receives a `List` and adds an element; the caller sees it. The same method assigns a new list to its parameter; the caller does not. Explain both results.',
          modelAnswer:
            'The argument is a reference value copied into the parameter. Adding an element mutates the object both references point at, so the caller observes the change. Assigning a new list replaces only the parameter’s copy of the reference. The caller’s variable still points at the original list. Java is pass-by-value; for objects, the copied value is a reference. If the method needs to return a different list, it must return it or mutate a holder the caller can observe.',
          weakAnswer:
            'Objects are passed by reference, so both changes should be visible. The second one is probably a compiler optimization.',
          strongAnswer:
            'There is one list object and two reference slots. Mutation changes the shared object; reassignment changes one slot. I would make that explicit in the API by returning the new list or by documenting that the method mutates in place. If I saw this in review, I would ask whether the parameter reassignment was meant to be observable, because it usually signals a misunderstanding of the calling contract.',
          followUp: 'How would you redesign the method so the caller can receive a replacement list safely?',
        },
        {
          id: 'java.l0.memory-in-motion.interview.3',
          difficulty: 'senior',
          question:
            'A service alternates between `StackOverflowError` and heap growth alerts. How do you separate the causes and choose a fix?',
          modelAnswer:
            'I would start with the evidence. A stack trace repeating the same frames points to recursion depth or a cyclic call path; a heap alert with a growing live set points to retention. A thread dump shows what each thread is executing, and a heap histogram or dump shows what is retained after a full collection. I would check whether the two symptoms share an input path: a recursive parser can also build a large object graph, in which case both limits are real. The fixes differ: bound the recursion or use an explicit stack, and remove the retaining reference or reduce the live set. Raising limits is a mitigation only after the growth is understood.',
          weakAnswer:
            'Both are memory errors, so I would increase the heap and the stack size until the alerts stop.',
          strongAnswer:
            'I would not merge them into one “memory” problem. I would capture the exact error, the repeating frames, and the live-set trend across collections. Then I would reproduce with a bounded input and inspect the retention path or recursion depth. If both occur on the same request, I would fix the algorithmic depth first and re-measure the heap, because a deep traversal can allocate per frame. Configuration changes come after the mechanism is known, with a documented bound and a load test.',
          followUp: 'What would you look for in a heap dump that a stack trace cannot show?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Prove what a copied reference can and cannot change',
      brief:
        'Write a small program with a mutable `Box` class. One method mutates the box it receives; another replaces its parameter with a new box. Print the value before and after each call, then repeat the experiment with two variables that reference the same box. Use the output to explain reference copying without saying “pass by reference.”',
      constraints: [
        'Define a `Box` class with one mutable `int value` field and a constructor.',
        'Write `mutate(Box box)` that changes the field through the parameter.',
        'Write `replace(Box box)` that assigns a new `Box` to the parameter without changing the original.',
        'In `main`, print the original value after each call and show that aliasing two variables produces one shared object.',
        'Add a comment or printed explanation that states Java passes the reference value by value.',
      ],
      starterCode: {
        filename: 'ReferenceLab.java',
        language: 'java',
        code: `final class ReferenceLab {
    static final class Box {
        int value;

        Box(int value) {
            this.value = value;
        }
    }

    static void mutate(Box box) {
        // Change the shared object.
    }

    static void replace(Box box) {
        // Replace only the local parameter.
    }

    public static void main(String[] args) {
        // Run both methods and print the evidence.
    }
}`,
      },
      referenceSolution: {
        filename: 'ReferenceLab.java',
        language: 'java',
        code: `final class ReferenceLab {
    static final class Box {
        int value;

        Box(int value) {
            this.value = value;
        }
    }

    static void mutate(Box box) {
        box.value = 42;
    }

    static void replace(Box box) {
        box = new Box(99);
    }

    public static void main(String[] args) {
        Box original = new Box(1);

        mutate(original);
        System.out.println("after mutate: " + original.value);

        replace(original);
        System.out.println("after replace: " + original.value);

        Box alias = original;
        alias.value = 7;
        System.out.println("through alias: " + original.value);
        System.out.println("same object: " + (alias == original));
    }
}`,
        annotations: [
          {
            line: 11,
            note: 'The parameter holds a copy of the caller’s reference, so the field change is visible.',
          },
          {
            line: 15,
            note: 'This replaces only the parameter slot; the caller still points at the original box.',
          },
          {
            line: 26,
            note: 'The alias receives another copy of the same reference value.',
          },
          {
            line: 28,
            note: 'Both variables reach one object, which is why the mutation is visible.',
          },
        ],
      },
      rubric: [
        {
          id: 'mutation-visible',
          check: 'Does the mutate method change the caller’s box and print the new value?',
          detail:
            'This proves that a copied reference still reaches the same object.',
          mustPass: true,
        },
        {
          id: 'reassignment-local',
          check: 'Does the replace method fail to change the caller’s box?',
          detail:
            'This proves that assigning a new object to a parameter does not update the caller’s slot.',
          mustPass: true,
        },
        {
          id: 'aliasing',
          check: 'Does the program demonstrate two variables sharing one object?',
          detail:
            'Aliasing is the observable consequence of copying a reference value. The identity comparison makes it explicit.',
          mustPass: true,
        },
        {
          id: 'explanation',
          check: 'Does the output or a comment correctly describe pass-by-value for the reference?',
          detail:
            'The exercise is meant to replace the “pass by reference” slogan with a slot-and-object model.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac ReferenceLab.java` and `java ReferenceLab`. Expect the value to change after `mutate`, stay unchanged after `replace`, and change again through the alias.',
        'Change `replace` to mutate the box instead of reassigning it. Explain why the caller now sees the change.',
        'Add a second alias and set the original variable to null. Explain why the object is still reachable through the alias and why that matters for garbage collection.',
      ],
    },
    recap: [
      'A method call pushes a frame; returning or throwing pops it and ends its local slots.',
      'A reference is copied by value, so mutation through a copy is visible but parameter reassignment is not.',
      'Objects live on the heap and remain alive while a GC root can reach them through references.',
      'Stack overflow is exhausted call depth, not exhausted heap, and needs a base case or an iterative design.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.memory-in-motion.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l0.stack-frame', 'java.l0.reference-value'],
      prompt: 'After a method returns, what happens to its local object variable and the object it referenced?',
      options: [
        {
          id: 'both-gone',
          text: 'The slot and the object are both destroyed immediately.',
        },
        {
          id: 'slot-gone-object-may-live',
          text: 'The slot is gone; the object survives if another reference can still reach it.',
        },
        {
          id: 'object-copied',
          text: 'The object is copied into the caller’s frame before the slot disappears.',
        },
        {
          id: 'slot-lives',
          text: 'The slot remains on the heap until the next garbage collection.',
        },
      ],
      correctOptionId: 'slot-gone-object-may-live',
      explanation:
        'The frame is popped, so its local slots disappear. The heap object is independent; it remains reachable through any returned reference, field, collection, or other root.',
    },
    {
      id: 'java.l0.memory-in-motion.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l0.reference-value'],
      prompt:
        'The caller expects `reset` to replace its array with a zero-filled one, but the original values remain. Which line causes the misunderstanding?',
      code: `final class Reset {
    static void reset(int[] values) {
        values = new int[values.length];
    }

    public static void main(String[] args) {
        int[] data = { 1, 2, 3 };
        reset(data);
        System.out.println(data[0]);
    }
}`,
      codeLanguage: 'java',
      bugLine: 3,
      bugSummary:
        'Assigning a new array to the parameter changes only the local copy of the reference; the caller still points at the original array.',
      explanation:
        'Java passes the reference value by value. The parameter and the caller’s variable initially point at one array, but the assignment on line 3 replaces only the parameter’s slot. To return a different array, the method must return it or copy values into the existing array.',
    },
    {
      id: 'java.l0.memory-in-motion.recall.q3',
      type: 'explain',
      concepts: ['java.l0.object-reachability', 'java.l0.stack-overflow'],
      prompt:
        'A service throws StackOverflowError while the heap has free space. Explain what resource is exhausted, and how you would distinguish it from an OutOfMemoryError caused by retained objects.',
      keyPoints: [
        'StackOverflowError means the thread’s call stack reached its depth limit, usually through deep or unbounded recursion.',
        'The heap is a separate area; free heap space does not prevent stack exhaustion.',
        'An OutOfMemoryError about Java heap space means an allocation could not be satisfied, often because objects are still reachable.',
        'The evidence differs: repeating recursive frames versus heap growth and a retained live set.',
      ],
      modelAnswer:
        'Each method call pushes a frame onto its thread’s stack. Unbounded recursion keeps pushing frames until the fixed stack limit is reached, and the JVM throws StackOverflowError. The heap can be mostly empty because the failure is call depth, not allocation. An OutOfMemoryError about the Java heap means the collector could not free enough room for an allocation, which points to retained objects or an allocation rate larger than the heap. I would inspect the stack trace for repeated frames and use a thread dump for depth; for heap growth I would use a heap histogram or dump to find the retaining path. Increasing -Xmx does not fix stack depth.',
      explanation:
        'Strong answers name the two resources and the evidence that separates them. They do not treat every memory error as one problem.',
    },
  ],
});
