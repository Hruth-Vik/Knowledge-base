import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  formatVersion: 1,
  id: 'java.l2.polymorphism-dispatch',
  language: 'java',
  levelId: 'java.l2',
  chapter: {
    id: 'type-relationships',
    title: 'Types, Inheritance, and Dispatch',
  },
  sequence: 4,
  slug: 'polymorphism-dispatch',
  title: 'The Bonus That Used the Compile-Time Type',
  deck: 'The object was a Manager at runtime, but the overload was chosen from the variable’s declared type. The bonus was 150 short.',
  kind: 'standard',
  estimatedMinutes: 16,
  tags: ['polymorphism', 'dynamic-dispatch', 'overloading', 'interfaces', 'design'],
  concepts: [
    {
      id: 'java.l2.polymorphism',
      title: 'Polymorphism',
      kind: 'principle',
      summary: [
        'Polymorphism lets one call site work with several implementations through a shared supertype.',
        'The caller depends on the contract, and each implementation supplies its own behavior.',
        'Subtype polymorphism is what lets new implementations be added without editing the caller.',
      ],
      aliases: ['subtype polymorphism', 'one interface many implementations'],
      tags: ['java', 'types', 'design'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.inheritance',
        },
        {
          type: 'implemented-by',
          target: 'java.l2.dynamic-dispatch',
        },
      ],
    },
    {
      id: 'java.l2.dynamic-dispatch',
      title: 'Dynamic dispatch',
      kind: 'mechanism',
      summary: [
        'An overridden instance method is selected from the receiver’s runtime class, not the variable’s declared type.',
        'The JVM resolves an invokevirtual or invokeinterface call against the object that receives it.',
        'Fields, static methods, and overload selection do not use this runtime path.',
      ],
      aliases: ['virtual dispatch', 'runtime dispatch', 'invokevirtual'],
      tags: ['java', 'jvm', 'methods'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.bytecode',
        },
      ],
    },
    {
      id: 'java.l2.overload-vs-override',
      title: 'Overload versus override',
      kind: 'failure-mode',
      summary: [
        'Overloads share a name but differ in parameter types, and the compiler chooses one from the static types at the call site.',
        'Overrides share a signature across a subtype and are chosen from the receiver’s runtime class.',
        'Replacing an override with an overload silently keeps the base behavior and can compile without warning.',
      ],
      aliases: ['static overload resolution', 'overload trap', 'method hiding'],
      tags: ['java', 'methods', 'bugs'],
      relations: [
        {
          type: 'commonly-confused-with',
          target: 'java.l2.dynamic-dispatch',
        },
      ],
    },
    {
      id: 'java.l2.open-closed-principle',
      title: 'Open/closed principle',
      kind: 'principle',
      summary: [
        'A design should allow new behavior without editing the code that already works.',
        'Polymorphism moves the variation behind a stable interface, so a new implementation does not change the caller.',
        'The principle is a trade-off, not a mandate: a closed set may be clearer as an exhaustive switch.',
      ],
      aliases: ['open for extension closed for modification', 'OCP', 'extension point'],
      tags: ['java', 'design', 'solid'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l2.polymorphism',
        },
      ],
    },
  ],
  revisits: [
    'java.l2.inheritance',
    'java.l2.composition',
    'java.l2.liskov-substitution',
    'java.l0.bytecode',
  ],
  versionCaveats: [
    'Examples target Java 21 LTS. The compiler selects overloads; the JVM dispatches overrides. The exact shape of a virtual dispatch table is implementation-specific, so the lesson describes the selection rule rather than a particular HotSpot layout.',
    'Fields and static methods are resolved from the static type; they are not polymorphic. Calling a static method through an instance is legal but misleading, and most style guides discourage it.',
    'Pattern matching for switch and sealed hierarchies are covered in the next lesson. They are another way to handle a closed set, not a replacement for every polymorphic design.',
  ],
  references: [
    {
      title: 'Java Language Specification: Method invocation expressions',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12',
      note: 'How the compiler selects an applicable method at compile time, including overload resolution.',
    },
    {
      title: 'Java Language Specification: Overriding and hiding',
      url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8',
      note: 'The difference between an instance override and a static method that hides another.',
    },
    {
      title: 'Java Virtual Machine Specification: invokevirtual and invokeinterface',
      url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.invokevirtual',
      note: 'The instructions that dispatch an instance method against the receiver’s runtime class.',
    },
  ],
  sections: {
    problem:
      'A payroll service computes a bonus with two overloads: `bonus(Employee)` returns 100, and `bonus(Manager)` returns 250. The caller holds the employee in an `Employee` variable because the list is typed `List<Employee>`. At runtime every object in the list is a `Manager`, but the call still uses the `Employee` overload.\n\nThe code compiles, the object knows its role, and the result is wrong. Overloading looked like polymorphism because both methods had the same name. They are different: an overload is chosen by the compiler from the static types it can see, while an override is chosen by the JVM from the object that receives the call. Mixing them up produces a bug that no compiler warning will catch.',
    analogy: {
      title: 'The dispatcher who reads the envelope',
      body:
        'A courier hands a package to a dispatcher. The envelope is labelled “employee,” even though the box inside is a manager’s shipment. The dispatcher has a manager route and an employee route, but chooses from the label on the envelope. The package takes the employee route.\n\nThe label is the variable’s static type. The contents are the runtime object. Overload resolution reads the label; dynamic dispatch opens the box and asks the object which method it implements.',
      mapping: [
        {
          technical: 'The variable’s declared type',
          everyday: 'The label printed on the envelope',
        },
        {
          technical: 'The object’s runtime class',
          everyday: 'What is actually inside the box',
        },
        {
          technical: 'Overload resolution',
          everyday: 'The dispatcher choosing a route from the label',
        },
        {
          technical: 'Dynamic dispatch',
          everyday: 'Opening the box and letting the contents choose their route',
        },
        {
          technical: 'A missing overload for the label',
          everyday: 'No route printed for that envelope label',
        },
      ],
      whereItBreaks:
        'A dispatcher can open the box or call the sender, so the label is not the only information available. Java overload resolution cannot inspect the runtime type; it must choose from the static types at compile time. The analogy also suggests that one route is “correct.” Both methods are valid Java; the bug is that the chosen behavior does not match the domain rule.',
    },
    mentalModel: {
      title: 'The compiler picks the overload; the object picks the override',
      figure: {
        width: 960,
        height: 400,
        caption:
          'A Manager object is held in an Employee variable. The compiler selects bonus(Employee), while the same object’s overridden role method still dispatches to Manager at runtime.',
        alt: 'A diagram with an Employee-typed variable pointing at a Manager object. One path goes to a compile-time overload table that selects bonus(Employee) and yields 100. Another path goes to a runtime dispatch box that selects Manager.role and yields manager. Annotations explain that the label and the object are different facts.',
        nodes: [
          {
            id: 'variable',
            label: 'Employee person',
            detail: 'static type Employee',
            x: 24,
            y: 48,
            width: 200,
            height: 84,
            shape: 'note',
            tone: 'muted',
          },
          {
            id: 'object',
            label: 'new Manager()',
            detail: 'runtime type Manager',
            x: 284,
            y: 40,
            width: 200,
            height: 100,
            shape: 'box',
            tone: 'accent',
          },
          {
            id: 'overloads',
            label: 'bonus overloads',
            detail: 'chosen at compile time',
            x: 548,
            y: 24,
            width: 190,
            height: 92,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'chosen',
            label: 'bonus(Employee)',
            detail: 'returns 100',
            x: 788,
            y: 24,
            width: 148,
            height: 92,
            shape: 'box',
            tone: 'warning',
          },
          {
            id: 'dispatch',
            label: 'role() dispatch',
            detail: 'chosen at runtime',
            x: 548,
            y: 196,
            width: 190,
            height: 92,
            shape: 'box',
            tone: 'correct',
          },
          {
            id: 'manager',
            label: 'Manager.role()',
            detail: 'returns manager',
            x: 788,
            y: 196,
            width: 148,
            height: 92,
            shape: 'box',
            tone: 'correct',
          },
        ],
        edges: [
          {
            from: 'variable',
            to: 'object',
            label: 'points to',
            kind: 'flow',
          },
          {
            from: 'variable',
            to: 'overloads',
            label: 'static type',
            kind: 'depends',
          },
          {
            from: 'overloads',
            to: 'chosen',
            label: 'selects',
            kind: 'flow',
          },
          {
            from: 'object',
            to: 'dispatch',
            label: 'receiver',
            kind: 'depends',
          },
          {
            from: 'dispatch',
            to: 'manager',
            label: 'override',
            kind: 'flow',
          },
          {
            from: 'chosen',
            to: 'manager',
            label: 'different rules',
            kind: 'contrast',
          },
        ],
        annotations: [
          {
            x: 24,
            y: 348,
            text: 'The variable’s type is all the compiler needs for an overload.',
          },
          {
            x: 548,
            y: 348,
            text: 'The runtime object is all the JVM needs for an override.',
          },
          {
            x: 788,
            y: 348,
            text: 'One object, two selection rules.',
            align: 'right',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Two facts about every reference drive this lesson: the type the compiler knows and the class of the object at runtime. Keep them separate and the behavior stops being surprising.',
      steps: [
        {
          title: 'The variable type and the object type are different',
          body:
            'A variable of type `Employee` can point at a `Manager` object because every manager is an employee. The compiler checks the assignment against the declared type. At runtime the object still has its own class, and that class decides which override runs.\n\nThis distinction is the foundation of subtype polymorphism. The caller can be written once against `Employee`, and each object brings its own behavior. It is also the source of the overload trap: the compiler may not know which concrete object will arrive.',
          code: {
            filename: 'Employee.java',
            language: 'java',
            code: `class Employee {
    String role() { return "employee"; }
}

class Manager extends Employee {
    @Override String role() { return "manager"; }
}

final class Main {
    public static void main(String[] args) {
        Employee person = new Manager();
        System.out.println(person.role());
    }
}`,
            annotations: [
              {
                line: 5,
                note: 'Manager overrides the instance method with the same signature.',
              },
              {
                line: 9,
                note: 'The variable is Employee, so callers can work with any Employee subtype.',
              },
              {
                line: 10,
                note: 'The object is still a Manager at runtime.',
              },
              {
                line: 11,
                note: 'Dynamic dispatch selects Manager.role, so the output is manager.',
              },
            ],
            output: `manager`,
          },
        },
        {
          title: 'Overloads are chosen from static types',
          body:
            'An overload set is a group of methods with the same name and different parameter types. The compiler chooses the most specific applicable method using the static types of the arguments. It does not know or care that the object passed at runtime is a subclass of the declared parameter type.\n\nThis is why `describe(Object)` wins over `describe(String)` when the argument is declared `Object`, even if the value is a string. A cast changes the static type and therefore the selected overload. The cast does not change the object.',
          code: {
            filename: 'Overload.java',
            language: 'java',
            code: `final class Overload {
    static String describe(Object value) { return "object"; }
    static String describe(String value) { return "string"; }

    public static void main(String[] args) {
        Object value = "hello";
        System.out.println(describe(value));
        System.out.println(describe((String) value));
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'This overload accepts any object reference.',
              },
              {
                line: 3,
                note: 'This overload is more specific, but only for a String-typed argument.',
              },
              {
                line: 5,
                note: 'The variable’s static type is Object, even though the value is a String.',
              },
              {
                line: 6,
                note: 'The compiler selects describe(Object), so the output is object.',
              },
              {
                line: 7,
                note: 'The cast changes the static type to String, so the other overload is selected.',
              },
            ],
            output: `object
string`,
          },
        },
        {
          title: 'Overrides follow the receiver, not the variable',
          body:
            'An instance method override is dispatched by the receiver’s runtime class. The JVM resolves `invokevirtual` for a class method or `invokeinterface` for an interface method against the object, then selects the most specific implementation of that signature. The variable’s declared type only determines whether the call is legal.\n\nFields and static methods do not participate. A field access is resolved from the static type, so hiding a field in a subclass does not change what a base-typed reference reads. A static method is chosen from the static type too; it is hidden, not overridden.',
          code: {
            filename: 'Fields.java',
            language: 'java',
            code: `class Parent {
    String name = "parent";
    static String kind() { return "parent"; }
    String role() { return "parent"; }
}
class Child extends Parent {
    String name = "child";
    static String kind() { return "child"; }
    @Override String role() { return "child"; }
}
class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.name);
        System.out.println(p.kind());
        System.out.println(p.role());
    }
}`,
            annotations: [
              {
                line: 2,
                note: 'The parent field is read through the static type Parent.',
              },
              {
                line: 3,
                note: 'kind is static; Child hides it rather than overriding it.',
              },
              {
                line: 4,
                note: 'role is an instance method, so it can be overridden.',
              },
              {
                line: 7,
                note: 'The child field hides the parent field; it does not replace it for Parent-typed access.',
              },
              {
                line: 8,
                note: 'This static method hides Parent.kind; the call is resolved at compile time.',
              },
              {
                line: 14,
                note: 'p.name reads Parent’s field, so the output is parent.',
              },
              {
                line: 15,
                note: 'p.kind() resolves to Parent.kind, so the output is parent again.',
              },
              {
                line: 16,
                note: 'p.role() dispatches to Child.role, so the output is child.',
              },
            ],
            output: `parent
parent
child`,
          },
        },
        {
          title: 'Interfaces move the variation behind a contract',
          body:
            'A class implements an interface by promising the methods in its contract. A caller can hold the interface type and call those methods without knowing the implementation. Adding a new implementation does not require editing the caller, which is the useful part of the open/closed principle.\n\nThe trade-off is that the interface must be the right shape. If every implementation needs a different operation, or if the caller must ask “which kind are you?” to do its job, the abstraction is not carrying the variation. A closed set of types with an external operation may be better served by a sealed switch; the next lesson shows that design.',
          code: {
            filename: 'Notifier.java',
            language: 'java',
            code: `interface Notifier {
    void send(String message);
}

final class EmailNotifier implements Notifier {
    public void send(String message) {
        System.out.println("email: " + message);
    }
}

final class SmsNotifier implements Notifier {
    public void send(String message) {
        System.out.println("sms: " + message);
    }
}

final class Main {
    public static void main(String[] args) {
        Notifier notifier = new EmailNotifier();
        notifier.send("hello");
    }
}`,
            annotations: [
              {
                line: 1,
                note: 'The interface names the operation every notification channel must provide.',
              },
              {
                line: 5,
                note: 'EmailNotifier supplies one implementation of the contract.',
              },
              {
                line: 11,
                note: 'SmsNotifier supplies a different implementation without changing the caller.',
              },
              {
                line: 19,
                note: 'The caller depends on Notifier, not on a concrete channel.',
              },
              {
                line: 20,
                note: 'invokeinterface dispatches to the receiver’s runtime implementation.',
              },
            ],
            output: `email: hello`,
          },
        },
      ],
      outro:
        'Use overloading for convenience when the behavior is the same and the static types are obvious. Use overriding or an interface when the behavior belongs to the object and must vary at runtime. When you see the same name with subtype parameters, ask which rule is doing the work.',
    },
    code: {
      intro:
        'The minimal example puts an override and an overload in the same call. The realistic example uses an interface so a new channel does not change the notifier.',
      minimal: {
        filename: 'Main.java',
        language: 'java',
        code: `class Animal { String sound() { return "..."; } }
class Dog extends Animal { @Override String sound() { return "woof"; } }
class Main {
    static String label(Animal animal) { return "animal"; }
    static String label(Dog dog) { return "dog"; }
    public static void main(String[] args) {
        Animal pet = new Dog();
        System.out.println(pet.sound() + " / " + label(pet));
    }
}`,
        annotations: [
          {
            line: 2,
            note: 'sound is overridden, so the call follows the runtime object.',
          },
          {
            line: 4,
            note: 'label(Animal) is one overload.',
          },
          {
            line: 5,
            note: 'label(Dog) is a different overload with a more specific parameter type.',
          },
          {
            line: 7,
            note: 'The variable is Animal, so the compiler sees only the Animal overload.',
          },
          {
            line: 8,
            note: 'pet.sound() prints woof; label(pet) prints animal.',
          },
        ],
        output: `woof / animal`,
      },
      realistic: {
        filename: 'Notifier.java',
        language: 'java',
        code: `import java.util.List;

interface Channel {
    String name();
    void send(String recipient, String body);
}

final class EmailChannel implements Channel {
    public String name() { return "email"; }
    public void send(String recipient, String body) {
        System.out.println("email to " + recipient + ": " + body);
    }
}

final class SmsChannel implements Channel {
    public String name() { return "sms"; }
    public void send(String recipient, String body) {
        System.out.println("sms to " + recipient + ": " + body);
    }
}

final class Notifier {
    private final List<Channel> channels;

    Notifier(List<Channel> channels) {
        this.channels = List.copyOf(channels);
    }

    void send(String recipient, String body) {
        for (Channel channel : channels) {
            channel.send(recipient, body);
        }
    }

    public static void main(String[] args) {
        Notifier notifier = new Notifier(List.of(new EmailChannel(), new SmsChannel()));
        notifier.send("ana", "order shipped");
    }
}`,
        annotations: [
          {
            line: 3,
            note: 'The interface defines the contract every channel honors.',
          },
          {
            line: 9,
            note: 'EmailChannel is one implementation; the notifier does not name it.',
          },
          {
            line: 16,
            note: 'SmsChannel is another implementation with the same contract.',
          },
          {
            line: 26,
            note: 'The channel list is copied so the notifier owns a stable set.',
          },
          {
            line: 31,
            note: 'Each call is dispatched to the element’s runtime implementation.',
          },
          {
            line: 36,
            note: 'A new channel can be added to this list without editing Notifier.',
          },
        ],
        output: `email to ana: order shipped
sms to ana: order shipped`,
      },
    },
    breakIt: {
      title: 'The manager who received the employee bonus',
      scenario:
        'A payroll report loads employees through a `List<Employee>`. Every element is a `Manager` in this run, so the team expects the manager bonus. The bonus calculator has two overloads, one for `Employee` and one for `Manager`. The report calls `bonus(person)` where `person` is declared as `Employee`.',
      brokenCode: {
        filename: 'Bonus.java',
        language: 'java',
        code: `class Employee {
    String role() { return "employee"; }
}
class Manager extends Employee {
    @Override String role() { return "manager"; }
}
final class Bonus {
    static int bonus(Employee employee) { return 100; }
    static int bonus(Manager manager) { return 250; }
    public static void main(String[] args) {
        Employee person = new Manager();
        System.out.println(person.role() + ": " + bonus(person));
    }
}`,
      },
      predictionPrompt:
        'The object is a Manager. Which bonus overload does the compiler choose, and why does the overridden role method not change that choice?',
      failureKind: 'logic',
      reveal: {
        observed:
          'The program prints `manager: 100`. The overridden `role()` method follows the runtime Manager object, but `bonus(person)` selects the Employee overload and returns 100.',
        explanation:
          'Overload resolution happens at compile time from the static type of the argument. `person` is declared `Employee`, so the compiler can only guarantee the `bonus(Employee)` method. It does not use the object’s runtime class. The `role()` call is different: it is an override, so `invokevirtual` dispatches to `Manager.role` and prints manager. The program therefore uses two different selection rules in one expression, and the output looks inconsistent until you separate them.',
        repair:
          'Put the behavior on the type if it is part of the object’s contract: declare `bonus()` on Employee and override it in Manager. If the operation must live outside the type, use a visitor or a pattern switch over a closed hierarchy, and make the subtype explicit. Do not add overloads for subtypes and assume the runtime object selects them. Add a test that calls through the base type, not only through a variable declared as the subclass.',
        correctedCode: {
          filename: 'Bonus.java',
          language: 'java',
          code: `class Employee {
    int bonus() { return 100; }
}
class Manager extends Employee {
    @Override int bonus() { return 250; }
}
final class Bonus {
    public static void main(String[] args) {
        Employee person = new Manager();
        System.out.println(person.bonus());
    }
}`,
        },
      },
    },
    aiMistakes: {
      intro:
        'Generated code often reaches for the same tool — an overload, an instanceof ladder, or a field — when the behavior needs runtime dispatch. These are the patterns to inspect.',
      mistakes: [
        {
          title: 'Using overloads as if they were polymorphism',
          generatedPattern:
            '“I added `render(Shape)` and `render(Circle)` so each subtype gets its own behavior. The runtime type will choose the right one.”',
          whyItFails:
            'The compiler chooses an overload from the static type at the call site. A caller holding `Shape` always gets `render(Shape)`, even when the object is a Circle. The extra overload is reachable only through a Circle-typed variable.',
          correction:
            'Declare an overridable method on the type, or use a visitor/pattern switch if the operation belongs outside the hierarchy. Test through the base type.',
          telltale:
            'Overloads whose parameter types are subtypes of one another, especially when the caller holds a collection of the base type.',
        },
        {
          title: 'Replacing polymorphism with an instanceof ladder',
          generatedPattern:
            '“I check `if (shape instanceof Circle) ... else if (shape instanceof Square) ...` so I can add behavior without touching the classes.”',
          whyItFails:
            'Every new subtype requires editing every ladder, and a missing branch often falls through to a default or throws. The design is open for modification, which is the opposite of the claimed benefit.',
          correction:
            'Put the behavior on the type when it is part of the type’s contract. If the set of types is closed and the operation is external, use a sealed hierarchy with an exhaustive switch so the compiler checks the missing case.',
          telltale:
            'Repeated instanceof chains over the same set of types, or a default branch that returns a placeholder for unknown types.',
        },
        {
          title: 'Expecting fields to be polymorphic',
          generatedPattern:
            '“The subclass declares the same `name` field with a different value, so a base-typed reference should read the subclass value.”',
          whyItFails:
            'Field access is resolved from the static type. The subclass field hides the base field; it does not override it. The base-typed reference reads the base field, which is a different storage location.',
          correction:
            'Expose the value through an instance method and override it, or store the value in the superclass constructor. Avoid hiding fields; it makes the object’s state depend on the reference type used to read it.',
          telltale:
            'A field with the same name in a superclass and subclass, or a base-typed reference that reads a surprising value.',
        },
        {
          title: 'Believing static methods are overridden',
          generatedPattern:
            '“I marked the static `create()` method with `@Override`, so the subclass version will be called through the base type.”',
          whyItFails:
            'A static method is hidden, not overridden. The call is resolved from the static type, and no receiver dispatch occurs. `@Override` may be accepted for a hiding declaration, but the runtime behavior does not change.',
          correction:
            'Use an instance method and an interface or superclass contract when behavior must vary. Keep static methods for utilities that do not depend on the runtime type.',
          telltale:
            'A `static` method in a subtype with the same signature as a superclass static method, especially when called through a base-typed reference.',
        },
      ],
      reviewChecklist: [
        'Does the call site hold the base type, and is the chosen method an override rather than an overload?',
        'Are subtype-specific overloads reachable only through subtype-typed variables?',
        'Are fields or static methods being used where runtime dispatch is required?',
        'Can a new implementation be added without editing the caller, and is that the right trade-off here?',
        'Do tests call through the abstraction rather than the concrete class?',
      ],
    },
    interviewCorner: {
      intro:
        'The interviewer wants the selection rule, not the vocabulary. Say which type each mechanism reads and when.',
      questions: [
        {
          id: 'java.l2.polymorphism-dispatch.interview.1',
          difficulty: 'junior',
          question: 'What is the difference between overloading and overriding?',
          modelAnswer:
            'Overloading declares methods with the same name but different parameter lists. The compiler chooses one from the static types of the arguments. Overriding declares a method with the same signature in a subtype, and the JVM chooses the implementation from the receiver’s runtime class. Overloading is a compile-time convenience; overriding is runtime polymorphism. A method cannot be overloaded by return type alone.',
          weakAnswer:
            'Overloading is compile time and overriding is runtime. That is the difference.',
          strongAnswer:
            'The mechanism differs: overload resolution uses the static types visible at the call site, while an override is dispatched against the object that receives the call. That is why a base-typed variable can select the base overload even when the object is a subtype. I also check fields and static methods, which follow the static type and are not polymorphic at all.',
          followUp:
            'Can an overload be selected at runtime if the argument is null?',
        },
        {
          id: 'java.l2.polymorphism-dispatch.interview.2',
          difficulty: 'mid',
          question:
            'Walk through what happens when an interface-typed variable calls an overridden method. Why can the JVM choose a different implementation than the variable’s type?',
          modelAnswer:
            'The variable holds a reference to an object whose class implements the interface. The call is compiled as an interface invocation, and the JVM resolves it against the receiver’s runtime class. That class provides an implementation of the method signature, either directly or through a superclass. The variable’s static type only makes the call legal; it does not choose the implementation. For class methods the instruction is invokevirtual, and for interface methods it is invokeinterface. The exact dispatch table layout is implementation-specific.',
          weakAnswer:
            'The JVM looks at the variable type and finds the method in that class. Interfaces work because the compiler adds the method.',
          strongAnswer:
            'The receiver is the object, so the runtime class is the authority. The compiler emits an invokeinterface with the interface method reference; the JVM selects the implementation from the object’s class. The static type proves that the method exists on the interface. If the method is default, the interface can provide a fallback, but the selection still follows the class hierarchy and the interface rules.',
          followUp:
            'What happens if a class inherits a method from a superclass and also has a default method with the same signature from an interface?',
        },
        {
          id: 'java.l2.polymorphism-dispatch.interview.3',
          difficulty: 'senior',
          question:
            'When would you choose a type switch over polymorphic dispatch, and how do sealed types change the trade-off?',
          modelAnswer:
            'Polymorphism is a good fit when the set of types is open and each type owns the behavior. A type switch is a good fit when the set is closed and the operation belongs outside the type, such as rendering, serialization, or a cross-cutting calculation. The classic trade-off is the expression problem: adding a new type is easy with polymorphism and expensive with a switch; adding a new operation is easy with a switch and expensive with polymorphism. Sealed types improve the switch side because the compiler can check exhaustiveness when a new subtype is added, but they also close the hierarchy to external extension.',
          weakAnswer:
            'Always use polymorphism. Type switches are a code smell and should be removed.',
          strongAnswer:
            'I choose based on the axis of change and ownership. If new implementations arrive from other teams or plugins, an open interface is better. If the domain has a fixed set of cases and operations are added more often than cases, a sealed hierarchy plus an exhaustive switch keeps the operation in one place and lets the compiler find missing branches. I would not use a default branch over a closed set; that gives up the compiler’s help. The cost is that every new case edits the switch and the permits clause.',
          followUp:
            'How would you add a new operation to a sealed hierarchy without editing every existing class?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Build a shipping calculator with interchangeable policies',
      brief:
        'Write a `ShippingCalculator` that holds a `ShippingPolicy` and computes an order total. Implement free shipping, a flat rate, and a threshold policy that becomes free above a subtotal. Add an express policy without editing the calculator. The same calculator code must work for every policy, and no caller may need to know the concrete policy type.',
      constraints: [
        'Define a small `ShippingPolicy` interface with one method that takes the subtotal and returns cents.',
        'Make `ShippingCalculator` final and inject the policy through its constructor.',
        'Implement at least four policies: free, flat, threshold, and express.',
        'Do not use instanceof, a type switch, or a subclass of the calculator to choose behavior.',
        'Print the total for the same subtotal under each policy.',
        'Explain in one sentence why adding express did not require editing the calculator.',
      ],
      starterCode: {
        filename: 'Shipping.java',
        language: 'java',
        code: `interface ShippingPolicy {
    long costCents(long subtotalCents);
}

final class ShippingCalculator {
    // Hold a policy and compute the total.

    public static void main(String[] args) {
        // Build the calculator with several policies and print totals.
    }
}`,
      },
      referenceSolution: {
        filename: 'Shipping.java',
        language: 'java',
        code: `interface ShippingPolicy {
    long costCents(long subtotalCents);
}

final class FreeShipping implements ShippingPolicy {
    public long costCents(long subtotalCents) { return 0; }
}

final class FlatRateShipping implements ShippingPolicy {
    private final long cents;

    FlatRateShipping(long cents) { this.cents = cents; }

    public long costCents(long subtotalCents) { return cents; }
}

final class ThresholdShipping implements ShippingPolicy {
    private final long thresholdCents;
    private final long belowThresholdCents;

    ThresholdShipping(long thresholdCents, long belowThresholdCents) {
        this.thresholdCents = thresholdCents;
        this.belowThresholdCents = belowThresholdCents;
    }

    public long costCents(long subtotalCents) {
        return subtotalCents >= thresholdCents ? 0 : belowThresholdCents;
    }
}

final class ExpressShipping implements ShippingPolicy {
    private final long cents;

    ExpressShipping(long cents) { this.cents = cents; }

    public long costCents(long subtotalCents) { return cents; }
}

final class ShippingCalculator {
    private final ShippingPolicy policy;

    ShippingCalculator(ShippingPolicy policy) {
        this.policy = policy;
    }

    long total(long subtotalCents) {
        return subtotalCents + policy.costCents(subtotalCents);
    }

    public static void main(String[] args) {
        long subtotal = 2500;
        System.out.println(new ShippingCalculator(new FreeShipping()).total(subtotal));
        System.out.println(new ShippingCalculator(new FlatRateShipping(499)).total(subtotal));
        System.out.println(new ShippingCalculator(new ThresholdShipping(5000, 499)).total(subtotal));
        System.out.println(new ShippingCalculator(new ExpressShipping(999)).total(subtotal));
    }
}`,
        annotations: [
          {
            line: 1,
            note: 'The policy interface is the contract that every shipping rule honors.',
          },
          {
            line: 20,
            note: 'ThresholdShipping holds its own configuration and applies the rule in one place.',
          },
          {
            line: 41,
            note: 'The calculator is final and depends only on the policy abstraction.',
          },
          {
            line: 47,
            note: 'The total delegates the shipping decision to the injected policy.',
          },
          {
            line: 54,
            note: 'ExpressShipping is a new implementation; no calculator code changed.',
          },
        ],
      },
      rubric: [
        {
          id: 'policy-interface',
          check: 'Is there a small ShippingPolicy interface with one clear contract?',
          detail:
            'A focused interface is what lets the calculator stay independent of each concrete rule.',
          mustPass: true,
        },
        {
          id: 'final-calculator',
          check: 'Is ShippingCalculator final and free of subtype checks?',
          detail:
            'A type check or calculator subclass would keep the variation coupled to the caller, which defeats the exercise.',
          mustPass: true,
        },
        {
          id: 'four-policies',
          check: 'Do four policies implement the same contract, including the threshold rule?',
          detail:
            'The set should exercise the abstraction, not just rename one behavior.',
          mustPass: true,
        },
        {
          id: 'same-call-site',
          check: 'Are all totals produced by the same total method and calculator type?',
          detail:
            'The output should demonstrate substitutability across policies.',
          mustPass: false,
        },
        {
          id: 'extension-explanation',
          check: 'Does the answer explain why express required no calculator edit?',
          detail:
            'The point is the direction of dependency: the calculator depends on the policy contract.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile and run with `javac Shipping.java` and `java Shipping`. Expect `2500`, `2999`, `2999`, and `3499`.',
        'Add a `HolidayShipping` policy without editing `ShippingCalculator`. Confirm that the same total method produces the new result.',
        'Change the calculator to use `instanceof` for one policy. Explain which extension property was lost and why the next policy would require another edit.',
      ],
    },
    recap: [
      'The static type controls what the compiler allows and which overload it selects; the runtime object controls which override runs.',
      'Overloading is compile-time convenience. Overriding and interface methods are runtime polymorphism.',
      'Fields and static methods follow the static type and are not polymorphic; hiding is not overriding.',
      'Polymorphism supports open extension, while a closed set may be clearer as a sealed switch; choose by the axis of change and who owns the operation.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l2.polymorphism-dispatch.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l2.overload-vs-override', 'java.l2.dynamic-dispatch'],
      prompt:
        'A variable is declared `Employee person = new Manager()`, and `bonus` is overloaded for `Employee` and `Manager`. Which overload runs?',
      options: [
        {
          id: 'employee-overload',
          text: 'bonus(Employee), because the compiler uses the variable’s static type.',
        },
        {
          id: 'manager-overload',
          text: 'bonus(Manager), because the object’s runtime type is Manager.',
        },
        {
          id: 'both',
          text: 'Both overloads run, and the more specific result is returned.',
        },
        {
          id: 'compile-error',
          text: 'The code does not compile because the types are ambiguous.',
        },
      ],
      correctOptionId: 'employee-overload',
      explanation:
        'Overload selection is a compile-time decision based on static types. The variable is Employee, so the Employee overload is the only one the compiler can select. An override would follow the runtime object instead.',
    },
    {
      id: 'java.l2.polymorphism-dispatch.recall.q2',
      type: 'predict-output',
      concepts: ['java.l2.dynamic-dispatch', 'java.l2.overload-vs-override'],
      prompt: 'What does this program print?',
      code: `class Animal { String sound() { return "..."; } }
class Dog extends Animal { @Override String sound() { return "woof"; } }
class Main {
    static String label(Animal animal) { return "animal"; }
    static String label(Dog dog) { return "dog"; }
    public static void main(String[] args) {
        Animal pet = new Dog();
        System.out.println(pet.sound() + " / " + label(pet));
    }
}`,
      codeLanguage: 'java',
      expectedOutput: 'woof / animal',
      explanation:
        'sound is overridden, so the call follows the Dog object. label is overloaded, and the variable is Animal, so the compiler chooses label(Animal).',
    },
    {
      id: 'java.l2.polymorphism-dispatch.recall.q3',
      type: 'explain',
      concepts: ['java.l2.polymorphism', 'java.l2.dynamic-dispatch'],
      prompt:
        'Explain why a caller can add a new implementation of an interface without editing the caller, and name one condition the interface must satisfy for that to remain true.',
      keyPoints: [
        'The caller depends on the interface contract and calls methods through the interface type.',
        'Each implementation supplies its own method bodies, selected by the receiver at runtime.',
        'The new implementation must honor the interface’s behavioral contract, not just its signatures.',
        'If the caller needs type-specific behavior or an operation outside the contract, the abstraction is incomplete.',
      ],
      modelAnswer:
        'The caller is compiled against the interface, so it only needs the methods the interface promises. A new class implements those methods and can be passed wherever the interface is expected. At runtime, dispatch selects the implementation from the receiver’s class. The caller does not change because its dependency points at the contract, not at the implementation. The condition is substitutability: the new class must honor the contract, including preconditions, postconditions, and expected failures. If the caller has to check the concrete type or call an operation the interface does not expose, the abstraction is not carrying the variation and the claim of open extension is false.',
      explanation:
        'Strong answers connect interface-based polymorphism to the direction of dependency and to Liskov substitution.',
    },
  ],
});
