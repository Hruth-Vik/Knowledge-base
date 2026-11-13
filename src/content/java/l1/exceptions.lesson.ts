import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.exceptions',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'flow-and-failure',
    title: 'Flow and Failure',
  },
  sequence: 4,
  slug: 'exceptions',
  title: 'Failure Has to Travel Somewhere',
  deck: 'Exceptions unwind the stack, close resources, and cross layer boundaries. Lose the cause and you lose the only evidence of what happened.',
  kind: 'standard',
  estimatedMinutes: 17,
  tags: ['exceptions', 'try-with-resources', 'cause', 'checked', 'failure'],
  concepts: [
    {
      id: 'java.l1.exception-taxonomy',
      title: 'Checked and unchecked exceptions',
      kind: 'term',
      summary: [
        'Checked exceptions extend Exception but not RuntimeException and must be declared or handled.',
        'Unchecked exceptions extend RuntimeException and signal programming errors or contract violations.',
        'Error marks serious JVM-level failures that ordinary code should not try to recover from.',
      ],
      aliases: ['checked exception', 'runtime exception', 'throwable hierarchy'],
      tags: ['java', 'exceptions'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-frame',
        },
      ],
    },
    {
      id: 'java.l1.try-with-resources',
      title: 'Try-with-resources',
      kind: 'mechanism',
      summary: [
        'A resource declared in the try header is closed automatically in reverse order.',
        'If the body and close both fail, close becomes a suppressed exception on the primary one.',
        'The construct replaces the error-prone finally block for AutoCloseable resources.',
      ],
      aliases: ['AutoCloseable', 'suppressed exception', 'automatic close'],
      tags: ['java', 'exceptions', 'resources'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.exception-taxonomy',
        },
      ],
    },
    {
      id: 'java.l1.exception-translation',
      title: 'Exception translation',
      kind: 'principle',
      summary: [
        'Each layer should expose failures in its own vocabulary instead of leaking implementation details.',
        'A translated exception must keep the original as its cause.',
        'Translation is not swallowing: the failure still stops the current operation and reaches a handler.',
      ],
      aliases: ['wrap and rethrow', 'cause chaining', 'layer boundary'],
      tags: ['java', 'exceptions', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.exception-taxonomy',
        },
      ],
    },
  ],
  revisits: ['java.l0.stack-frame', 'java.l0.stack-overflow', 'java.l1.autoboxing'],
  versionCaveats: [
    'Examples target Java 21 LTS. try-with-resources has been available since Java 7; Java 9 added the ability to use an effectively final variable that is already declared.',
    'Suppressed exceptions are recorded on the primary throwable and printed by printStackTrace, but a logging framework must be configured to include them; logging only getMessage() discards both the cause chain and the suppression.',
    'Checked exceptions are a language rule, not a universal design law. Frameworks and APIs differ on whether to expose them, but the compiler enforces declarations for the checked ones you throw.',
  ],
  references: [
    {
      title: 'Java Language Specification: Exception Handling',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html',
      note: 'The throwable hierarchy, checked versus unchecked rules, and the precise semantics of try, catch, and finally.',
    },
    {
      title: 'Java SE 21 API: Throwable',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html',
      note: 'Cause chaining, suppressed exceptions, and the difference between getMessage and the stack trace.',
    },
    {
      title: 'Java SE 21 API: AutoCloseable',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html',
      note: 'The contract that try-with-resources uses, including the close method that may throw.',
    },
  ],
  sections: {
    problem:
      'A checkout handler fails with a clear database error. By the time it reaches the API response, the message says `"checkout failed"` and nothing else. The original SQL state, the constraint name, and the line that threw are gone. On another path, a file read fails and the connection is closed in a `finally` block; the close also fails, and the second exception replaces the first. The log shows a disk error on close while the real read failure disappears.\n\nBoth outcomes come from treating an exception as a message instead of an object with a path. It carries a type, a stack trace, a cause, and possibly suppressed exceptions. The rules for who must declare it, how resources are closed, and how it crosses a layer decide whether that evidence survives.',
    analogy: {
      title: 'The incident report chain',
      body:
        'A worker at a machine reports a jammed feed. The supervisor does not rewrite the report as “production issue” and throw the original away. The supervisor adds context, attaches the original sheet, and forwards it. Each layer can describe the problem in its own terms while the chain of evidence stays intact.\n\nA `finally` block is like a cleanup crew that files its own incident on the way out. If the cleanup report replaces the original, the next responder investigates the wrong event. A suppressed exception is the note that says: here is the cleanup failure, attached to the primary incident.',
      mapping: [
        {
          technical: 'A thrown exception',
          everyday: 'An incident report moving up the chain',
        },
        {
          technical: 'The stack trace',
          everyday: 'The list of stations the report passed through',
        },
        {
          technical: 'The cause field',
          everyday: 'The original report attached to a summary',
        },
        {
          technical: 'Exception translation',
          everyday: 'A supervisor restating the problem for their layer',
        },
        {
          technical: 'A suppressed exception',
          everyday: 'A cleanup problem filed alongside the primary report',
        },
      ],
      whereItBreaks:
        'An incident report is written once and copied; a Java exception is an object that is thrown once and then referenced. Rethrowing a new exception without the cause really does discard the chain, which is why translation is a deliberate act. The analogy also implies that every layer must add a report. Good code often lets an exception pass unchanged when the layer has nothing useful to add.',
    },
    mentalModel: {
      title: 'Unwind, close, translate, preserve',
      figure: {
        width: 960,
        height: 380,
        caption:
          'A throw unwinds frames until a matching catch. Resources close on the way out. A layer may translate the type, but it must attach the original as the cause.',
        alt: 'A diagram showing a throw inside a method unwinding the stack to a catch handler. A resource branch closes in reverse order and records a suppressed exception. A translation branch wraps a low-level exception in a domain exception and keeps the cause chain.',
        nodes: [
          {
            id: 'throw',
            label: 'throw',
            detail: 'inside a frame',
            x: 16,
            y: 32,
            width: 160,
            height: 84,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'unwind',
            label: 'unwind frames',
            detail: 'finally still runs',
            x: 220,
            y: 32,
            width: 176,
            height: 84,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'catch',
            label: 'matching catch',
            detail: 'nearest handler',
            x: 440,
            y: 32,
            width: 176,
            height: 84,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'resource',
            label: 'AutoCloseable',
            detail: 'closed in reverse order',
            x: 220,
            y: 160,
            width: 176,
            height: 84,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'suppressed',
            label: 'suppressed',
            detail: 'cleanup failure attached',
            x: 440,
            y: 160,
            width: 176,
            height: 84,
            shape: 'note',
            tone: 'correct',
          },
          {
            id: 'domain',
            label: 'domain exception',
            detail: 'layer vocabulary',
            x: 660,
            y: 32,
            width: 168,
            height: 84,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'cause',
            label: 'cause preserved',
            detail: 'original throwable',
            x: 660,
            y: 160,
            width: 168,
            height: 84,
            shape: 'note',
            tone: 'correct',
          },
          {
            id: 'lost',
            label: 'cause lost',
            detail: 'message only',
            x: 660,
            y: 272,
            width: 168,
            height: 72,
            shape: 'box',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'throw',
            to: 'unwind',
            label: 'propagates',
            kind: 'flow',
          },
          {
            from: 'unwind',
            to: 'catch',
            label: 'finds',
            kind: 'flow',
          },
          {
            from: 'unwind',
            to: 'resource',
            label: 'closes',
            kind: 'flow',
          },
          {
            from: 'resource',
            to: 'suppressed',
            label: 'if close fails',
            kind: 'flow',
          },
          {
            from: 'catch',
            to: 'domain',
            label: 'translate',
            kind: 'flow',
          },
          {
            from: 'domain',
            to: 'cause',
            label: 'attach',
            kind: 'depends',
          },
          {
            from: 'domain',
            to: 'lost',
            label: 'without cause',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 348,
            text: 'A catch only runs after the frames above it have unwound.',
          },
          {
            x: 440,
            y: 348,
            text: 'The primary failure stays primary; cleanup failures are suppressed.',
          },
          {
            x: 660,
            y: 348,
            text: 'A new type may hide the implementation, never the evidence.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Start with the compiler’s checked/unchecked rule, then follow the unwind path through cleanup, and finish at the layer boundary where a failure is translated.',
      steps: [
        {
          title: 'The hierarchy decides who must handle what',
          body:
            'Every throwable descends from `Throwable`. `Error` and its subclasses describe JVM or environment failures such as `OutOfMemoryError`. `Exception` splits into checked exceptions and `RuntimeException` plus its subclasses, which are unchecked. The compiler requires a checked exception to be caught or declared in the method signature; it imposes no such rule for unchecked ones.\n\nThe distinction is about the compiler contract, not about seriousness. An unchecked `NullPointerException` can be more damaging than a checked `IOException`. Unchecked exceptions usually mean the caller broke a precondition or the code has a bug. Checked exceptions usually mean an operation can fail for reasons outside the caller’s control, and the caller must decide at which boundary to handle it.',
          code: {
            filename: 'Taxonomies.java',
            language: 'java',
            code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

final class Taxonomies {
    static int parse(String text) {
        return Integer.parseInt(text);
    }

    static String read(String path) throws IOException {
        return Files.readString(Path.of(path));
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'NumberFormatException is unchecked, so the compiler does not require a throws clause.',
              },
              {
                line: 10,
                note: 'IOException is checked; callers must handle it or add it to their own signature.',
              },
              {
                line: 11,
                note: 'The declaration documents a failure the method cannot prevent, such as a missing file.',
              },
            ],
          },
        },
        {
          title: 'Unwinding runs finally blocks on the way out',
          body:
            'When an exception is thrown, the JVM searches the current frame for a matching catch. If there is none, the frame is popped, its `finally` blocks run, and the search continues in the caller. This repeats until a handler is found. A catch that does not match still lets the exception continue, but `finally` always runs on the way out.\n\nA `finally` block that throws replaces the exception in flight. If `close()` fails while the body is already failing, the close exception becomes the one the caller sees. The original is not automatically attached. That is why resource cleanup in `finally` is easy to get subtly wrong.',
          code: {
            filename: 'Masking.java',
            language: 'java',
            code: `import java.io.IOException;

final class Masking {
    static final class Resource implements AutoCloseable {
        public void close() throws IOException {
            throw new IOException("close failed");
        }
    }

    static void run() throws IOException {
        Resource resource = new Resource();
        try {
            throw new IOException("work failed");
        } finally {
            resource.close();
        }
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The cleanup itself can fail, which is the case finally blocks handle badly.',
              },
              {
                line: 13,
                note: 'This is the primary failure the caller needs to see.',
              },
              {
                line: 15,
                note: 'The close failure replaces the primary exception; “work failed” disappears.',
              },
              {
                line: 11,
                note: 'The resource is acquired outside the protected block, so the acquire failure is separate.',
              },
            ],
          },
        },
        {
          title: 'Try-with-resources attaches cleanup failures',
          body:
            'A resource declared in the try header is closed automatically, in reverse order of declaration, before control leaves the block. The compiler generates a close path that runs on normal completion and on failure. If the body throws and a later close also throws, the body exception stays primary and the close failure is added to its suppressed list.\n\nThe suppressed exceptions are part of the throwable object. `printStackTrace` prints them, and structured logging should include them. If the code catches the primary exception and logs only `getMessage()`, the suppressed detail is lost even though it was recorded. Use the logging call that accepts a `Throwable`, not just a string.',
          code: {
            filename: 'Resources.java',
            language: 'java',
            code: `import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

final class Resources {
    static String firstLine(String path) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'The reader is closed automatically when the block exits, including by exception.',
              },
              {
                line: 8,
                note: 'The return value is computed, then close runs before the method actually returns.',
              },
              {
                line: 9,
                note: 'A close failure here becomes suppressed on the primary exception, not a replacement.',
              },
            ],
          },
        },
        {
          title: 'Translate at the boundary and keep the cause',
          body:
            'A persistence layer should not leak `SQLException` into a domain service, and a domain service should not require the web layer to know its internal types. Translation gives each layer a vocabulary it can respond to. The rule is simple: construct the new exception with the original as its cause, usually through `super(message, cause)`.\n\nTranslation is not the same as swallowing. Swallowing catches a failure and continues as if it succeeded, often returning a default. Translation stops the current operation and sends a typed failure to a handler that can decide what to do. If the layer has nothing useful to add, letting the original propagate is better than wrapping it in a vague runtime exception.',
          code: {
            filename: 'Accounts.java',
            language: 'java',
            code: `record Account(String id) {}

final class Accounts {
    static Account find(String id) {
        try {
            return lookup(id);
        } catch (IllegalArgumentException cause) {
            throw new AccountNotFoundException("account " + id, cause);
        }
    }

    private static Account lookup(String id) {
        throw new IllegalArgumentException("malformed id");
    }
}

final class AccountNotFoundException extends RuntimeException {
    AccountNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'The low-level failure type belongs to the lookup implementation.',
              },
              {
                line: 8,
                note: 'The domain exception adds context and keeps the original as the cause.',
              },
              {
                line: 19,
                note: 'super(message, cause) is what preserves the chain for logs and debugging.',
              },
            ],
          },
        },
      ],
      outro:
        'The hierarchy sets the compiler contract. Unwinding runs cleanup. Try-with-resources keeps the primary failure primary. Translation changes the vocabulary while the cause chain carries the evidence.',
    },
    code: {
      intro:
        'Throw a checked condition with an explicit message, then translate a low-level failure at a domain boundary without discarding it.',
      minimal: {
        filename: 'Divide.java',
        language: 'java',
        code: `final class Divide {
    static int share(int total, int people) {
        if (people <= 0) {
            throw new IllegalArgumentException("people must be positive");
        }
        return total / people;
    }

    public static void main(String[] args) {
        System.out.println(share(10, 2));
        System.out.println(share(10, 0));
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The precondition is checked at the point where it can be enforced.',
          },
          {
            line: 4,
            note: 'IllegalArgumentException is unchecked, so callers are not forced to declare it.',
          },
          {
            line: 11,
            note: 'An uncaught exception unwinds main and prints its stack trace.',
          },
        ],
        output: `5
Exception in thread "main" java.lang.IllegalArgumentException: people must be positive
	at Divide.share(Divide.java:4)
	at Divide.main(Divide.java:11)`,
      },
      realistic: {
        filename: 'Accounts.java',
        language: 'java',
        code: `final class Accounts {
    static String describe(String id) {
        try {
            return load(id);
        } catch (IllegalArgumentException cause) {
            throw new AccountLookupException("cannot load " + id, cause);
        }
    }

    static String load(String id) {
        if (!id.startsWith("acct-")) {
            throw new IllegalArgumentException("bad id: " + id);
        }
        return "account " + id;
    }

    public static void main(String[] args) {
        System.out.println(describe("acct-42"));
        try {
            describe("42");
        } catch (AccountLookupException error) {
            System.out.println(error.getMessage());
            System.out.println(error.getCause().getMessage());
        }
    }
}

final class AccountLookupException extends RuntimeException {
    AccountLookupException(String message, Throwable cause) {
        super(message, cause);
    }
}`,
        annotations: [
          {
            line: 6,
            note: 'The domain exception says what the caller tried to do, not how the lookup works.',
          },
          {
            line: 7,
            note: 'Passing cause here is what makes the original failure retrievable later.',
          },
          {
            line: 22,
            note: 'The top-level handler can read the domain message and the original evidence.',
          },
          {
            line: 30,
            note: 'The constructor delegates to RuntimeException(message, cause).',
          },
        ],
        output: `account acct-42
cannot load 42
bad id: 42`,
      },
    },
    breakIt: {
      title: 'The log that blamed the cleanup',
      scenario:
        'A loader opens a resource, does work in a try block, and closes the resource in `finally`. During an incident the work throws, and the close also throws. The log contains only the close failure. The team spends the afternoon investigating the disk while the original parsing failure stays hidden.',
      brokenCode: {
        filename: 'Masking.java',
        language: 'java',
        code: `import java.io.IOException;

final class Masking {
    static final class Resource implements AutoCloseable {
        public void close() throws IOException {
            throw new IOException("close failed");
        }
    }

    static void run() throws IOException {
        Resource resource = new Resource();
        try {
            throw new IOException("work failed");
        } finally {
            resource.close();
        }
    }
}`,
      },
      predictionPrompt:
        'Both the work and the close throw an IOException. Which message reaches the caller, and where did the other one go?',
      failureKind: 'resource',
      reveal: {
        observed:
          'The caller receives `IOException: close failed`. The original `work failed` exception is not attached anywhere; it was replaced when the finally block threw.',
        explanation:
          'The exception from the try block is in flight when `finally` runs. A new throwable from `close()` replaces it, because Java propagates the exception that leaves the finally block. There is no automatic suppression in a hand-written finally block. The resulting log is internally consistent and completely misleading about the first failure.',
        repair:
          'Use try-with-resources so the resource is closed automatically and a close failure becomes suppressed on the primary exception. If a manual finally block is unavoidable, preserve the primary exception, attach the close failure with `addSuppressed`, and rethrow the primary. Never let cleanup silently replace the reason the operation failed.',
        correctedCode: {
          filename: 'Masking.java',
          language: 'java',
          code: `import java.io.IOException;

final class Masking {
    static final class Resource implements AutoCloseable {
        public void close() throws IOException {
            throw new IOException("close failed");
        }
    }

    static void run() throws IOException {
        try (Resource resource = new Resource()) {
            throw new IOException("work failed");
        }
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated exception handling often compiles cleanly and destroys the evidence. These patterns are worth checking in every catch block.',
      mistakes: [
        {
          title: 'Translating with only a message',
          generatedPattern:
            '“I wrapped the database error in a service exception: `throw new OrderException(e.getMessage());`.”',
          whyItFails:
            'The new exception has no cause, so the original type, stack trace, and suppressed exceptions are gone. The message may be a summary that omits the constraint, SQL state, or nested failure. Debugging starts from the wrapper and has nowhere to go.',
          correction:
            'Use `new OrderException("could not place order", cause)` so the original is attached. Log the full throwable at the boundary that handles it, not just the message.',
          telltale:
            'A catch block that constructs an exception from `getMessage()` or string concatenation without passing the caught object as a cause.',
        },
        {
          title: 'Catching Exception and returning a default',
          generatedPattern:
            '“The method can fail, so I catch `Exception` and return an empty list. The caller does not need to know.”',
          whyItFails:
            'The failure and the successful-empty case become indistinguishable. Retries, alerts, and user messages all see success. The catch also hides programming errors such as a null bug, not just expected I/O failures.',
          correction:
            'Catch the narrowest type that represents a recoverable condition, and decide explicitly whether to recover, translate, or propagate. If an empty result is a valid fallback, log or count the failure and document the policy.',
          telltale:
            '`catch (Exception e) { return Collections.emptyList(); }`, an empty catch block, or a catch that only prints a message.',
        },
        {
          title: 'Declaring throws Exception everywhere',
          generatedPattern:
            '“I added `throws Exception` to the method so the compiler stops complaining.”',
          whyItFails:
            'The signature no longer tells callers what can fail, so every caller must handle everything or widen its own signature. Implementation details leak upward and the eventual catch becomes too broad to respond usefully. It also forces callers to catch unchecked failures they did not need to declare.',
          correction:
            'Declare the specific checked exceptions the method can produce, or translate them into a domain type at the boundary. Keep unchecked exceptions out of the throws clause unless the documentation value is real.',
          telltale:
            '`throws Exception` on application methods, followed by a broad catch several layers up.',
        },
        {
          title: 'Closing resources in finally without a null check',
          generatedPattern:
            '“I will close the stream in `finally` to guarantee cleanup: `in.close();`.”',
          whyItFails:
            'If the constructor failed, the variable may be null and the close throws `NullPointerException`, masking the construction failure. If close itself fails, it replaces the primary exception. Double-close behavior also depends on the resource.',
          correction:
            'Declare the resource in a try-with-resources header so acquisition and close are handled together. If a manual finally block is required, guard against null and preserve the primary exception with `addSuppressed`.',
          telltale:
            'A `finally` block that dereferences a resource variable declared outside the try, especially one assigned inside it.',
        },
      ],
      reviewChecklist: [
        'Does every translated exception pass the original as its cause?',
        'Is the catch type narrow enough to distinguish recoverable failure from a bug?',
        'Are AutoCloseable resources declared in a try-with-resources header?',
        'Does logging include the full throwable rather than only getMessage()?',
        'Does the method signature name specific checked exceptions instead of throws Exception?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer wants the compiler rule, the runtime unwinding path, and a defensible boundary policy. Reciting “checked is for recoverable” is not enough.',
      questions: [
        {
          id: 'java.l1.exceptions.interview.1',
          difficulty: 'junior',
          question: 'What is the difference between a checked and an unchecked exception in Java?',
          modelAnswer:
            'A checked exception extends `Exception` but not `RuntimeException`. The compiler requires it to be caught or declared in the method signature. An unchecked exception extends `RuntimeException` and does not require a declaration. `Error` is separate and represents serious JVM-level failures. The distinction is a compile-time contract; it does not by itself say which failure is more severe.',
          weakAnswer:
            'Checked exceptions are recoverable and unchecked ones are bugs, so unchecked exceptions should never be caught.',
          strongAnswer:
            'The hierarchy determines what the compiler enforces. Checked exceptions force the caller to acknowledge a failure that may come from outside the program, such as I/O. Unchecked exceptions usually signal a broken precondition or programming error and are allowed to propagate to a top-level handler. Neither rule replaces judgment: a caller can recover from some runtime exceptions, and it can decide to translate a checked one immediately. I choose based on the API contract and the layer that can actually respond.',
          followUp: 'Where would you catch an unchecked exception, and what would you do there?',
        },
        {
          id: 'java.l1.exceptions.interview.2',
          difficulty: 'mid',
          question:
            'Why is try-with-resources safer than closing a resource in a finally block?',
          modelAnswer:
            'Try-with-resources closes the resource automatically on every exit path and, if the body and close both throw, keeps the body exception primary while attaching the close failure as suppressed. A hand-written finally block replaces the in-flight exception when close throws, so the original failure disappears. Try-with-resources also avoids a null dereference when the resource was never acquired and closes multiple resources in reverse order.',
          weakAnswer:
            'It is shorter and does not require a finally block, so there is less code to get wrong.',
          strongAnswer:
            'The important difference is exception semantics, not brevity. The generated close path preserves the primary failure and records cleanup failures as suppressed exceptions. A manual finally block that throws becomes the new primary exception. With multiple resources, the declaration order also defines a deterministic reverse close order. I would reserve manual cleanup for non-AutoCloseable state and handle suppression explicitly if it can fail while another exception is active.',
          followUp: 'How would you inspect a suppressed exception in a log or debugger?',
        },
        {
          id: 'java.l1.exceptions.interview.3',
          difficulty: 'senior',
          question:
            'How would you design exception handling across a controller, service, and repository so failures stay useful?',
          modelAnswer:
            'Each boundary should expose a vocabulary its caller can act on. The repository translates driver exceptions into a persistence or domain failure and keeps the cause. The service adds business context only when it can do so meaningfully, and otherwise lets the exception propagate. The controller maps domain failures to a response and logs the full throwable once, with a correlation identifier. Programming errors stay unchecked and reach a top-level handler. I would avoid catching Exception in the middle, avoid logging and rethrowing at every layer, and define which layer owns retries and which owns recovery.',
          weakAnswer:
            'Wrap every method in try/catch, log the error, and throw a RuntimeException so the controller can return 500.',
          strongAnswer:
            'The design question is ownership. Who can recover, who can add context, and who decides the external response? Translation preserves the cause; logging happens once at the handling boundary; retries happen only where the operation is idempotent and the failure is transient. I would make the exception types part of the service contract and test the mapping, including the case where a low-level cause must be visible in the log but not in the client response. That keeps both the diagnostic evidence and the API boundary intact.',
          followUp: 'What should a client response include from an internal exception, and what must it never include?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a loader that preserves failure',
      brief:
        'Write a small configuration loader that reads the first non-blank line of a file with try-with-resources. Translate missing and unreadable files into a checked `ConfigLoadException` that keeps the cause, and print the chain at the top level. Then show that a close failure does not replace the original read failure.',
      constraints: [
        'Use try-with-resources for the reader; do not close it in a finally block.',
        'Declare a checked `ConfigLoadException` with a constructor that accepts a message and a cause.',
        'Translate `IOException` into `ConfigLoadException` at the loader boundary and keep the cause.',
        'Return a clear result for an empty file rather than throwing an unexplained null.',
        'At the top level, print the domain message, the cause message, and the suppressed count.',
        'Include one successful read and one missing-file case.',
      ],
      starterCode: {
        filename: 'ConfigLoader.java',
        language: 'java',
        code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

final class ConfigLoader {
    static String firstLine(Path path) throws ConfigLoadException {
        // Read with try-with-resources and translate failures.
        return "";
    }

    public static void main(String[] args) {
        // Print a success, then a failure with its cause chain.
    }
}

final class ConfigLoadException extends Exception {
    ConfigLoadException(String message, Throwable cause) {
        super(message, cause);
    }
}`,
      },
      referenceSolution: {
        filename: 'ConfigLoader.java',
        language: 'java',
        code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

final class ConfigLoader {
    static String firstLine(Path path) throws ConfigLoadException {
        try {
            for (String line : Files.readAllLines(path)) {
                if (!line.isBlank()) {
                    return line;
                }
            }
            return "<empty>";
        } catch (IOException cause) {
            throw new ConfigLoadException("cannot read " + path, cause);
        }
    }

    public static void main(String[] args) {
        try {
            System.out.println(firstLine(Path.of("config.txt")));
        } catch (ConfigLoadException error) {
            System.out.println(error.getMessage());
            System.out.println(error.getCause().getMessage());
            System.out.println("suppressed: " + error.getSuppressed().length);
        }
    }
}

final class ConfigLoadException extends Exception {
    ConfigLoadException(String message, Throwable cause) {
        super(message, cause);
    }
}`,
        annotations: [
          {
            line: 8,
            note: 'Files.readAllLines opens and closes the file internally, so there is no leaked reader.',
          },
          {
            line: 15,
            note: 'The domain exception adds the operation and path without discarding the IOException.',
          },
          {
            line: 24,
            note: 'The cause is the original failure; the message alone would not be enough evidence.',
          },
          {
            line: 25,
            note: 'The suppressed count is printed as evidence; a close failure would appear here.',
          },
        ],
      },
      rubric: [
        {
          id: 'resource-safety',
          check: 'Is every opened resource closed automatically on success and failure?',
          detail:
            'A reader closed only on the success path leaks on failure. Try-with-resources also defines the suppression behavior.',
          mustPass: true,
        },
        {
          id: 'cause-preserved',
          check: 'Does the translated ConfigLoadException carry the original IOException as its cause?',
          detail:
            'Without the cause, the domain message hides the actual filesystem or permission error that the operator needs.',
          mustPass: true,
        },
        {
          id: 'domain-boundary',
          check: 'Does the loader expose a domain exception instead of leaking IOException to its caller?',
          detail:
            'The exercise is about translation at a boundary, not about renaming the same failure at every layer.',
          mustPass: true,
        },
        {
          id: 'empty-file',
          check: 'Does an empty file produce a documented result rather than an unexplained null or crash?',
          detail:
            'Absence of configuration is a domain case, not an exception that should be discovered late.',
          mustPass: false,
        },
        {
          id: 'evidence-output',
          check: 'Does the top-level handler print the domain message, cause, and suppressed count?',
          detail:
            'The output is the evidence that the chain survived translation.',
          mustPass: false,
        },
      ],
      verification: [
        'Create `config.txt` with a blank line followed by `port=8080`, then compile and run with `javac ConfigLoader.java` and `java ConfigLoader`. The success path should print `port=8080`.',
        'Rename the file and run again. The output should show the domain message, the original `NoSuchFileException` message, and a suppressed count of 0.',
        'Replace the try-with-resources path with a manual reader whose close throws, then explain why try-with-resources keeps the read failure primary.',
      ],
    },
    recap: [
      'Checked exceptions must be declared or caught; unchecked exceptions and errors are not enforced by the compiler.',
      'Unwinding runs finally blocks and closes resources; a throwing finally can replace the primary failure.',
      'Try-with-resources closes in reverse order and records close failures as suppressed exceptions on the primary one.',
      'Translate exceptions only when a layer can add meaning, and always preserve the original cause.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.exceptions.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.exception-taxonomy'],
      prompt: 'Which statement is true about a checked exception?',
      options: [
        {
          id: 'declare',
          text: 'The compiler requires it to be caught or declared in the method signature.',
        },
        {
          id: 'never',
          text: 'It can never be caught by a catch block.',
        },
        {
          id: 'runtime',
          text: 'It must extend `RuntimeException`.',
        },
        {
          id: 'ignored',
          text: 'It is ignored if the method returns a value.',
        },
      ],
      correctOptionId: 'declare',
      explanation:
        'A checked exception extends Exception but not RuntimeException. The compiler enforces handling or declaration; an unchecked exception has no such requirement.',
    },
    {
      id: 'java.l1.exceptions.recall.q2',
      type: 'predict-output',
      concepts: ['java.l1.try-with-resources'],
      prompt:
        'What does this program print? Assume `Resource.close()` throws `IOException("close")` and is declared in the try header.',
      code: `final class Demo {\n    public static void main(String[] args) throws Exception {\n        try (Resource resource = new Resource()) {\n            throw new IllegalStateException("work");\n        } catch (IllegalStateException error) {\n            System.out.println(error.getMessage());\n            System.out.println(error.getSuppressed().length);\n        }\n    }\n}`,
      codeLanguage: 'java',
      expectedOutput: `work
1`,
      acceptedOutputs: ['work\n1'],
      explanation:
        'The IllegalStateException from the body stays primary. The close failure is attached as a suppressed exception, so the message is still "work" and the suppressed count is 1.',
    },
    {
      id: 'java.l1.exceptions.recall.q3',
      type: 'explain',
      concepts: ['java.l1.exception-translation', 'java.l1.exception-taxonomy'],
      prompt:
        'A repository catches a low-level database exception and throws a domain exception. What must it preserve, and why is that different from swallowing the failure?',
      keyPoints: [
        'The original exception should be attached as the cause so the type, message, stack trace, and suppressed details remain available.',
        'Translation changes the vocabulary at a layer boundary while still stopping the current operation and reaching a handler.',
        'Swallowing catches the failure and continues as if it succeeded, often returning a default, so the caller cannot react.',
        'A good translation adds context the lower layer did not have, rather than replacing the evidence with a generic message.',
      ],
      modelAnswer:
        'The repository should throw a domain exception constructed with the original database exception as its cause. That keeps the stack trace, SQL state, constraint name, and any suppressed exceptions available to the handler and the logs. Translation is not swallowing: the operation still fails and the failure still propagates, but callers see a type that belongs to their layer. Swallowing would catch the failure and return a normal-looking result, which removes both the control-flow signal and the evidence.',
      explanation:
        'Strong answers separate vocabulary from evidence: the type can change, the cause must not. They also distinguish translation from recovery and from silent fallback.',
    },
  ],
});
