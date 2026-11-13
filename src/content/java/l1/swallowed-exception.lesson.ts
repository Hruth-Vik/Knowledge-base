import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l1.swallowed-exception',
  language: 'java',
  levelId: 'java.l1',
  chapter: {
    id: 'flow-and-failure',
    title: 'Flow and Failure',
  },
  sequence: 6,
  slug: 'swallowed-exception',
  title: 'The Outage That Looked Like an Empty Shelf',
  deck: 'A recommendation call failed, the catch returned an empty list, and the page rendered a valid empty state. Nothing alerted for five days.',
  kind: 'incident-story',
  estimatedMinutes: 14,
  tags: ['exceptions', 'fallback', 'observability', 'incident', 'resilience'],
  concepts: [
    {
      id: 'java.l1.exception-swallowing',
      title: 'Swallowed exception',
      kind: 'failure-mode',
      summary: [
        'A catch that returns a default or continues makes the failure invisible to its callers.',
        'The request can succeed with a result indistinguishable from a legitimate empty result.',
        'Swallowing removes both the control-flow signal and the diagnostic evidence.',
      ],
      aliases: ['empty catch', 'catch and return default', 'silent failure'],
      tags: ['java', 'exceptions', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.exception-taxonomy',
        },
      ],
    },
    {
      id: 'java.l1.degraded-fallback',
      title: 'Degraded fallback',
      kind: 'principle',
      summary: [
        'A fallback is a product decision about what to show when a dependency fails.',
        'It must be explicit in the return type or status, bounded in scope, and safe for the caller.',
        'A fallback is not a substitute for reporting or fixing the failure.',
      ],
      aliases: ['graceful degradation', 'fallback path', 'partial response'],
      tags: ['java', 'exceptions', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.exception-swallowing',
        },
        {
          type: 'depends-on',
          target: 'java.l1.exception-translation',
        },
      ],
    },
    {
      id: 'java.l1.failure-observability',
      title: 'Failure observability',
      kind: 'principle',
      summary: [
        'The handling boundary should record what failed, where, and how often.',
        'Log the full throwable once and emit a counter or ratio for the fallback path.',
        'Alert on the fallback rate, not on an individual event that may be normal.',
      ],
      aliases: ['fallback metric', 'error budget', 'degraded-mode alert'],
      tags: ['java', 'exceptions', 'operations'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l1.degraded-fallback',
        },
      ],
    },
  ],
  revisits: ['java.l1.exception-taxonomy', 'java.l1.exception-translation'],
  versionCaveats: [
    'Examples target Java 21 LTS. The fallback and observability patterns are language-neutral; the code uses only JDK types so the failure path can be run locally.',
    'A production logger and metrics client are not part of the JDK. The examples use System.out and LongAdder to make the behavior observable without pretending to integrate a particular vendor.',
    'A fallback is safe only when the product semantics allow it. Returning an empty recommendation list may be acceptable; returning an empty balance or an empty permission set is usually not.',
  ],
  references: [
    {
      title: 'Java SE 21 API: Throwable',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html',
      note: 'The evidence a swallowed exception discards: type, stack trace, cause, and suppressed exceptions.',
    },
    {
      title: 'Java SE 21 API: LongAdder',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html',
      note: 'A low-contention counter suitable for a fallback or error metric in the example.',
    },
    {
      title: 'Java Language Specification: try, catch, and finally',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20',
      note: 'How a catch selects an exception and how control continues after the handler returns.',
    },
  ],
  sections: {
    problem:
      'A catalogue page calls a recommendation service to fill a “you may also like” shelf. The call starts timing out after a network change. The client catches the exception and returns an empty list, because an empty list is a valid response. The page renders “No recommendations yet” and returns HTTP 200.\n\nDashboards stay green: there are no 5xx responses, latency improves, and the error rate is flat. The only signal is a gradual drop in click-through rate. Five days later someone notices that every customer is seeing an empty shelf. The failure was handled, logged nowhere, and counted nowhere. From the outside it looked exactly like a product with no recommendations.',
    analogy: {
      title: 'The clerk who says “nothing in stock”',
      body:
        'A customer asks a shop clerk for a popular item. The clerk calls the stockroom, but the line is busy. Instead of saying “I cannot reach the stockroom,” the clerk says “nothing in stock.” The customer leaves believing the shop is simply out of the item. The manager never hears about the phone problem because every conversation ended with a normal answer.\n\nA visible fallback is the clerk saying “the stockroom line is down; I can check another branch or take your number.” The customer still does not get the item immediately, but the failure is part of the interaction and the manager can see the pattern.',
      mapping: [
        {
          technical: 'The remote recommendation call',
          everyday: 'The stockroom phone line',
        },
        {
          technical: 'A timeout or connection failure',
          everyday: 'The line is busy or disconnected',
        },
        {
          technical: 'An empty list returned from catch',
          everyday: '“Nothing in stock”',
        },
        {
          technical: 'A legitimate empty result',
          everyday: 'The shop genuinely has no more of the item',
        },
        {
          technical: 'A degraded result with a metric',
          everyday: 'A visible “stockroom unavailable” message',
        },
      ],
      whereItBreaks:
        'The clerk’s customer can ask a follow-up question; an API client usually cannot. A page that renders an empty list gives the user no way to distinguish “nothing to recommend” from “recommendations are down.” The analogy also implies that the failure is obvious to the clerk. In code, the catch block is the only place that knows, and it has to choose to record it.',
    },
    mentalModel: {
      title: 'A fallback needs a state and a signal',
      figure: {
        width: 960,
        height: 380,
        caption:
          'A failed dependency returns an empty list, so the response is 200 and the page looks merely empty. A visible fallback records the failure and marks the result degraded.',
        alt: 'A diagram comparing a silent fallback and an observed fallback. The silent path catches an exception, returns an empty list, sends HTTP 200, and produces no alert. The observed path returns a degraded result, increments a counter, logs the throwable, and alerts on the fallback ratio.',
        nodes: [
          {
            id: 'call',
            label: 'remote call',
            detail: 'recommendation service',
            x: 16,
            y: 40,
            width: 176,
            height: 84,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'fail',
            label: 'timeout',
            detail: 'dependency unavailable',
            x: 232,
            y: 40,
            width: 176,
            height: 84,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'silent',
            label: 'catch → empty list',
            detail: 'no state, no signal',
            x: 456,
            y: 24,
            width: 208,
            height: 84,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'ok',
            label: 'HTTP 200',
            detail: 'looks like a valid empty state',
            x: 708,
            y: 24,
            width: 220,
            height: 84,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'observed',
            label: 'degraded result',
            detail: 'explicit status',
            x: 456,
            y: 172,
            width: 208,
            height: 84,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'metric',
            label: 'counter + log',
            detail: 'rate and throwable',
            x: 708,
            y: 172,
            width: 220,
            height: 84,
            shape: 'note',
            tone: 'correct',
          },
          {
            id: 'alert',
            label: 'fallback alert',
            detail: 'ratio over budget',
            x: 456,
            y: 300,
            width: 208,
            height: 64,
            shape: 'note',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'call',
            to: 'fail',
            label: 'throws',
            kind: 'flow',
          },
          {
            from: 'fail',
            to: 'silent',
            label: 'catch all',
            kind: 'flow',
          },
          {
            from: 'silent',
            to: 'ok',
            label: 'return',
            kind: 'flow',
          },
          {
            from: 'fail',
            to: 'observed',
            label: 'catch specific',
            kind: 'flow',
          },
          {
            from: 'observed',
            to: 'metric',
            label: 'record',
            kind: 'flow',
          },
          {
            from: 'metric',
            to: 'alert',
            label: 'threshold',
            kind: 'depends',
          },
          {
            from: 'silent',
            to: 'metric',
            label: 'missing signal',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 344,
            text: 'A valid empty result and a failed call must not share one representation.',
          },
          {
            x: 456,
            y: 344,
            text: 'The fallback is a product state, not a discarded exception.',
          },
          {
            x: 708,
            y: 344,
            text: 'Alert on the ratio, not on one expected timeout.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Start with the catch that decides whether the failure exists, then make the fallback explicit, record it, and alert on its rate.',
      steps: [
        {
          title: 'A catch decides what the caller can know',
          body:
            'An exception is a control-flow signal. When a catch returns a normal value, that signal stops. The caller cannot tell whether the dependency failed, whether the request was valid, or whether the result is genuinely empty. This is not a compiler bug; it is the handler choosing to absorb the failure.\n\nAbsorbing is sometimes correct, but it must be a deliberate policy. The handler should know which failure it is absorbing, why the fallback is safe, and how the event will be recorded. A catch that names `Exception` cannot make those distinctions because it treats a timeout, a malformed response, and a null bug as the same event.',
          code: {
            filename: 'Fallback.java',
            language: 'java',
            code: `import java.util.List;

final class Fallback {
    static List<String> load() {
        try {
            return remoteCall();
        } catch (Exception error) {
            return List.of();
        }
    }

    static List<String> remoteCall() {
        throw new IllegalStateException("recommendation service unavailable");
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'Catching Exception includes timeouts, parsing bugs, and programming errors.',
              },
              {
                line: 8,
                note: 'The empty list becomes a successful result with no trace of the failure.',
              },
              {
                line: 13,
                note: 'This is the event the caller never learns about.',
              },
            ],
          },
        },
        {
          title: 'Make the fallback a state the caller can see',
          body:
            'A result type can distinguish “ready with items” from “unavailable because the dependency failed.” A sealed interface or an enum makes the states explicit and lets the UI choose different copy. The caller can still degrade gracefully, but it does so with knowledge instead of a coincidence.\n\nChoose the representation from the product semantics. If an empty list is a legitimate outcome, the unavailable state must be separate from it. If the caller cannot function without the data, the fallback may be to fail the request rather than return a partial result.',
          code: {
            filename: 'Recommendations.java',
            language: 'java',
            code: `import java.util.List;

sealed interface Recommendations permits Ready, Unavailable {}

record Ready(List<String> items) implements Recommendations {}

record Unavailable(String reason) implements Recommendations {}

final class Catalog {
    static Recommendations load() {
        return new Ready(List.of("book", "lamp"));
    }

    public static void main(String[] args) {
        Recommendations result = load();
        System.out.println(result instanceof Ready ready ? ready.items() : "unavailable");
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The permitted states are closed, so a caller can handle both explicitly.',
              },
              {
                line: 5,
                note: 'Ready carries the actual items and nothing about failure.',
              },
              {
                line: 7,
                note: 'Unavailable is a different state, even when it carries no items.',
              },
              {
                line: 16,
                note: 'The caller can branch on the state instead of guessing from an empty collection.',
              },
            ],
            output: `[book, lamp]`,
          },
        },
        {
          title: 'Record the failure at the handling boundary',
          body:
            'The catch block is the only place that knows the dependency failed. It should log the full throwable with enough context to identify the operation, and it should increment a counter for the fallback path. Logging only `getMessage()` discards the stack trace and cause. Logging every occurrence at high volume can also flood the logs, so rate-limit or sample the message while keeping the counter exact.\n\nUse a counter or ratio rather than a boolean “is the service down?” flag. A single timeout is normal; a sustained fallback rate is an incident. The metric makes the difference visible without requiring anyone to read a page.',
          code: {
            filename: 'Observed.java',
            language: 'java',
            code: `import java.util.List;
import java.util.concurrent.atomic.LongAdder;

final class Observed {
    static final LongAdder FALLBACKS = new LongAdder();

    static List<String> load() {
        try {
            return remoteCall();
        } catch (RuntimeException error) {
            FALLBACKS.increment();
            System.out.println("recommendations fallback: " + error);
            return List.of();
        }
    }

    static List<String> remoteCall() {
        throw new IllegalStateException("timeout");
    }
}`,
            annotations: [
              {
                line: 10,
                note: 'The catch is narrow enough to name a runtime failure from the dependency.',
              },
              {
                line: 11,
                note: 'The counter records the fallback even when the log line is sampled or dropped.',
              },
              {
                line: 12,
                note: 'Printing the throwable keeps the type and message; a real logger should include the trace.',
              },
            ],
          },
        },
        {
          title: 'Alert on the rate, not on one event',
          body:
            'A fallback alert should answer whether the degradation is normal or sustained. Compute a ratio over a window: fallbacks divided by requests, or fallbacks per minute with a minimum request volume. A single timeout should not page anyone; a ten percent fallback rate for five minutes probably should.\n\nThe alert threshold is a product and operations decision. It needs a denominator, a window, and a minimum traffic floor so a quiet period does not create a false alarm. The same metric can feed a dashboard, a circuit breaker, and a postmortem timeline.',
          code: {
            filename: 'Budget.java',
            language: 'java',
            code: `final class Budget {
    static boolean shouldAlert(long fallbacks, long requests) {
        if (requests < 100) {
            return false;
        }
        return fallbacks * 100 / requests > 5;
    }

    public static void main(String[] args) {
        System.out.println(shouldAlert(2, 1000));
        System.out.println(shouldAlert(80, 1000));
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'A minimum traffic floor prevents a tiny sample from paging the team.',
              },
              {
                line: 6,
                note: 'The ratio is the signal; the absolute count alone has no context.',
              },
              {
                line: 10,
                note: 'Two fallbacks in a thousand requests is normal noise.',
              },
              {
                line: 11,
                note: 'Eighty in a thousand is a sustained degradation worth investigating.',
              },
            ],
            output: `false
true`,
          },
        },
      ],
      outro:
        'A swallowed exception turns a dependency failure into a normal result. An explicit fallback keeps the product behavior but restores the state and the signal. A ratio alert makes the difference visible before a customer has to report it.',
    },
    code: {
      intro:
        'Compare a silent empty result with a fallback that the caller and the dashboard can both see.',
      minimal: {
        filename: 'Fallback.java',
        language: 'java',
        code: `final class Fallback {
    static String[] load() {
        try {
            return remote();
        } catch (RuntimeException error) {
            return new String[0];
        }
    }

    static String[] remote() {
        throw new IllegalStateException("down");
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'The dependency call is the operation that can fail.',
          },
          {
            line: 6,
            note: 'The fallback returns a perfectly valid empty array.',
          },
          {
            line: 10,
            note: 'The failure is real, but the caller sees only an empty result.',
          },
        ],
      },
      realistic: {
        filename: 'Catalog.java',
        language: 'java',
        code: `import java.util.List;
import java.util.concurrent.atomic.LongAdder;

final class Catalog {
    sealed interface Result permits Ready, Unavailable {}
    record Ready(List<String> items) implements Result {}
    record Unavailable(String reason) implements Result {}

    static final LongAdder FALLBACKS = new LongAdder();

    static Result load() {
        try {
            return new Ready(remote());
        } catch (RuntimeException error) {
            FALLBACKS.increment();
            System.out.println("recommendations unavailable: " + error);
            return new Unavailable(error.getMessage());
        }
    }

    static List<String> remote() {
        throw new IllegalStateException("timeout");
    }

    public static void main(String[] args) {
        Result result = load();
        System.out.println(result instanceof Ready ready ? ready.items() : "degraded");
        System.out.println("fallbacks=" + FALLBACKS.sum());
    }
}`,
        annotations: [
          {
            line: 15,
            note: 'The counter records the rate even if the log line is sampled.',
          },
          {
            line: 16,
            note: 'The throwable is included in the log message for diagnosis.',
          },
          {
            line: 17,
            note: 'The fallback is a named state, not an empty list that pretends everything worked.',
          },
          {
            line: 27,
            note: 'The caller can render degraded copy instead of a false empty state.',
          },
          {
            line: 28,
            note: 'The count is available to a metric or a health check.',
          },
        ],
        output: `recommendations unavailable: java.lang.IllegalStateException: timeout
degraded
fallbacks=1`,
      },
    },
    breakIt: {
      title: 'The empty shelf that was an outage',
      scenario:
        'A catalogue page calls a recommendation service. After a network change, every call times out. The client catches `Exception` and returns an empty list, which the page renders as “No recommendations yet.” The HTTP status is 200, the error dashboard is flat, and no alert fires. Conversion drops for five days before someone compares the shelf across environments.',
      brokenCode: {
        filename: 'Catalog.java',
        language: 'java',
        code: `import java.util.List;

final class Catalog {
    static List<String> recommendations() {
        try {
            return remote();
        } catch (Exception error) {
            return List.of();
        }
    }

    static List<String> remote() {
        throw new IllegalStateException("recommendation service unavailable");
    }

    public static void main(String[] args) {
        System.out.println("items=" + recommendations().size());
    }
}`,
      },
      predictionPrompt:
        'The dependency is down for every request. What do the HTTP status, the page content, and the error dashboard each show, and why does none of them reveal the outage?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `items=0`. The page returns HTTP 200 with a valid empty-state message. The error dashboard stays flat because no exception reaches an error handler and no failure metric is incremented.',
        explanation:
          'The catch converts the exception into an ordinary empty list. The caller has no way to distinguish “there are no recommendations” from “the recommendation service did not answer.” The failure is not logged or counted at the catch site, so the only remaining signal is downstream behavior such as click-through rate. The application is technically available while a feature is completely unavailable.',
        repair:
          'Catch the specific transient failures, return a result that names the degraded state, log the throwable once with context, and increment a fallback counter. Alert on the fallback ratio over a window with a minimum traffic floor. Decide whether the product should show cached items, an unavailable message, or omit the shelf entirely. Do not change the fallback to a thrown exception unless failing the whole page is the right product behavior.',
        correctedCode: {
          filename: 'Catalog.java',
          language: 'java',
          code: `import java.util.List;
import java.util.concurrent.atomic.LongAdder;

final class Catalog {
    sealed interface Result permits Ready, Unavailable {}
    record Ready(List<String> items) implements Result {}
    record Unavailable(String reason) implements Result {}

    static final LongAdder FALLBACKS = new LongAdder();

    static Result recommendations() {
        try {
            return new Ready(remote());
        } catch (RuntimeException error) {
            FALLBACKS.increment();
            System.out.println("recommendations unavailable: " + error);
            return new Unavailable(error.getMessage());
        }
    }

    static List<String> remote() {
        throw new IllegalStateException("recommendation service unavailable");
    }

    public static void main(String[] args) {
        Result result = recommendations();
        System.out.println(result instanceof Ready ready ? ready.items() : "degraded");
        System.out.println("fallbacks=" + FALLBACKS.sum());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated resilience code tends to make the happy path look robust while hiding the failure path. These are the patterns to inspect.',
      mistakes: [
        {
          title: 'Catching Exception and returning an empty collection',
          generatedPattern:
            '“The recommendation call is optional, so I catch `Exception` and return `List.of()`.”',
          whyItFails:
            'The empty list is indistinguishable from a legitimate empty result, and catching `Exception` also hides programming errors. The caller cannot choose degraded copy, retry, or omit the section. No metric or log records the failure unless the catch does it explicitly.',
          correction:
            'Catch the specific expected failure, return a typed degraded result, and record the event. If the product truly wants an empty list, keep that mapping at the presentation boundary where it can be labeled.',
          telltale:
            'A catch block whose entire body is `return Collections.emptyList()`, `return null`, or `return Optional.empty()`.',
        },
        {
          title: 'Logging and continuing at debug level',
          generatedPattern:
            '“I logged the exception with `log.debug` so it does not spam production, then returned the fallback.”',
          whyItFails:
            'Debug logging is usually disabled in production, so the only evidence is gone. Even when enabled, a per-request log line can flood the system during an outage and make the incident harder to diagnose.',
          correction:
            'Emit a counter or ratio for every fallback, and log a sampled or rate-limited message with the full throwable. Alert on the aggregate, not on each line.',
          telltale:
            'A fallback path with only a debug log, or a production incident where the logs contain no evidence of the handled failure.',
        },
        {
          title: 'Adding a fallback without an alert',
          generatedPattern:
            '“We return cached data when the service is down, so the page stays up. The fallback is the resilience story.”',
          whyItFails:
            'A fallback preserves availability but can hide a prolonged dependency outage. If nobody watches the fallback rate, stale or empty data becomes the new normal. The system is up while the feature is effectively broken.',
          correction:
            'Treat the fallback as a degraded state with a metric, dashboard, and alert threshold. Define the maximum acceptable duration and what happens if the dependency does not return.',
          telltale:
            'A fallback branch with no counter, no dashboard panel, and no runbook entry.',
        },
        {
          title: 'Retrying every failed request without a budget',
          generatedPattern:
            '“When the call fails, retry three times. If it still fails, return the fallback. That makes it resilient.”',
          whyItFails:
            'During a full outage, every request multiplies into three or more calls. The retry traffic can keep the dependency down, increase latency for every caller, and consume threads or connections. A fallback plus unbounded retries is a load amplifier, not resilience.',
          correction:
            'Use a bounded retry budget with backoff and jitter, retry only transient failures and only idempotent operations, and open a circuit breaker when the failure rate crosses a threshold. Record both retries and fallbacks.',
          telltale:
            'A retry loop with no cap, no backoff, or no distinction between a timeout and a validation error.',
        },
      ],
      reviewChecklist: [
        'Can a caller distinguish a legitimate empty result from a failed dependency?',
        'Does the catch name specific exceptions instead of Exception or Throwable?',
        'Is there a counter or ratio for the fallback path?',
        'Is the log line sampled or rate-limited while preserving the full throwable?',
        'Are retries bounded, backed off, and limited to transient idempotent failures?',
        'Does the product have explicit copy or behavior for the degraded state?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer wants to see the difference between availability and observability, and between a fallback and a lie.',
      questions: [
        {
          id: 'java.l1.swallowed-exception.interview.1',
          difficulty: 'junior',
          question: 'Why is `catch (Exception e) { return List.of(); }` dangerous?',
          modelAnswer:
            'It turns every failure into a successful empty result. The caller cannot tell whether there are genuinely no items or the dependency failed. It also catches programming errors such as a null bug, not just expected I/O failures. The exception is not logged or counted, so the only evidence is downstream behavior. If returning an empty list is the right product behavior, the catch should still record the event and use a type or status that distinguishes it from a legitimate empty result.',
          weakAnswer:
            'It is bad because empty lists are not thread-safe. I would return a synchronized list instead.',
          strongAnswer:
            'The problem is information loss, not the collection implementation. The catch erases the failure signal and the diagnostic evidence. A narrow catch plus a typed degraded result plus a metric preserves availability without pretending the dependency answered. I would also check whether catching Exception hides a bug that should fail fast.',
          followUp: 'When would catching a broad exception at a top-level boundary be acceptable?',
        },
        {
          id: 'java.l1.swallowed-exception.interview.2',
          difficulty: 'mid',
          question:
            'Design the fallback behavior for a product page that calls a recommendation service which can time out.',
          modelAnswer:
            'I would catch the specific timeout or availability failure, not every exception. The service would return a result type with ready and unavailable states, and the page would render different copy for each. I would increment a fallback counter, log a sampled message with the throwable, and alert when the fallback ratio crosses a threshold over a window with enough traffic. Depending on the product, I might show cached recommendations or omit the shelf, but I would not present an outage as “no recommendations.”',
          weakAnswer:
            'Return an empty list so the page still loads. Recommendations are optional, so the user does not need to know.',
          strongAnswer:
            'Availability and honesty are separate goals. The page can stay up without claiming there are no recommendations. A typed state lets the UI say “recommendations are temporarily unavailable,” and the metric lets operations see the dependency. I would define the fallback’s maximum duration, whether cached data is acceptable, and what the page does if the cache is also empty. Retries would be bounded and only for transient failures.',
          followUp: 'What would you show if the cached recommendations are also stale or empty?',
        },
        {
          id: 'java.l1.swallowed-exception.interview.3',
          difficulty: 'senior',
          question:
            'How would you detect silent degradation across a system where many services have fallbacks?',
          modelAnswer:
            'I would make every fallback a first-class state with a metric, not just a branch in a catch block. Service dashboards would show fallback ratio, duration, and the dependency involved. Synthetic checks would exercise a request that should produce real data and fail if it consistently returns degraded content. Logs would include sampled throwables with correlation identifiers. I would also review product metrics such as conversion or click-through, because a technically available feature can still be functionally down.',
          weakAnswer:
            'The error rate would rise if something were wrong. Fallbacks only run when there is an error, so the existing alerting should catch it.',
          strongAnswer:
            'Fallbacks suppress the error signal by design, so the existing error rate can stay flat. I would instrument the fallback path explicitly, alert on its ratio and duration, and add a canary or synthetic check that asserts real content is present. I would distinguish “dependency unavailable” from “valid empty result” in the data model, and review the fallback policy as part of incident response. Otherwise the system optimizes for green dashboards while the feature is dark.',
          followUp: 'What is the risk of alerting on every single fallback event?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a catalogue loader with an honest fallback',
      brief:
        'Write a loader that calls a recommendation dependency which can time out. Return a result that distinguishes ready recommendations from an unavailable dependency, record a fallback count, and print the degraded state. Then add a second caller that treats the degraded result differently from a legitimate empty list.',
      constraints: [
        'Catch only the expected transient failure; do not catch Exception or Throwable.',
        'Return a sealed result or an equivalent type with ready and unavailable states.',
        'Increment a counter for every fallback and include the failure message in the output.',
        'Provide a legitimate empty result and a failed dependency case so the two are visibly different.',
        'Do not retry more than once in the example; document why a retry budget matters.',
        'Print both the caller-visible state and the fallback count.',
      ],
      starterCode: {
        filename: 'Catalogue.java',
        language: 'java',
        code: `import java.util.List;
import java.util.concurrent.atomic.LongAdder;

final class Catalogue {
    sealed interface Result permits Ready, Unavailable {}
    record Ready(List<String> items) implements Result {}
    record Unavailable(String reason) implements Result {}

    static final LongAdder FALLBACKS = new LongAdder();

    static Result load() {
        // Call the dependency, catch the transient failure, and record it.
        return new Ready(List.of());
    }

    public static void main(String[] args) {
        // Print a ready result, an empty result, and a failed dependency.
    }
}`,
      },
      referenceSolution: {
        filename: 'Catalogue.java',
        language: 'java',
        code: `import java.util.List;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.LongAdder;

final class Catalogue {
    sealed interface Result permits Ready, Unavailable {}
    record Ready(List<String> items) implements Result {}
    record Unavailable(String reason) implements Result {}

    static final LongAdder FALLBACKS = new LongAdder();

    static Result load(boolean dependencyUp, boolean hasItems) {
        try {
            if (!dependencyUp) {
                throw new TimeoutException("recommendation service timed out");
            }
            return new Ready(hasItems ? List.of("book", "lamp") : List.of());
        } catch (TimeoutException error) {
            FALLBACKS.increment();
            System.out.println("fallback: " + error.getMessage());
            return new Unavailable("recommendations unavailable");
        }
    }

    static void print(String label, Result result) {
        if (result instanceof Ready ready) {
            System.out.println(label + ": ready " + ready.items());
        } else if (result instanceof Unavailable unavailable) {
            System.out.println(label + ": " + unavailable.reason());
        }
    }

    public static void main(String[] args) {
        print("normal", load(true, true));
        print("empty", load(true, false));
        print("outage", load(false, false));
        System.out.println("fallbacks=" + FALLBACKS.sum());
    }
}`,
        annotations: [
          {
            line: 17,
            note: 'A legitimate empty result stays in the Ready state.',
          },
          {
            line: 18,
            note: 'Only the expected transient failure is caught; a bug still propagates.',
          },
          {
            line: 19,
            note: 'The fallback is recorded before the result is returned.',
          },
          {
            line: 20,
            note: 'The log line carries context; a real logger would include the stack trace.',
          },
          {
            line: 21,
            note: 'The caller receives a named degraded state, not an empty list.',
          },
          {
            line: 29,
            note: 'The UI can render different copy for the outage.',
          },
        ],
      },
      rubric: [
        {
          id: 'narrow-catch',
          check: 'Does the loader catch only the expected transient failure rather than Exception?',
          detail:
            'A broad catch hides programming errors and makes the fallback policy impossible to reason about.',
          mustPass: true,
        },
        {
          id: 'explicit-state',
          check: 'Can a caller distinguish a legitimate empty result from an unavailable dependency?',
          detail:
            'This is the incident’s root cause. Availability without an honest state is still a broken feature.',
          mustPass: true,
        },
        {
          id: 'fallback-signal',
          check: 'Does every fallback increment a counter or emit an equivalent metric?',
          detail:
            'A fallback without a signal is invisible to operations, which is how the outage lasted five days.',
          mustPass: true,
        },
        {
          id: 'retry-policy',
          check: 'Is any retry bounded and limited to the transient failure?',
          detail:
            'Unbounded retries can amplify an outage. The exercise may choose not to retry, but it must state the policy.',
          mustPass: false,
        },
        {
          id: 'evidence-output',
          check: 'Does the output show the ready, empty, and outage cases and the fallback count?',
          detail:
            'The three cases are the evidence that the state distinction works.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Catalogue.java` and `java Catalogue`. Expect ready items, a ready empty list, an unavailable message, and a fallback count of 1.',
        'Change the catch to `Exception` and add a deliberate `NullPointerException` in the try block. Explain why the fallback now hides a programming error.',
        'Remove the counter and rerun the outage case. Explain what evidence remains for an operator and why the page’s HTTP status is not enough.',
      ],
    },
    recap: [
      'A catch that returns a default turns a failure into a normal result and removes the caller’s ability to react.',
      'A fallback is a product decision: make it an explicit state and choose copy or behavior for it.',
      'Record fallback events with a counter and a full throwable; alert on the ratio over a window.',
      'Catch specific failures and bound retries, or the fallback becomes a hidden outage or a load amplifier.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l1.swallowed-exception.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l1.exception-swallowing'],
      prompt: 'What is lost when a catch block returns an empty list on every failure?',
      options: [
        {
          id: 'signal',
          text: 'The caller can no longer tell a dependency failure from a legitimate empty result.',
        },
        {
          id: 'memory',
          text: 'The empty list is not garbage-collected.',
        },
        {
          id: 'compile',
          text: 'The method no longer compiles without a throws clause.',
        },
        {
          id: 'latency',
          text: 'The fallback makes every request slower.',
        },
      ],
      correctOptionId: 'signal',
      explanation:
        'The empty list is a valid success value. Returning it from catch erases the failure signal and usually the diagnostic evidence as well, so callers and operators cannot distinguish the two states.',
    },
    {
      id: 'java.l1.swallowed-exception.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l1.exception-swallowing', 'java.l1.failure-observability'],
      prompt:
        'The page stays up during a dependency outage, but nobody is alerted. Which line hides the failure?',
      code: `final class Catalog {\n    static String load() {\n        try {\n            return remote();\n        } catch (Exception error) {\n            return \"\";\n        }\n    }\n\n    static String remote() {\n        throw new IllegalStateException(\"down\");\n    }\n}`,
      codeLanguage: 'java',
      bugLine: 6,
      bugSummary:
        'The catch returns a normal empty string without logging, counting, or exposing the failure state.',
      explanation:
        'The catch absorbs every exception and returns a value that looks like a legitimate empty result. Nothing reaches the caller or the monitoring system. A narrow catch plus an explicit degraded result and a fallback metric would keep the page available without hiding the outage.',
    },
    {
      id: 'java.l1.swallowed-exception.recall.q3',
      type: 'explain',
      concepts: ['java.l1.degraded-fallback', 'java.l1.failure-observability'],
      prompt:
        'Explain the difference between a graceful fallback and a swallowed exception, and name the evidence a fallback must leave behind.',
      keyPoints: [
        'A fallback keeps the feature available with a defined degraded behavior; swallowing pretends the operation succeeded.',
        'The caller must be able to distinguish the degraded state from a legitimate empty or default result.',
        'The fallback should record the failure with a counter or ratio and a sampled full throwable.',
        'Operations should alert on the fallback rate over a window, not on a single expected event.',
      ],
      modelAnswer:
        'A graceful fallback is a product decision: when the dependency fails, the page shows cached content or an explicit unavailable message, and the caller can tell that this is not the normal result. A swallowed exception catches the failure and returns a value that looks exactly like success, so the caller cannot react and operations cannot see it. A real fallback records the event with a counter or ratio and a log line that includes the throwable, then alerts when the rate is sustained. The fallback preserves availability; the evidence preserves the ability to notice and fix the failure.',
      explanation:
        'Strong answers separate product behavior from observability. “Return empty and log it” is still incomplete if the caller cannot distinguish the state or if the log is the only signal.',
    },
  ],
});
