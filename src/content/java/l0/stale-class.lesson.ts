import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.stale-class',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'from-source-to-process',
    title: 'From Source to a Running Process',
  },
  sequence: 4,
  slug: 'stale-class',
  title: 'The Deploy That Ran Yesterday’s Code',
  deck: 'The new JAR was on the server and the old class still ran. Classpath order and class identity explain the impossible deploy.',
  kind: 'incident-story',
  estimatedMinutes: 13,
  tags: ['classpath', 'packaging', 'class-loading', 'incident', 'deployment'],
  concepts: [
    {
      id: 'java.l0.classpath-order',
      title: 'Classpath order',
      kind: 'mechanism',
      summary: [
        'The classpath is an ordered list of directories, JARs, and modules.',
        'The first definition of a class name on that path wins.',
        'A wildcard expands to JARs, but the expansion order is not specified.',
      ],
      aliases: ['class path', '-cp', 'JAR search order'],
      tags: ['java', 'toolchain'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.jvm',
        },
      ],
    },
    {
      id: 'java.l0.class-identity',
      title: 'Class identity',
      kind: 'principle',
      summary: [
        'A loaded class is identified by its binary name and defining class loader.',
        'Two files with the same name do not merge; one definition shadows the other.',
        'The same name loaded by two loaders produces two distinct types.',
      ],
      aliases: ['defining loader', 'duplicate class', 'shadowed JAR'],
      tags: ['java', 'class-loading'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.classpath-order',
        },
        {
          type: 'depends-on',
          target: 'java.l0.bytecode',
        },
      ],
    },
    {
      id: 'java.l0.stale-artifact',
      title: 'Stale artifact',
      kind: 'failure-mode',
      summary: [
        'A deploy can succeed while an older class file remains earlier on the path.',
        'Build caches, image layers, and duplicate JARs can preserve the old bytecode.',
        'The loaded code source, not the deploy timestamp, is the evidence.',
      ],
      aliases: ['old JAR', 'cached image', 'duplicate dependency'],
      tags: ['java', 'deployment', 'bugs'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.class-identity',
        },
      ],
    },
  ],
  revisits: ['java.l0.source-to-process', 'java.l0.bytecode', 'java.l0.jvm'],
  versionCaveats: [
    'Examples target Java 21 LTS. The Java launcher documents that the order of JAR files expanded from a classpath wildcard is not specified; do not rely on it for version selection.',
    'Application servers and frameworks may add their own class loaders and parent-first or child-first delegation. The same first-match principle applies, but the effective order includes their configuration.',
  ],
  references: [
    {
      title: 'Java Launcher: class path and wildcards',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html',
      note: 'The -classpath option, JAR wildcard expansion, and the warning that expansion order is unspecified.',
    },
    {
      title: 'Java SE 21 API: ClassLoader',
      url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html',
      note: 'Delegation, defining loaders, and the relationship between a class name and a loaded class.',
    },
    {
      title: 'Java Virtual Machine Specification: Loading, Linking, and Initializing',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html',
      note: 'When loading happens and how a class is created from a binary name.',
    },
  ],
  sections: {
    problem:
      'A release adds a new pricing rule and changes one log line. The pipeline is green, the new JAR has the expected checksum, and the deploy reports success. Production still applies the old rule and prints the old message. A restart does not help. A rollback of the deploy does not change anything either.\n\nThe class is present. The code is simply not the code that was packaged last. The JVM found a different file with the same binary name earlier on its search path, and it has no reason to prefer the newer one. Until you ask the loaded class where it came from, the deploy dashboard and the running process are describing different artifacts.',
    analogy: {
      title: 'Two editions of the prompt book',
      body:
        'A theatre keeps two editions of the prompt book for the same play. The stage manager grabs the first binder on the shelf, opens it to the requested scene, and the crew performs that blocking. The performance is coherent; it is simply an older production.\n\nThe title of the scene is the class name. The binder is a classpath entry. The stage manager is the class loader, and “first binder on the shelf” is the search order. Adding a newer binder does not help if the older one is still first.',
      mapping: [
        {
          technical: 'A fully qualified class name',
          everyday: 'The name of the scene',
        },
        {
          technical: 'A directory or JAR on the classpath',
          everyday: 'A binder on the shelf',
        },
        {
          technical: 'A class loader resolving a name',
          everyday: 'The stage manager choosing a binder',
        },
        {
          technical: 'Classpath order',
          everyday: 'The order of binders on the shelf',
        },
        {
          technical: 'A shadowed duplicate class',
          everyday: 'A newer scene that is never opened',
        },
      ],
      whereItBreaks:
        'A stage manager might compare editions and choose the newest. The JVM uses the first definition it finds for a given loader; it does not inspect version numbers or file timestamps. Loading is also lazy and happens once per loader, not for the whole play at once. Two different loaders can each define their own copy of the same name, which the single-shelf analogy cannot show.',
    },
    mentalModel: {
      title: 'The first definition wins',
      figure: {
        width: 960,
        height: 360,
        caption:
          'The launcher searches classpath entries in order. The first file that defines com.acme.Pricing is loaded; a later copy with the same name is shadowed. The class+load log names the winner.',
        alt: 'A launch classpath points first to an old pricing JAR and later to app.jar. The old JAR defines com.acme.Pricing in the app class loader, while the new class is shadowed. A class-load log records the old JAR as the source.',
        nodes: [
          {
            id: 'launch',
            label: 'launch classpath',
            detail: 'ordered search path',
            x: 16,
            y: 32,
            width: 184,
            height: 80,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'jar-old',
            label: 'lib/pricing-1.4.jar',
            detail: 'Pricing v1',
            x: 236,
            y: 24,
            width: 204,
            height: 92,
            shape: 'cylinder',
            tone: 'warning',
          },
          {
            id: 'jar-new',
            label: 'app.jar',
            detail: 'Pricing v2, shadowed',
            x: 236,
            y: 148,
            width: 204,
            height: 92,
            shape: 'cylinder',
            tone: 'muted',
          },
          {
            id: 'loader',
            label: 'app class loader',
            detail: 'defines one Pricing',
            x: 484,
            y: 72,
            width: 184,
            height: 100,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'class',
            label: 'com.acme.Pricing',
            detail: 'v1 is running',
            x: 712,
            y: 72,
            width: 184,
            height: 100,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'evidence',
            label: 'class+load log',
            detail: 'names the winning JAR',
            x: 712,
            y: 220,
            width: 184,
            height: 84,
            shape: 'note',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'launch',
            to: 'jar-old',
            label: 'search first',
            kind: 'flow',
          },
          {
            from: 'launch',
            to: 'jar-new',
            label: 'search later',
            kind: 'flow',
          },
          {
            from: 'jar-old',
            to: 'loader',
            label: 'defines',
            kind: 'flow',
          },
          {
            from: 'jar-new',
            to: 'loader',
            label: 'shadowed',
            kind: 'contrast',
          },
          {
            from: 'loader',
            to: 'class',
            label: 'one type',
            kind: 'flow',
          },
          {
            from: 'class',
            to: 'evidence',
            label: 'trace',
            kind: 'depends',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 316,
            text: 'Same binary name, two files.',
          },
          {
            x: 484,
            y: 316,
            text: 'The first match per loader wins.',
          },
          {
            x: 712,
            y: 316,
            text: 'Verify the loaded artifact, not the deploy log.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Follow the launch command from the classpath string to the loaded class. Then see why a successful deploy can leave an older file in front.',
      steps: [
        {
          title: 'The classpath is a search order, not a set',
          body:
            '`-cp` or `-classpath` supplies directories, JAR files, and (on modern Java) modules. When the JVM needs a class, it asks the relevant loader, which searches its delegation parents and its own path. The first definition it finds for the binary name is the one it uses.\n\nA wildcard such as `lib/*` expands to the JARs in that directory, but the Java launcher does not specify the expansion order. Two hosts can therefore resolve the same command differently. Explicit paths or a single shaded artifact remove that ambiguity.',
          code: {
            filename: 'launch.sh',
            language: 'bash',
            code: `#!/usr/bin/env bash
set -euo pipefail
APP_HOME=/srv/pricing
exec java \\
  -Xlog:class+load=info \\
  -cp "$APP_HOME/lib/*:$APP_HOME/app.jar" \\
  com.acme.pricing.Main`,
            annotations: [
              {
                line: 5,
                note: 'The wildcard is convenient, but the launcher does not guarantee the order of the JARs it expands to.',
              },
              {
                line: 6,
                note: 'The first matching definition of com.acme.pricing.Main is the entry point that runs.',
              },
              {
                line: 7,
                note: 'The class+load log records which JAR supplied each loaded class.',
              },
            ],
          },
        },
        {
          title: 'Loading is lazy and cached per loader',
          body:
            'A class is loaded when the program first needs it: constructing an instance, reading a static field, calling a static method, or resolving a reference from another class. The loader checks its already-loaded classes first. Once a class is defined, the same loader returns the same `Class` object for that name.\n\nThis caching is why replacing a JAR under a running process does not change the code. The old definition is already loaded. It is also why a redeploy must start a new process or create a new loader; copying a file into a running application is not a class update.',
          code: {
            filename: 'Origin.java',
            language: 'java',
            code: `final class Origin {
    public static void main(String[] args) {
        Class<?> type = Origin.class;
        var source = type.getProtectionDomain().getCodeSource();
        System.out.println(type.getName());
        System.out.println(source == null ? "bootstrap" : source.getLocation());
    }
}`,
            annotations: [
              {
                line: 3,
                note: 'Referencing Origin.class triggers the application class loader.',
              },
              {
                line: 4,
                note: 'The code source identifies the JAR or directory that supplied the definition.',
              },
              {
                line: 6,
                note: 'This is runtime evidence, not a build-file guess.',
              },
            ],
            output: `Origin
file:/srv/pricing/lib/pricing-1.4.jar`,
          },
        },
        {
          title: 'A fat JAR can contain both versions',
          body:
            'A shaded or “fat” JAR merges dependency classes into one archive. If the build includes two versions of the same library, the archive can contain duplicate entries for one class path. Extraction tools may overwrite one with the other, or the archive may keep the first entry. Either way, the file that runs is the one the loader sees, not necessarily the version the dependency tree selected.\n\nShading can also relocate packages to avoid collisions. That is a real fix when two libraries must coexist. It is not the same as excluding the old dependency from the runtime image.',
          code: {
            filename: 'duplicates.sh',
            language: 'bash',
            code: `#!/usr/bin/env bash
set -euo pipefail
jar tf app.jar | grep 'com/acme/pricing/Pricing.class'
unzip -p app.jar META-INF/MANIFEST.MF
sha256sum app.jar`,
            annotations: [
              {
                line: 3,
                note: 'This prints every archive entry with the class path; duplicates appear more than once.',
              },
              {
                line: 4,
                note: 'The manifest can name a class path or a main class that points at another artifact.',
              },
              {
                line: 5,
                note: 'A digest identifies the artifact you actually deployed.',
              },
            ],
          },
        },
        {
          title: 'A deploy can keep the old artifact in front',
          body:
            'Pipelines fail in ordinary ways: a cached image layer still contains last week’s JAR, a launch script points at a versioned directory that was not updated, an application server exposes a shared library before the application’s own, or a rollback restores the old script while leaving the new file. The deploy log says what the pipeline intended; the process says what it loaded.\n\nCompare the running code source with the artifact digest the pipeline published. If they differ, fix the packaging or launch order. Increasing the version number in a comment does not change which file the loader finds.',
          code: {
            filename: 'evidence.sh',
            language: 'bash',
            code: `#!/usr/bin/env bash
set -euo pipefail
java -Xlog:class+load=info -cp "$APP_HOME/lib/*:$APP_HOME/app.jar" \\
  com.acme.pricing.Main 2>&1 | grep 'com.acme.pricing.Pricing'
sha256sum "$APP_HOME/app.jar"
sha256sum "$APP_HOME/lib/pricing-1.4.jar"`,
            annotations: [
              {
                line: 3,
                note: 'Run the same launch shape as production so the observed loader order matches.',
              },
              {
                line: 4,
                note: 'The log line names the source that actually defined the class.',
              },
              {
                line: 5,
                note: 'Compare the running artifact with the one the release published.',
              },
              {
                line: 6,
                note: 'A second copy on the path is now visible instead of inferred.',
              },
            ],
          },
        },
      ],
      outro:
        'The deploy is a sequence of file copies and a launch command. The running program is the result of one loader’s search order. Those are different facts, and only the second one explains behavior.',
    },
    code: {
      intro:
        'Ask a loaded class for its code source, then reproduce the launch shape that puts two versions on one search path.',
      minimal: {
        filename: 'Origin.java',
        language: 'java',
        code: `final class Origin {
    public static void main(String[] args) {
        var source = Origin.class.getProtectionDomain().getCodeSource();
        System.out.println(source.getLocation());
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The protection domain records where this definition came from.',
          },
          {
            line: 4,
            note: 'The location is a file URL to the directory or JAR that supplied the class.',
          },
        ],
        output: `file:/srv/pricing/lib/pricing-1.4.jar`,
      },
      realistic: {
        filename: 'launch.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail
APP_HOME=/srv/pricing
CP="$APP_HOME/lib/*:$APP_HOME/app.jar"
exec java -Xlog:class+load=info -cp "$CP" com.acme.pricing.Main`,
        annotations: [
          {
            line: 3,
            note: 'APP_HOME pins the runtime image location instead of relying on the working directory.',
          },
          {
            line: 4,
            note: 'The wildcard and the application JAR share one search path; a duplicate class will be resolved by order.',
          },
          {
            line: 5,
            note: 'The class+load log is the runtime record of which file won.',
          },
        ],
      },
    },
    breakIt: {
      title: 'The release that behaved differently on two hosts',
      scenario:
        'A pricing library is packaged twice: `pricing-1.4.jar` in the shared library directory and `pricing-2.0.jar` inside the application JAR. The launch script uses `lib/*` followed by the application JAR. After a base-image update, one host applies the new pricing rule and another applies the old one. The deploy reports the same version on both.',
      brokenCode: {
        filename: 'launch.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail
APP_HOME=/srv/pricing
exec java -cp "$APP_HOME/lib/*:$APP_HOME/app.jar" \\
  com.acme.pricing.Main`,
      },
      predictionPrompt:
        'Both hosts have both JARs. Why can they load different versions, and which file should you inspect to prove it?',
      failureKind: 'configuration',
      reveal: {
        observed:
          '`-Xlog:class+load=info` shows `com.acme.pricing.Pricing` loaded from `lib/pricing-1.4.jar` on one host and from `app.jar` on the other. The application reports the same release version on both.',
        explanation:
          'The wildcard expands to both library JARs, but the launcher does not specify their order relative to each other or to the explicit application JAR. Whichever definition the application loader finds first becomes the class for that process. The other copy is shadowed. The release label comes from the application metadata, not from the loaded pricing class, so it cannot reveal the split.',
        repair:
          'Make the runtime classpath deterministic and free of duplicate definitions. Remove the old library from the image, use explicit paths, or shade and relocate the dependency so two versions cannot collide. Add a startup check or a test that prints the code source for critical classes, and fail the release if it is not the expected artifact.',
        correctedCode: {
          filename: 'launch.sh',
          language: 'bash',
          code: `#!/usr/bin/env bash
set -euo pipefail
APP_HOME=/srv/pricing
CP="$APP_HOME/app.jar"
exec java -Xlog:class+load=info -cp "$CP" com.acme.pricing.Main`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Classpath incidents produce fixes that feel plausible because they operate on the build. The runtime is a separate artifact with its own evidence.',
      mistakes: [
        {
          title: 'Treating the dependency tree as the runtime classpath',
          generatedPattern:
            '“`mvn dependency:tree` shows only version 2.0, so the server must be loading 2.0.”',
          whyItFails:
            'The dependency tree describes the build’s resolved graph. The runtime image can contain an extra JAR, a shaded copy, an application-server library, or a launch script that adds a path. None of those are guaranteed to appear in the tree.',
          correction:
            'Inspect the loaded class’s code source in the running process. Compare the effective classpath, the image contents, and the artifact digest. Use the build graph to explain how a duplicate could have entered, not to prove what is loaded.',
          telltale:
            'A version conclusion based only on a build tool report while the runtime host has a `lib` directory or a shared container.',
        },
        {
          title: 'Assuming the newest JAR wins',
          generatedPattern:
            '“The new JAR is first in the directory and has a later timestamp, so the JVM will use it.”',
          whyItFails:
            'The loader uses the first class definition it finds in its search order. It does not compare JAR versions or file timestamps. A wildcard’s expansion order is not specified, and directory listings are not a version policy.',
          correction:
            'Remove duplicates or make the order explicit and tested. If two versions must coexist, isolate them with distinct class loaders or relocated packages.',
          telltale:
            'A launch command that relies on `lib/*` containing exactly one version, with no check that the duplicate is gone.',
        },
        {
          title: 'Thinking two same-named classes merge',
          generatedPattern:
            '“Both JARs contain `Pricing`, so the JVM combines the methods from each one.”',
          whyItFails:
            'A class definition is selected as a whole. Methods from a shadowed class file do not merge into the loaded one. Two definitions with the same name can exist only in different defining loaders, where they are distinct types and can cause cast or linkage errors.',
          correction:
            'Treat duplicate class names as a packaging conflict. Keep one definition per loader, or deliberately isolate versions with separate loaders and understand the type boundary.',
          telltale:
            'A `ClassCastException` saying two objects with the same class name are incompatible, or behavior that matches neither source file exactly.',
        },
        {
          title: 'Fixing it by deleting target/ locally',
          generatedPattern:
            '“Run a clean build and redeploy; that will replace the old class.”',
          whyItFails:
            'A local clean build does not remove a cached CI layer, a shared library in the runtime image, or a launch script that still points at the old path. The deployed artifact can remain untouched while the local build succeeds.',
          correction:
            'Verify the artifact digest and the loaded code source in the target environment. Rebuild the image or deployment unit from a known input, and prove that the old file is absent.',
          telltale:
            'A fix that only changes the developer’s working directory while production still runs the old path.',
        },
      ],
      reviewChecklist: [
        'Does the runtime image contain exactly one definition of each critical class?',
        'Is the classpath order explicit, or is it hidden behind an unspecified wildcard?',
        'Does a startup check print the code source or digest of the version-sensitive classes?',
        'Does the release verification compare the deployed artifact with the running process?',
        'Are duplicates isolated by loader or relocation rather than assumed to merge?',
      ],
    },
    interviewCorner: {
      intro:
        'The useful answer traces the class from a name to a file and a loader. “It deployed successfully” is not evidence about runtime behavior.',
      questions: [
        {
          id: 'java.l0.stale-class.interview.1',
          difficulty: 'junior',
          question: 'What happens if the same class appears in two JARs on the classpath?',
          modelAnswer:
            'The class loader searches its classpath in order. The first definition it finds for the binary name is the one it loads. The second copy is shadowed and does not merge with the first. If the two copies are loaded by different class loaders, they are different runtime types even though they have the same name. You can see which file won with `-verbose:class` or `-Xlog:class+load`.',
          weakAnswer:
            'The JVM picks the newer one, or it merges the two class files.',
          strongAnswer:
            'A class name is resolved by a defining loader. That loader’s search order decides which file defines the type; later copies are invisible unless another loader defines the same name separately. This is why duplicate dependencies can produce behavior that matches an older source file while the deploy metadata says otherwise. I would inspect the code source rather than trust file timestamps.',
          followUp: 'Why can the same class name produce a ClassCastException in a plugin system?',
        },
        {
          id: 'java.l0.stale-class.interview.2',
          difficulty: 'mid',
          question:
            'You deployed a new JAR, but production still runs the old logic. Walk through your diagnosis.',
          modelAnswer:
            'I would first confirm the running process and the artifact it actually loaded. I would print the code source for the class that owns the old behavior, inspect the effective classpath, and look for duplicate JARs or a shadowing application-server library. I would compare the deployed artifact’s digest with the release artifact and check the launch script and image layers. If the old class is earlier on the path, I would remove it or make the path explicit, then restart the process and repeat the same check. I would not assume a restart alone changed anything.',
          weakAnswer:
            'Restart the service and clear the build cache; the new JAR should take over.',
          strongAnswer:
            'I would treat the deploy log and the process as separate evidence. The class+load log tells me which file defined the class, and the code source or digest confirms the artifact. Then I would trace how that file entered the runtime image: a shared library, a fat JAR duplicate, a cached layer, or a launch script. The fix is to remove the ambiguity and verify the loaded source again, not merely to redeploy the same layout.',
          followUp: 'What would you add to the startup sequence so this cannot recur silently?',
        },
        {
          id: 'java.l0.stale-class.interview.3',
          difficulty: 'senior',
          question:
            'How would you design a release process that makes classpath shadowing and stale artifacts detectable?',
          modelAnswer:
            'I would make the runtime artifact explicit and reproducible: one application image, a lockfile or resolved dependency graph, and a deterministic classpath with no shared duplicate libraries. I would publish a digest and record it in the release metadata. At startup, I would log the code source or digest for a small set of version-sensitive classes and fail readiness if it does not match. In CI, I would scan the packaged image for duplicate class entries and test the launch command in the same shape as production. For plugin systems, I would isolate versions with explicit class loaders and test the type boundary, because two loaders can legitimately define the same name.',
          weakAnswer:
            'Use the latest version of every dependency and rely on the build tool to resolve conflicts.',
          strongAnswer:
            'Resolution is not deployment. I would verify the final image contents, not just the build graph, and make the effective order observable. A startup assertion on code source, duplicate-class scanning, and an immutable artifact digest turn a silent shadow into a failed release with a clear owner. The design should also state which components are allowed to share a loader, because loader isolation changes type identity.',
          followUp: 'What is the trade-off between shading dependencies and isolating them with class loaders?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a class-origin reporter',
      brief:
        'Write a small command-line tool that prints the code source for each class name passed as an argument. Then use it to prove which copy of a duplicated class is loaded when two directories or JARs are placed on the classpath in a chosen order. The output should be useful in a release check, not just a one-off experiment.',
      constraints: [
        'Accept one or more fully qualified class names as command-line arguments.',
        'Load each class without initializing its static state if possible; explain the choice.',
        'Print the class name and its code source location, with a clear fallback for bootstrap classes.',
        'Handle a missing class with a useful message and continue to the remaining names.',
        'Run the program once with two classpath entries that contain different versions of the same test class.',
        'Explain in the output or a comment why the first entry wins for one loader.',
      ],
      starterCode: {
        filename: 'ClassOrigin.java',
        language: 'java',
        code: `final class ClassOrigin {
    static void printOrigin(String name) {
        // Resolve the class and print where it came from.
    }

    public static void main(String[] args) {
        for (String name : args) {
            printOrigin(name);
        }
    }
}`,
      },
      referenceSolution: {
        filename: 'ClassOrigin.java',
        language: 'java',
        code: `final class ClassOrigin {
    static void printOrigin(String name) {
        try {
            Class<?> type = Class.forName(name, false, ClassOrigin.class.getClassLoader());
            var source = type.getProtectionDomain().getCodeSource();
            String location = source == null ? "bootstrap" : source.getLocation().toString();
            System.out.println(name + " <- " + location);
        } catch (ClassNotFoundException error) {
            System.out.println(name + " <- not found");
        }
    }

    public static void main(String[] args) {
        for (String name : args) {
            printOrigin(name);
        }
    }
}`,
        annotations: [
          {
            line: 4,
            note: 'The false flag avoids running static initializers just to report a location.',
          },
          {
            line: 5,
            note: 'The code source is the JAR or directory that defined the loaded class.',
          },
          {
            line: 6,
            note: 'Bootstrap classes have no application code source, so the fallback is explicit.',
          },
          {
            line: 15,
            note: 'Every requested class is reported, including the ones that are missing.',
          },
        ],
      },
      rubric: [
        {
          id: 'code-source',
          check: 'Does the tool print the code source for a loaded application class?',
          detail:
            'The code source is runtime evidence of the defining artifact, unlike a deploy timestamp or a build report.',
          mustPass: true,
        },
        {
          id: 'missing-class',
          check: 'Does a missing class produce a clear message without aborting the remaining names?',
          detail:
            'A release check should report all requested classes, including the ones that reveal a packaging mistake.',
          mustPass: true,
        },
        {
          id: 'duplicate-experiment',
          check: 'Does the write-up show two classpath entries containing the same name and identify the winner?',
          detail:
            'The experiment must connect the tool’s output to the loader’s first-match rule.',
          mustPass: true,
        },
        {
          id: 'loader-explanation',
          check: 'Does the explanation distinguish a shadowed copy from a class defined by another loader?',
          detail:
            'A duplicate on one loader is shadowed; the same name on two loaders is two types. Both are packaging issues but not the same runtime behavior.',
          mustPass: false,
        },
      ],
      verification: [
        'Create two directories with a test class of the same fully qualified name but different behavior. Put both on the classpath in a chosen order and run `ClassOrigin` against that name.',
        'Reverse the classpath order and run again. Confirm that the reported code source changes and that the first entry wins each time.',
        'Add a name that does not exist and confirm the tool reports it while still printing the other results.',
      ],
    },
    recap: [
      'A classpath is an ordered search path; a loader uses the first definition it finds for a name.',
      'A class is identified by its binary name and defining loader, not by a JAR filename or timestamp.',
      'Build caches, image layers, fat JARs, and shared libraries can leave an older definition in front.',
      'The loaded code source or class+load log is the evidence; a successful deploy is not.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.stale-class.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l0.classpath-order', 'java.l0.class-identity'],
      prompt: 'Two JARs on one application classpath contain the same fully qualified class. Which definition is used?',
      options: [
        {
          id: 'newest',
          text: 'The JAR with the newest file timestamp.',
        },
        {
          id: 'first',
          text: 'The first definition the loader finds in its search order.',
        },
        {
          id: 'merged',
          text: 'The two class files are merged method by method.',
        },
        {
          id: 'error',
          text: 'The JVM refuses to start with a duplicate-class error.',
        },
      ],
      correctOptionId: 'first',
      explanation:
        'One loader defines one class per binary name. The first definition it finds wins; the later copy is shadowed. Version numbers and timestamps are not part of the decision.',
    },
    {
      id: 'java.l0.stale-class.recall.q2',
      type: 'order-the-steps',
      concepts: ['java.l0.stale-artifact', 'java.l0.classpath-order'],
      prompt: 'Put a useful stale-class investigation in order.',
      items: [
        {
          id: 'reproduce',
          text: 'Reproduce the behavior with the production launch shape and enable class-load logging.',
        },
        {
          id: 'source',
          text: 'Identify the JAR or directory that supplied the loaded class.',
        },
        {
          id: 'path',
          text: 'Inspect the effective classpath and image for a duplicate or earlier copy.',
        },
        {
          id: 'fix',
          text: 'Remove the ambiguity, restart, and verify the same class source again.',
        },
      ],
      correctOrder: ['reproduce', 'source', 'path', 'fix'],
      explanation:
        'First observe which definition actually loaded, then explain how it got in front. Removing files without that evidence can leave the same order in place.',
    },
    {
      id: 'java.l0.stale-class.recall.q3',
      type: 'explain',
      concepts: ['java.l0.stale-artifact', 'java.l0.class-identity'],
      prompt:
        'Why is a successful deploy not evidence that the new class is running? Describe the check you would use instead.',
      keyPoints: [
        'A deploy copies files and starts a process; it does not prove which file a loader finds.',
        'The loader uses the first matching definition for a name and caches it for that loader.',
        'A stale image layer, shared library, fat JAR, or launch script can leave an older copy earlier on the path.',
        'The loaded code source or class+load log identifies the actual defining artifact.',
      ],
      modelAnswer:
        'The deploy reports what the pipeline copied and which process it started. The behavior comes from the class definition the loader resolves at runtime. If an older JAR is earlier on the classpath, that definition wins and the new one is shadowed; replacing a file under a running process does not change an already loaded class either. I would inspect the code source or the class+load log for the class that owns the behavior, compare it with the release artifact digest, and check the image and launch path for duplicates. The fix is verified by repeating that check after a restart.',
      explanation:
        'Strong answers separate deployment intent from runtime resolution and name the loader’s first-match rule. A version string in the application metadata does not prove which class file is executing.',
    },
  ],
});
