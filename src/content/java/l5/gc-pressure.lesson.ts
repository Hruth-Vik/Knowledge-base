import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l5.gc-pressure',
  language: 'java',
  levelId: 'java.l5',
  chapter: {
    id: 'jvm-runtime',
    title: 'How the JVM Runs Code',
  },
  sequence: 3,
  slug: 'gc-pressure',
  title: 'The Latency Spike That Was Allocation',
  deck: 'The heap was never full, yet p99 latency spiked every few seconds. Allocation rate and live-set size explain both the frequency and the pause.',
  kind: 'incident-story',
  estimatedMinutes: 18,
  tags: ['gc', 'latency', 'allocation', 'heap', 'jvm'],
  concepts: [
    {
      id: 'java.l5.live-set',
      title: 'Live set',
      kind: 'term',
      summary: [
        'The live set is every heap object reachable from GC roots at collection time.',
        'Used heap after a full collection approximates the live set, not total allocation.',
        'Caches, sessions, and large retained graphs raise the floor that every collection must handle.',
      ],
      aliases: ['live data', 'retained heap'],
      tags: ['jvm', 'memory', 'gc'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.stack-and-heap',
        },
      ],
    },
    {
      id: 'java.l5.allocation-rate',
      title: 'Allocation rate',
      kind: 'term',
      summary: [
        'Allocation rate is the number of bytes allocated per unit of time.',
        'A high rate causes frequent young collections even when the live set is small.',
        'Short-lived garbage is cheap per object; the cumulative rate drives collector work.',
      ],
      aliases: ['bytes allocated per second', 'allocation pressure'],
      tags: ['jvm', 'memory', 'performance'],
      relations: [],
    },
    {
      id: 'java.l5.gc-pause',
      title: 'GC pause',
      kind: 'mechanism',
      summary: [
        'A pause is a stop-the-world phase where application threads cannot run.',
        'Young collections copy live objects; old collections mark and often compact them.',
        'Pause time grows with live data and reference complexity, not just garbage volume.',
      ],
      aliases: ['stop-the-world pause', 'collection pause'],
      tags: ['jvm', 'gc', 'latency'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.live-set',
        },
        {
          type: 'depends-on',
          target: 'java.l5.allocation-rate',
        },
      ],
    },
  ],
  revisits: ['java.l0.stack-and-heap'],
  versionCaveats: [
    'Examples target Java 21 LTS and G1 as the default collector. Pause behavior, humongous thresholds, and log fields differ across collectors and JVM versions.',
    'Never tune a production collector from a single log line. Measure the live set, allocation rate, and pause distribution against the actual latency objective.',
  ],
  references: [
    {
      title: 'Java SE 21 HotSpot Virtual Machine Garbage Collection Tuning Guide',
      url: 'https://docs.oracle.com/en/java/javase/21/gctuning/',
      note: 'Collector choices, pause goals, and heap sizing from measured behavior.',
    },
    {
      title: 'Java SE 21 API: MemoryMXBean',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/MemoryMXBean.html',
      note: 'Heap and non-heap memory observation from inside the process.',
    },
    {
      title: 'JDK Flight Recorder',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/jdk.jfr/jdk/jfr/package-summary.html',
      note: 'Allocation sampling and pause events for correlating collector work with latency.',
    },
  ],
  sections: {
    problem:
      'A thumbnail service has a 4 GB heap and reports only 1.1 GB used after a full collection. That looks healthy. Yet p99 latency jumps from 80 ms to 900 ms every few seconds, CPU time is dominated by GC threads, and a handful of requests time out during each spike.\n\nThe team tries a larger heap. The spikes become less frequent and slightly longer. The real problem is a combination: a high allocation rate from per-request image buffers and string building, plus a cache that raises the live set enough to make old collections expensive. Heap fullness is the wrong dashboard. Allocation rate explains how often the collector runs; live-set size explains what each pause costs.',
    analogy: {
      title: 'A kitchen with a fixed number of tables',
      body:
        'A restaurant can clear dirty plates quickly, but the work depends on how many tables are occupied and how often new dishes arrive. If diners keep ordering, the kitchen runs its cleaning cycle constantly. If every table is also reserved for the whole evening, each cycle has more to clear and the dining room stalls longer.\n\nAdding more tables can reduce how often the kitchen closes, but it does not make each closure cheaper. The useful measurements are arrival rate and occupied tables, not “how many tables are empty right now.”',
      mapping: [
        {
          technical: 'Allocation rate',
          everyday: 'How often new dishes arrive',
        },
        {
          technical: 'Live set',
          everyday: 'Tables still occupied when cleaning starts',
        },
        {
          technical: 'Young collection',
          everyday: 'A quick pass through the active tables',
        },
        {
          technical: 'Full collection',
          everyday: 'A whole-room shutdown and deep clean',
        },
        {
          technical: 'Heap size',
          everyday: 'The total number of tables',
        },
        {
          technical: 'Pause',
          everyday: 'Time the dining room cannot seat anyone',
        },
      ],
      whereItBreaks:
        'A restaurant can clean incrementally while serving. Modern collectors also do much of their work concurrently, but every collector still has stop-the-world phases. The analogy also ignores object copying and reference updates, which make pause cost depend on the shape of the live graph, not only its size.',
    },
    mentalModel: {
      title: 'Allocation sets the tempo; live data sets the price',
      figure: {
        width: 960,
        height: 360,
        caption:
          'Requests allocate temporary buffers. Young collections reclaim most of them, but survivors are promoted. A large live set in the old generation makes marking and compaction pauses expensive.',
        alt: 'A left-to-right diagram: requests allocate temporary buffers, which trigger young collections. Survivors are promoted to the old generation, where a large cache raises the live set. Old-generation collection produces the p99 latency pause.',
        nodes: [
          {
            id: 'request',
            label: 'request',
            detail: 'thumbnail job',
            x: 16,
            y: 128,
            width: 148,
            height: 92,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'allocate',
            label: 'temporary buffers',
            detail: 'high allocation rate',
            x: 204,
            y: 124,
            width: 178,
            height: 100,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'young',
            label: 'young collection',
            detail: 'frequent, usually short',
            x: 420,
            y: 28,
            width: 176,
            height: 100,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'promote',
            label: 'promotion',
            detail: 'survivors age up',
            x: 420,
            y: 224,
            width: 176,
            height: 100,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'old',
            label: 'old generation',
            detail: 'cache + retained data',
            x: 632,
            y: 112,
            width: 176,
            height: 148,
            shape: 'stack',
            tone: 'warning',
          },
          {
            id: 'pause',
            label: 'p99 pause',
            detail: 'stop-the-world phase',
            x: 836,
            y: 132,
            width: 110,
            height: 108,
            shape: 'circle',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'request',
            to: 'allocate',
            label: 'handles',
            kind: 'flow',
          },
          {
            from: 'allocate',
            to: 'young',
            label: 'fills',
            kind: 'flow',
          },
          {
            from: 'young',
            to: 'promote',
            label: 'survivors',
            kind: 'flow',
          },
          {
            from: 'promote',
            to: 'old',
            label: 'tenured',
            kind: 'flow',
          },
          {
            from: 'old',
            to: 'pause',
            label: 'mark / compact',
            kind: 'depends',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 308,
            text: 'Allocation sets the tempo.',
          },
          {
            x: 380,
            y: 308,
            text: 'Live data sets the price.',
          },
          {
            x: 700,
            y: 308,
            text: 'The pause users feel.',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Garbage collection is a throughput and latency trade-off. Measure the two inputs before choosing a collector or a heap size.',
      steps: [
        {
          title: 'Reachability defines the live set',
          body:
            'A collection starts from GC roots: thread stacks, static fields, JNI handles, and runtime structures. Anything reachable from those roots is live. Everything else is eligible for reclamation. The used heap immediately after a full collection is a practical estimate of the live set.\n\nCaches are the usual surprise. A “small” cache of decoded images or response objects can hold hundreds of megabytes. That raises the floor for every collection and can push a workload toward full collections even when request handling allocates nothing unusual.',
          code: {
            filename: 'ImageCache.java',
            language: 'java',
            code: `import java.util.LinkedHashMap;
import java.util.Map;

final class ImageCache {
    private static final Map<String, byte[]> CACHE =
        new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                return size() > 200;
            }
        };

    static void put(String key, byte[] image) {
        CACHE.put(key, image);
    }

    public static void main(String[] args) {
        for (int i = 0; i < 1_000; i++) {
            put("image-" + i, new byte[4 * 1024 * 1024]);
        }
        System.out.println("cached " + CACHE.size());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'A static map is a GC root path. Every value it retains contributes to the live set.',
              },
              {
                line: 9,
                note: 'The bound is a count, not a byte budget; the retained size depends on the values.',
              },
              {
                line: 19,
                note: 'Each entry is a 4 MiB array. Two hundred entries alone are roughly 800 MiB of live data.',
              },
            ],
            output: `cached 200`,
          },
        },
        {
          title: 'Allocation rate drives collection frequency',
          body:
            'Most allocations are a pointer bump in a thread-local buffer. That is why object creation is cheap in isolation. The cost appears when the young generation fills: the collector must find survivors and copy them. A higher allocation rate fills the young generation more often.\n\nShort-lived objects usually die in the first collection, which is efficient. Objects that survive are copied into survivor spaces and eventually promoted. High rates combined with larger temporary arrays can create humongous regions and expensive collection cycles. Allocation profiling tells you which call sites generate the bytes, not just which classes exist.',
          code: {
            filename: 'Allocation.java',
            language: 'java',
            code: `final class Allocation {
    public static void main(String[] args) {
        long total = 0;
        for (int i = 0; i < 1_000_000; i++) {
            String row = "row-" + i + ":" + (i * 31);
            total += row.length();
        }
        System.out.println(total);
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'Each iteration builds a new String and intermediate concatenation objects.',
              },
              {
                line: 5,
                note: 'Only the length is retained, so almost every allocated byte becomes short-lived garbage.',
              },
              {
                line: 7,
                note: 'A tiny live set can coexist with a very high allocation rate.',
              },
            ],
            output: `The sum of the row lengths; the bytes allocated are far larger than the retained result.`,
          },
        },
        {
          title: 'Pause cost follows live data',
          body:
            'A young collection copies reachable young objects to survivor space. An old collection marks live objects and may compact them, updating references as it moves data. The more live objects and references, the more work happens while application threads are stopped.\n\nThis is why “there is plenty of free heap” does not guarantee short pauses. Free space affects how often collection starts, while the live set affects the work during a pause. Collector choice changes how much of that work is concurrent, but it cannot make an arbitrarily large live set free.',
          code: {
            filename: 'HeapFacts.java',
            language: 'java',
            code: `final class HeapFacts {
    public static void main(String[] args) {
        Runtime runtime = Runtime.getRuntime();
        long max = runtime.maxMemory();
        long used = runtime.totalMemory() - runtime.freeMemory();

        System.out.println("max MiB " + max / (1024 * 1024));
        System.out.println("used MiB " + used / (1024 * 1024));
    }
}`,
            annotations: [
              {
                line: 4,
                note: 'maxMemory is the heap ceiling, not the live set and not all process memory.',
              },
              {
                line: 5,
                note: 'Used heap includes garbage that has not been collected yet, so it is not a live-set measurement.',
              },
              {
                line: 8,
                note: 'After a full collection, used heap is a much better approximation of retained data.',
              },
            ],
            output: `max MiB 4096
used MiB 1127`,
          },
        },
        {
          title: 'Read GC logs and allocation profiles together',
          body:
            'GC logs tell you when and why collections happened: young versus mixed versus full, heap before and after, and pause duration. Allocation profiles tell you which code created the bytes. Neither alone explains a latency spike. Correlate the pause timestamp with the request trace and the allocation hot path.\n\nLook for the pattern, not one line: frequent young collections with a small live set suggest allocation rate; long old or full pauses with a large post-collection heap suggest live-set pressure. Then decide whether to reduce allocation, bound retention, resize the heap, or change collector based on the latency objective.',
          code: {
            filename: 'gc-evidence.sh',
            language: 'bash',
            code: `java -Xms4g -Xmx4g -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar
jcmd <pid> GC.heap_info
jcmd <pid> GC.class_histogram
jcmd <pid> JFR.start duration=60s filename=allocation.jfr settings=profile`,
            annotations: [
              {
                line: 1,
                note: 'The GC log records pause type, cause, heap before and after, and timing. Fixed heap sizes remove resizing noise.',
              },
              {
                line: 2,
                note: 'heap_info reports current regions and usage; after a full collection it estimates the live set.',
              },
              {
                line: 3,
                note: 'The class histogram reveals which object types dominate retained heap, not which allocate fastest.',
              },
              {
                line: 4,
                note: 'A short JFR recording samples allocations and pause events so they can be correlated with request traces.',
              },
            ],
          },
        },
      ],
      outro:
        'A heap graph answers “what is retained?” A GC log answers “when and why did the collector run?” An allocation profile answers “who created the bytes?” Use all three before changing a flag.',
    },
    code: {
      intro:
        'Compare a high-allocation loop with an operation that streams data without materializing it. Both produce output; only one creates a large amount of short-lived garbage.',
      minimal: {
        filename: 'Allocate.java',
        language: 'java',
        code: `final class Allocate {
    public static void main(String[] args) {
        long total = 0;
        for (int i = 0; i < 1_000_000; i++) {
            String row = "row-" + i + ":" + (i * 31);
            total += row.length();
        }
        System.out.println(total);
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'Every iteration allocates a result String plus intermediate objects for concatenation.',
          },
          {
            line: 5,
            note: 'Only the length survives, so the live set stays tiny while allocation pressure is high.',
          },
          {
            line: 8,
            note: 'Run with -Xlog:gc to see frequent young collections despite the small retained result.',
          },
        ],
        output: `A large total; the retained heap remains small.`,
      },
      realistic: {
        filename: 'StreamFile.java',
        language: 'java',
        code: `import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

final class StreamFile {
    static void send(Path file, OutputStream out) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            in.transferTo(out);
        }
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            System.out.println("usage: StreamFile <input> <output>");
            return;
        }
        try (OutputStream out = Files.newOutputStream(Path.of(args[1]))) {
            send(Path.of(args[0]), out);
        }
    }
}`,
        annotations: [
          {
            line: 9,
            note: 'The input stream is opened per call, not held in a static cache after the request ends.',
          },
          {
            line: 10,
            note: 'transferTo copies through a small reusable buffer instead of allocating an array the size of the file.',
          },
          {
            line: 19,
            note: 'The try-with-resources block closes the output stream after the copy, releasing the file descriptor and native resources.',
          },
        ],
        output: `The input file is copied to the output path without materializing the whole file in memory.`,
      },
    },
    breakIt: {
      title: 'The report builder that GC’d every second',
      scenario:
        'A nightly report endpoint builds a CSV response by appending rows to a `String`. It works for a hundred orders. Under a large account it allocates hundreds of megabytes of intermediate strings, triggers repeated young collections, and eventually causes a multi-second pause. Heap after collection is only 120 MB, so the team concludes that memory is not the problem.',
      brokenCode: {
        filename: 'ReportJob.java',
        language: 'java',
        code: `import java.util.List;

record Order(String id, long cents) {}

final class ReportJob {
    static String render(List<Order> orders) {
        String report = "";
        for (Order order : orders) {
            report += order.id() + "," + order.cents() + "\\n";
        }
        return report;
    }

    public static void main(String[] args) {
        List<Order> orders = java.util.stream.IntStream.range(0, 100_000)
            .mapToObj(i -> new Order("order-" + i, i * 10L))
            .toList();
        System.out.println(render(orders).length());
    }
}`,
      },
      predictionPrompt:
        'The final report is only a few megabytes. Why would this code allocate hundreds of megabytes, and why does the heap still look mostly empty after GC?',
      failureKind: 'resource',
      reveal: {
        observed:
          'Each `+=` creates a new String containing everything written so far, then copies the old contents into it. With 100,000 rows the total copying is quadratic. The live set stays small because only the latest intermediate string survives, but the allocation rate is enormous.',
        explanation:
          'A tiny retained result does not mean low collector work. Young collections are triggered by allocation, not by the size of the final object. The report builder creates and discards a growing sequence of intermediate strings, so the collector runs frequently. Occasional promotion or a large intermediate can turn that frequency into a visible pause. The heap histogram after collection looks innocent because the garbage has already been reclaimed.',
        repair:
          'Build the report with one pre-sized `StringBuilder`, or stream rows directly to the response. Avoid `String +=` in loops. Measure the allocation rate before and after the change instead of relying on heap usage alone.',
        correctedCode: {
          filename: 'ReportJob.java',
          language: 'java',
          code: `import java.util.List;

record Order(String id, long cents) {}

final class ReportJob {
    static String render(List<Order> orders) {
        StringBuilder report = new StringBuilder(orders.size() * 16);
        for (Order order : orders) {
            report.append(order.id()).append(',')
                .append(order.cents()).append('\\n');
        }
        return report.toString();
    }

    public static void main(String[] args) {
        List<Order> orders = java.util.stream.IntStream.range(0, 100_000)
            .mapToObj(i -> new Order("order-" + i, i * 10L))
            .toList();
        System.out.println(render(orders).length());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'GC advice is full of slogans that sound causal but describe a correlation. These are the patterns that lead teams to resize a heap instead of fixing the workload.',
      mistakes: [
        {
          title: 'Saying pauses are caused by too much garbage',
          generatedPattern:
            '“The application creates a lot of garbage, so the GC pauses. Reduce garbage and pauses will disappear.”',
          whyItFails:
            'Garbage volume drives collection frequency, but pause duration is dominated by the live set and the work needed to move or mark it. A workload can allocate heavily with short pauses, or allocate little while retaining a huge graph that makes full collections expensive.',
          correction:
            'Measure both. Use GC logs and allocation profiles to separate frequency from pause cost, then reduce allocation, bound retention, resize the heap, or change collector based on the actual bottleneck.',
          telltale:
            'The heap after full GC is large, yet the team keeps trying to reduce short-lived allocations without touching the cache.',
        },
        {
          title: 'Setting -Xmx to most of the host memory',
          generatedPattern:
            '“The server has 16 GB, so set `-Xmx14g` and give the heap room to breathe.”',
          whyItFails:
            'The JVM also needs Metaspace, code cache, thread stacks, direct buffers, and native libraries. In a container, the host total may be irrelevant. A too-large heap can also make worst-case pauses longer and hide a live-set leak.',
          correction:
            'Size the heap from the measured live set with headroom, respect the container limit, and leave room for non-heap memory. Set `-Xms` and `-Xmx` deliberately and verify the actual limit inside the process.',
          telltale:
            'The process is killed by the container while the heap log shows plenty of free Java heap.',
        },
        {
          title: 'Assuming a bigger young generation is always better',
          generatedPattern:
            '“Increase the young generation so young collections happen less often. That will fix the latency spikes.”',
          whyItFails:
            'A larger young generation reduces frequency but can increase the amount copied per collection. It may also change promotion timing. The latency objective, survivor behavior, and allocation profile determine whether that trade is useful.',
          correction:
            'Tune with evidence: pause distribution, promotion rate, humongous allocations, and the latency SLO. Consider collector choice and allocation reduction before blindly changing generation sizes.',
          telltale:
            'Collection count falls, but the maximum pause and p99 latency get worse.',
        },
      ],
      reviewChecklist: [
        'Did you separate allocation-rate pressure from live-set pressure?',
        'Is the heap sized from measured live data and container limits?',
        'Did you check for large temporary arrays or `String +=` in hot paths?',
        'Did you correlate GC pauses with request latency and allocation profiles?',
      ],
    },
    interviewCorner: {
      intro:
        'GC interviews become useful when you can name the measurement behind the recommendation. Avoid collector folklore and describe the trade-off.',
      questions: [
        {
          id: 'java.l5.gc-pressure.interview.1',
          difficulty: 'junior',
          question: 'What is a GC pause, and why does the application stop during one?',
          modelAnswer:
            'A GC pause is a stop-the-world phase in which application threads are halted so the collector can perform work that requires a stable object graph. Young collections typically copy live objects between regions; old collections mark and may compact them. Some collector work is concurrent, but phases such as evacuation or remarking still require a pause. The duration depends on the collector and the amount of live data it must handle.',
          weakAnswer:
            'The GC pauses to delete unused variables and free memory.',
          strongAnswer:
            'It is a coordination point. The collector needs a consistent view while it moves objects or updates references. Modern collectors shorten or parallelize those phases, but they cannot eliminate the need for some stop-the-world work. Pause time is a function of live data and graph shape, not simply the number of unreachable objects.',
          followUp:
            'Why can a heap with lots of free space still produce long pauses?',
        },
        {
          id: 'java.l5.gc-pressure.interview.2',
          difficulty: 'mid',
          question:
            'CPU is high in GC threads and heap usage is low. What do you measure next?',
          modelAnswer:
            'I would capture a GC log with pause types, heap before and after, and allocation events, plus a short JFR recording for allocation samples. I would estimate the live set from heap usage after a full collection and compare it with the heap ceiling. Low used heap with frequent young collections points to a high allocation rate; long old or full pauses point to live-set pressure or promotion. Then I would identify the allocation hot path before changing flags.',
          weakAnswer:
            'Heap usage is low, so GC cannot be the problem. I would look for a CPU leak in application code.',
          strongAnswer:
            'Low used heap is a snapshot, not a rate. I would measure bytes allocated per second, collection frequency, promotion, and pause distribution. I would correlate pause timestamps with p99 latency and inspect allocation samples by call site. That separates “too many short collections” from “a few expensive collections,” which lead to different fixes.',
          followUp:
            'How would you prove that a specific code path is responsible for the allocation rate?',
        },
        {
          id: 'java.l5.gc-pressure.interview.3',
          difficulty: 'senior',
          question:
            'A service misses its p99 SLO during GC cycles. How do you choose between reducing allocation, resizing the heap, and changing collector?',
          modelAnswer:
            'I would start from the SLO and the pause distribution: how long, how often, and which collection types. I would measure the live set after full collections and the allocation rate by call site. If pauses are frequent and short with a small live set, I would attack allocation first and possibly adjust young sizing. If pauses are long because the live set is large, I would bound retention, then size the heap and choose a low-pause collector such as ZGC if the SLO justifies its throughput cost. I would validate with a canary and compare p99, GC CPU, and allocation rate before and after.',
          weakAnswer:
            'I would switch to ZGC because it has no pauses, then increase the heap until the alerts stop.',
          strongAnswer:
            'The choice follows the evidence. Allocation reduction lowers collection frequency and is usually the cheapest durable fix. Heap sizing must follow the live set and container budget, not the host’s total RAM. Collector choice trades pause behavior against throughput and CPU. I would run a controlled experiment with the same traffic shape, measure p99 and GC overhead, and keep the change only if it moves the SLO without shifting the problem elsewhere.',
          followUp:
            'What would make you reject a collector change even if it improved p99?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Measure allocation before you tune the collector',
      brief:
        'Build an `AllocationLab` that renders the same rows with `String +=` and with a pre-sized `StringBuilder`, measures the bytes allocated by each version, and prints the comparison. The point is to make allocation visible as a rate, not to guess from heap usage.',
      constraints: [
        'Use Java 21 and `com.sun.management.ThreadMXBean.getCurrentThreadAllocatedBytes()` for measurement.',
        'Render 10,000 rows with both approaches; the resulting strings must be equal.',
        'Use a pre-sized `StringBuilder` and `append` rather than repeated `String` concatenation.',
        'Print the allocated MiB for each version and the ratio between them.',
        'Run both versions in the same process so heap state is comparable.',
      ],
      starterCode: {
        filename: 'AllocationLab.java',
        language: 'java',
        code: `import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;

final class AllocationLab {
    private static final int ROWS = 10_000;

    public static void main(String[] args) {
        ThreadMXBean threads = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        // Measure withConcat and withBuilder, then print MiB and the ratio.
    }

    // Add withConcat, withBuilder, and a MiB helper.
}`,
      },
      referenceSolution: {
        filename: 'AllocationLab.java',
        language: 'java',
        code: `import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;

final class AllocationLab {
    private static final int ROWS = 10_000;

    public static void main(String[] args) {
        ThreadMXBean threads = (ThreadMXBean) ManagementFactory.getThreadMXBean();

        long beforeConcat = threads.getCurrentThreadAllocatedBytes();
        String concat = withConcat(ROWS);
        long afterConcat = threads.getCurrentThreadAllocatedBytes();

        long beforeBuilder = threads.getCurrentThreadAllocatedBytes();
        String builder = withBuilder(ROWS);
        long afterBuilder = threads.getCurrentThreadAllocatedBytes();

        long concatBytes = afterConcat - beforeConcat;
        long builderBytes = afterBuilder - beforeBuilder;

        System.out.println("same output: " + concat.equals(builder));
        System.out.println("concat MiB: " + mib(concatBytes));
        System.out.println("builder MiB: " + mib(builderBytes));
        System.out.println("ratio: " + (double) concatBytes / builderBytes);
    }

    static String withConcat(int rows) {
        String out = "";
        for (int i = 0; i < rows; i++) {
            out += "row-" + i + "\\n";
        }
        return out;
    }

    static String withBuilder(int rows) {
        StringBuilder out = new StringBuilder(rows * 10);
        for (int i = 0; i < rows; i++) {
            out.append("row-").append(i).append('\\n');
        }
        return out.toString();
    }

    static double mib(long bytes) {
        return bytes / (1024.0 * 1024.0);
    }
}`,
        annotations: [
          {
            line: 10,
            note: 'The per-thread counter isolates allocations from this work from other threads and background activity.',
          },
          {
            line: 30,
            note: 'The concatenation loop copies the accumulated string on every iteration, so total allocation grows quadratically.',
          },
          {
            line: 36,
            note: 'A pre-sized builder avoids repeated array growth and copies for a known row count.',
          },
          {
            line: 22,
            note: 'Reporting MiB makes the allocation difference legible next to the identical output strings.',
          },
        ],
      },
      rubric: [
        {
          id: 'measured-allocation',
          check: 'Does the program measure per-thread allocated bytes around each version?',
          detail:
            'Heap usage after the fact cannot separate the two implementations. The allocation counter makes the rate visible.',
          mustPass: true,
        },
        {
          id: 'equivalent-output',
          check: 'Do both implementations produce identical strings?',
          detail:
            'An allocation optimization that changes the output is not an optimization.',
          mustPass: true,
        },
        {
          id: 'builder-implementation',
          check: 'Does the builder version pre-size and use append?',
          detail:
            'Pre-sizing avoids growth copies; append avoids creating a new String on every row.',
          mustPass: true,
        },
        {
          id: 'interpretation',
          check: 'Does the output show the builder allocating far fewer bytes and explain why?',
          detail:
            'The numbers should connect the code shape to allocation rate, not just produce a smaller figure.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile with `javac --release 21 AllocationLab.java` and run `java AllocationLab`; expect identical output strings and a much larger concat figure.',
        'Run with `-Xms64m -Xmx64m -Xlog:gc` and compare collection frequency between the two variants.',
        'Record a short JFR profile with `-XX:StartFlightRecording=filename=alloc.jfr,settings=profile` and inspect allocation samples by call site.',
      ],
    },
    recap: [
      'Live set is the retained object graph; used heap after a full collection approximates it.',
      'Allocation rate drives collection frequency; a small retained result can still create heavy collector work.',
      'Pause duration grows with live data and reference complexity, while free heap mostly affects when collection starts.',
      'Tune from evidence: GC logs, heap-after-collection, and allocation profiles, not from a single heap-usage number.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l5.gc-pressure.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l5.live-set'],
      prompt: 'Which measurement best approximates the live set?',
      options: [
        {
          id: 'used-before',
          text: 'Used heap immediately before a collection.',
        },
        {
          id: 'used-after-full',
          text: 'Used heap immediately after a full collection.',
        },
        {
          id: 'max-heap',
          text: 'The value of `-Xmx`.',
        },
        {
          id: 'committed',
          text: 'Committed heap size.',
        },
      ],
      correctOptionId: 'used-after-full',
      explanation:
        'After a full collection, unreachable objects are gone. What remains is the reachable object graph, which is the practical live-set estimate.',
    },
    {
      id: 'java.l5.gc-pressure.recall.q2',
      type: 'order-the-steps',
      concepts: ['java.l5.gc-pause', 'java.l5.allocation-rate'],
      prompt: 'Put a GC latency investigation in a useful order.',
      items: [
        {
          id: 'observe',
          text: 'Capture GC logs and correlate pause timestamps with request latency.',
        },
        {
          id: 'live',
          text: 'Estimate the live set from heap usage after a full collection.',
        },
        {
          id: 'allocate',
          text: 'Profile allocation hot paths and measure bytes allocated per second.',
        },
        {
          id: 'change',
          text: 'Fix the dominant cause and compare the same workload before and after.',
        },
      ],
      correctOrder: ['observe', 'live', 'allocate', 'change'],
      explanation:
        'First connect pauses to the symptom, then separate live-set cost from allocation-rate frequency, and only then change code or flags.',
    },
    {
      id: 'java.l5.gc-pressure.recall.q3',
      type: 'explain',
      concepts: ['java.l5.gc-pause', 'java.l5.live-set'],
      prompt:
        'Why can increasing the heap make pauses less frequent but longer, even when the allocation rate stays the same?',
      keyPoints: [
        'A larger heap delays when a collection is triggered, so collections happen less often.',
        'A larger heap can allow more live data and garbage to accumulate before a collection.',
        'Full or old-generation pause work scales with the live graph that must be marked or moved.',
        'Frequency and duration are different measurements; optimizing one does not guarantee the other.',
      ],
      modelAnswer:
        'Heap size changes when the collector decides to run, not how much live data exists. With more room, the application can run longer between collections, so pauses become less frequent. But if the live set also grows, or a full collection must mark and compact more retained objects, each pause can take longer. Allocation rate still determines how fast the heap fills. That is why a larger heap can improve throughput while making worst-case latency worse, and why live-set reduction is often the durable fix.',
      explanation:
        'Strong answers separate collection frequency from pause duration and explain that heap size does not reduce the retained graph.',
    },
  ],
});
