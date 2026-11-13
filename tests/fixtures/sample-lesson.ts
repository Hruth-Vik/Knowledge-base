import { defineLesson } from '../../src/lib/schema/lesson.js';

export const sampleLesson = defineLesson({
  formatVersion: 1,
  id: 'java.l0.sample-references',
  language: 'java',
  levelId: 'java.l0',
  chapter: {
    id: 'sample-chapter',
    title: 'Sample chapter',
  },
  sequence: 1,
  slug: 'sample-references',
  title: 'A sample lesson about references',
  deck: 'Test fixture only. It exercises every required lesson section.',
  kind: 'standard',
  estimatedMinutes: 12,
  tags: ['fixture', 'references'],
  concepts: [
    {
      id: 'java.l0.sample-reference',
      title: 'Reference value',
      kind: 'mechanism',
      summary: [
        'A reference variable stores a value that points at an object.',
        'Copying the variable copies the reference, not the object.',
        'The object remains shared until no reachable reference points at it.',
      ],
      aliases: ['object reference'],
      tags: ['memory'],
      relations: [
        {
          type: 'depends-on',
          target: 'java.l0.sample-object',
        },
      ],
    },
    {
      id: 'java.l0.sample-object',
      title: 'Object identity',
      kind: 'principle',
      summary: [
        'An object has an identity independent of its current field values.',
        'Two objects can be equal by value and still be different objects.',
        'Identity is what reference equality checks.',
      ],
      aliases: ['object identity'],
      tags: ['memory', 'equality'],
      relations: [],
    },
  ],
  revisits: [],
  versionCaveats: ['Test fixture; not published content.'],
  sections: {
    problem:
      'A variable that holds an object does not hold the whole object. Confusing the variable with the object leads to aliasing bugs, misleading diagrams, and wrong claims about Java being pass-by-reference.',
    analogy: {
      title: 'A coat check ticket',
      body:
        'The ticket is small enough to copy into a pocket. The coat in the cloakroom is much larger, and several tickets can direct staff to the same coat.',
      mapping: [
        {
          technical: 'The reference variable',
          everyday: 'The coat check ticket',
        },
        {
          technical: 'The object on the heap',
          everyday: 'The coat in the cloakroom',
        },
        {
          technical: 'Copying a reference during a method call',
          everyday: 'Writing the ticket number on another slip of paper',
        },
      ],
      whereItBreaks:
        'A cloakroom cannot move a coat while nobody is looking. A garbage collector can reclaim an object once no reference reaches it, and objects do not have a fixed physical location.',
    },
    mentalModel: {
      title: 'The variable and the object are separate',
      figure: {
        width: 560,
        height: 260,
        caption: 'A local reference value points at one shared object.',
        alt: 'A box labelled variable contains a reference arrow. The arrow points to a larger box labelled object on the heap.',
        nodes: [
          {
            id: 'variable',
            label: 'variable',
            detail: 'holds a reference value',
            x: 24,
            y: 54,
            width: 180,
            height: 72,
            shape: 'box',
            tone: 'neutral',
          },
          {
            id: 'object',
            label: 'object',
            detail: 'fields live on the heap',
            x: 320,
            y: 30,
            width: 200,
            height: 112,
            shape: 'box',
            tone: 'accent',
          },
        ],
        edges: [
          {
            from: 'variable',
            to: 'object',
            label: 'points to',
            kind: 'depends',
          },
        ],
        annotations: [
          {
            x: 24,
            y: 180,
            text: 'Copying the variable copies only the arrow.',
          },
        ],
      },
    },
    underTheHood: {
      intro:
        'Follow one variable through assignment and a method call. The distinction between the slot and the object is the whole lesson.',
      steps: [
        {
          title: 'Create a local slot',
          body:
            'The compiler reserves a local-variable slot in the current stack frame. That slot has a type that describes what kind of reference it can hold.',
        },
        {
          title: 'Store a reference',
          body:
            'When an object is created, the runtime produces a reference value. Assignment stores that value in the slot. The object remains on the heap.',
        },
        {
          title: 'Pass a copy',
          body:
            'Java passes the reference value by value. The callee gets another slot containing the same reference. Mutating the object is visible to the caller; reassigning the parameter is not.',
        },
      ],
    },
    code: {
      intro:
        'First observe the reference value itself. Then observe what changes when it is passed to a method.',
      minimal: {
        filename: 'Reference.java',
        language: 'java',
        code: `var box = new StringBuilder("a");
var copy = box;
copy.append("b");
System.out.println(box);`,
        annotations: [
          {
            line: 1,
            note: 'The variable stores a reference to a new StringBuilder.',
          },
          {
            line: 3,
            note: 'Both variables reach the same object, so the mutation is visible through box.',
          },
        ],
        output: 'ab',
      },
      realistic: {
        filename: 'RenameService.java',
        language: 'java',
        code: `final class Account {
    private String name;

    void rename(String newName) {
        name = newName;
    }
}

void relabel(Account account) {
    account = new Account();
}`,
        annotations: [
          {
            line: 1,
            note: 'The class declaration only defines the shape; objects are created separately.',
          },
          {
            line: 10,
            note: 'Reassigning the local parameter does not change the caller reference.',
          },
          {
            line: 5,
            note: 'Field assignment mutates the object the reference reaches.',
          },
        ],
      },
    },
    breakIt: {
      title: 'The copied reference that is not a copied object',
      scenario:
        'A developer assumes every method receives its own copy of the object and tries to protect the caller from mutation.',
      brokenCode: {
        filename: 'Broken.java',
        language: 'java',
        code: `void clear(StringBuilder value) {
    value.setLength(0);
}

var value = new StringBuilder("keep me");
clear(value);
System.out.println("[" + value + "]");`,
      },
      predictionPrompt:
        'Predict the printed value before revealing the result. Does the assignment inside clear replace the caller object?',
      failureKind: 'logic',
      reveal: {
        observed: 'The program prints an empty pair of brackets: `[]`.',
        explanation:
          'The method receives a copy of the reference. That copy points at the same StringBuilder, so setLength mutates the object the caller still holds.',
        repair:
          'If the contract is not to mutate, either avoid mutating the argument or pass an immutable value and return a new object.',
      },
    },
    aiMistakes: {
      intro:
        'Generated explanations often say Java is pass-by-reference when they mean “the referenced object can be mutated.”',
      mistakes: [
        {
          title: 'Calling Java pass-by-reference',
          generatedPattern:
            '“Objects are passed by reference, so changes in the callee affect the caller.”',
          whyItFails:
            'The argument is a reference value passed by value. Reassigning the parameter cannot change the caller’s variable.',
          correction:
            'Say Java is strictly pass-by-value. Reference values are copied, so object mutations through the copied reference remain visible.',
          telltale:
            'The explanation uses “reference” as both the argument-passing mode and the kind of value.',
        },
        {
          title: 'Drawing the object inside the variable',
          generatedPattern:
            'A diagram puts the fields of a heap object inside the local variable box.',
          whyItFails:
            'The variable slot holds a reference value, while the object state lives elsewhere on the heap.',
          correction:
            'Draw the variable and the object separately, with an arrow from the slot to the object.',
          telltale:
            'Copies of the variable and the object become impossible to reason about.',
        },
      ],
      reviewChecklist: [
        'Does the explanation distinguish a reference value from the object it points at?',
        'Does it avoid claiming that object mutations are impossible?',
        'Does it account for reassigning the parameter inside the callee?',
      ],
    },
    interviewCorner: {
      intro:
        'Answer the mechanism first, then the consequence. Interviewers notice the difference.',
      questions: [
        {
          id: 'java.l0.sample-references.interview.1',
          difficulty: 'junior',
          question:
            'Is Java pass-by-value or pass-by-reference? Explain what happens to an object argument.',
          modelAnswer:
            'Java is always pass-by-value. For an object argument, the value being copied is the reference. The callee can mutate the object reached by that reference, but reassigning its parameter does not change the caller variable.',
          weakAnswer:
            'Java is pass-by-reference for objects because the object can change.',
          strongAnswer:
            'Java is pass-by-value for primitives and reference values alike. The reference value is copied into the callee slot, so the callee shares the object but not the caller variable.',
          followUp:
            'What would you observe if the callee assigned a new object to the parameter?',
        },
        {
          id: 'java.l0.sample-references.interview.2',
          difficulty: 'mid',
          question:
            'How can two references point to different objects while equals reports true?',
          modelAnswer:
            'equals can be overridden to compare logical state. Two distinct objects can carry equal field values, while reference equality remains false because identity is different.',
          weakAnswer:
            'equals and == are basically the same for objects.',
          strongAnswer:
            'distinct identities can be logically equal under a valid equals contract. == compares reference identity; equals should compare the class-defined value relation.',
          followUp:
            'What obligation does overriding equals place on hashCode?',
        },
        {
          id: 'java.l0.sample-references.interview.3',
          difficulty: 'senior',
          question:
            'Why does an object remain reachable after every local reference in a method has returned?',
          modelAnswer:
            'Reachability is graph-based from roots, not scoped to the method that created an object. A static collection, live thread, queued task, or listener can still hold a reference to the object.',
          weakAnswer:
            'Local scope ends, so the garbage collector immediately removes all objects from that method.',
          strongAnswer:
            'The method frame becomes unreachable, but any reference reachable from GC roots can keep the object alive. Inspect static state, thread locals, queues, and registered callbacks.',
          followUp:
            'What evidence in a heap dump would identify the retaining path?',
        },
      ],
    },
    writeFromScratch: {
      title: 'Rebuild the reference experiment',
      brief:
        'Write a small Java program that demonstrates the difference between reassigning a reference parameter and mutating the object it points at. Then explain the result in comments.',
      constraints: [
        'Use Java 21 and a single source file.',
        'Include one parameter reassignment that the caller does not observe.',
        'Include one object mutation that the caller does observe.',
        'Do not use arrays to hide the mechanism.',
      ],
      starterCode: {
        filename: 'ReferenceExperiment.java',
        language: 'java',
        code: '',
      },
      referenceSolution: {
        filename: 'ReferenceExperiment.java',
        language: 'java',
        code: `final class Switch {
    boolean on;
}

void replace(Switch value) {
    value = new Switch();
}

void turnOn(Switch value) {
    value.on = true;
}`,
        annotations: [
          {
            line: 5,
            note: 'The local parameter is assigned a new object; the caller reference is untouched.',
          },
          {
            line: 10,
            note: 'The shared object is mutated through the copied reference value.',
          },
        ],
      },
      rubric: [
        {
          id: 'reassignment',
          check: 'Does one method reassign its parameter and leave the caller unchanged?',
          detail:
            'The caller should still reach the original object after the method returns.',
          mustPass: true,
        },
        {
          id: 'mutation',
          check: 'Does one method mutate the shared object through its parameter?',
          detail:
            'The caller should be able to observe the changed field after the call.',
          mustPass: true,
        },
        {
          id: 'explanation',
          check: 'Does the explanation distinguish copied reference values from copied objects?',
          detail:
            'A correct explanation can point to both experiments and name the copied value.',
          mustPass: false,
        },
        {
          id: 'runnable',
          check: 'Can the program be compiled and run locally with Java 21?',
          detail:
            'Foundation does not execute Java in the browser. Verify this on your machine.',
          mustPass: false,
        },
      ],
      verification: [
        'Compile with javac 21 and run the class locally.',
        'Print the object identity or a field value before and after each method call.',
      ],
    },
    recap: [
      'A reference variable stores a reference value, not the object itself.',
      'Java copies that reference value during a method call.',
      'Mutation through the copy is visible to the caller; reassigning the parameter is not.',
    ],
  },
  recallCheck: [
    {
      id: 'java.l0.sample-references.recall.q1',
      type: 'multiple-choice',
      concepts: ['java.l0.sample-reference'],
      prompt:
        'A method receives an object reference and assigns a new object to its parameter. What does the caller observe?',
      options: [
        {
          id: 'caller-sees-new',
          text: 'The caller now points at the new object.',
        },
        {
          id: 'caller-unchanged',
          text: 'The caller reference is unchanged.',
        },
        {
          id: 'compile-error',
          text: 'The code cannot compile.',
        },
      ],
      correctOptionId: 'caller-unchanged',
      explanation:
        'The parameter is a separate variable containing a copy of the reference value.',
    },
    {
      id: 'java.l0.sample-references.recall.q2',
      type: 'predict-output',
      concepts: ['java.l0.sample-reference', 'java.l0.sample-object'],
      prompt:
        'What is printed? Both variables refer to the same mutable object.',
      code: `var value = new StringBuilder("a");
var copy = value;
copy.append("b");
System.out.println(value);`,
      codeLanguage: 'java',
      expectedOutput: 'ab',
      explanation:
        'copy contains the same reference value as value, so both reach one StringBuilder.',
    },
    {
      id: 'java.l0.sample-references.recall.q3',
      type: 'explain',
      concepts: ['java.l0.sample-object'],
      prompt:
        'In your own words, why can two objects be equal without having the same identity?',
      keyPoints: [
        'equals can define value equality',
        'identity is a separate concept',
        '== compares reference identity',
      ],
      modelAnswer:
        'equals is an overridable method that can compare logical state. Identity is which object exists. Two objects with equal fields are still distinct objects, so == can be false while equals is true.',
      explanation:
        'Strong answers separate the value relation from object identity and mention the equals/hashCode contract later in the course.',
    },
  ],
});
