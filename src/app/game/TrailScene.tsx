import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import type { LessonStatus } from '@/lib/state/derive.js';
import { ChevronLeftIcon } from '../ui/icons.js';
import { Biome } from './Biome.js';
import { ChibiSprite } from './ChibiSprite.js';
import { ConceptOrb } from './ConceptOrb.js';
import { StagePanel } from './StagePanel.js';
import { StagePylon } from './StagePylon.js';
import { LESSON_STATUS_LABEL } from './status.js';
import type { TrailConcept, TrailStage, TrailWorld } from './trail.js';
import styles from './field-run.module.css';

type NumericMotion = ReturnType<typeof useMotionValue<number>>;

export interface TrailSceneHandle {
  focusField(): void;
  locateStage(stageId: string): void;
}

interface TrailSceneProps {
  readonly world: TrailWorld;
  readonly statuses: ReadonlyMap<string, LessonStatus>;
  readonly selectedStage: TrailStage | null;
  readonly onSelectStage: (stageId: string) => void;
  readonly onCloseStage: () => void;
}

interface RunnerState {
  x: number;
  vx: number;
  y: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
  squash: number;
  camera: number;
  input: { left: boolean; right: boolean };
  jumpQueued: boolean;
  discovered: Set<string>;
  nearbyStage: string | null;
  nearbyOrb: string | null;
  biomeIndex: number;
  wasRunning: boolean;
  wasAirborne: boolean;
}

interface TrailLoopProps {
  readonly world: TrailWorld;
  readonly reduced: boolean;
  readonly widthRef: MutableRefObject<number>;
  readonly stateRef: MutableRefObject<RunnerState>;
  readonly playerNodeRef: RefObject<HTMLDivElement>;
  readonly playerX: NumericMotion;
  readonly jumpY: NumericMotion;
  readonly cameraX: NumericMotion;
  readonly facing: NumericMotion;
  readonly squashX: NumericMotion;
  readonly squashY: NumericMotion;
  readonly onBiome: (index: number) => void;
  readonly onNearbyStage: (stageId: string | null) => void;
  readonly onNearbyOrb: (conceptId: string | null) => void;
  readonly onDiscover: (concepts: readonly TrailConcept[]) => void;
}

const RUN_SPEED = 286;
const JUMP_SPEED = 630;
const GRAVITY = 1720;
const STAGE_RANGE = 116;
const ORB_PREVIEW_RANGE = 190;
const ORB_COLLECT_X = 54;
const ORB_REACH = 154;
const FAR_PATTERN = 320;
const MID_PATTERN = 460;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function modulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

function cameraRatio(width: number): number {
  return width < 620 ? 0.34 : 0.4;
}

function biomeIndexAt(world: TrailWorld, x: number): number {
  for (let index = 0; index < world.biomes.length; index += 1) {
    const biome = world.biomes[index];
    if (biome && x >= biome.start && x < biome.end) {
      return index;
    }
  }
  return Math.max(0, world.biomes.length - 1);
}

