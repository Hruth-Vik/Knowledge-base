import type { LevelManifest } from '../../lib/schema/curriculum.js';

/**
 * Level metadata is stable curriculum structure. Lessons are content files
 * discovered by the validator and grouped beneath these levels.
 */
export const levels = [
  {
    id: 'java.l0',
    language: 'java',
    index: 0,
    title: 'How a Computer Runs Your Code',
    deck: 'CPU, memory, bytecode, and the long chain from source file to running process.',
    outcome:
      'You can explain what happens to a .java file, distinguish stack from heap, and justify why Java chose a virtual machine instead of compiling straight to machine code.',
  },
  {
    id: 'java.l1',
    language: 'java',
    index: 1,
    title: 'The Language Core',
    deck: 'Values, references, control flow, strings, equality, and exceptions without folklore.',
    outcome:
      'You can reason precisely about primitives versus references, string identity, equals/hashCode contracts, and exception flow instead of reciting half-remembered rules.',
  },
  {
    id: 'java.l2',
    language: 'java',
    index: 2,
    title: 'Objects Built Properly',
    deck: 'Encapsulation, polymorphism, records, sealed types, immutability, and SOLID without ceremony.',
    outcome:
      'You can design a small object model that hides its invariants, choose inheritance only when it is justified, and explain the trade-offs behind each modern Java type.',
  },
  {
    id: 'java.l3',
    language: 'java',
    index: 3,
    title: 'Data, Generics, and Streams',
    deck: 'Collections, hashing, iterator contracts, generic variance, lambdas, and stream pipelines.',
    outcome:
      'You can choose the right collection from its internals, predict hash-based failure modes, write type-safe generic APIs, and explain what a stream pipeline actually does at runtime.',
  },
  {
    id: 'java.l4',
    language: 'java',
    index: 4,
    title: 'Concurrency and the Java Memory Model',
    deck: 'Threads, visibility, happens-before, locks, executors, virtual threads, and the failures that only appear under load.',
    outcome:
      'You can identify races and visibility bugs, reason about happens-before, size a pool from evidence, and know when virtual threads change the design.',
  },
  {
    id: 'java.l5',
    language: 'java',
    index: 5,
    title: 'Inside the JVM',
    deck: 'Class loading, bytecode, runtime memory, generational heap, garbage collection, JIT compilation, and real memory leaks.',
    outcome:
      'You can read a heap dump, explain how a class becomes code, predict which GC behavior matters for a workload, and investigate a leak from evidence rather than guesswork.',
  },
  {
    id: 'java.l6',
    language: 'java',
    index: 6,
    title: 'Spring Core Without the Magic',
    deck: 'IoC, dependency resolution, bean lifecycle, proxies, AOP, cycles, and auto-configuration.',
    outcome:
      'You can explain how an application context is assembled, why a proxy exists, why a circular dependency sometimes starts and sometimes does not, and what Spring Boot generated from your classpath.',
  },
  {
    id: 'java.l7',
    language: 'java',
    index: 7,
    title: 'Spring Boot and the Web',
    deck: 'Starters, HTTP request traversal, validation, error handling, filters, security, REST design, and tests.',
    outcome:
      'You can trace a request from socket to response, design a coherent error contract, place security at the correct layer, and write tests that fail for useful reasons.',
  },
  {
    id: 'java.l8',
    language: 'java',
    index: 8,
    title: 'Persistence from JDBC to JPA',
    deck: 'Connections, transactions, isolation, Hibernate state, N+1 queries, locking, caching, and migrations.',
    outcome:
      'You can read a transaction boundary, explain what the persistence context is holding, diagnose N+1 and lazy-loading failures, and choose a migration strategy deliberately.',
  },
  {
    id: 'java.l9',
    language: 'java',
    index: 9,
    title: 'Production Engineering',
    deck: 'Logs, metrics, configuration, caching, messaging, resilience, and performance debugging under pressure.',
    outcome:
      'You can turn a production symptom into a testable hypothesis, instrument the right boundary, and choose timeouts, retries, and circuit breakers without creating a worse outage.',
  },
  {
    id: 'java.l10',
    language: 'java',
    index: 10,
    title: 'Architecture and the Interview Gauntlet',
    deck: 'Boundaries, distributed failure, idempotency, sagas, API design, and defending decisions out loud.',
    outcome:
      'You can compare architectural options with explicit evidence, design an idempotent write path, reason through partial failure, and handle a structured Java interview without bluffing.',
  },
] satisfies readonly LevelManifest[];
