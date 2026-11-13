import { useRef, useState, type ChangeEvent } from 'react';
import {
  createBackup,
  createBackupFilename,
  parseBackupText,
  serializeBackup,
} from '@/lib/storage/backup.js';
import type { UserStateV1 } from '@/lib/state/schema.js';
import { eligibleRestDays } from '@/lib/state/streak.js';
import { APP_STAGE, APP_VERSION } from '../about.js';
import { downloadTextFile } from '../download.js';
import { formatDateKey, formatShortDate, pluralize } from '../format.js';
import { useAppStore } from '../store.js';
import { Button } from '../ui/Button.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Prose } from '../ui/Prose.js';
import { Reveal } from '../ui/Reveal.js';
import { FlameIcon } from '../ui/icons.js';
import styles from './SettingsPage.module.css';

type NoticeTone = 'success' | 'error';

interface Notice {
  readonly tone: NoticeTone;
  readonly message: string;
  readonly details?: readonly string[];
}

interface PendingImport {
  readonly fileName: string;
  readonly exportedAt: string;
  readonly state: UserStateV1;
}

const THEME_OPTIONS = [
  {
    value: 'system',
    label: 'System',
    description: 'Follow the operating system’s light or dark setting.',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Warm paper and dark ink.',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-glare blue-ink for late work.',
  },
] as const;

const BACKEND_LABEL = {
  indexeddb: 'IndexedDB',
  localstorage: 'localStorage',
  memory: 'Memory only',
} as const;

