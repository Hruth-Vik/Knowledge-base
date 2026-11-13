import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l5.class-loading',
  language: 'java',
  levelId: 'java.l5',
  chapter: {
    id: 'jvm-runtime',
    title: 'How the JVM Runs Code',
  },
  sequence: 1,
  slug: 'class-loading',
  title: 'How a Class Enters the JVM',
  deck: 'A .class file is not running code. Follow loading, linking, and initialization until main() can execute.',
  kind: 'standard',
  estimatedMinutes: 18,
  tags: ['jvm', 'class-loading', 'bytecode', 'initialization'],
  concepts: [
    {
      id: 'java.l5.class-loading',
      title: 'Class loading',
      kind: 'mechanism',
      summary: [
        'The JVM finds a binary class by name and defines it for a class loader.',
        'Loading, linking, and initialization are separate stages.',
        'A class is initialized on first active use, not when the file is read.',
      ],
      aliases: ['loading a class'],
      tags: ['jvm', 'runtime'],
      relations: [
        {
          type: 'implemented-by',
          target: 'java.l5.class-loader-delegation',
        },
      ],
    },
    {
      id: 'java.l5.class-loader-delegation',
      title: 'Class loader delegation',
      kind: 'mechanism',
      summary: [
        'A loader asks its parent before trying to define a class itself.',
        'The defining loader becomes part of the runtime class identity.',
        'Different loaders can define different classes with the same name.',
      ],
      aliases: ['parent-first delegation', 'class loader namespace'],
      tags: ['jvm', 'classpath'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.class-loading',
        },
        {
          type: 'causes',
          target: 'java.l5.linkage-failure',
        },
      ],
    },
    {
      id: 'java.l5.static-initialization',
      title: 'Static initialization',
      kind: 'mechanism',
      summary: [
        'The JVM runs static field initializers and static blocks in textual order.',
        'Initialization happens once per class per defining loader.',
        'A failed initializer is remembered and becomes a linkage failure on later use.',
      ],
      aliases: ['class initialization', 'clinit'],
      tags: ['jvm', 'initialization'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.class-loading',
        },
        {
          type: 'commonly-confused-with',
          target: 'java.l5.linkage-failure',
        },
      ],
    },
    {
      id: 'java.l5.linkage-failure',
      title: 'Linkage failure',
      kind: 'failure-mode',
      summary: [
        'ClassNotFoundException comes from an explicit load request.',
        'NoClassDefFoundError can mean the class was compiled but cannot be linked or initialized.',
        'Read the first cause; later errors often hide a failed static initializer.',
      ],
      aliases: ['NoClassDefFoundError', 'ExceptionInInitializerError'],
      tags: ['jvm', 'failures'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l5.class-loading',
        },
        {
          type: 'contrasts-with',
          target: 'java.l5.static-initialization',
        },
      ],
    },
  ],
  revisits: [],
  versionCaveats: [
    'Examples target Java 21 LTS on HotSpot. Class loading is specified by the JVM, but loader implementations and diagnostics can vary by runtime.',
  ],
  references: [
    {
      title: 'Java Language Specification, Chapter 12: Execution',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html',
      note: 'The normative order for loading, linking, and initialization.',
    },
    {
      title: 'Java Virtual Machine Specification, Chapter 5: Loading, Linking, and Initializing',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html',
      note: 'The runtime rules, including initialization locks and errors.',
    },
  ],
  sections: {
    problem:
      'A class compiles on your machine and disappears at runtime. Or it loads, then every request fails with `NoClassDefFoundError` even though the class file is present. Developers usually reach for the classpath and stop there. The classpath is only the finding step. The JVM also has to link the class, initialize its static state, and attach the result to a defining loader. Those stages fail differently, and the first error is often not the one printed at the top of the stack trace.',
    analogy: {
      title: 'A receiving desk with three stamps',
      body:
        'A shipment arrives at a warehouse desk. The clerk first finds the crate and assigns it a bay. Then an inspector checks the manifest and connects it to the warehouse system. Only when someone actually needs the contents does a technician open the crate and run its setup procedure. A crate can be found and inspected without ever being opened.',
      mapping: [
        {
          technical: 'Loading',
          everyday: 'Finding the crate and assigning a bay',
        },
        {
          technical: 'Linking',
          everyday: 'Checking the manifest and connecting the records',
        },
        {
          technical: 'Initialization',
          everyday: 'Opening the crate and running its setup steps',
        },
        {
          technical: 'Defining class loader',
          everyday: 'The desk that owns the bay and its records',
        },
      ],
      whereItBreaks:
        'A warehouse has one obvious physical crate. The JVM can define the same class name more than once under different loaders, and those are different runtime types. A failure during setup is also remembered: the crate is not reopened on every request.',
    },
    mentalModel: {
      title: 'A class file becomes a runtime class in stages',
      figure: {
        width: 900,
        height: 330,
        caption:
          'Compilation produces a class file. Loading defines it, linking prepares it, and initialization runs its static setup.',
        alt: 'A left-to-right diagram: source Java file goes through javac to a class file, which is loaded and linked by a class loader, then initialized into a runtime class with static state and executable code.',
        nodes: [
          {
            id: 'source',
            label: 'Source file',
            detail: 'Example.java',
            x: 16,
            y: 112,
            width: 150,
            height: 86,
            shape: 'box',
            tone: 'muted',
          },
          {
            id: 'classfile',
            label: 'Class file',
            detail: 'bytecode + constant pool',
            x: 240,
            y: 104,
            width: 164,
            height: 102,
            shape: 'stack',
            tone: 'accent',
          },
          {
            id: 'loader',
            label: 'Class loader',
            detail: 'find · link · define',
            x: 478,
            y: 94,
            width: 176,
            height: 122,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'runtime',
            label: 'Runtime class',
            detail: 'static state + code',
            x: 728,
            y: 94,
            width: 148,
            height: 122,
            shape: 'box',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'source',
            to: 'classfile',
            label: 'javac',
            kind: 'flow',
          },
          {
            from: 'classfile',
            to: 'loader',
            label: 'load + link',
            kind: 'flow',
          },
          {
            from: 'loader',
            to: 'runtime',
            label: 'initialize',
            kind: 'flow',
          },
        ],
        annotations: [
          {
            x: 16,
            y: 238,
            text: 'Loading is lazy. Referenced classes appear\nwhen code first needs them.',
          },
          {
            x: 478,
            y: 238,
            text: 'Initialization runs once per defining loader.\nA failure is remembered.',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'The JVM specification separates three stages because each answers a different question: can we identify the class, can we connect it to everything it references, and should its static setup run now?',
      steps: [
        {
          title: 'Loading finds and defines the class',
          body:
            'A class loader locates the binary representation for a name such as `com.acme.Plugin`. It may ask its parent first. If the parent cannot supply the class, the loader defines it and becomes its **defining loader**. From that point, the runtime type is identified by the pair of class name and defining loader, not by the name alone.',
        },
        {
          title: 'Linking verifies, prepares, and resolves',
          body:
            'Verification checks that the bytecode is structurally safe for the JVM. Preparation creates static fields and assigns their default values, such as `0` or `null`. Resolution connects symbolic references from the constant pool to actual classes, fields, and methods. Resolution may happen lazily, so a missing dependency can surface later than the initial load.',
        },
        {
          title: 'Initialization executes static setup',
          body:
            'On first **active use**, the JVM runs static field initializers and static blocks in textual order. Active use includes creating an instance, reading or writing a non-constant static field, invoking a static method, or initializing a subclass. Access through a compile-time constant does not trigger it.',
        },
        {
          title: 'Only then does main run',
          body:
            'The launcher loads and initializes the class containing `main`, then invokes the method. Every class reached from that code follows the same lazy path. A missing dependency, a verification problem, or a failed static initializer appears at the point of use, not at the moment `java` started.',
        },
      ],
      outro:
        'This is why “the jar is on the classpath” is only one hypothesis. The file may be present and still fail verification, resolve against the wrong loader, or throw while its static state is being built.',
    },
    code: {
      intro:
        'First watch initialization order inside one class. Then compare an explicit load with a load that deliberately skips initialization.',
      minimal: {
        filename: 'Ticket.java',
        language: 'java',
        code: `final class Ticket {
    static int counter = announce();
    static { System.out.println("static block"); }
    Ticket() { System.out.println("constructor"); }
    static int announce() {
        System.out.println("field init");
        return 1;
    }
}
System.out.println("before");
new Ticket();
System.out.println("after");`,
        annotations: [
          {
            line: 2,
            note: 'The static field initializer runs before the static block because it appears first.',
          },
          {
            line: 3,
            note: 'Static blocks run in textual order with static field initializers.',
          },
          {
            line: 4,
            note: 'The constructor runs only after class initialization has completed.',
          },
          {
            line: 11,
            note: 'The first new Ticket() is the active use that triggers initialization.',
          },
        ],
        output: `before
field init
static block
constructor
after`,
      },
      realistic: {
        filename: 'PluginHost.java',
        language: 'java',
        code: `final class PluginHost {
    static Object instantiate(String name) throws Exception {
        Class<?> type = Class.forName(name);
        return type.getDeclaredConstructor().newInstance();
    }

    static Class<?> peek(String name) throws Exception {
        return Class.forName(name, false, PluginHost.class.getClassLoader());
    }

    public static void main(String[] args) throws Exception {
        Class<?> api = peek("com.acme.Plugin");
        System.out.println("peeked: " + api.getName());
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'Class.forName(name) loads and initializes the class by default.',
          },
          {
            line: 8,
            note: 'The false argument skips initialization while still loading and linking.',
          },
          {
            line: 12,
            note: 'A plugin framework often inspects types before it decides to initialize them.',
          },
        ],
      },
    },
    breakIt: {
      title: 'The static initializer that poisons every later request',
      scenario:
        'A configuration class reads an environment variable in a static initializer. The variable is missing in a local run. The first request fails during class initialization; every later request fails before the constructor is reached.',
      brokenCode: {
        filename: 'Config.java',
        language: 'java',
        code: `final class Config {
    static final String BASE_URL = System.getenv("API_URL").trim();

    static String endpoint() {
        return BASE_URL + "/v1";
    }
}`,
      },
      predictionPrompt:
        'Predict both failures. What error appears on the first active use, and what error appears on the next one?',
      failureKind: 'runtime',
      reveal: {
        observed:
          'The first use throws `ExceptionInInitializerError` caused by a `NullPointerException`. Later uses throw `NoClassDefFoundError: Could not initialize class Config`.',
        explanation:
          '`System.getenv` returned `null`, so `trim()` failed while the JVM was running the static initializer. The JVM marks the class as erroneous. The first attempt reports the initialization exception; later attempts report that the class could not be initialized. The class file did not move, and the classpath is not the cause.',
        repair:
          'Validate external input before dereferencing it. Throw an error that names the missing variable, and keep static initialization free of work that can fail for environmental reasons. Prefer constructing configuration explicitly when startup order matters.',
        correctedCode: {
          filename: 'Config.java',
          language: 'java',
          code: `final class Config {
    static final String BASE_URL = require("API_URL");

    static String require(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing environment variable: " + key);
        }
        return value;
    }

    static String endpoint() {
        return BASE_URL + "/v1";
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Class-loading explanations often collapse three stages into one sentence. The result sounds confident and predicts the wrong error.',
      mistakes: [
        {
          title: 'Saying a present class file cannot produce NoClassDefFoundError',
          generatedPattern:
            '“NoClassDefFoundError means the class is missing from the classpath. Add the jar and the problem is solved.”',
          whyItFails:
            'The error can also mean the class was found but failed linking or initialization. A failed static initializer is a common cause, and the class file is still present.',
          correction:
            'Separate the cases: ClassNotFoundException comes from an explicit load such as Class.forName. NoClassDefFoundError can come from linking or from an initialization failure remembered by the JVM.',
          telltale:
            'The advice stops at classpath and never asks for the first caused-by frame.',
        },
        {
          title: 'Running static blocks at JVM startup',
          generatedPattern:
            '“Static blocks execute when the application starts, before main.”',
          whyItFails:
            'A class is initialized on first active use. Classes that are never touched do not run their static setup, even if they are packaged in the application.',
          correction:
            'Describe initialization as lazy and per defining loader. Name an active use, such as creating an instance or invoking a static method.',
          telltale:
            'The explanation cannot explain why reordering imports changes when a log line appears.',
        },
        {
          title: 'Treating a class name as its full identity',
          generatedPattern:
            '“Two classes with the same fully qualified name are the same class.”',
          whyItFails:
            'Runtime identity includes the defining loader. Two loaders can define the same name as different types, which produces surprising casts and instanceof results.',
          correction:
            'State the pair explicitly: binary name plus defining class loader. Inspect getClassLoader when diagnosing plugin or application-server conflicts.',
          telltale:
            'The answer mentions duplicate jars but cannot explain a ClassCastException between apparently identical types.',
        },
      ],
      reviewChecklist: [
        'Does the explanation separate loading, linking, and initialization?',
        'Does it identify the first active use that triggers static setup?',
        'Does it distinguish an explicit load failure from a remembered initialization failure?',
        'Does it mention the defining loader when type identity matters?',
      ],
    },
    interviewCorner: {
      intro:
        'Answer the mechanism first, then the production consequence. The interviewer is listening for the stage you blame.',
      questions: [
        {
          id: 'java.l5.class-loading.interview.1',
          difficulty: 'junior',
          question:
            'What is the difference between loading, linking, and initializing a Java class?',
          modelAnswer:
            'Loading finds the binary representation and defines the class in a loader. Linking verifies the bytecode, prepares static fields with default values, and resolves symbolic references. Initialization runs static field initializers and static blocks on first active use. The stages answer different questions: identify, connect, and run setup.',
          weakAnswer:
            'Loading reads the class file, and then the constructor runs.',
          strongAnswer:
            'Loading defines a runtime type under a loader. Linking verifies and prepares it and resolves references. Initialization executes its static setup once per defining loader, before the first instance or static access that requires it.',
          followUp:
            'Which stage creates the static field, and which stage assigns its non-default initial value?',
        },
        {
          id: 'java.l5.class-loading.interview.2',
          difficulty: 'mid',
          question:
            'Why can two instances fail a cast even when their class names are identical?',
          modelAnswer:
            'A runtime class is identified by its binary name and its defining class loader. If two loaders define the same bytes under the same name, the JVM treats them as distinct types. A cast between them fails because the runtime types differ, even though the names printed in logs match.',
          weakAnswer:
            'The classes came from different jars, so Java picked one at random.',
          strongAnswer:
            'Defining-loader identity is part of the type. The objects may share source code and a name but belong to separate loader namespaces. Print each object’s class loader and compare it, rather than comparing only getName().',
          followUp:
            'How would parent-first delegation usually prevent this, and when would it not?',
        },
        {
          id: 'java.l5.class-loading.interview.3',
          difficulty: 'senior',
          question:
            'A service throws NoClassDefFoundError only after a deployment. How do you investigate without guessing?',
          modelAnswer:
            'I read the full stack trace and the first caused-by, because a failed static initializer is often hidden. I confirm whether the class is present in the runtime artifact, which loader defined it, and whether initialization ran. I compare the deployed classpath and loader topology with the previous release. If initialization failed, I inspect environment, permissions, and static dependencies. I reproduce with the same runtime and class loader rather than adding jars blindly.',
          weakAnswer:
            'The class is missing, so I add every dependency jar to the classpath and redeploy.',
          strongAnswer:
            'I separate discovery, linkage, and initialization failures. I capture the first cause, the defining loader, and the environment at startup. Then I reproduce with the same deployment artifact. Only after ruling out a remembered initialization failure do I change the classpath.',
          followUp:
            'What would you log at startup so the next incident is shorter?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a class-initialization probe',
      brief:
        'Write a small Java 21 program that proves when class initialization happens. Use one class for the probe and a separate class for main, so the main class’s own initialization does not contaminate the result. Trigger a load without initialization, then trigger initialization explicitly.',
      constraints: [
        'Use Java 21 and at least two top-level classes in one file.',
        'Print a line from a static field initializer, a static block, and a constructor.',
        'Load the probe class with Class.forName(name, false, loader) before initializing it.',
        'Show that loading alone did not run the static setup.',
        'Explain the observed order in comments or a final printed statement.',
      ],
      starterCode: {
        filename: 'StartupProbe.java',
        language: 'java',
        code: `final class Probe {
    // Add static setup and a constructor.
}

final class StartupProbe {
    public static void main(String[] args) throws Exception {
        // Load Probe without initializing it, then initialize it.
    }
}`,
      },
      referenceSolution: {
        filename: 'StartupProbe.java',
        language: 'java',
        code: `final class Probe {
    static final int VALUE = print("field");
    static { System.out.println("static block"); }

    Probe() { System.out.println("constructor"); }

    static int print(String label) {
        System.out.println(label);
        return 1;
    }
}

final class StartupProbe {
    public static void main(String[] args) throws Exception {
        System.out.println("before load");
        Class<?> type = Class.forName(
                "Probe", false, StartupProbe.class.getClassLoader());
        System.out.println("loaded: " + type.getSimpleName());
        System.out.println("before init");
        type.getDeclaredConstructor().newInstance();
        System.out.println("done");
    }
}`,
        annotations: [
          {
            line: 2,
            note: 'Static field and static block run in textual order on initialization.',
          },
          {
            line: 16,
            note: 'The false argument loads and links Probe without running its static setup.',
          },
          {
            line: 20,
            note: 'Creating an instance is an active use, so initialization runs here.',
          },
        ],
      },
      rubric: [
        {
          id: 'separate-class',
          check: 'Does a separate Probe class keep main-class initialization from hiding the experiment?',
          detail:
            'The class containing main is initialized before main runs. The probe must live elsewhere for the observation to mean anything.',
          mustPass: true,
        },
        {
          id: 'skip-initialization',
          check: 'Does the program load Probe with initialization explicitly disabled?',
          detail:
            'Use Class.forName(name, false, loader) and print evidence before the first active use.',
          mustPass: true,
        },
        {
          id: 'initialization-order',
          check: 'Does the output show field initializer, static block, then constructor?',
          detail:
            'Textual order inside the class controls the first two. The constructor comes after class initialization completes.',
          mustPass: true,
        },
        {
          id: 'explanation',
          check: 'Does the explanation connect the output to loading versus initialization?',
          detail:
            'A correct explanation names the active use and notes that initialization is once per defining loader.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile with javac 21 and run StartupProbe on your machine.',
        'Confirm that no static probe output appears before "before init".',
        'Move the static field below the static block and confirm the printed order changes.',
      ],
    },
    recap: [
      'Loading defines a class under a loader; linking verifies and prepares it; initialization runs its static setup.',
      'Initialization is lazy, happens on first active use, and runs once per defining loader.',
      'A class is identified by its binary name and defining loader, not by the name alone.',
      'A failed static initializer is remembered; later use can surface as NoClassDefFoundError.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l5.class-loading.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l5.static-initialization'],
      prompt:
        'Which action triggers class initialization of a class that has not been initialized yet?',
      options: [
        {
          id: 'read-constant',
          text: 'Reading a compile-time constant declared by the class.',
        },
        {
          id: 'create-instance',
          text: 'Creating an instance of the class.',
        },
        {
          id: 'load-with-false',
          text: 'Calling Class.forName(name, false, loader).',
        },
        {
          id: 'inspect-type',
          text: 'Inspecting the class object returned by a load without initialization.',
        },
      ],
      correctOptionId: 'create-instance',
      explanation:
        'Creating an instance is an active use. Compile-time constants are inlined, and a load with initialize=false deliberately skips static setup.',
    },
    {
      id: 'java.l5.class-loading.recall.q2',
      type: 'predict-output',
      concepts: [
        'java.l5.static-initialization',
        'java.l5.class-loader-delegation',
      ],
      prompt:
        'What does this program print? The class is initialized once, before the first instance is constructed.',
      code: `final class Signal {
    static { System.out.println("initialized"); }
    Signal() { System.out.println("constructed"); }
}

System.out.println("before");
new Signal();
new Signal();
System.out.println("after");`,
      codeLanguage: 'java',
      expectedOutput: `before
initialized
constructed
constructed
after`,
      acceptedOutputs: [
        'before initialized constructed constructed after',
        'before\ninitialized\nconstructed\nconstructed\nafter',
      ],
      explanation:
        'The first new Signal() triggers initialization, so the static block runs before the first constructor. The second instance reuses the already initialized class.',
    },
    {
      id: 'java.l5.class-loading.recall.q3',
      type: 'explain',
      concepts: ['java.l5.linkage-failure'],
      prompt:
        'Explain the difference between ClassNotFoundException and a NoClassDefFoundError caused by a failed static initializer.',
      keyPoints: [
        'ClassNotFoundException comes from an explicit load request that cannot find the class.',
        'NoClassDefFoundError can occur when the class is found but linking or initialization fails.',
        'A failed static initializer is remembered, so later uses report NoClassDefFoundError.',
      ],
      modelAnswer:
        'ClassNotFoundException is thrown by explicit loading APIs such as Class.forName when the requested name cannot be resolved. NoClassDefFoundError is a linkage error: the runtime needed a class that had been present at compile time but could not be linked or initialized. If a static initializer throws, the first active use reports ExceptionInInitializerError and later uses report NoClassDefFoundError because the JVM remembers the erroneous class.',
      explanation:
        'Strong answers distinguish discovery from initialization and mention that the first failure and later failures can use different exception types.',
    },
  ],
});
