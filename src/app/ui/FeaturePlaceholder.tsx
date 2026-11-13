import type { ReactNode } from 'react';
import { Page } from './Page.js';
import { PageHeader } from './PageHeader.js';
import { PageSection } from './PageSection.js';
import { Prose } from './Prose.js';
import { Reveal } from './Reveal.js';
import styles from './FeaturePlaceholder.module.css';

interface Fact {
  readonly label: string;
  readonly value: string;
}

interface FeaturePlaceholderProps {
  readonly kicker: string;
  readonly title: string;
  readonly deck: string;
  readonly stage: string;
  readonly statusTitle: string;
  readonly aside?: ReactNode;
  readonly action?: ReactNode;
  readonly facts?: readonly Fact[];
  readonly children: ReactNode;
}

export function FeaturePlaceholder({
  kicker,
  title,
  deck,
  stage,
  statusTitle,
  aside,
  action,
  facts,
  children,
}: FeaturePlaceholderProps) {
  return (
    <Page>
      <PageHeader
        aside={aside}
        deck={deck}
        kicker={kicker}
        title={title}
      />

      <PageSection index="01" label="Status" id="status">
        <Reveal className={styles.block}>
          <span className={styles.signal} aria-hidden="true" />
          <p className={styles.stage}>{stage}</p>
          <h2 className={styles.statusTitle}>{statusTitle}</h2>
          <Prose>{children}</Prose>
          {action ? <div className={styles.action}>{action}</div> : null}
        </Reveal>
      </PageSection>

      {facts && facts.length > 0 ? (
        <PageSection index="02" label="Planned shape" id="planned-shape">
          <dl className={styles.facts}>
            {facts.map((fact, index) => (
              <Reveal
                as="div"
                className={styles.fact}
                delay={index * 90}
                key={fact.label}
              >
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
        </PageSection>
      ) : null}
    </Page>
  );
}