export function SettingsPage() {
  const data = useAppStore((state) => state.data);
  const storageBackend = useAppStore((state) => state.storageBackend);
  const setTheme = useAppStore((state) => state.setTheme);
  const setDailyGoal = useAppStore((state) => state.setDailyGoal);
  const spendRestDay = useAppStore((state) => state.spendRestDay);
  const removeRestDay = useAppStore((state) => state.removeRestDay);
  const replaceData = useAppStore((state) => state.replaceData);
  const resetData = useAppStore((state) => state.resetData);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleExport = () => {
    const backup = createBackup(data);
    downloadTextFile(createBackupFilename(), serializeBackup(backup));
    setNotice({
      tone: 'success',
      message: 'A complete JSON backup was downloaded.',
    });
  };

  const handleFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setNotice(null);
    setPendingImport(null);

    try {
      const text = await file.text();
      const parsed = parseBackupText(text);
      if (!parsed.ok) {
        setNotice({
          tone: 'error',
          message: parsed.message,
          details: parsed.issues,
        });
        return;
      }

      setPendingImport({
        fileName: file.name,
        exportedAt: parsed.exportedAt,
        state: parsed.state,
      });
    } catch {
      setNotice({
        tone: 'error',
        message: 'The selected file could not be read.',
      });
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) {
      return;
    }

    // A pre-import backup is mandatory. It is triggered by this explicit
    // confirmation click, not silently after a file picker.
    downloadTextFile(
      createBackupFilename().replace('.json', '-before-import.json'),
      serializeBackup(createBackup(data)),
    );

    const replaced = replaceData(pendingImport.state);
    if (!replaced) {
      setNotice({
        tone: 'error',
        message: 'The imported state did not pass validation.',
      });
      return;
    }

    setNotice({
      tone: 'success',
      message: `Imported ${pendingImport.fileName}. A backup of the previous notebook was downloaded first.`,
    });
    setPendingImport(null);
  };

  const handleReset = () => {
    downloadTextFile(
      createBackupFilename().replace('.json', '-before-reset.json'),
      serializeBackup(createBackup(data)),
    );
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('foundation.journey.')) {
        window.localStorage.removeItem(key);
      }
    }
    resetData();
    setConfirmingReset(false);
    setNotice({
      tone: 'success',
      message:
        'A fresh notebook was created. A backup of the previous notebook was downloaded first.',
    });
  };

  const backendText = storageBackend
    ? BACKEND_LABEL[storageBackend]
    : 'Checking…';
  const isMemoryOnly = storageBackend === 'memory';
  const restDays = eligibleRestDays(data);

  return (
    <Page>
      <PageHeader
        kicker="Notebook / Settings"
        title="Settings"
        deck="Control the reading surface and the record. There is no account, no server, and no telemetry."
        aside={
          <>
            <span>Schema version {data.schemaVersion}</span>
            <br />
            <span>{backendText}</span>
          </>
        }
      />

      <PageSection index="01" label="Reading" id="reading">
        <Reveal className={styles.fieldGrid}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Theme</legend>
            <p className={styles.hint}>
              The choice is stored in the notebook, not in a server profile.
            </p>
            <div className={styles.choices}>
              {THEME_OPTIONS.map((option) => (
                <label className={styles.choice} key={option.value}>
                  <input
                    checked={data.settings.theme === option.value}
                    name="theme"
                    onChange={() => setTheme(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <span className={styles.choiceDescription}>
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label className={styles.legend} htmlFor="daily-goal">
              Daily goal
            </label>
            <p className={styles.hint}>
              Lessons marked done per local day. A day with only reading is
              still a day with no completed lesson.
            </p>
            <select
              className={styles.select}
              id="daily-goal"
              onChange={(event) => setDailyGoal(Number(event.target.value))}
              value={data.settings.dailyGoalLessons}
            >
              <option value={1}>1 lesson</option>
              <option value={2}>2 lessons</option>
              <option value={3}>3 lessons</option>
            </select>
          </div>
        </Reveal>
      </PageSection>

      <PageSection index="02" label="Rest days" id="rest" tone="ochre">
        <Reveal>
          <div className={styles.restHead}>
            <div>
              <p className={styles.restLead}>
                {pluralize(data.streak.restDayTokens, 'rest-day token')} in your
                pocket.
              </p>
              <p className={styles.hint}>
                One token is granted per ISO week when the notebook has shown
                recent activity, up to two. A token covers a missed day without
                pretending the day contained study. Spending and removing are
                always explicit decisions.
              </p>
            </div>
            <span className={styles.tokenBadge}>
              <FlameIcon /> {data.streak.restDayTokens}
            </span>
          </div>

          {restDays.length === 0 ? (
            <p className={styles.hint}>
              No uncovered missed day in the last seven days.
            </p>
          ) : (
            <ul className={styles.restList}>
              {restDays.map((dateKey) => (
                <li className={styles.restRow} key={dateKey}>
                  <span className={styles.restDate}>
                    {formatDateKey(dateKey)}
                  </span>
                  <span className={styles.restRowNote}>
                    {data.streak.restDayTokens === 0
                      ? 'No token available'
                      : 'Missed day'}
                  </span>
                  <Button
                    disabled={data.streak.restDayTokens === 0}
                    onClick={() => spendRestDay(dateKey)}
                  >
                    Cover with a token
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {data.streak.restDays.length > 0 ? (
            <div className={styles.restCovered}>
              <p className={styles.legend}>Covered days</p>
              <ul className={styles.restList}>
                {data.streak.restDays.map((dateKey) => (
                  <li className={styles.restRow} key={dateKey}>
                    <span className={styles.restDate}>
                      {formatDateKey(dateKey)}
                    </span>
                    <span className={styles.restRowNote}>
                      Counts as a rest day
                    </span>
                    <Button onClick={() => removeRestDay(dateKey)}>
                      Remove coverage
                    </Button>
                  </li>
                ))}
              </ul>
              <p className={styles.hint}>
                Removing coverage does not refund the token. That keeps the
                record honest.
              </p>
            </div>
          ) : null}
        </Reveal>
      </PageSection>

      <PageSection index="03" label="Data" id="data">
        <Reveal>
          <dl className={styles.dataList}>
          <div className={styles.dataRow}>
            <dt>Storage</dt>
            <dd>{backendText}</dd>
          </div>
          <div className={styles.dataRow}>
            <dt>Last write</dt>
            <dd>{formatShortDate(new Date(data.updatedAt))}</dd>
          </div>
          <div className={styles.dataRow}>
            <dt>Backup format</dt>
            <dd>foundation.backup · format version 1</dd>
          </div>
        </dl>

        {isMemoryOnly ? (
          <p className={styles.warning}>
            Browser storage is unavailable. Changes will disappear when this
            tab closes. Export now if the record matters.
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button onClick={handleExport}>Export backup</Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            Choose backup to import…
          </Button>
          <input
            accept=".json,application/json"
            className={styles.fileInput}
            onChange={handleFileSelected}
            ref={fileInputRef}
            type="file"
          />
        </div>
        <p className={styles.hint}>
          Export is a complete JSON file. Import replaces this notebook only
          after validation, and downloads a copy of the current notebook first.
        </p>

        {pendingImport ? (
          <div
            aria-label="Confirm backup import"
            className={styles.importPanel}
            role="region"
          >
            <p className={styles.panelLabel}>Import ready</p>
            <p className={styles.panelText}>
              <strong>{pendingImport.fileName}</strong> was exported on{' '}
              {formatShortDate(new Date(pendingImport.exportedAt))}. Importing
              replaces all lessons, notes, review data, and settings in this
              browser.
            </p>
            <div className={styles.actions}>
              <Button autoFocus onClick={handleConfirmImport} variant="primary">
                Import and keep a backup
              </Button>
              <Button onClick={() => setPendingImport(null)}>Cancel</Button>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div
            className={[
              styles.notice,
              notice.tone === 'error' ? styles.noticeError : styles.noticeOk,
            ].join(' ')}
            role={notice.tone === 'error' ? 'alert' : 'status'}
          >
            <p>{notice.message}</p>
            {notice.details && notice.details.length > 0 ? (
              <ul>
                {notice.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className={styles.resetBlock}>
          <div>
            <p className={styles.resetTitle}>Reset notebook</p>
            <p className={styles.hint}>
              Removes lessons, reviews, notes, map data, and settings from this
              browser. A backup is downloaded first.
            </p>
          </div>
          {confirmingReset ? (
            <div className={styles.resetConfirm} role="alert">
              <p>This cannot be undone after the download.</p>
              <div className={styles.actions}>
                <Button onClick={handleReset} variant="danger">
                  Remove everything
                </Button>
                <Button onClick={() => setConfirmingReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setConfirmingReset(true)} variant="danger">
              Reset notebook…
            </Button>
          )}
        </div>
        </Reveal>
      </PageSection>

      <PageSection index="04" label="About" id="about">
        <Reveal>
          <Prose>
            <p>
              FOUNDATION is a static, local-first learning platform. Content is
              compiled from typed lesson modules at build time. User data is
              written only in this browser, and export is a first-class feature.
            </p>
            <p>
              There is no account system, no telemetry, and no server-side copy
              of this notebook. Clearing browser storage without an export
              removes the record.
            </p>
          </Prose>
          <dl className={styles.aboutFacts}>
            <div>
              <dt>Build</dt>
              <dd>v{APP_VERSION}</dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>{APP_STAGE}</dd>
            </div>
            <div>
              <dt>Content</dt>
              <dd>Java 21 LTS</dd>
            </div>
          </dl>
        </Reveal>
      </PageSection>
    </Page>
  );
}
