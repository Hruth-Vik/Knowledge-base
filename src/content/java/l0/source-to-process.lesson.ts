import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.source-to-process',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'from-source-to-process',
    title: 'From Source to a Running Process',
  },
  sequence: 1,
  slug: 'source-to-process',
  title: 'What Actually Runs When You Press Run',
  deck: 'A .java file is a recipe, not the meal. Follow the compiler, the class file, the JVM, and the CPU until main() becomes real work.',
  kind: 'standard',
  estimatedMinutes: 14,
  tags: ['java', 'compilation', 'bytecode', 'jvm', 'memory'],
  concepts: [
    {
      id: 'java.l0.source-to-process',
      title: 'Source-to-process path',
      kind: 'mechanism',
      summary: [
        'The source file is checked and compiled before a program can run.',
        'The JVM loads class files, verifies them, and executes bytecode.',
        'Compilation and runtime are separate environments with separate failures.',
      ],
      aliases: ['compile and run', 'Java program lifecycle'],
      tags: ['java', 'toolchain'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.bytecode',
        },
        {
          type: 'depends-on',
          target: 'java.l0.jvm',
        },
      ],
    },
    {
      id: 'java.l0.bytecode',
      title: 'Bytecode',
      kind: 'term',
      summary: [
        'Bytecode is the portable instruction format stored in a .class file.',
        'It is not native machine code; the JVM translates or compiles it further.',
        'Bytecode keeps Java portable across operating systems and CPU families.',
      ],
      aliases: ['class file instructions', 'JVM instructions'],
      tags: ['java', 'compilation'],
      relations: [
        {
          type: 'implemented-by',
          target: 'java.l0.jvm',
        },
      ],
    },
    {
      id: 'java.l0.jvm',
      title: 'Java Virtual Machine',
      kind: 'mechanism',
      summary: [
        'The JVM loads class files, manages memory, and executes bytecode.',
        'It runs code with an interpreter and compiles hot paths with the JIT.',
        'The JVM is a program running on your machine, not a hardware CPU.',
      ],
      aliases: ['JVM', 'HotSpot'],
      tags: ['java', 'runtime'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.bytecode',
        },
      ],
    },
    {
      id: 'java.l0.stack-and-heap',
      title: 'Stack and heap',
      kind: 'mechanism',
      summary: [
        'Each thread gets a stack; frames hold local values and references.',
        'Objects live on the heap and are reclaimed by the garbage collector.',
        'A local object variable stores a reference, not the object itself.',
      ],
      aliases: ['stack vs heap', 'Java memory areas'],
      tags: ['java', 'memory'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.jvm',
        },
      ],
    },
  ],
  revisits: [],
  versionCaveats: [
    'Examples target Java 21 LTS. The exact erasure, inlining, and escape-analysis decisions belong to the runtime and can change between JVM versions.',
  ],
  references: [
    {
      title: 'Java Language Specification, Chapter 12: Execution',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html',
      note: 'How compilation, loading, linking, and initialization relate.',
    },
    {
      title: 'Java Virtual Machine Specification, Chapter 2: The Structure of the Java Virtual Machine',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html',
      note: 'Bytecode, runtime data areas, frames, and the execution engine.',
    },
  ],
  sections: {
    problem:
      'The editor says **Build succeeded**, then the terminal says **Error: could not find or load main class**. Or the code runs on your laptop and dies on the server with a class-file version error. These are not mysterious. They are different stages of one pipeline reporting different failures.\n\nMost confusion starts with a single wrong picture: that the JVM reads your `.java` file. It does not. `javac` turns source into portable bytecode, and the JVM runs that bytecode. The source file is already gone by the time `main()` executes. Once you can name the stage that failed, the error message stops being noise.',
    analogy: {
      title: 'A play from script to stage',
      body:
        'A playwright writes a script. A director turns it into a prompt book with blocking, cues, and scene changes. On performance night, the stage crew follows the prompt book while the actors perform. The audience never sees the script, and the crew never improvises from it.\n\nThe prompt book is portable in a way the performance is not: a different theatre can stage the same show, but the lighting rig, the room, and the crew still matter.',
      mapping: [
        {
          technical: '`Main.java`',
          everyday: 'The playwright’s script',
        },
        {
          technical: '`javac`',
          everyday: 'The director turning script into a prompt book',
        },
        {
          technical: '`.class` bytecode',
          everyday: 'The prompt book with cues and scene changes',
        },
        {
          technical: 'The JVM',
          everyday: 'The stage crew performing the prompt book',
        },
        {
          technical: 'The CPU',
          everyday: 'The stage, lights, and physical theatre',
        },
      ],
      whereItBreaks:
        'A prompt book describes one performance style. Bytecode is a real instruction set with verification rules, a constant pool, and version numbers. The JVM is not a neutral stage crew either: its version, garbage collector, and JIT compiler change how the same bytecode behaves under load.',
    },
    mentalModel: {
      title: 'Source becomes bytecode; the JVM turns bytecode into work',
      figure: {
        width: 960,
        height: 360,
        caption:
          'Compilation and execution are separate. The compiler checks source and emits class files; the JVM loads, verifies, and executes those files on the host CPU.',
        alt: 'A left-to-right diagram: a Java source file is compiled by javac into a class file containing bytecode. The JVM loads and verifies that class file, then its interpreter and JIT compiler produce native machine instructions for the CPU. A side note shows local variables on a thread stack and objects on the heap.',
        nodes: [
          {
            id: 'source',
            label: 'Main.java',
            detail: 'source you edit',
            x: 18,
            y: 116,
            width: 150,
            height: 88,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'javac',
            label: 'javac',
            detail: 'parse · check · emit',
            x: 216,
            y: 112,
            width: 146,
            height: 96,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'classfile',
            label: 'Main.class',
            detail: 'bytecode + constant pool',
            x: 408,
            y: 100,
            width: 168,
            height: 116,
            shape: 'stack',
            tone: 'accent',
          },
          {
            id: 'jvm',
            label: 'JVM',
            detail: 'load · verify · execute',
            x: 620,
            y: 84,
            width: 160,
            height: 148,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'cpu',
            label: 'CPU',
            detail: 'native instructions',
            x: 820,
            y: 116,
            width: 122,
            height: 88,
            shape: 'circle',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'source',
            to: 'javac',
            label: 'compile',
            kind: 'flow',
          },
          {
            from: 'javac',
            to: 'classfile',
            label: 'emit',
            kind: 'flow',
          },
          {
            from: 'classfile',
            to: 'jvm',
            label: 'load',
            kind: 'flow',
          },
          {
            from: 'jvm',
            to: 'cpu',
            label: 'interpret / JIT',
            kind: 'flow',
          },
        ],
        annotations: [
          {
            x: 18,
            y: 244,
            text: 'Compile-time errors happen here.\nThe source never reaches the JVM.',
          },
          {
            x: 620,
            y: 264,
            text: 'Runtime errors happen here.\nThe class file may be present and still fail.',
          },
          {
            x: 408,
            y: 320,
            text: 'Bytecode is portable, not identical to machine code.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'The pipeline has two environments. `javac` runs on your build machine and has the full source tree. The JVM runs later, with only class files and whatever libraries happen to be on its runtime path. Keep those environments separate and most “it compiled” surprises become explainable.',
      steps: [
        {
          title: 'javac checks the source and emits bytecode',
          body:
            'The compiler parses each source file, resolves names, checks types, and desugars constructs such as enhanced `for` loops and records. It writes one `.class` file per top-level type. That file contains bytecode plus a constant pool of names and literals — not CPU instructions.\n\nThe output is versioned. A class file compiled for Java 21 cannot be loaded by a Java 17 runtime, even if the source uses no new syntax.',
          code: {
            filename: 'compile-and-inspect.sh',
            language: 'bash',
            code: `javac -d out src/Main.java
javap -classpath out -c Main
java -cp out Main`,
            annotations: [
              {
                line: 1,
                note: 'Compilation writes Main.class under out/. The source file is no longer needed to run.',
              },
              {
                line: 2,
                note: 'javap disassembles the class file. This is the instruction stream the JVM consumes.',
              },
              {
                line: 3,
                note: 'The launcher starts a JVM, loads Main.class, and invokes main.',
              },
            ],
          },
        },
        {
          title: 'The JVM loads and verifies the class',
          body:
            'A class loader finds `Main.class`, defines the class, and links it. Verification checks that the bytecode obeys the JVM’s structural rules: operand types, stack shape, branch targets, and access boundaries. A hand-edited or mismatched class file can fail here before any application code runs.\n\nLoading is lazy and separate from initialization. The class-loading lesson follows that path in detail; for this lesson, the important part is that the JVM is working with bytecode and metadata, not your editor buffer.',
        },
        {
          title: 'The execution engine interprets, then compiles hot paths',
          body:
            'The interpreter executes bytecode directly. As methods become hot, the JIT compiler translates them into native machine code for the host CPU. The JVM can also deoptimize code when its assumptions stop holding.\n\nSo “Java is interpreted” and “Java is compiled” are both partly true. The portable artifact is bytecode; the CPU eventually runs machine instructions produced by the interpreter or the JIT.',
        },
        {
          title: 'Stack and heap hold different things',
          body:
            'Each thread has a stack of frames. A frame holds parameters, local variables, and intermediate values. A local variable of type `Order` holds a **reference**; the `Order` object itself lives on the heap. The garbage collector reclaims heap objects that are no longer reachable.\n\nThis distinction explains why copying a list variable does not copy the list, and why a method can return an object after its stack frame disappears.',
          code: {
            filename: 'MemorySketch.java',
            language: 'java',
            code: `final class MemorySketch {
    public static void main(String[] args) {
        int copies = 2;
        Order order = new Order("A-17");
        System.out.println(order.id() + " x " + copies);
    }

    record Order(String id) {}
}`,
            annotations: [
              {
                line: 3,
                note: 'A primitive local lives directly in the stack frame.',
              },
              {
                line: 4,
                note: 'The reference lives on the stack; the Order object is allocated on the heap.',
              },
              {
                line: 8,
                note: 'The record class and its metadata are runtime objects managed by the JVM.',
              },
            ],
          },
        },
      ],
      outro:
        'When something fails, name the environment first: compiler, class loader, verifier, initializer, or running code. That single question rules out half the wrong fixes.',
    },
    code: {
      intro:
        'Start with the smallest possible path from source to output. Then look at what the running process can tell you about its own runtime.',
      minimal: {
        filename: 'Greeting.java',
        language: 'java',
        code: `final class Greeting {
    public static void main(String[] args) {
        String who = args.length > 0 ? args[0] : "world";
        System.out.println("hello, " + who);
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The file name must match the public top-level class name. This class is package-private, but the file is still Greeting.java.',
          },
          {
            line: 2,
            note: 'The launcher looks for this exact signature: public static void main(String[]).',
          },
          {
            line: 3,
            note: 'Command-line arguments arrive as a String array at runtime, not at compile time.',
          },
          {
            line: 4,
            note: 'String concatenation creates a new String. The object lives on the heap.',
          },
        ],
        output: `$ javac Greeting.java
$ java Greeting Ada
hello, Ada`,
      },
      realistic: {
        filename: 'RuntimeFacts.java',
        language: 'java',
        code: `final class RuntimeFacts {
    public static void main(String[] args) {
        System.out.println("runtime " + Runtime.version());
        System.out.println("class " + RuntimeFacts.class.getResource("RuntimeFacts.class"));
        System.out.println("max heap " + Runtime.getRuntime().maxMemory() / (1024 * 1024) + " MiB");
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The program can report the JVM version it is actually running on, which may differ from the build JDK.',
          },
          {
            line: 4,
            note: 'getResource locates the class file through the defining loader. Null means it was generated or loaded from an unusual source.',
          },
          {
            line: 5,
            note: 'maxMemory is a heap ceiling hint, not a promise that this much RAM is free.',
          },
        ],
      },
    },
    breakIt: {
      title: 'The build machine is newer than the runtime',
      scenario:
        'A developer compiles a small service with the default JDK on their laptop, then copies the class files to a server that still runs Java 17. The source is valid Java. The compiler exits successfully. The server fails before `main()` prints anything.',
      brokenCode: {
        filename: 'deploy.sh',
        language: 'bash',
        code: `javac -d out Main.java
java -cp out Main
# java.lang.UnsupportedClassVersionError:
# Main has been compiled by a more recent version
# (class file version 65.0), this version recognizes up to 61.0`,
      },
      predictionPrompt:
        'Which stage failed: compilation, class loading, or application logic? What are the two version numbers telling you?',
      failureKind: 'configuration',
      reveal: {
        observed:
          'The class loader refused `Main.class` before verification or `main()` execution. Class-file version 65 means Java 21; version 61 is Java 17.',
        explanation:
          '`javac` emitted a class file for the compiler’s target version. The server’s JVM only understands class-file versions up to its own release. This is a build/runtime contract failure, not a syntax error and not a missing class. The class file is present and readable; it is simply too new.',
        repair:
          'Make the target explicit. Compile with `--release 17` when the production runtime is Java 17, and run CI on the same major version as production. Do not rely on whatever JDK happens to be first on a developer’s PATH.',
        correctedCode: {
          filename: 'deploy.sh',
          language: 'bash',
          code: `javac --release 17 -d out Main.java
java -cp out Main`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Most bad explanations of Java execution are not random. They collapse two stages into one sentence, which makes the resulting prediction sound precise and wrong.',
      mistakes: [
        {
          title: 'Saying the JVM reads the .java file',
          generatedPattern:
            '“The JVM interprets your Java source line by line, which is why it is slower than C.”',
          whyItFails:
            'The JVM never sees the source file. `javac` emits bytecode in a `.class` file, and the JVM loads that. Source-level syntax errors are caught before the JVM starts.',
          correction:
            'Name the two environments: the compiler checks source and emits bytecode; the JVM loads, verifies, and executes bytecode. Then discuss interpretation and JIT compilation separately.',
          telltale:
            'The explanation cannot say why a deleted `.java` file does not stop an already-built application from running.',
        },
        {
          title: 'Treating “write once, run anywhere” as identical behavior',
          generatedPattern:
            '“The same bytecode behaves exactly the same on every JVM and operating system.”',
          whyItFails:
            'Bytecode is portable, but runtime versions, garbage collectors, JIT decisions, native libraries, file systems, and default encodings still differ. A program can compile once and behave differently under load or on another runtime.',
          correction:
            'Say that bytecode removes the CPU/OS rewrite, not every environmental difference. Pin the runtime, test on the deployment image, and treat native or version-specific behavior explicitly.',
          telltale:
            'The answer promises portability but has no explanation for platform bugs or class-file version errors.',
        },
        {
          title: 'Putting every local variable, including objects, on the stack',
          generatedPattern:
            '“Objects declared inside a method are stored on the stack because they are local.”',
          whyItFails:
            'The local variable slot holds a reference. The object it points to lives on the heap. The JIT may scalar-replace an object that never escapes, but that is an optimization, not the language’s storage model.',
          correction:
            'Separate the reference from the referent: stack frames hold primitive values and references; heap holds objects. Mention escape analysis only as a JIT optimization with no source-level guarantee.',
          telltale:
            'The explanation cannot explain why returning a newly created object is safe after the method returns.',
        },
      ],
      reviewChecklist: [
        'Does the explanation name the compiler and the runtime as separate environments?',
        'Does it say the JVM executes bytecode, not source?',
        'Does it distinguish stack references from heap objects?',
        'Does it explain how a successfully compiled program can still fail at class loading or runtime?',
      ],
    },
    interviewCorner: {
      intro:
        'Answer the pipeline before the error. An interviewer can hear whether you know which environment owns the failure.',
      questions: [
        {
          id: 'java.l0.source-to-process.interview.1',
          difficulty: 'junior',
          question:
            'What happens between running `javac Main.java` and the CPU executing your code?',
          modelAnswer:
            '`javac` parses and type-checks the source, then emits `Main.class` containing bytecode and a constant pool. When the program starts, the JVM locates and defines the class, verifies the bytecode, links it, and initializes static state. Its interpreter executes bytecode, and the JIT compiles hot methods into native instructions that the CPU runs.',
          weakAnswer:
            'The compiler turns Java into binary, and then the computer runs the binary.',
          strongAnswer:
            'Compilation and execution are separate. `javac` produces portable class files, not an executable. The JVM loads and verifies those class files, manages runtime memory, and executes bytecode through an interpreter and JIT. The CPU only ever runs native instructions.',
          followUp:
            'Which of those stages can fail after the build has already succeeded?',
        },
        {
          id: 'java.l0.source-to-process.interview.2',
          difficulty: 'mid',
          question:
            'A program compiles on JDK 21 but fails on a Java 17 server with `UnsupportedClassVersionError`. How do you diagnose and prevent it?',
          modelAnswer:
            'I read the class-file version in the error: 65 means Java 21, 61 means Java 17. The compiler emitted a newer target than the runtime accepts. I check `java -version` and `javac -version` in both environments, then compile with `--release 17` or upgrade the runtime. I make CI use the production major version so the mismatch cannot reach deployment.',
          weakAnswer:
            'The class is missing, so I would copy the JDK onto the server or add the jar again.',
          strongAnswer:
            'This is a build/runtime contract failure, not a missing dependency. I confirm the major versions and the class-file target, align `--release` with the runtime, and add a deployment-image check. I would also verify that CI and production use the same major JDK, not just the same application code.',
          followUp:
            'Why is compiling with an older JDK not the same as compiling with `--release` on a newer JDK?',
        },
        {
          id: 'java.l0.source-to-process.interview.3',
          difficulty: 'senior',
          question:
            'A service deploys cleanly, starts, then throws `NoSuchMethodError` on the first request. Walk through the pipeline and your investigation.',
          modelAnswer:
            'The source compiled against one version of a dependency, but the runtime loaded a class with a different method signature. I read the first caused-by and the missing method descriptor, then inspect the runtime classpath and class-loader topology. I compare the dependency tree used at compile time with the deployed artifact, check for duplicate or shaded jars, and confirm which loader defined the class. The fix is to align the runtime artifact, not to add another jar blindly.',
          weakAnswer:
            'The method is missing from the source, so I would recompile and redeploy everything.',
          strongAnswer:
            'Compilation resolved a symbolic reference against a compile-time type; runtime resolution found a different class definition. I trace the defining loader, the artifact that supplied it, and the dependency version in the built image. I reproduce with the exact deployed classpath and then make the packaging deterministic.',
          followUp:
            'How would you make the next dependency conflict visible before production?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a runtime fact sheet',
      brief:
        'Write a tiny Java 21 program that proves the pipeline from the inside. One class holds observable setup; a separate `FactSheet` class starts the JVM and prints facts about the runtime it actually got. The exercise is about distinguishing compiler output from runtime evidence, not about memorizing flags.',
      constraints: [
        'Use Java 21 and two top-level classes in one file, with `FactSheet` containing `main`.',
        'Give the probe class a static field initializer, a static block, and a constructor that each print a distinct line.',
        'Print `Runtime.version()` and the location of the probe’s class resource.',
        'Create one probe instance and explain why the static lines appear before the constructor.',
        'Compile with an explicit `--release` target and state which class-file version that target produces.',
      ],
      starterCode: {
        filename: 'FactSheet.java',
        language: 'java',
        code: `final class Probe {
    // Add static setup and a constructor that print distinct lines.
}

final class FactSheet {
    public static void main(String[] args) {
        // Print runtime facts, then create one Probe.
    }
}`,
      },
      referenceSolution: {
        filename: 'FactSheet.java',
        language: 'java',
        code: `final class Probe {
    static final int VALUE = announce("field");
    static { System.out.println("static block"); }

    Probe() { System.out.println("constructor"); }

    static int announce(String label) {
        System.out.println(label);
        return 1;
    }
}

final class FactSheet {
    public static void main(String[] args) {
        System.out.println("runtime " + Runtime.version());
        System.out.println("probe class " + Probe.class.getResource("Probe.class"));
        System.out.println("max heap bytes " + Runtime.getRuntime().maxMemory());

        System.out.println("before instance");
        new Probe();
        System.out.println("after instance");
    }
}`,
        annotations: [
          {
            line: 2,
            note: 'Static field initialization and static blocks run in textual order, once per defining loader.',
          },
          {
            line: 5,
            note: 'The constructor runs after class initialization has completed.',
          },
          {
            line: 16,
            note: 'Runtime.version describes the executing JVM, which can differ from the JDK used to compile.',
          },
          {
            line: 17,
            note: 'The class resource is resolved through the defining loader; a null result is evidence worth investigating.',
          },
          {
            line: 21,
            note: 'Creating the first instance is an active use that triggers Probe initialization.',
          },
        ],
      },
      rubric: [
        {
          id: 'separate-probe',
          check: 'Does a separate Probe class keep the main class’s initialization out of the experiment?',
          detail:
            '`FactSheet` is initialized before `main` runs. The probe must live elsewhere for the printed order to mean anything.',
          mustPass: true,
        },
        {
          id: 'runtime-evidence',
          check: 'Does the program print the executing JVM version and class resource location?',
          detail:
            'Those are runtime facts. A build log cannot substitute for what the loaded program reports.',
          mustPass: true,
        },
        {
          id: 'initialization-order',
          check: 'Does the output show field initializer, static block, then constructor?',
          detail:
            'Textual order controls the two static lines; the constructor follows class initialization.',
          mustPass: true,
        },
        {
          id: 'explanation',
          check: 'Does the written explanation separate compiler output from runtime behavior?',
          detail:
            'A strong answer names the class-file target, the executing JVM, and the first active use that triggered initialization.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile with `javac --release 21 -d out FactSheet.java` and run `java -cp out FactSheet`.',
        'Run `javap -classpath out -c -p Probe` and find the static initializer method.',
        'Change the `--release` target to 17 and confirm the compiler rejects any Java 21-only syntax you introduce.',
      ],
    },
    recap: [
      '`javac` checks source and emits versioned class files containing bytecode; the JVM executes those files, not the source.',
      'Loading, verification, linking, and initialization happen at runtime and can fail even after a clean build.',
      'The interpreter and JIT turn bytecode into native CPU work; “interpreted” and “compiled” both describe parts of Java execution.',
      'Stack frames hold primitives and references; heap objects are managed by the garbage collector.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.source-to-process.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l0.source-to-process'],
      prompt: 'Which artifact does the JVM actually load and execute?',
      options: [
        {
          id: 'source-file',
          text: 'The `.java` source file, interpreted one line at a time.',
        },
        {
          id: 'class-file',
          text: 'The `.class` file containing bytecode and a constant pool.',
        },
        {
          id: 'native-binary',
          text: 'A native executable emitted by `javac`.',
        },
        {
          id: 'build-log',
          text: 'The compiler’s build log, replayed by the launcher.',
        },
      ],
      correctOptionId: 'class-file',
      explanation:
        '`javac` emits class files. The JVM defines, verifies, and executes the bytecode inside them; it never reads the original source.',
    },
    {
      id: 'java.l0.source-to-process.recall.q2',
      type: 'order-the-steps',
      concepts: ['java.l0.source-to-process', 'java.l0.bytecode'],
      prompt:
        'Put the successful path from source to CPU work in order.',
      items: [
        {
          id: 'compile',
          text: '`javac` checks the source and emits a `.class` file.',
        },
        {
          id: 'load',
          text: 'The JVM finds and defines the class under a class loader.',
        },
        {
          id: 'verify',
          text: 'The JVM verifies and links the bytecode.',
        },
        {
          id: 'execute',
          text: 'The interpreter or JIT executes native instructions on the CPU.',
        },
      ],
      correctOrder: ['compile', 'load', 'verify', 'execute'],
      explanation:
        'Compilation precedes runtime. Loading and linking prepare the class; execution produces native work only after verification succeeds.',
    },
    {
      id: 'java.l0.source-to-process.recall.q3',
      type: 'explain',
      concepts: ['java.l0.stack-and-heap'],
      prompt:
        'A method creates an object in a local variable and returns it. The method’s stack frame disappears. Why is the returned object still usable?',
      keyPoints: [
        'The local variable holds a reference; the object itself lives on the heap.',
        'Returning the reference copies the reference, not the object.',
        'The object stays alive while it remains reachable; the garbage collector reclaims it later.',
      ],
      modelAnswer:
        'The stack frame contains the local variable slot, which stores a reference to an object allocated on the heap. Returning the object returns that reference to the caller. The original frame can disappear without destroying the heap object. As long as the caller or another live structure can reach the object, the garbage collector keeps it alive.',
      explanation:
        'Strong answers separate the reference from the referent and mention reachability rather than “the stack is deleted, so the object is deleted.”',
    },
  ],
});
