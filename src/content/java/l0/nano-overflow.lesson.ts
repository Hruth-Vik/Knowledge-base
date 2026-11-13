import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.nano-overflow',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'data-in-the-machine',
    title: 'Data in the Machine',
  },
  sequence: 5,
  slug: 'nano-overflow',
  title: 'The Timer That Jumped Backwards',
  deck: 'A latency alert fired with a negative duration. The clock was fine; a 32-bit cast had wrapped after about thirty-six minutes.',
  kind: 'incident-story',
  estimatedMinutes: 13,
  tags: ['time', 'overflow', 'narrowing', 'metrics', 'incident'],
  concepts: [
    {
      id: 'java.l0.monotonic-clock',
      title: 'Monotonic clock',
      kind: 'term',
      summary: [
        'System.nanoTime returns a monotonic counter with an arbitrary origin.',
        'Only differences between two readings have meaning, not the absolute value.',
        'currentTimeMillis is wall-clock time and can jump when the clock is adjusted.',
      ],
      aliases: ['nanoTime', 'monotonic time', 'elapsed time'],
      tags: ['java', 'time'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.jvm',
        },
      ],
    },
    {
      id: 'java.l0.narrowing-cast',
      title: 'Narrowing cast',
      kind: 'failure-mode',
      summary: [
        'Casting a long to int keeps the low 32 bits and discards the rest.',
        'The result can be negative even when the long value was positive.',
        'Math.toIntExact or a wider type makes an unsafe conversion explicit.',
      ],
      aliases: ['(int) cast', 'truncation', 'int overflow by cast'],
      tags: ['java', 'numbers', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.integer-overflow',
        },
      ],
    },
    {
      id: 'java.l0.duration-measurement',
      title: 'Duration measurement',
      kind: 'principle',
      summary: [
        'Measure elapsed time by subtracting two readings in the widest type.',
        'Keep nanoseconds or milliseconds as a long through the calculation.',
        'Convert units once at the display or storage boundary.',
      ],
      aliases: ['elapsed time', 'stopwatch pattern', 'duration arithmetic'],
      tags: ['java', 'time', 'metrics'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.monotonic-clock',
        },
      ],
    },
  ],
  revisits: ['java.l0.integer-overflow', 'java.l0.binary-representation', 'java.l0.jvm'],
  versionCaveats: [
    'Examples target Java 21 LTS. The resolution of System.nanoTime is platform-dependent, and the origin is arbitrary; the value is not an epoch timestamp.',
    'A long nanoTime counter can represent roughly 292 years of elapsed time before its own range is exhausted. The failure in this lesson happens much sooner because the value is narrowed to an int.',
  ],
  references: [
    {
      title: 'Java SE 21 API: System.nanoTime',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()',
      note: 'The monotonic clock, its arbitrary origin, and why only differences are meaningful.',
    },
    {
      title: 'Java SE 21 API: System.currentTimeMillis',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#currentTimeMillis()',
      note: 'Wall-clock time and its dependence on the host clock.',
    },
    {
      title: 'Java SE 21 API: Duration',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html',
      note: 'An explicit duration type with nanosecond precision and unit conversion.',
    },
  ],
  sections: {
    problem:
      'A scheduled job measures how long it takes to build a report. For the first half hour the latency chart looks plausible. After about thirty-six minutes, some samples become negative. The alert that should fire when a run exceeds its budget stays silent, and the retry logic treats the negative duration as “finished instantly.” Nothing about the wall clock changed.\n\nThe timer used `System.nanoTime()`, which is the correct clock for elapsed time. The problem was the storage type between the clock and the alert. A positive count of microseconds was narrowed to an `int`, and the high bits disappeared when the value crossed 2³¹. The clock was monotonic; the number was not.',
    analogy: {
      title: 'A stopwatch with a small dial',
      body:
        'A stopwatch counts steadily, but its display has only so many digits. Once the count passes the largest number the dial can show, the reading rolls over and starts again from the bottom. The watch is still running; the display has simply lost the high digits.\n\nA duration is the difference between two readings, not either reading alone. If you copy that difference into a display with fewer digits, the low digits remain but the high part vanishes. The alert then reasons about the shortened display instead of the real elapsed time.',
      mapping: [
        {
          technical: 'System.nanoTime()',
          everyday: 'The steady stopwatch mechanism',
        },
        {
          technical: 'Two readings and a subtraction',
          everyday: 'Start and stop presses',
        },
        {
          technical: 'A long elapsed value',
          everyday: 'The full elapsed count',
        },
        {
          technical: 'A cast to int',
          everyday: 'A display with fewer digits',
        },
        {
          technical: 'A negative duration',
          everyday: 'The shortened display rolling over',
        },
      ],
      whereItBreaks:
        'A stopwatch dial is a physical constraint on the display. The int cast is an explicit instruction in the source code: the programmer asked for the low 32 bits. The analogy also suggests the watch itself wrapped, which is not what happened; the nanoTime counter is a long and its own range is enormous. Only the narrowed copy lost information.',
    },
    mentalModel: {
      title: 'Subtract in long, narrow only with proof',
      figure: {
        width: 960,
        height: 360,
        caption:
          'Two nanoTime readings are subtracted as longs. The microsecond count stays a long until an int cast discards the high bits and the signed value turns negative.',
        alt: 'A diagram showing start and end nanoTime readings feeding a long subtraction, then a division to microseconds. A cast to int produces a negative value after about 35.8 minutes. A separate branch keeps the long value and formats a Duration.',
        nodes: [
          {
            id: 'start',
            label: 'nanoTime start',
            detail: '64-bit counter',
            x: 16,
            y: 24,
            width: 184,
            height: 80,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'end',
            label: 'nanoTime end',
            detail: 'same clock',
            x: 16,
            y: 148,
            width: 184,
            height: 80,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'subtract',
            label: 'end − start',
            detail: 'still a long',
            x: 240,
            y: 72,
            width: 176,
            height: 100,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'micros',
            label: '÷ 1,000',
            detail: 'long microseconds',
            x: 456,
            y: 72,
            width: 176,
            height: 100,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'cast',
            label: '(int) micros',
            detail: 'low 32 bits only',
            x: 672,
            y: 72,
            width: 164,
            height: 100,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'negative',
            label: 'negative duration',
            detail: 'after 2³¹ µs',
            x: 672,
            y: 220,
            width: 164,
            height: 80,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'repair',
            label: 'stay long',
            detail: 'Duration or long',
            x: 860,
            y: 72,
            width: 84,
            height: 100,
            shape: 'box',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'start',
            to: 'subtract',
            label: 'read',
            kind: 'flow',
          },
          {
            from: 'end',
            to: 'subtract',
            label: 'read',
            kind: 'flow',
          },
          {
            from: 'subtract',
            to: 'micros',
            label: 'convert',
            kind: 'flow',
          },
          {
            from: 'micros',
            to: 'cast',
            label: 'narrow',
            kind: 'flow',
          },
          {
            from: 'cast',
            to: 'negative',
            label: 'wraps',
            kind: 'flow',
          },
          {
            from: 'micros',
            to: 'repair',
            label: 'keep',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 316,
            text: 'Only the difference between readings is meaningful.',
          },
          {
            x: 672,
            y: 316,
            text: '2³¹ microseconds is about 35 minutes 47 seconds.',
          },
          {
            x: 860,
            y: 316,
            text: 'Convert at the display boundary, not in the measurement.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'The failure starts with a correct clock, passes through a unit conversion, and ends in a type conversion that is easy to miss in review.',
      steps: [
        {
          title: 'nanoTime is a counter, not a date',
          body:
            '`System.nanoTime()` returns a `long` reading from a monotonic clock. Its origin is arbitrary and can differ between JVMs and runs; the number is not milliseconds since 1970. The API guarantees that later calls do not return earlier values within the same JVM, which is what makes it suitable for measuring elapsed time.\n\nFor a duration, subtract two readings. Do not store the absolute value as a timestamp, do not compare it across processes, and do not send it to another service as if it were epoch time. Use `System.currentTimeMillis()` or `Instant` when you need wall-clock time, and accept that wall clocks can jump.',
          code: {
            filename: 'Clock.java',
            language: 'java',
            code: `final class Clock {
    public static void main(String[] args) {
        long start = System.nanoTime();
        long end = System.nanoTime();
        long elapsedNanos = end - start;
        long elapsedMillis = elapsedNanos / 1_000_000;

        System.out.println("elapsed millis: " + elapsedMillis);
        System.out.println("wall clock: " + System.currentTimeMillis());
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The absolute reading has an arbitrary origin; it is only useful as one endpoint of a difference.',
              },
              {
                line: 5,
                note: 'Subtracting two longs keeps the full elapsed value, even when each reading is large.',
              },
              {
                line: 6,
                note: 'The unit conversion stays in long arithmetic, so the result cannot wrap at the int boundary.',
              },
              {
                line: 9,
                note: 'Wall-clock time answers a different question and can move backward when the host clock is adjusted.',
              },
            ],
          },
        },
        {
          title: 'A cast discards the high bits',
          body:
            'A narrowing primitive conversion from `long` to `int` keeps the low 32 bits. It does not check whether the value fits. A positive long above `Integer.MAX_VALUE` becomes negative or unrelated, and the compiler accepts it because the cast is explicit.\n\nThis is different from converting units. Dividing nanoseconds by 1,000 gives microseconds and still fits in a long. Casting the microsecond count to an int is a second, independent decision. If the duration can exceed 2,147,483,647 microseconds, that decision is wrong.',
          code: {
            filename: 'Narrow.java',
            language: 'java',
            code: `final class Narrow {
    public static void main(String[] args) {
        long micros = 2_400_000_000L;
        int narrowed = (int) micros;
        System.out.println(micros);
        System.out.println(narrowed);
        System.out.println(Math.toIntExact(micros));
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'This positive long represents forty minutes in microseconds.',
              },
              {
                line: 4,
                note: 'The cast keeps the low 32 bits, so the sign changes.',
              },
              {
                line: 6,
                note: 'The narrowed value is a valid int that no longer represents the duration.',
              },
              {
                line: 7,
                note: 'toIntExact refuses the conversion instead of returning a misleading value.',
              },
            ],
            output: `2400000000
-1894967296
Exception in thread "main" java.lang.ArithmeticException: integer overflow`,
          },
        },
        {
          title: 'The wrap happens at a predictable boundary',
          body:
            'A signed 32-bit int reaches its positive limit at 2,147,483,647. In microseconds, that is 2,147.483647 seconds, or about 35 minutes 47 seconds. After that, the cast produces negative values until the low 32 bits wrap again at 2³² microseconds, about 71 minutes 35 seconds.\n\nThis is why the bug can pass a short smoke test and fail in a longer scheduled job. The boundary is not random and not load-dependent. It is a property of the type and the unit. Once you know the unit, you can calculate when it will happen.',
          code: {
            filename: 'Boundary.java',
            language: 'java',
            code: `final class Boundary {
    public static void main(String[] args) {
        long signedLimitMicros = Integer.MAX_VALUE;
        long unsignedLimitMicros = 1L << 32;

        System.out.println(signedLimitMicros / 1_000_000 + " seconds");
        System.out.println(unsignedLimitMicros / 1_000_000 + " seconds");
        System.out.println(Integer.MAX_VALUE / 1_000_000 + " seconds as int");
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'The signed boundary is the largest positive int, interpreted as microseconds.',
              },
              {
                line: 4,
                note: 'The low 32 bits repeat after 2³² microseconds, but the signed range ends earlier.',
              },
              {
                line: 6,
                note: 'The signed boundary is about 2,147 seconds, just under thirty-six minutes.',
              },
              {
                line: 7,
                note: 'The full low-bit cycle is about 4,295 seconds, just under seventy-two minutes.',
              },
            ],
            output: `2147 seconds
4294 seconds
2147 seconds as int`,
          },
        },
        {
          title: 'Convert units once, at the boundary',
          body:
            'Keep the measurement in the widest practical type until you display it or write it to a system with a known contract. `Duration.ofNanos(elapsedNanos)` preserves the value and provides explicit conversions. `TimeUnit.NANOSECONDS.toMillis(...)` documents the truncation. A metrics API that requires an int should be treated as a boundary with a range check, not as a convenient storage type.\n\nUnit conversion and type narrowing are separate decisions. Choose the unit for the domain, then choose a type that can hold every value in that unit for the lifetime of the process. If a downstream system cannot, clamp or reject explicitly and record what happened.',
          code: {
            filename: 'Display.java',
            language: 'java',
            code: `import java.time.Duration;
import java.util.concurrent.TimeUnit;

final class Display {
    public static void main(String[] args) {
        long elapsedNanos = 40L * 60 * 1_000_000_000;
        Duration duration = Duration.ofNanos(elapsedNanos);
        long millis = TimeUnit.NANOSECONDS.toMillis(elapsedNanos);

        System.out.println(duration.toMinutes() + " minutes");
        System.out.println(millis + " millis");
    }
}`,
            annotations: [
              {
                line: 6,
                note: 'The elapsed value stays in nanoseconds as a long.',
              },
              {
                line: 7,
                note: 'Duration carries the full value and names the unit in the type.',
              },
              {
                line: 8,
                note: 'The conversion to milliseconds is explicit and still uses a long.',
              },
              {
                line: 10,
                note: 'Formatting happens after the measurement, not inside it.',
              },
            ],
            output: `40 minutes
2400000 millis`,
          },
        },
      ],
      outro:
        'The clock was monotonic the whole time. The loss happened when a positive long was narrowed to an int whose signed range ended after about thirty-six minutes. Keep elapsed time in a wide type and convert once, explicitly.',
    },
    code: {
      intro:
        'Measure with a long, then compare a safe conversion with the int cast that caused the incident.',
      minimal: {
        filename: 'Timer.java',
        language: 'java',
        code: `final class Timer {
    public static void main(String[] args) throws Exception {
        long start = System.nanoTime();
        Thread.sleep(50);
        long elapsedNanos = System.nanoTime() - start;
        long micros = elapsedNanos / 1_000;
        System.out.println(micros >= 0);
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The start reading is a long from the monotonic clock.',
          },
          {
            line: 5,
            note: 'Subtract first, then convert. The difference is the duration.',
          },
          {
            line: 6,
            note: 'Microseconds stay in a long, so a long-running measurement does not wrap here.',
          },
        ],
        output: `true`,
      },
      realistic: {
        filename: 'Latency.java',
        language: 'java',
        code: `import java.time.Duration;

final class Latency {
    public static void main(String[] args) {
        long elapsedNanos = 40L * 60 * 1_000_000_000;
        long micros = elapsedNanos / 1_000;
        int narrowed = (int) micros;

        System.out.println(micros);
        System.out.println(narrowed);
        System.out.println(Duration.ofNanos(elapsedNanos).toMinutes());
    }
}`,
        annotations: [
          {
            line: 5,
            note: 'This simulates a job that ran for forty minutes.',
          },
          {
            line: 6,
            note: 'The microsecond count is 2.4 billion, which fits in a long.',
          },
          {
            line: 7,
            note: 'The int cast keeps the low 32 bits and turns the duration negative.',
          },
          {
            line: 11,
            note: 'Duration keeps the full value and converts minutes without narrowing.',
          },
        ],
        output: `2400000000
-1894967296
40`,
      },
    },
    breakIt: {
      title: 'The latency budget that stopped firing',
      scenario:
        'A scheduled report returns its elapsed time as an `int` number of microseconds. An alert fires when that value exceeds the budget. Short runs alert correctly. After about thirty-six minutes the value becomes negative, the comparison is false, and long runs stop alerting. The retry code also sees a negative duration and treats the run as instant.',
      brokenCode: {
        filename: 'Elapsed.java',
        language: 'java',
        code: `final class Elapsed {
    static int elapsedMicros(long startNanos) {
        return (int) ((System.nanoTime() - startNanos) / 1_000);
    }

    public static void main(String[] args) {
        long start = System.nanoTime();
        int elapsed = elapsedMicros(start);
        System.out.println("elapsed micros: " + elapsed);
    }
}`,
      },
      predictionPrompt:
        'Assume the method is called after forty minutes. What value does it return, and what does the alert condition conclude?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The method returns `-1894967296` after forty minutes. A budget check such as `elapsed > budget` is false, so the alert never fires. The signed boundary is crossed at 2,147,483,647 microseconds, about 35 minutes 47 seconds.',
        explanation:
          'The subtraction is performed in long arithmetic and produces 2,400,000,000,000 nanoseconds. Dividing by 1,000 gives 2,400,000,000 microseconds, still a long. The cast then keeps the low 32 bits. Since the value is above `Integer.MAX_VALUE`, the two’s-complement interpretation is negative. The duration did not wrap; the narrowed representation did.',
        repair:
          'Return a long count and keep the unit in the method name or type. Compare durations before converting, or use `Duration` and its explicit accessors. If a downstream API truly requires an int, validate the range with `Math.toIntExact` and handle the failure at that boundary instead of sending a negative duration.',
        correctedCode: {
          filename: 'Elapsed.java',
          language: 'java',
          code: `import java.time.Duration;

final class Elapsed {
    static long elapsedNanos(long startNanos) {
        return System.nanoTime() - startNanos;
    }

    public static void main(String[] args) {
        long start = System.nanoTime();
        Duration elapsed = Duration.ofNanos(elapsedNanos(start));
        System.out.println("elapsed: " + elapsed.toMillis() + " ms");
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Timing bugs often look like monitoring bugs. These are the patterns that hide a type or clock mistake behind a plausible metric.',
      mistakes: [
        {
          title: 'Using currentTimeMillis for elapsed time',
          generatedPattern:
            '“Measure the duration by subtracting `System.currentTimeMillis()` before and after the operation.”',
          whyItFails:
            'Wall-clock time can move backward or forward when the host clock is adjusted by NTP or an operator. A duration can become negative or jump by hours even though the operation took milliseconds. It is also not portable across restarts in the way a monotonic measurement is.',
          correction:
            'Use `System.nanoTime()` for elapsed time within a process. Use wall-clock time only for timestamps that must correspond to a calendar instant, and keep the two concepts separate.',
          telltale:
            'A latency or timeout measured with `currentTimeMillis`, especially when negative durations or clock-skew alerts appear.',
        },
        {
          title: 'Storing microseconds or milliseconds in an int',
          generatedPattern:
            '“An int is enough for a duration; the job is supposed to finish in seconds.”',
          whyItFails:
            'The type must hold the worst case, not the expected case. Signed milliseconds overflow after about 24.8 days, and signed microseconds after about 35.8 minutes. A retry, a stalled dependency, or a scheduled job can cross the boundary without any obvious load spike.',
          correction:
            'Store elapsed time in a long with a unit in the name, such as `elapsedMillis` or `elapsedNanos`. Use Duration when the value crosses API boundaries. Narrow only at a validated edge.',
          telltale:
            '`int elapsed`, `int latency`, or `int duration` next to `nanoTime`, `currentTimeMillis`, or a metrics API.',
        },
        {
          title: 'Treating nanoTime as an epoch timestamp',
          generatedPattern:
            '“Store `System.nanoTime()` in the database so we can compare when requests started.”',
          whyItFails:
            'The origin is arbitrary and may differ between JVMs and runs. A nanoTime value from one process is not comparable with a value from another, and it is not a date. Persisting it creates numbers that look precise but have no shared meaning.',
          correction:
            'Use `Instant` or epoch milliseconds for wall-clock timestamps. Use nanoTime only for differences inside one process, and record the start instant separately if you need both.',
          telltale:
            'A database column or log field containing a nanoTime value, or a timestamp that is negative or absurd when compared across hosts.',
        },
        {
          title: 'Casting to int to save space in metrics',
          generatedPattern:
            '“The metrics client takes an int, so I will cast the duration and keep the payload small.”',
          whyItFails:
            'The cast preserves neither the magnitude nor the sign once the value leaves the int range. A dashboard can show negative latency or a p99 that looks healthy because long runs became negative samples. The loss is silent at the call site.',
          correction:
            'Keep the wide value through the metric pipeline, or convert to a bounded unit and clamp or reject explicitly. Record the unit and range in the metric contract. Use `Math.toIntExact` if the client truly requires an int.',
          telltale:
            'An explicit `(int)` around a duration, byte count, or identifier before sending it to a metrics or logging API.',
        },
      ],
      reviewChecklist: [
        'Is elapsed time measured with a monotonic clock rather than wall-clock time?',
        'Does the duration stay in a long or Duration through the calculation?',
        'Is every cast to int guarded by a range check or Math.toIntExact?',
        'Does the unit appear in the variable name or type?',
        'Are long-running jobs tested past the signed int boundary, not only for a few seconds?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer wants to see the difference between a clock, a unit, and a storage type. Those are three separate decisions.',
      questions: [
        {
          id: 'java.l0.nano-overflow.interview.1',
          difficulty: 'junior',
          question: 'When would you use `System.nanoTime()` instead of `System.currentTimeMillis()`?',
          modelAnswer:
            'I use `nanoTime` to measure elapsed time inside a process: start a timer, run the work, read the clock again, and subtract. It is monotonic, so it does not jump when the wall clock is adjusted. `currentTimeMillis` is for wall-clock timestamps that need to correspond to a calendar time. A nanoTime reading has an arbitrary origin and should not be stored as a date or compared across processes.',
          weakAnswer:
            'nanoTime is more precise, so I use it for all timestamps and logging.',
          strongAnswer:
            'They answer different questions. `nanoTime` gives a monotonic counter for differences; `currentTimeMillis` gives wall-clock time for when something happened. I keep elapsed durations in a long or Duration and use `Instant` for timestamps. Mixing them produces either non-portable numbers or durations that can move backward.',
          followUp: 'Why can a duration measured with currentTimeMillis become negative?',
        },
        {
          id: 'java.l0.nano-overflow.interview.2',
          difficulty: 'mid',
          question:
            'A latency metric starts returning negative values after about thirty-six minutes. What type boundary would you inspect?',
          modelAnswer:
            'Thirty-six minutes is close to 2³¹ microseconds, so I would look for a long-to-int cast on a microsecond duration. The clock is probably fine; the narrowed value is the problem. I would trace the unit and type from the measurement to the metric, replace the int with a long or Duration, and add a boundary test. If an API requires an int, I would use `Math.toIntExact` and handle the overflow explicitly.',
          weakAnswer:
            'The system clock must be wrong, so I would enable NTP or restart the host.',
          strongAnswer:
            'The period is a strong clue: 2,147,483,647 microseconds is about 35 minutes 47 seconds, and 2³² microseconds is about 71 minutes 35 seconds. That points to a signed int holding microseconds. I would confirm the call chain, check for casts or int fields, and reproduce with a simulated duration. Wall-clock adjustments can also produce odd durations, so I would verify the clock source at the same time rather than assuming.',
          followUp: 'How would you test the fix without waiting forty minutes in CI?',
        },
        {
          id: 'java.l0.nano-overflow.interview.3',
          difficulty: 'senior',
          question:
            'How would you design timing and latency metrics so this class of overflow is hard to introduce?',
          modelAnswer:
            'I would standardize on a Duration or a long with an explicit unit for internal timing, and make the unit part of the type or name. Metrics adapters would accept the wide value or a documented unit and would not expose an unvalidated int cast. I would add boundary tests with simulated clocks, not real sleeps, and review every conversion at an external API. Dashboards should reject negative durations or flag them as a contract violation rather than plotting them as data.',
          weakAnswer:
            'Use a larger int or a double, and add a dashboard alert for negative latency.',
          strongAnswer:
            'The design should make the unsafe conversion visible. A long/Duration internal contract, unit-bearing names, a metrics adapter with a checked range, and simulated-clock tests cover the mechanism. A negative-duration alert is useful as a detection backstop, but it is not the fix. I would also audit retry and timeout code, because a wrapped duration can change control flow, not just graphs.',
          followUp: 'What is the trade-off between storing nanoseconds as a long and storing a Duration object?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a stopwatch that cannot wrap',
      brief:
        'Write a small stopwatch that records a start reading from a monotonic clock and returns elapsed nanoseconds as a long. Add a formatter for milliseconds and seconds, and demonstrate the result for a simulated forty-minute duration without sleeping for forty minutes.',
      constraints: [
        'Use `System.nanoTime()` for the start and stop readings; do not use wall-clock time.',
        'Return elapsed nanoseconds as a long and keep the unit in the method name.',
        'Provide a formatting method that uses Duration or explicit unit conversion, not an int cast.',
        'Simulate a forty-minute duration in a test method so the boundary is exercised quickly.',
        'Reject a negative elapsed value with a clear message or exception.',
      ],
      starterCode: {
        filename: 'Stopwatch.java',
        language: 'java',
        code: `import java.time.Duration;

final class Stopwatch {
    private long startNanos;

    void start() {
        // Record a monotonic reading.
    }

    long elapsedNanos() {
        // Return the difference as a long.
        return 0L;
    }

    static String format(long nanos) {
        // Format with Duration or explicit unit conversion.
        return "";
    }

    public static void main(String[] args) {
        // Run a short measurement and a simulated forty-minute one.
    }
}`,
      },
      referenceSolution: {
        filename: 'Stopwatch.java',
        language: 'java',
        code: `import java.time.Duration;

final class Stopwatch {
    private long startNanos;

    void start() {
        startNanos = System.nanoTime();
    }

    long elapsedNanos() {
        long elapsed = System.nanoTime() - startNanos;
        if (elapsed < 0) {
            throw new IllegalStateException("monotonic clock moved backwards");
        }
        return elapsed;
    }

    static String format(long nanos) {
        Duration duration = Duration.ofNanos(nanos);
        long minutes = duration.toMinutes();
        long seconds = duration.minusMinutes(minutes).toSeconds();
        return minutes + "m " + seconds + "s";
    }

    public static void main(String[] args) {
        Stopwatch watch = new Stopwatch();
        watch.start();
        System.out.println("short: " + format(watch.elapsedNanos()));

        long fortyMinutes = 40L * 60 * 1_000_000_000;
        System.out.println("long: " + format(fortyMinutes));
        System.out.println("micros: " + (fortyMinutes / 1_000));
    }
}`,
        annotations: [
          {
            line: 7,
            note: 'The start reading is monotonic and stays a long.',
          },
          {
            line: 10,
            note: 'Subtract first, then validate. The duration is never narrowed to an int.',
          },
          {
            line: 21,
            note: 'Duration handles the unit conversion without losing the high bits.',
          },
          {
            line: 31,
            note: 'A simulated duration exercises the boundary immediately; it does not depend on a real sleep.',
          },
        ],
      },
      rubric: [
        {
          id: 'monotonic-source',
          check: 'Does the stopwatch use System.nanoTime rather than wall-clock time?',
          detail:
            'Wall-clock adjustments can make a duration negative or jump, even when the code is otherwise correct.',
          mustPass: true,
        },
        {
          id: 'wide-duration',
          check: 'Does elapsed time stay a long or Duration through the calculation?',
          detail:
            'The int boundary is the incident. A wide type removes the silent narrowing.',
          mustPass: true,
        },
        {
          id: 'boundary-test',
          check: 'Does the program exercise a forty-minute duration without sleeping for forty minutes?',
          detail:
            'A simulated value makes the boundary test fast and deterministic.',
          mustPass: true,
        },
        {
          id: 'formatting',
          check: 'Does formatting use explicit units and avoid an int cast?',
          detail:
            'A formatter should not reintroduce the type bug after the measurement is safe.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Stopwatch.java` and `java Stopwatch`. The long simulation should print `40m 0s` and the microsecond count should remain positive.',
        'Change `elapsedNanos` to return an int cast. Rerun the simulated forty-minute case and explain the negative result.',
        'Replace `System.nanoTime()` with `System.currentTimeMillis()` and explain why the method name and unit would also need to change.',
      ],
    },
    recap: [
      'nanoTime is a monotonic counter with an arbitrary origin; only differences are meaningful.',
      'Wall-clock time is for timestamps, not elapsed durations that must survive clock adjustments.',
      'A cast to int discards high bits; a positive long can become a negative int.',
      'Keep durations in long or Duration and convert units once, explicitly, at the boundary.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.nano-overflow.recall.q1',
      type: 'predict-output',
      concepts: ['java.l0.narrowing-cast'],
      prompt: 'What does this program print for the narrowed value?',
      code: `final class Narrow {
    public static void main(String[] args) {
        long micros = 2_400_000_000L;
        int narrowed = (int) micros;
        System.out.println(narrowed);
    }
}`,
      codeLanguage: 'java',
      expectedOutput: '-1894967296',
      acceptedOutputs: ['-1894967296'],
      explanation:
        'The long is 2,400,000,000 microseconds. Casting to int keeps the low 32 bits, and the two’s-complement interpretation becomes negative. Subtracting 2³² from 2,400,000,000 gives −1,894,967,296.',
    },
    {
      id: 'java.l0.nano-overflow.recall.q2',
      type: 'spot-the-bug',
      concepts: ['java.l0.narrowing-cast', 'java.l0.duration-measurement'],
      prompt:
        'This method is used to measure a scheduled job that can run for over an hour. Which line can turn a valid duration into a negative number?',
      code: `final class Elapsed {
    static long elapsedNanos(long start) {
        return System.nanoTime() - start;
    }

    static int elapsedMicros(long start) {
        return (int) (elapsedNanos(start) / 1_000);
    }
}`,
      codeLanguage: 'java',
      bugLine: 7,
      bugSummary:
        'The int cast narrows a long microsecond count and wraps once the duration passes about 35 minutes 47 seconds.',
      explanation:
        'The subtraction and division are correct, but the final cast discards the high bits. A long return type, Duration, or Math.toIntExact with an explicit range check would make the boundary safe or visible.',
    },
    {
      id: 'java.l0.nano-overflow.recall.q3',
      type: 'explain',
      concepts: ['java.l0.monotonic-clock', 'java.l0.duration-measurement'],
      prompt:
        'Why is System.nanoTime the right clock for a duration but the wrong value to store as a timestamp? Explain the unit and type decisions you would make.',
      keyPoints: [
        'nanoTime is monotonic, so differences are stable against wall-clock adjustments.',
        'Its origin is arbitrary, so an absolute reading is not a date and is not portable across processes.',
        'Keep the duration in a long number of nanoseconds or a Duration; do not narrow it to int.',
        'Convert to milliseconds or seconds once at the display or storage boundary with an explicit unit.',
      ],
      modelAnswer:
        'A duration needs a clock that does not jump, and nanoTime provides a monotonic counter. The absolute number is arbitrary, so it is useful only when subtracted from another reading in the same process. I would keep the difference in a long or a Duration, then convert to the unit the consumer needs. I would not store nanoTime as a timestamp; use Instant or epoch milliseconds for that. I would also avoid an int because microseconds overflow the signed range after about thirty-six minutes.',
      explanation:
        'Strong answers separate the clock choice, the unit, and the storage type. They also state why the absolute nanoTime value is not a date.',
    },
  ],
});
