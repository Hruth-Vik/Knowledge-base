import styles from './SectionLabel.module.css';

interface SectionLabelProps {
  readonly index?: string;
  readonly label: string;
  readonly id?: string;
}

export function SectionLabel({ index, label, id }: SectionLabelProps) {
  return (
    <div className={styles.row}>
      {index ? (
        <span className={styles.index} aria-hidden="true">
          {index}
        </span>
      ) : null}
      <h2 className={styles.text} id={id}>
        {label}
      </h2>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}
