import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l5.classloader-leak',
  language: 'java',
  levelId: 'java.l5',
  chapter: {
    id: 'jvm-runtime',
    title: 'How the JVM Runs Code',
  },
  sequence: 2,
  slug: 'classloader-leak',
  title: 'The Metaspace Leak Behind a Plugin Reload',
  deck: 'A redeploy released every plugin instance and still ran out of Metaspace. The old class loader was reachable, so its classes could never unload.',
  kind: 'incident-story',
  estimatedMinutes: 18,
  tags: ['classloader', 'metaspace', 'plugins', 'memory-leak', 'jvm'],
  concepts: [
    {
      id: 'java.l5.loader-reachability',
      title: 'Class loader reachability',
      kind: 'mechanism',
      summary: [
        'A class is unloaded only when its defining class loader becomes unreachable.',
        'Classes, their static fields, and their instances all keep the loader alive.',
        'Retaining one instance or static reference can pin an entire loader generation.',
      ],
      aliases: ['class unloading', 'loader leak'],
      tags: ['jvm', 'classloading', 'memory'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.class-loading',
        },
        {
          type: 'contrasts-with',
          target: 'java.l5.metaspace-exhaustion',
        },
      ],
    },
    {
      id: 'java.l5.thread-context-loader',
      title: 'Thread context class loader',
      kind: 'mechanism',
      summary: [
        'Each thread holds a context class loader used by frameworks and service loaders.',
        'A long-lived pool thread can keep a discarded plugin loader reachable.',
        'Set and restore the context loader around plugin work, then clear it.',
      ],
      aliases: ['TCCL', 'context class loader'],
      tags: ['jvm', 'classloading', 'threads'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.loader-reachability',
        },
      ],
    },
    {
      id: 'java.l5.metaspace-exhaustion',
      title: 'Metaspace exhaustion',
      kind: 'failure-mode',
      summary: [
        'Metaspace holds class metadata, bytecode, and related runtime structures.',
        'A leak shows up as growing Metaspace after full collections, then an OutOfMemoryError.',
        'Raising MaxMetaspaceSize postpones the failure; it does not remove the retainer.',
      ],
      aliases: ['Metaspace OOM', 'class metadata leak'],
      tags: ['jvm', 'memory', 'failure'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.loader-reachability',
        },
      ],
    },
  ],
  revisits: ['java.l5.class-loading', 'java.l0.jvm'],
  versionCaveats: [
    'Examples target Java 21 LTS. Metaspace sizing flags and class-unloading log tags differ across JVM versions and collectors.',
    'Class unloading behavior also depends on the garbage collector and whether a class is still referenced by a live class loader, thread, or JNI structure.',
  ],
  references: [
    {
      title: 'Java SE 21 API: ClassLoader',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html',
      note: 'Loader hierarchy, delegation, and the closeable URLClassLoader contract.',
    },
    {
      title: 'Java SE 21 API: Thread.getContextClassLoader',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html#getContextClassLoader()',
      note: 'Why frameworks use the context loader and why thread pools can pin it.',
    },
    {
      title: 'Java HotSpot VM Options: Metaspace',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html',
      note: 'MaxMetaspaceSize and logging options for diagnosing class metadata growth.',
    },
  ],
  sections: {
    problem:
      'A plugin host redeploys a jar without restarting the JVM. After each redeploy, the old plugin should be gone. Heap usage stays modest, and a heap dump shows no obvious instance leak. Yet after forty reloads the process dies with `OutOfMemoryError: Metaspace`, while `jcmd VM.metaspace` shows class metadata climbing in a straight line.\n\nThis is not a heap leak. The old plugin’s classes can never unload because something still references their class loader. Every class it defined, every static field it initialized, and all of its metadata remain reachable. The fix is not a larger Metaspace. It is finding the retainer and giving the old loader a real lifecycle.',
    analogy: {
      title: 'The office that never returns its keys',
      body:
        'A company moves a team into a floor of an office building. When the team is replaced, the furniture can leave, but the old team’s key cards are still active and the building manager still lists them as tenants. The floor cannot be reassigned because the old tenancy record is technically alive.\n\nAdding more floors delays the shortage, but the building keeps accumulating abandoned tenancies. The useful question is not “how many floors do we have?” but “who still holds a key to the old floor?”',
      mapping: [
        {
          technical: 'A class loader',
          everyday: 'The tenancy record for one team’s floor',
        },
        {
          technical: 'A class defined by that loader',
          everyday: 'A room assigned to that team',
        },
        {
          technical: 'Metaspace',
          everyday: 'The building’s floor space',
        },
        {
          technical: 'A thread context loader or static field',
          everyday: 'An active key card or tenant record',
        },
        {
          technical: 'Class unloading',
          everyday: 'Reassigning the floor after the tenancy ends',
        },
      ],
      whereItBreaks:
        'A building manager can revoke a key card directly. The JVM only unloads a class loader when the entire object graph that reaches it becomes unreachable. There is no API to force one class or one loader to unload.',
    },
    mentalModel: {
      title: 'One live reference keeps a whole generation of classes alive',
      figure: {
        width: 960,
        height: 360,
        caption:
          'The application loader defines plugin loaders for each deployment. An old loader remains reachable through a worker thread’s context loader, so its classes and Metaspace metadata stay alive.',
        alt: 'A diagram showing the application class loader defining plugin loader v1 and v2. Both define classes in Metaspace. A long-lived worker thread holds a context class loader reference to v1, keeping the old loader and its metadata reachable after redeploy.',
        nodes: [
          {
            id: 'app',
            label: 'application loader',
            detail: 'long-lived',
            x: 24,
            y: 132,
            width: 168,
            height: 96,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'v1',
            label: 'plugin loader v1',
            detail: 'previous deployment',
            x: 240,
            y: 36,
            width: 190,
            height: 104,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'v2',
            label: 'plugin loader v2',
            detail: 'current deployment',
            x: 240,
            y: 220,
            width: 190,
            height: 104,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'meta',
            label: 'Metaspace',
            detail: 'v1 + v2 class metadata',
            x: 496,
            y: 84,
            width: 196,
            height: 176,
            shape: 'stack',
            tone: 'accent',
          },
          {
            id: 'thread',
            label: 'worker thread',
            detail: 'context loader → v1',
            x: 748,
            y: 116,
            width: 184,
            height: 120,
            shape: 'note',
            tone: 'warning',
          },
        ],
        edges: [
          {
            from: 'app',
            to: 'v1',
            label: 'defined',
            kind: 'flow',
          },
          {
            from: 'app',
            to: 'v2',
            label: 'defined',
            kind: 'flow',
          },
          {
            from: 'v1',
            to: 'meta',
            label: 'defines',
            kind: 'depends',
          },
          {
            from: 'v2',
            to: 'meta',
            label: 'defines',
            kind: 'depends',
          },
          {
            from: 'thread',
            to: 'v1',
            label: 'keeps reachable',
            kind: 'depends',
          },
        ],
        annotations: [
          {
            x: 24,
            y: 292,
            text: 'Application loader lives on.',
          },
          {
            x: 496,
            y: 292,
            text: 'Metadata frees with the loader.',
          },
          {
            x: 748,
            y: 292,
            text: 'A pool thread pins old v1.',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Class unloading is a reachability problem, not a reference-counting problem. Trace what can reach the loader, then verify the evidence before changing a flag.',
      steps: [
        {
          title: 'Unloading happens per loader, never per class',
          body:
            'The JVM defines a class in the context of a class loader. The class’s metadata, its static fields, and the loader itself form one reachability unit. If the loader is unreachable, its classes can be unloaded together. If the loader is reachable, none of its classes can vanish independently.\n\nThat is why “delete the object” or “clear the cache” may not help. An instance keeps its `Class` alive, and the `Class` keeps its defining loader alive. A single retained plugin object, static field, or thread-local value can therefore pin the entire deployment.',
          code: {
            filename: 'PinnedByInstance.java',
            language: 'java',
            code: `import java.net.URL;
import java.net.URLClassLoader;

final class PinnedByInstance {
    private static Object lastPlugin;

    static void deploy() throws Exception {
        URL url = new URL("file:build/plugin.jar");
        URLClassLoader loader = new URLClassLoader(
            new URL[] { url }, PinnedByInstance.class.getClassLoader());
        Class<?> type = Class.forName("com.acme.Plugin", true, loader);
        lastPlugin = type.getDeclaredConstructor().newInstance();
    }

    public static void main(String[] args) throws Exception {
        deploy();
        System.out.println(lastPlugin.getClass().getClassLoader());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'This static field is a GC root. Whatever it points at stays reachable for the process lifetime.',
              },
              {
                line: 10,
                note: 'Each call creates a new loader, so each deployment defines a fresh generation of plugin classes.',
              },
              {
                line: 12,
                note: 'The plugin instance’s Class points back to the loader that defined it.',
              },
              {
                line: 13,
                note: 'Keeping the instance in a static field pins the loader and all of its Metaspace metadata.',
              },
            ],
          },
        },
        {
          title: 'Thread pools outlive deployments',
          body:
            'Frameworks often set a thread’s context class loader so service loaders and plugin code can find resources. That reference lives on the `Thread` object. A cached pool thread can survive many redeploys, quietly holding the loader from the deployment that created it.\n\nThe same pattern appears with `ThreadLocal` values, executors created by a plugin, shutdown hooks, and logging contexts. Set the context loader only around the work that needs it, restore the previous value in a `finally` block, and shut down executors owned by the plugin before discarding its loader.',
          code: {
            filename: 'ContextLoader.java',
            language: 'java',
            code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ContextLoader {
    static void runWithLoader(ClassLoader loader, Runnable task) {
        Thread thread = Thread.currentThread();
        ClassLoader previous = thread.getContextClassLoader();
        thread.setContextClassLoader(loader);
        try {
            task.run();
        } finally {
            thread.setContextClassLoader(previous);
        }
    }

    public static void main(String[] args) {
        ClassLoader plugin = ContextLoader.class.getClassLoader();
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            pool.submit(() -> runWithLoader(plugin, () -> System.out.println("work")));
        } finally {
            pool.shutdown();
        }
    }
}`,
            annotations: [
              {
                line: 7,
                note: 'Save the previous context loader so the thread is restored, not left pointing at plugin code.',
              },
              {
                line: 8,
                note: 'The thread now holds a strong reference to the plugin loader for the duration of the task.',
              },
              {
                line: 11,
                note: 'A finally block restores the thread even when the task throws.',
              },
              {
                line: 21,
                note: 'Executors owned by a plugin must be shut down; their worker threads can outlive the loader swap.',
              },
            ],
          },
        },
        {
          title: 'Find the retainer before resizing Metaspace',
          body:
            'A heap dump shows objects; class-loader statistics show the loader graph. Start with the loader count and Metaspace after a forced collection. If both keep climbing across redeploys, a retainer exists. Use a heap dump and inspect the dominator tree for the old loader, then follow incoming references to threads, static fields, or JNI globals.\n\nMetaspace growth alone is not proof of a leak: loading more classes legitimately grows it. The telling pattern is repeated deployments leaving old loader generations behind after full collections.',
          code: {
            filename: 'diagnose.sh',
            language: 'bash',
            code: `jcmd <pid> VM.metaspace
jcmd <pid> GC.class_stats
jmap -clstats <pid>
jcmd <pid> GC.heap_dump heap.hprof`,
            annotations: [
              {
                line: 1,
                note: 'VM.metaspace summarizes committed and used class metadata by loader category.',
              },
              {
                line: 2,
                note: 'GC.class_stats needs diagnostic VM options; it breaks down loaded classes and their size.',
              },
              {
                line: 3,
                note: 'jmap -clstats lists class loaders with parent, class count, and liveness information.',
              },
              {
                line: 4,
                note: 'The heap dump lets you follow incoming references from an old loader to its retainer.',
              },
            ],
          },
        },
      ],
      outro:
        'A loader leak is a lifecycle bug wearing a memory costume. Fix the ownership of threads, statics, and resources; then confirm that loader counts fall after redeploys.',
    },
    code: {
      intro:
        'First observe the lifecycle directly. Then run a reload loop and watch what happens when each generation keeps a reference to the previous one.',
      minimal: {
        filename: 'LoaderFacts.java',
        language: 'java',
        code: `final class LoaderFacts {
    public static void main(String[] args) {
        ClassLoader app = LoaderFacts.class.getClassLoader();
        ClassLoader platform = ClassLoader.getPlatformClassLoader();

        System.out.println("app " + app);
        System.out.println("platform " + platform);
        System.out.println("parent " + app.getParent());
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The application loader defined this class. It is the loader a leak would pin.',
          },
          {
            line: 4,
            note: 'The platform loader is a parent in the delegation chain, not the loader of application classes.',
          },
          {
            line: 8,
            note: 'Parent delegation means a loader can see classes from its ancestors without defining them.',
          },
        ],
        output: `app jdk.internal.loader.ClassLoaders$AppClassLoader@...
platform jdk.internal.loader.ClassLoaders$PlatformClassLoader@...
parent jdk.internal.loader.ClassLoaders$PlatformClassLoader@...`,
      },
      realistic: {
        filename: 'ReloadLoop.java',
        language: 'java',
        code: `import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

final class ReloadLoop {
    private static final List<URLClassLoader> OLD = new ArrayList<>();

    static void deploy(Path jar, boolean retain) throws Exception {
        URL url = jar.toUri().toURL();
        URLClassLoader loader = new URLClassLoader(
            new URL[] { url }, ReloadLoop.class.getClassLoader());
        if (retain) {
            OLD.add(loader);
        }
        Class<?> type = Class.forName("com.acme.Plugin", true, loader);
        type.getDeclaredConstructor().newInstance();
    }

    public static void main(String[] args) throws Exception {
        Path jar = Path.of("build/plugin.jar");
        for (int i = 0; i < 40; i++) {
            deploy(jar, i % 2 == 0);
        }
        System.out.println("retained loaders " + OLD.size());
    }
}`,
        annotations: [
          {
            line: 8,
            note: 'This list is a static GC root. Every loader added to it stays reachable for the process lifetime.',
          },
          {
            line: 14,
            note: 'Retaining only some generations still leaks those generations; the rest may unload.',
          },
          {
            line: 17,
            note: 'The plugin class is defined by this loader, not by the application loader.',
          },
          {
            line: 23,
            note: 'The alternating flag models a partial cleanup bug rather than a total failure to release.',
          },
        ],
        output: `retained loaders 20`,
      },
    },
    breakIt: {
      title: 'The redeploy that kept every generation',
      scenario:
        'A plugin host supports hot redeploys without a restart. Every deployment is recorded in a static list so the operations endpoint can report deployment history. After a week of frequent releases, the process fails with `OutOfMemoryError: Metaspace`. Heap usage is only 180 MB of a 2 GB maximum, and no plugin instance appears in the heap histogram. The deployment count is 43.',
      brokenCode: {
        filename: 'PluginHost.java',
        language: 'java',
        code: `import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

final class PluginHost {
    private static final List<URLClassLoader> DEPLOYED = new ArrayList<>();

    static void deploy(Path jar) throws Exception {
        URL url = jar.toUri().toURL();
        URLClassLoader loader = new URLClassLoader(
            new URL[] { url }, PluginHost.class.getClassLoader());
        DEPLOYED.add(loader);
        Class<?> type = Class.forName("com.acme.Plugin", true, loader);
        type.getDeclaredConstructor().newInstance();
    }

    public static void main(String[] args) throws Exception {
        for (int i = 0; i < 50; i++) {
            deploy(Path.of("build/plugin.jar"));
        }
        System.out.println("deployed " + DEPLOYED.size());
    }
}`,
      },
      predictionPrompt:
        'The instances are gone and the heap is mostly empty. Why does Metaspace keep growing, and what keeps each old generation alive?',
      failureKind: 'resource',
      reveal: {
        observed:
          'The static `DEPLOYED` list holds every `URLClassLoader`. Each loader keeps its classes, static state, and Metaspace metadata reachable. The process fails with `OutOfMemoryError: Metaspace` while the Java heap remains far below its limit.',
        explanation:
          'Class metadata is unloaded only when the defining loader is unreachable. The static list is a GC root, so no loader in it can be collected. Even though the plugin instances are gone, each loader still defines classes and may hold static fields. The heap dump looks clean because the leak is in class metadata, not in ordinary Java objects. Raising `MaxMetaspaceSize` would only delay the same failure.',
        repair:
          'Keep exactly one active loader per plugin. Close the previous loader when swapping, remove the static history list, shut down plugin-owned executors, and clear any thread context loader that points at the old generation. Expose deployment metadata as plain strings rather than loader references.',
        correctedCode: {
          filename: 'PluginHost.java',
          language: 'java',
          code: `import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;

final class PluginHost implements AutoCloseable {
    private URLClassLoader active;

    synchronized void deploy(Path jar) throws Exception {
        URL url = jar.toUri().toURL();
        URLClassLoader next = new URLClassLoader(
            new URL[] { url }, PluginHost.class.getClassLoader());

        URLClassLoader previous = active;
        active = next;
        if (previous != null) {
            previous.close();
        }

        Class<?> type = Class.forName("com.acme.Plugin", true, next);
        type.getDeclaredConstructor().newInstance();
    }

    @Override
    public synchronized void close() throws Exception {
        if (active != null) {
            active.close();
            active = null;
        }
    }

    public static void main(String[] args) throws Exception {
        try (PluginHost host = new PluginHost()) {
            for (int i = 0; i < 50; i++) {
                host.deploy(Path.of("build/plugin.jar"));
            }
        }
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Metaspace failures invite flag changes because flags are easy to deploy. These explanations skip the lifecycle question that actually caused the leak.',
      mistakes: [
        {
          title: 'Increasing MaxMetaspaceSize as the fix',
          generatedPattern:
            '“The process ran out of Metaspace, so raise `-XX:MaxMetaspaceSize` from 256m to 1g.”',
          whyItFails:
            'The leak is a reachable old loader generation. A larger ceiling buys time and makes the eventual failure more expensive, but the retainer still holds every class it ever defined.',
          correction:
            'Treat Metaspace growth after full collections as evidence of retained loaders. Find the incoming reference, fix the lifecycle, and only then size Metaspace with headroom for legitimate class loading.',
          telltale:
            'Metaspace usage keeps climbing after each redeploy and does not fall after a full GC, even when the heap is nearly empty.',
        },
        {
          title: 'Claiming classes unload when instances disappear',
          generatedPattern:
            '“The plugin objects are no longer used, so the garbage collector will unload their classes and free the metadata.”',
          whyItFails:
            'Class unloading depends on the defining loader becoming unreachable. The loader can still be referenced by a thread, a static field, a JNI handle, or another class it defined.',
          correction:
            'Trace loader reachability, not just instance reachability. Check thread context loaders, executor threads, static caches, shutdown hooks, and resources opened by the plugin.',
          telltale:
            'A heap dump has almost no plugin instances, but `jmap -clstats` shows many loaders with the same class names.',
        },
        {
          title: 'Assuming System.gc() can force class unloading',
          generatedPattern:
            '“Add `System.gc()` after redeploy so the old classes are unloaded immediately.”',
          whyItFails:
            'A collection cannot unload a loader that is still reachable. Explicit GC also damages latency and may be disabled by the runtime. It does not replace a lifecycle fix.',
          correction:
            'Release the loader’s references, close its resources, and verify with loader statistics after natural collections. Use logging such as `-Xlog:class+unload=info` when you need evidence.',
          telltale:
            'The code calls `System.gc()` repeatedly, yet Metaspace and loader counts continue to grow.',
        },
      ],
      reviewChecklist: [
        'Does every plugin loader have one owner and a close path?',
        'Are plugin-owned executors, threads, and context loaders shut down or cleared?',
        'Do static fields store plain data instead of class loader references?',
        'Does the redeploy test check loader counts or Metaspace after collection, not just heap usage?',
      ],
    },
    interviewCorner: {
      intro:
        'A class loader question tests whether you understand reachability across objects, classes, and metadata. Start with the lifecycle, then bring evidence.',
      questions: [
        {
          id: 'java.l5.classloader-leak.interview.1',
          difficulty: 'junior',
          question: 'What is Metaspace, and how is it different from the Java heap?',
          modelAnswer:
            'Metaspace stores class metadata for loaded classes: the runtime representation of a class, method metadata, bytecode-related structures, and the constant pool. It is native memory managed by the JVM, not the Java object heap. Ordinary objects still live on the heap. A Metaspace OutOfMemoryError means class metadata could not be allocated, not that the object heap is full.',
          weakAnswer:
            'Metaspace is just another name for the heap where classes are stored.',
          strongAnswer:
            'Metaspace is the native-memory region for class metadata, while the heap holds instances and arrays. Classes are unloaded with their defining loader, which frees Metaspace. That is why a loader leak shows up as Metaspace growth even when a heap histogram looks normal.',
          followUp:
            'Why can a heap dump be mostly empty while a process still dies from memory pressure?',
        },
        {
          id: 'java.l5.classloader-leak.interview.2',
          difficulty: 'mid',
          question:
            'How does a class actually get unloaded, and why can you not unload one class at a time?',
          modelAnswer:
            'A class is unloaded when its defining class loader becomes unreachable. The JVM treats the loader and the classes it defined as a reachability unit. You cannot request one class to unload, because its metadata, static state, and references are tied to that loader. Any live instance, static field, thread context loader, or JNI reference that reaches the loader can keep the whole generation alive.',
          weakAnswer:
            'Set the class reference to null and call System.gc; the JVM will unload it.',
          strongAnswer:
            'The unit of unloading is the defining loader. I would prove the loader is unreachable, not just that the last visible instance is gone. That means checking GC roots such as thread context loaders, static collections, executors, and native handles. Once the loader is collectible, its classes and metadata go together.',
          followUp:
            'Where would you look first if a redeploy leaves the old loader alive?',
        },
        {
          id: 'java.l5.classloader-leak.interview.3',
          difficulty: 'senior',
          question:
            'A plugin platform leaks one class loader per deployment. Walk through your investigation and the prevention plan.',
          modelAnswer:
            'I would reproduce a redeploy and capture Metaspace, loader counts, and a heap dump after a full collection. I would identify an old plugin loader in the dump and follow incoming references to the dominator. Common retainers are pool threads with the plugin context loader, static registries, plugin-created executors, JDBC drivers, logging contexts, and shutdown hooks. After fixing ownership and close paths, I would add a redeploy test that asserts the old loader becomes unreachable, plus a production alert on loader count or Metaspace after collection.',
          weakAnswer:
            'I would increase Metaspace, restart on a schedule, and add a monitoring dashboard.',
          strongAnswer:
            'The investigation is a reachability trace: reproduce, collect, find the old loader, and follow incoming references to the exact retainer. The fix is a lifecycle contract: one owner, close on swap, clear context loaders, shut down executors, and avoid static loader references. Prevention is a canary redeploy that measures loader liveness and an alert based on post-collection Metaspace trend, not raw usage.',
          followUp:
            'How would you write a repeatable test that fails when a loader cannot be collected?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Give a plugin loader a real lifecycle',
      brief:
        'Build a `PluginSlot` that owns exactly one class loader at a time. Swapping to a new jar must close the previous loader, and closing the slot must release the active one. Prove the lifecycle with a small tracking loader that records whether `close()` ran.',
      constraints: [
        'Use Java 21 and a `TrackingLoader` that extends `URLClassLoader` and records when it is closed.',
        'Keep a single active loader reference; do not store old loaders in a static or instance collection.',
        'Implement `swap(Path)` so the next loader is installed before the previous one is closed.',
        'Implement `AutoCloseable` and close the active loader on shutdown.',
        'Print whether the old loader was closed after a swap.',
      ],
      starterCode: {
        filename: 'PluginSlot.java',
        language: 'java',
        code: `import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;

final class PluginSlot implements AutoCloseable {
    // Keep exactly one active loader and close the previous one on swap.

    public static void main(String[] args) throws Exception {
        Path dir = Path.of("plugins");
        // Create a slot, swap once, and prove the previous loader was closed.
    }
}`,
      },
      referenceSolution: {
        filename: 'PluginSlot.java',
        language: 'java',
        code: `import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;

final class PluginSlot implements AutoCloseable {
    static final class TrackingLoader extends URLClassLoader {
        private boolean closed;

        TrackingLoader(URL url, ClassLoader parent) {
            super(new URL[] { url }, parent);
        }

        @Override
        public void close() throws IOException {
            closed = true;
            super.close();
        }

        boolean isClosed() { return closed; }
    }

    private TrackingLoader active;

    PluginSlot(Path dir) throws IOException {
        this.active = open(dir);
    }

    private static TrackingLoader open(Path dir) throws IOException {
        return new TrackingLoader(
            dir.toUri().toURL(), PluginSlot.class.getClassLoader());
    }

    TrackingLoader active() { return active; }

    void swap(Path dir) throws IOException {
        TrackingLoader next = open(dir);
        TrackingLoader previous = active;
        active = next;
        previous.close();
    }

    @Override
    public void close() throws IOException {
        active.close();
    }

    public static void main(String[] args) throws Exception {
        Path dir = Path.of("plugins");
        try (PluginSlot slot = new PluginSlot(dir)) {
            TrackingLoader first = slot.active();
            slot.swap(dir);
            System.out.println("swapped: " + (first != slot.active()));
            System.out.println("old closed: " + first.isClosed());
        }
    }
}`,
        annotations: [
          {
            line: 7,
            note: 'The tracking subclass records the close call without changing delegation behavior.',
          },
          {
            line: 23,
            note: 'One active field is the whole lifecycle contract; old generations are not kept in a history list.',
          },
          {
            line: 40,
            note: 'The old loader is closed only after the new one is installed, so the slot never exposes a closed active loader.',
          },
          {
            line: 45,
            note: 'Closing the slot releases the active loader and any jars it holds open.',
          },
          {
            line: 54,
            note: 'The output proves the swap changed the active loader and closed the previous one.',
          },
        ],
      },
      rubric: [
        {
          id: 'single-active-loader',
          check: 'Does the slot keep exactly one active loader with no hidden collection of old ones?',
          detail:
            'The static history list was the leak. A single owner makes the lifecycle inspectable.',
          mustPass: true,
        },
        {
          id: 'close-on-swap',
          check: 'Does swap close the previous loader after installing the next one?',
          detail:
            'Releasing resources on replacement is the core behavior that prevents loader generations from accumulating.',
          mustPass: true,
        },
        {
          id: 'close-on-shutdown',
          check: 'Does AutoCloseable release the active loader?',
          detail:
            'A redeploy-safe component still needs a clean process shutdown and test teardown.',
          mustPass: true,
        },
        {
          id: 'evidence',
          check: 'Does the program print that the old loader was closed?',
          detail:
            'The tracking loader makes an otherwise invisible lifecycle event observable.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac PluginSlot.java` and `java PluginSlot`; expect `swapped: true` and `old closed: true`.',
        'Run twenty swaps under `-Xlog:class+unload=info` in a real host and confirm that old loader generations disappear after collection.',
        'Use `jcmd <pid> VM.metaspace` before and after a redeploy in a long-running host. Metaspace should return near its baseline, not climb monotonically.',
      ],
    },
    recap: [
      'Class unloading happens per defining loader; a reachable loader keeps all of its classes and metadata alive.',
      'Thread context loaders, static fields, plugin-owned executors, and native handles are common retainers.',
      'Metaspace exhaustion after redeploys is evidence of retained loaders, not a reason to raise the ceiling.',
      'Fix the lifecycle: one owner, close on swap, clear context loaders, and verify loader liveness with evidence.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l5.classloader-leak.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l5.loader-reachability'],
      prompt: 'When can a class defined by a plugin loader be unloaded?',
      options: [
        {
          id: 'instances-gone',
          text: 'As soon as the last instance of the class is collected.',
        },
        {
          id: 'loader-unreachable',
          text: 'When its defining class loader becomes unreachable.',
        },
        {
          id: 'metaspace-full',
          text: 'When Metaspace reaches MaxMetaspaceSize.',
        },
        {
          id: 'system-gc',
          text: 'When the application calls System.gc().',
        },
      ],
      correctOptionId: 'loader-unreachable',
      explanation:
        'The loader is the unit of unloading. Instances, static fields, threads, and JNI references can all keep it reachable.',
    },
    {
      id: 'java.l5.classloader-leak.recall.q2',
      type: 'order-the-steps',
      concepts: ['java.l5.metaspace-exhaustion'],
      prompt: 'Put a Metaspace leak investigation in a sensible order.',
      items: [
        {
          id: 'confirm',
          text: 'Confirm Metaspace and loader counts grow across redeploys after collection.',
        },
        {
          id: 'dump',
          text: 'Capture a heap dump and locate an old plugin loader.',
        },
        {
          id: 'trace',
          text: 'Follow incoming references to the retaining thread, static field, or native handle.',
        },
        {
          id: 'fix',
          text: 'Fix the lifecycle and verify that old loaders become collectible.',
        },
      ],
      correctOrder: ['confirm', 'dump', 'trace', 'fix'],
      explanation:
        'Evidence first, then the retainer, then the fix. Changing Metaspace flags before tracing skips the cause.',
    },
    {
      id: 'java.l5.classloader-leak.recall.q3',
      type: 'explain',
      concepts: ['java.l5.thread-context-loader', 'java.l5.loader-reachability'],
      prompt:
        'Why can a single worker thread keep an entire discarded plugin deployment alive?',
      keyPoints: [
        'The Thread object holds a reference to its context class loader.',
        'The context loader can be the plugin loader from the deployment that configured the thread.',
        'A pooled thread can outlive many redeploys, so the loader remains reachable.',
        'The loader keeps its classes, static state, and Metaspace metadata reachable.',
      ],
      modelAnswer:
        'Each Thread has a context class loader field. If a plugin or framework sets that field to the plugin loader and the thread is returned to a long-lived pool without restoring the previous value, the Thread object remains a GC root path to the old loader. The loader in turn reaches its classes and their static state. Because the loader never becomes unreachable, none of that deployment’s classes can unload, and Metaspace keeps growing. Restoring the context loader in a finally block breaks the chain.',
      explanation:
        'Strong answers connect a thread field to loader reachability and then to class metadata, rather than calling it simply “a thread leak.”',
    },
  ],
});