function TrailLoop({
  world,
  reduced,
  widthRef,
  stateRef,
  playerNodeRef,
  playerX,
  jumpY,
  cameraX,
  facing,
  squashX,
  squashY,
  onBiome,
  onNearbyStage,
  onNearbyOrb,
  onDiscover,
}: TrailLoopProps) {
  const landingTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (landingTimer.current !== null) {
        window.clearTimeout(landingTimer.current);
      }
      const node = playerNodeRef.current;
      if (node) {
        delete node.dataset.landing;
      }
    };
  }, [playerNodeRef]);

  useAnimationFrame((_time, delta) => {
    const state = stateRef.current;
    const dt = Math.min(Math.max(delta, 0), 48) / 1000;
    if (dt <= 0) {
      return;
    }

    const viewportWidth = widthRef.current || 1;
    const direction =
      Number(state.input.right) - Number(state.input.left);
    const targetVelocity = direction * RUN_SPEED;
    const grip = reduced ? 1 : 1 - Math.exp(-dt * 14);
    state.vx += (targetVelocity - state.vx) * grip;
    if (direction === 0 && Math.abs(state.vx) < 4) {
      state.vx = 0;
    }

    const minX = 54;
    const maxX = Math.max(minX, world.width - 70);
    state.x = clamp(state.x + state.vx * dt, minX, maxX);
    if (state.x === minX || state.x === maxX) {
      state.vx = 0;
    }
    if (direction !== 0) {
      state.facing = direction > 0 ? 1 : -1;
    }

    playerX.set(state.x);
    facing.set(state.facing);

    if (state.jumpQueued) {
      state.jumpQueued = false;
      if (state.grounded) {
        state.grounded = false;
        state.vy = -JUMP_SPEED;
      }
    }

    if (!state.grounded) {
      state.y += state.vy * dt;
      state.vy += GRAVITY * dt;
      if (state.y >= 0) {
        const wasFalling = state.vy > 120;
        state.y = 0;
        state.vy = 0;
        state.grounded = true;

        if (wasFalling && !reduced) {
          state.squash = 1;
          const node = playerNodeRef.current;
          if (node) {
            node.dataset.landing = 'true';
            if (landingTimer.current !== null) {
              window.clearTimeout(landingTimer.current);
            }
            landingTimer.current = window.setTimeout(() => {
              delete node.dataset.landing;
              landingTimer.current = null;
            }, 360);
          }
        }
      }
    }

    jumpY.set(state.y);

    state.squash *= Math.exp(-dt * 9);
    if (state.squash < 0.001) {
      state.squash = 0;
    }
    const stretch = state.grounded
      ? 0
      : Math.min(0.14, Math.abs(state.vy) / 5200);
    squashX.set(1 + state.squash * 0.14 - stretch * 0.25);
    squashY.set(1 - state.squash * 0.16 + stretch * 0.55);

    const running = state.grounded && Math.abs(state.vx) > 28;
    if (running !== state.wasRunning) {
      state.wasRunning = running;
      playerNodeRef.current?.setAttribute('data-running', String(running));
    }
    const airborne = !state.grounded;
    if (airborne !== state.wasAirborne) {
      state.wasAirborne = airborne;
      playerNodeRef.current?.setAttribute('data-airborne', String(airborne));
    }

    const ratio = cameraRatio(viewportWidth);
    const targetCamera = clamp(
      state.x - viewportWidth * ratio,
      0,
      Math.max(0, world.width - viewportWidth),
    );
    const cameraEase = reduced ? 1 : 1 - Math.exp(-dt * 8);
    state.camera += (targetCamera - state.camera) * cameraEase;
    if (Math.abs(targetCamera - state.camera) < 0.5) {
      state.camera = targetCamera;
    }
    cameraX.set(state.camera);

    const nextBiome = biomeIndexAt(world, state.x);
    if (nextBiome !== state.biomeIndex) {
      state.biomeIndex = nextBiome;
      onBiome(nextBiome);
    }

    let nearStage: TrailStage | null = null;
    let nearStageDistance = Number.POSITIVE_INFINITY;
    for (const stage of world.stages) {
      const distance = Math.abs(stage.x - state.x);
      if (distance <= STAGE_RANGE && distance < nearStageDistance) {
        nearStage = stage;
        nearStageDistance = distance;
      }
    }
    const nearStageId = nearStage?.id ?? null;
    if (nearStageId !== state.nearbyStage) {
      state.nearbyStage = nearStageId;
      onNearbyStage(nearStageId);
    }

    const collected: TrailConcept[] = [];
    if (state.discovered.size < world.concepts.length) {
      for (const orb of world.concepts) {
        if (state.discovered.has(orb.id)) {
          continue;
        }
        if (
          Math.abs(orb.x - state.x) <= ORB_COLLECT_X &&
          orb.height <= -state.y + ORB_REACH
        ) {
          state.discovered.add(orb.id);
          collected.push(orb);
        }
      }
    }
    if (collected.length > 0) {
      onDiscover(collected);
    }

    let nextOrb: TrailConcept | null = null;
    let nextOrbDistance = Number.POSITIVE_INFINITY;
    for (const orb of world.concepts) {
      if (state.discovered.has(orb.id)) {
        continue;
      }
      const distance = Math.abs(orb.x - state.x);
      if (distance <= ORB_PREVIEW_RANGE && distance < nextOrbDistance) {
        nextOrb = orb;
        nextOrbDistance = distance;
      }
    }
    const nextOrbId = nextOrb?.id ?? null;
    if (nextOrbId !== state.nearbyOrb) {
      state.nearbyOrb = nextOrbId;
      onNearbyOrb(nextOrbId);
    }
  });

  return null;
}

const StageMapTick = memo(function StageMapTick({
  width,
  current,
}: {
  readonly width: number;
  readonly current: boolean;
}) {
  return (
    <span
      className={styles.hudMapTick}
      data-current={current ? 'true' : undefined}
      style={{ flexGrow: width }}
    />
  );
});

export const TrailScene = forwardRef<TrailSceneHandle, TrailSceneProps>(
  function TrailScene(
    { world, statuses, selectedStage, onSelectStage, onCloseStage },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const playerNodeRef = useRef<HTMLDivElement>(null);
    const widthRef = useRef(0);
    const reduced = useReducedMotion() === true;

    const [onScreen, setOnScreen] = useState(true);
    const [tabVisible, setTabVisible] = useState(
      () => document.visibilityState !== 'hidden',
    );
    const [biomeIndex, setBiomeIndex] = useState(0);
    const [nearbyStageId, setNearbyStageId] = useState<string | null>(null);
    const [nearbyOrbId, setNearbyOrbId] = useState<string | null>(null);
    const [discovered, setDiscovered] = useState<ReadonlySet<string>>(
      () => new Set<string>(),
    );
    const [lastDiscoveryId, setLastDiscoveryId] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');

    const playerX = useMotionValue(world.startX);
    const jumpY = useMotionValue(0);
    const cameraX = useMotionValue(0);
    const worldX = useTransform(cameraX, (value) => -value);
    const facing = useMotionValue(1);
    const squashX = useMotionValue(1);
    const squashY = useMotionValue(1);
    const farX = useTransform(cameraX, (value) =>
      reduced ? 0 : -modulo(value * 0.16, FAR_PATTERN),
    );
    const midX = useTransform(cameraX, (value) =>
      reduced ? 0 : -modulo(value * 0.3, MID_PATTERN),
    );

    const stateRef = useRef<RunnerState>({
      x: world.startX,
      vx: 0,
      y: 0,
      vy: 0,
      grounded: true,
      facing: 1,
      squash: 0,
      camera: 0,
      input: { left: false, right: false },
      jumpQueued: false,
      discovered: new Set<string>(),
      nearbyStage: null,
      nearbyOrb: null,
      biomeIndex: 0,
      wasRunning: false,
      wasAirborne: false,
    });

    const stageById = useMemo(
      () => new Map(world.stages.map((stage) => [stage.id, stage])),
      [world.stages],
    );
    const conceptById = useMemo(
      () => new Map(world.concepts.map((concept) => [concept.id, concept])),
      [world.concepts],
    );

    const currentBiome = world.biomes[biomeIndex] ?? world.biomes[0];
    const nearbyStage = nearbyStageId
      ? (stageById.get(nearbyStageId) ?? null)
      : null;
    const nearbyOrb = nearbyOrbId
      ? (conceptById.get(nearbyOrbId) ?? null)
      : null;
    const lastDiscovery = lastDiscoveryId
      ? (conceptById.get(lastDiscoveryId) ?? null)
      : null;

    const running = onScreen && tabVisible && selectedStage === null;

    useEffect(() => {
      const node = viewportRef.current;
      if (!node) {
        return;
      }
      const measure = () => {
        widthRef.current = node.clientWidth;
      };
      measure();
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(measure);
      observer?.observe(node);
      window.addEventListener('resize', measure);
      return () => {
        observer?.disconnect();
        window.removeEventListener('resize', measure);
      };
    }, []);

    useEffect(() => {
      const node = viewportRef.current;
      if (!node || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setOnScreen(Boolean(entry?.isIntersecting));
        },
        { rootMargin: '140px 0px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const update = () => {
        setTabVisible(document.visibilityState !== 'hidden');
      };
      update();
      document.addEventListener('visibilitychange', update);
      return () => document.removeEventListener('visibilitychange', update);
    }, []);

    useEffect(() => {
      if (running) {
        return;
      }
      const state = stateRef.current;
      state.input.left = false;
      state.input.right = false;
      state.jumpQueued = false;
      state.vx = 0;
    }, [running]);

    const handleDiscover = useCallback((items: readonly TrailConcept[]) => {
      if (items.length === 0) {
        return;
      }
      setDiscovered((previous) => {
        const next = new Set(previous);
        for (const item of items) {
          next.add(item.id);
        }
        return next;
      });
      const latest = items[items.length - 1];
      if (!latest) {
        return;
      }
      setLastDiscoveryId(latest.id);
      setAnnouncement(
        items.length === 1
          ? `Observed ${latest.title}. ${latest.summary} Discovery only; lesson status has not changed.`
          : `Observed ${items.length} concepts, including ${latest.title}. Discovery only; lesson status has not changed.`,
      );
    }, []);

    const handleBiome = useCallback((index: number) => {
      setBiomeIndex(index);
    }, []);

    const handleNearbyStage = useCallback((stageId: string | null) => {
      setNearbyStageId(stageId);
    }, []);

    const handleNearbyOrb = useCallback((conceptId: string | null) => {
      setNearbyOrbId(conceptId);
    }, []);

    const jump = useCallback(() => {
      if (!running) {
        return;
      }
      stateRef.current.jumpQueued = true;
    }, [running]);

    useImperativeHandle(
      ref,
      () => ({
        focusField() {
          viewportRef.current?.focus({ preventScroll: true });
        },
        locateStage(stageId: string) {
          const stage = stageById.get(stageId);
          if (!stage) {
            return;
          }
          const state = stateRef.current;
          state.x = clamp(stage.x - 48, 54, Math.max(54, world.width - 70));
          state.vx = 0;
          state.y = 0;
          state.vy = 0;
          state.grounded = true;
          state.squash = 0;
          state.input.left = false;
          state.input.right = false;
          state.jumpQueued = false;
          state.facing = 1;
          state.nearbyStage = stage.id;
          state.nearbyOrb = null;
          const nextBiome = biomeIndexAt(world, state.x);
          state.biomeIndex = nextBiome;

          playerX.set(state.x);
          jumpY.set(0);
          facing.set(1);

          const width = widthRef.current;
          const targetCamera = clamp(
            state.x - width * cameraRatio(width || 1),
            0,
            Math.max(0, world.width - (width || 0)),
          );
          state.camera = targetCamera;
          cameraX.set(targetCamera);

          setBiomeIndex(nextBiome);
          setNearbyStageId(stage.id);
          setNearbyOrbId(null);
          setAnnouncement(
            `Moved to L${two(stage.levelIndex)} stage ${two(stage.sequence)}: ${stage.title}. Press Enter to open the stage card.`,
          );
          viewportRef.current?.focus({ preventScroll: true });
        },
      }),
      [
        cameraX,
        facing,
        jumpY,
        playerX,
        stageById,
        world,
      ],
    );

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (selectedStage !== null) {
        return;
      }
      const state = stateRef.current;
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        event.preventDefault();
        state.input.left = true;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        event.preventDefault();
        state.input.right = true;
      } else if (key === ' ' || key === 'Spacebar') {
        event.preventDefault();
        if (!event.repeat) {
          jump();
        }
      } else if (key === 'Enter' && nearbyStage) {
        event.preventDefault();
        onSelectStage(nearbyStage.id);
      }
    };

    const handleKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const state = stateRef.current;
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        state.input.left = false;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        state.input.right = false;
      }
    };

    const clearInput = () => {
      stateRef.current.input.left = false;
      stateRef.current.input.right = false;
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-stage-pylon]')) {
        return;
      }
      viewportRef.current?.focus({ preventScroll: true });
    };

    const nudgeTimers = useRef<{ left: number | null; right: number | null }>({
      left: null,
      right: null,
    });

    useEffect(() => {
      const timers = nudgeTimers.current;
      return () => {
        if (timers.left !== null) {
          window.clearTimeout(timers.left);
        }
        if (timers.right !== null) {
          window.clearTimeout(timers.right);
        }
      };
    }, []);

    const holdStart = (side: 'left' | 'right') => {
      if (selectedStage !== null) {
        return;
      }
      stateRef.current.input[side] = true;
    };

    const holdStop = (side: 'left' | 'right') => {
      stateRef.current.input[side] = false;
    };

    const nudge = (side: 'left' | 'right') => {
      if (selectedStage !== null) {
        return;
      }
      const state = stateRef.current;
      state.input[side] = true;
      if (nudgeTimers.current[side] !== null) {
        window.clearTimeout(nudgeTimers.current[side]);
      }
      nudgeTimers.current[side] = window.setTimeout(() => {
        state.input[side] = false;
        nudgeTimers.current[side] = null;
      }, 220);
    };

    const closePanel = () => {
      onCloseStage();
    };

    const stageStatus = nearbyStage
      ? (statuses.get(nearbyStage.id) ?? 'not-started')
      : null;
    const activeObservation = nearbyOrb ?? lastDiscovery;

    const toneStyle = {
      '--biome-tone': `var(--tone-${currentBiome?.tone ?? 'rose'})`,
      '--biome-wash': `var(--tone-${currentBiome?.tone ?? 'rose'}-wash)`,
    } as CSSProperties;

    return (
      <div className={styles.scene}>
        <div className={styles.viewportShell}>
          <div
            aria-describedby="field-run-instructions"
            aria-label="Chibi Field Run interactive trail"
            className={styles.viewport}
            data-paused={running ? undefined : 'true'}
            data-reduced={reduced ? 'true' : undefined}
            onBlur={clearInput}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onPointerDown={handlePointerDown}
            ref={viewportRef}
            role="region"
            style={toneStyle}
            tabIndex={0}
          >
            <div aria-hidden="true" className={styles.sky}>
              <span className={styles.sun} />
              <span className={`${styles.cloud} ${styles.cloudA}`} />
              <span className={`${styles.cloud} ${styles.cloudB}`} />
              <span className={`${styles.cloud} ${styles.cloudC}`} />
              <motion.div
                className={styles.parallaxFar}
                style={{ x: farX }}
              />
              <motion.div
                className={styles.parallaxMid}
                style={{ x: midX }}
              />
            </div>

            <motion.div
              aria-hidden="true"
              className={styles.world}
              data-game-world="true"
              style={{ x: worldX, width: `${world.width}px` }}
            >
              <div className={styles.ground} />
              {world.biomes.map((biome) => (
                <Biome biome={biome} key={biome.levelId} />
              ))}
              {world.stages.map((stage) => (
                <StagePylon
                  key={stage.id}
                  near={stage.id === nearbyStageId}
                  onSelect={onSelectStage}
                  selected={stage.id === selectedStage?.id}
                  stage={stage}
                  status={statuses.get(stage.id) ?? 'not-started'}
                />
              ))}
              {world.concepts.map((orb) => (
                <ConceptOrb
                  key={orb.id}
                  near={orb.id === nearbyOrbId}
                  observed={discovered.has(orb.id)}
                  orb={orb}
                />
              ))}

              <motion.div
                className={styles.player}
                data-airborne="false"
                data-running="false"
                ref={playerNodeRef}
                style={{ x: playerX, y: jumpY }}
              >
                <motion.div
                  className={styles.playerFacing}
                  style={{ scaleX: facing }}
                >
                  <motion.div
                    className={styles.playerSquash}
                    style={{ scaleX: squashX, scaleY: squashY }}
                  >
                    <div className={styles.playerBreath}>
                      <ChibiSprite />
                      <span className={styles.runDust}>
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className={styles.landingDust}>
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            <div aria-hidden="true" className={styles.hud}>
              <div className={styles.hudTop}>
                <div className={styles.hudBiome}>
                  <span className={styles.hudKicker}>
                    Biome {two(biomeIndex + 1)} / {two(world.biomes.length)}
                  </span>
                  <strong className={styles.hudTitle}>
                    {currentBiome?.title ?? 'Java trail'}
                  </strong>
                  <span className={styles.hudMap}>
                    {world.biomes.map((biome, index) => (
                      <StageMapTick
                        current={index === biomeIndex}
                        key={biome.levelId}
                        width={biome.width / world.width}
                      />
                    ))}
                  </span>
                </div>

                <div className={styles.hudCount}>
                  <span className={styles.hudCountNumber}>
                    {two(discovered.size)}
                  </span>
                  <span className={styles.hudCountLabel}>
                    / {two(world.conceptCount)} observed
                    <em>session only</em>
                  </span>
                </div>
              </div>

              <div className={styles.hudPrompt}>
                {nearbyStage ? (
                  <>
                    <span className={styles.hudPromptKicker}>
                      Stage {two(nearbyStage.sequence)} · L
                      {two(nearbyStage.levelIndex)}
                    </span>
                    <strong className={styles.hudPromptTitle}>
                      {nearbyStage.title}
                    </strong>
                    <span className={styles.hudPromptMeta}>
                      <span
                        className={styles.statusChip}
                        data-status={stageStatus ?? 'not-started'}
                      >
                        <i aria-hidden="true" />
                        {LESSON_STATUS_LABEL[stageStatus ?? 'not-started']}
                      </span>
                      <span className={styles.hudKeyHint}>
                        <kbd>Enter</kbd> open · tap pylon
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className={styles.hudPromptKicker}>Field trail</span>
                    <strong className={styles.hudPromptTitle}>
                      Run toward the next pylon
                    </strong>
                    <span className={styles.hudPromptMeta}>
                      <span className={styles.hudKeyHint}>
                        <kbd>←</kbd>
                        <kbd>→</kbd> or <kbd>A</kbd>
                        <kbd>D</kbd> run · <kbd>Space</kbd> jump
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className={styles.srOnly} id="field-run-instructions">
              Use the left and right arrow keys or A and D to run. Press Space
              to jump. Press Enter to open the stage pylon you are beside. Touch
              controls are below the field. A full list of levels and lessons
              follows the game.
            </p>
            <p aria-live="polite" className={styles.srOnly}>
              {announcement}
            </p>
          </div>

          {selectedStage ? (
            <StagePanel
              onClose={closePanel}
              stage={selectedStage}
              status={statuses.get(selectedStage.id) ?? 'not-started'}
            />
          ) : null}
        </div>

        <div className={styles.controlDeck}>
          <div aria-label="Trail controls" className={styles.controlCluster}>
            <button
              aria-label="Run left"
              className={styles.holdButton}
              onClick={(event) => {
                if (event.detail === 0) {
                  nudge('left');
                }
              }}
              onPointerCancel={() => holdStop('left')}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                holdStart('left');
              }}
              onPointerLeave={() => holdStop('left')}
              onPointerUp={() => holdStop('left')}
              type="button"
            >
              <ChevronLeftIcon />
              <span>Left</span>
            </button>

            <button
              aria-label="Run right"
              className={styles.holdButton}
              onClick={(event) => {
                if (event.detail === 0) {
                  nudge('right');
                }
              }}
              onPointerCancel={() => holdStop('right')}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                holdStart('right');
              }}
              onPointerLeave={() => holdStop('right')}
              onPointerUp={() => holdStop('right')}
              type="button"
            >
              <ChevronLeftIcon className={styles.flipIcon} />
              <span>Right</span>
            </button>

            <button
              aria-label="Jump"
              className={styles.jumpButton}
              onClick={(event) => {
                if (event.detail === 0) {
                  jump();
                }
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                jump();
              }}
              type="button"
            >
              <span>Jump</span>
              <kbd>Space</kbd>
            </button>

            <button
              aria-label={
                nearbyStage
                  ? `Open stage card for ${nearbyStage.title}`
                  : 'Open nearby stage card'
              }
              className={styles.openButton}
              disabled={!nearbyStage}
              onClick={() => {
                if (nearbyStage) {
                  onSelectStage(nearbyStage.id);
                }
              }}
              type="button"
            >
              <span>Open stage</span>
              <kbd>Enter</kbd>
            </button>
          </div>

          <p aria-hidden="true" className={styles.controlHint}>
            <kbd>←</kbd>
            <kbd>→</kbd> or <kbd>A</kbd>
            <kbd>D</kbd> run · <kbd>Space</kbd> jump · <kbd>Enter</kbd> opens
            the nearest pylon
          </p>
        </div>

        <div className={styles.observationBar}>
          <div className={styles.observationCopy}>
            <span className={styles.observationKicker}>
              {nearbyOrb
                ? 'Nearby observation'
                : lastDiscovery
                  ? 'Latest observation'
                  : 'Observation orbs'}
            </span>
            {activeObservation ? (
              <>
                <h3 className={styles.observationTitle}>
                  {activeObservation.title}
                </h3>
                <p className={styles.observationSummary}>
                  {activeObservation.summary}
                </p>
              </>
            ) : (
              <>
                <h3 className={styles.observationTitle}>
                  Authored concepts, floating in place
                </h3>
                <p className={styles.observationSummary}>
                  Each orb is a real concept from a published lesson. Run beneath
                  one, or jump when it sits high, to log it for this session.
                </p>
              </>
            )}
            <span className={styles.observationHint}>
              {nearbyOrb
                ? 'Move through the orb to log this observation.'
                : lastDiscovery
                  ? 'Logged this session. Discovery never changes lesson status.'
                  : 'Discovery only — this page writes nothing to the notebook.'}
            </span>
          </div>

          <div
            aria-label={`${discovered.size} of ${world.conceptCount} concepts observed this session`}
            className={styles.observationCount}
          >
            <span className={styles.observationCountNumber}>
              {two(discovered.size)}
            </span>
            <span className={styles.observationCountLabel}>
              of {two(world.conceptCount)} observed
              <em>session only</em>
            </span>
          </div>
        </div>

        <p className={styles.truthNote}>
          <strong>Notebook truth</strong>
          Stage status is read with the same derived status helpers as the
          roadmap. Observation orbs are a session-only act of looking; they are
          not completion, recall, or XP.
        </p>

        {running ? (
          <TrailLoop
            cameraX={cameraX}
            facing={facing}
            jumpY={jumpY}
            onBiome={handleBiome}
            onDiscover={handleDiscover}
            onNearbyOrb={handleNearbyOrb}
            onNearbyStage={handleNearbyStage}
            playerNodeRef={playerNodeRef}
            playerX={playerX}
            reduced={reduced}
            squashX={squashX}
            squashY={squashY}
            stateRef={stateRef}
            widthRef={widthRef}
            world={world}
          />
        ) : null}
      </div>
    );
  },
);
