import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';
import { storeCredential } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Achievements ──
interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_reaction', name: 'FIRST SPARK', desc: 'Complete your first reaction round', icon: '⚡' },
  { id: 'sub_300', name: 'QUICK DRAW', desc: 'React under 300ms', icon: '🎯' },
  { id: 'sub_200', name: 'LIGHTNING', desc: 'React under 200ms', icon: '⚡' },
  { id: 'sub_150', name: 'SUPERHUMAN', desc: 'React under 150ms', icon: '🧬' },
  { id: 'five_rounds', name: 'WARMED UP', desc: 'Complete 5 reaction rounds', icon: '🔥' },
  { id: 'memory_complete', name: 'RECALL', desc: 'Complete a memory game', icon: '🧠' },
  { id: 'memory_fast', name: 'SPEED RECALL', desc: 'Complete memory in under 30s', icon: '⏱️' },
  { id: 'memory_efficient', name: 'PERFECT MEMORY', desc: 'Complete memory in 6 moves', icon: '💎' },
];

async function storeAchievement(achievement: Achievement, stats: Record<string, any>) {
  try {
    await storeCredential('GameAchievement', {
      game: 'neural-reflex',
      achievement: achievement.id,
      name: achievement.name,
      description: achievement.desc,
      ...stats,
      unlockedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.log('Failed to store achievement:', e);
  }
}

type GameMode = 'menu' | 'reaction' | 'memory';
type ReactionPhase = 'waiting' | 'ready' | 'early' | 'go' | 'result';

// Memory card colors
const CARD_COLORS = ['#00E5FF', '#FF3366', '#00FF88', '#FFE100', '#A855F7', '#FF8800', '#3B82F6', '#FF69B4'];

export function GameScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<GameMode>('menu');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {mode === 'menu' && <MenuScreen onSelect={setMode} />}
      {mode === 'reaction' && <ReactionGame onBack={() => setMode('menu')} />}
      {mode === 'memory' && <MemoryGame onBack={() => setMode('menu')} />}
    </View>
  );
}

// ── Menu ──
function MenuScreen({ onSelect }: { onSelect: (m: GameMode) => void }) {
  return (
    <View style={styles.menu}>
      <Text style={styles.gameTitle}>NEURAL{'\n'}REFLEX</Text>
      <Text style={styles.gameSubtitle}>TRAIN YOUR SYNAPSES</Text>

      <TouchableOpacity style={styles.menuCard} onPress={() => { Haptics.impactAsync(); onSelect('reaction'); }}>
        <Text style={styles.menuCardIcon}>⚡</Text>
        <View style={styles.menuCardText}>
          <Text style={styles.menuCardTitle}>REFLEX</Text>
          <Text style={styles.menuCardDesc}>Test your reaction speed</Text>
        </View>
        <Text style={styles.menuCardArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuCard, styles.menuCardGreen]} onPress={() => { Haptics.impactAsync(); onSelect('memory'); }}>
        <Text style={styles.menuCardIcon}>🧠</Text>
        <View style={styles.menuCardText}>
          <Text style={styles.menuCardTitle}>MEMORY</Text>
          <Text style={styles.menuCardDesc}>Match the pairs</Text>
        </View>
        <Text style={styles.menuCardArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Reaction Game ──
function ReactionGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<ReactionPhase>('waiting');
  const [times, setTimes] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgAnim = useRef(new Animated.Value(0)).current;
  const unlocked = useRef(new Set<string>());

  const best = times.length > 0 ? Math.min(...times) : null;
  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  const checkAchievements = (time: number, roundNum: number) => {
    const check = (a: Achievement) => {
      if (unlocked.current.has(a.id)) return;
      unlocked.current.add(a.id);
      setToast(`${a.icon} ${a.name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      storeAchievement(a, { reactionTime: time, round: roundNum, best });
      setTimeout(() => setToast(null), 2500);
    };
    if (roundNum >= 1) check(ACHIEVEMENTS[0]); // first_reaction
    if (time < 300) check(ACHIEVEMENTS[1]); // sub_300
    if (time < 200) check(ACHIEVEMENTS[2]); // sub_200
    if (time < 150) check(ACHIEVEMENTS[3]); // sub_150
    if (roundNum >= 5) check(ACHIEVEMENTS[4]); // five_rounds
  };

  const startRound = () => {
    setPhase('ready');
    setCurrentTime(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate to red
    Animated.timing(bgAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    const delay = 1500 + Math.random() * 3500;
    timerRef.current = setTimeout(() => {
      setPhase('go');
      startRef.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.timing(bgAnim, { toValue: 2, duration: 100, useNativeDriver: false }).start();
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      startRound();
    } else if (phase === 'ready') {
      // Too early!
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('early');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.timing(bgAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    } else if (phase === 'go') {
      const elapsed = Date.now() - startRef.current;
      const newRound = round + 1;
      setCurrentTime(elapsed);
      setTimes(prev => [...prev, elapsed]);
      setRound(newRound);
      setPhase('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(bgAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
      checkAchievements(elapsed, newRound);
    } else if (phase === 'early' || phase === 'result') {
      startRound();
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [Colors.black, '#331111', '#003322'],
  });

  return (
    <Animated.View style={[styles.gameContainer, { backgroundColor: bgColor }]}>
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {toast} — STORED ON-CHAIN</Text>
        </View>
      )}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.gameHeaderTitle}>⚡ REFLEX</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="BEST" value={best ? `${best}ms` : '—'} accent />
        <StatBox label="ROUND" value={`${round}`} />
        <StatBox label="AVG" value={avg ? `${avg}ms` : '—'} />
      </View>

      <TouchableOpacity style={styles.tapArea} activeOpacity={0.8} onPress={handleTap}>
        {phase === 'waiting' && (
          <>
            <Text style={styles.tapIcon}>⚡</Text>
            <Text style={styles.tapTitle}>TAP TO START</Text>
            <Text style={styles.tapHint}>Test your reaction speed</Text>
          </>
        )}
        {phase === 'ready' && (
          <>
            <Text style={styles.tapIcon}>🔴</Text>
            <Text style={[styles.tapTitle, { color: Colors.magenta }]}>WAIT...</Text>
            <Text style={styles.tapHint}>Tap when it turns green</Text>
          </>
        )}
        {phase === 'go' && (
          <>
            <Text style={styles.tapIcon}>🟢</Text>
            <Text style={[styles.tapTitle, { color: Colors.green }]}>TAP NOW!</Text>
          </>
        )}
        {phase === 'early' && (
          <>
            <Text style={styles.tapIcon}>❌</Text>
            <Text style={[styles.tapTitle, { color: Colors.magenta }]}>TOO EARLY</Text>
            <Text style={styles.tapHint}>Tap to try again</Text>
          </>
        )}
        {phase === 'result' && (
          <>
            <Text style={styles.resultTime}>{currentTime}ms</Text>
            <Text style={[styles.tapHint, { color: (currentTime || 999) < 200 ? Colors.green : (currentTime || 999) < 350 ? Colors.cyan : Colors.amber }]}>
              {(currentTime || 999) < 150 ? 'INSANE' : (currentTime || 999) < 200 ? 'EXCELLENT' : (currentTime || 999) < 300 ? 'GOOD' : 'KEEP GOING'}
            </Text>
            <Text style={styles.tapHint}>Tap to go again</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Memory Game ──
function MemoryGame({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<{ id: number; color: string; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const locked = useRef(false);
  const unlocked = useRef(new Set<string>());

  const initGame = useCallback(() => {
    const pairs = CARD_COLORS.slice(0, 6);
    const deck = [...pairs, ...pairs]
      .sort(() => Math.random() - 0.5)
      .map((color, i) => ({ id: i, color, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setElapsed(0);
    locked.current = false;
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // Timer
  useEffect(() => {
    if (!gameStarted || matches === 6) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 100);
    return () => clearInterval(iv);
  }, [gameStarted, startTime, matches]);

  const flipCard = (id: number) => {
    if (locked.current) return;
    if (flipped.includes(id)) return;
    if (cards[id].matched) return;

    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      locked.current = true;

      if (cards[newFlipped[0]].color === cards[newFlipped[1]].color) {
        // Match!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            newFlipped.includes(i) ? { ...c, matched: true } : c
          ));
          setFlipped([]);
          setMatches(m => {
            const newM = m + 1;
            if (newM === 6) {
              // Game complete — check achievements
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const finalTime = Math.floor((Date.now() - startTime) / 1000);
              const finalMoves = moves + 1;
              const showAch = (a: Achievement) => {
                if (unlocked.current.has(a.id)) return;
                unlocked.current.add(a.id);
                setToast(`${a.icon} ${a.name}`);
                storeAchievement(a, { moves: finalMoves, time: finalTime });
                setTimeout(() => setToast(null), 2500);
              };
              showAch(ACHIEVEMENTS[5]); // memory_complete
              if (finalTime < 30) setTimeout(() => showAch(ACHIEVEMENTS[6]), 2600); // memory_fast
              if (finalMoves <= 6) setTimeout(() => showAch(ACHIEVEMENTS[7]), 5200); // memory_efficient
            }
            return newM;
          });
          locked.current = false;
        }, 400);
      } else {
        // No match
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setTimeout(() => {
          setFlipped([]);
          locked.current = false;
        }, 800);
      }
    }
  };

  const isComplete = matches === 6;
  const CARD_SIZE = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.sm * 3) / 4;

  return (
    <View style={styles.gameContainer}>
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {toast} — STORED ON-CHAIN</Text>
        </View>
      )}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.gameHeaderTitle}>🧠 MEMORY</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="MOVES" value={`${moves}`} accent />
        <StatBox label="PAIRS" value={`${matches}/6`} />
        <StatBox label="TIME" value={`${elapsed}s`} />
      </View>

      {isComplete ? (
        <View style={styles.tapArea}>
          <Text style={styles.tapIcon}>🎉</Text>
          <Text style={[styles.tapTitle, { color: Colors.green }]}>COMPLETE!</Text>
          <Text style={styles.resultTime}>{moves} moves • {elapsed}s</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={initGame}>
            <Text style={styles.playAgainText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardGrid}>
          {cards.map((card, i) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { width: CARD_SIZE, height: CARD_SIZE * 1.2 },
                (flipped.includes(i) || card.matched) && { backgroundColor: card.color, borderColor: card.color },
                card.matched && { opacity: 0.4 },
              ]}
              onPress={() => flipCard(i)}
              activeOpacity={0.7}
            >
              {(flipped.includes(i) || card.matched) ? (
                <Text style={styles.cardEmoji}>
                  {card.matched ? '✓' : '●'}
                </Text>
              ) : (
                <Text style={styles.cardBack}>?</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isComplete && !gameStarted && (
        <Text style={styles.memoryHint}>Tap cards to find matching pairs</Text>
      )}
    </View>
  );
}

// ── Stat Box ──
function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.statBox, accent && styles.statBoxAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: Colors.cyan }]}>{value}</Text>
    </View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  // Menu
  menu: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  gameTitle: {
    fontFamily: Fonts.display,
    fontSize: 52,
    color: Colors.white,
    lineHeight: 56,
    marginBottom: Spacing.sm,
  },
  gameSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 3,
    marginBottom: Spacing.xxxl,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.cyanAlpha(0.3),
    backgroundColor: Colors.cyanAlpha(0.05),
    marginBottom: Spacing.lg,
  },
  menuCardGreen: {
    borderColor: Colors.greenAlpha(0.3),
    backgroundColor: Colors.greenAlpha(0.05),
  },
  menuCardIcon: {
    fontSize: 28,
    marginRight: Spacing.lg,
  },
  menuCardText: {
    flex: 1,
  },
  menuCardTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
    letterSpacing: 2,
  },
  menuCardDesc: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuCardArrow: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xl,
    color: Colors.textTertiary,
  },
  // Game shared
  gameContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  gameHeaderTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statBoxAccent: {
    borderColor: Colors.cyanAlpha(0.3),
    backgroundColor: Colors.cyanAlpha(0.05),
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  // Tap area (reaction)
  tapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  tapIcon: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  tapTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  resultTime: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: Colors.cyan,
    marginBottom: Spacing.md,
  },
  // Memory
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.textTertiary,
  },
  cardEmoji: {
    fontSize: 28,
    color: Colors.white,
  },
  memoryHint: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  playAgainBtn: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.cyan,
  },
  playAgainText: {
    fontFamily: Fonts.display,
    fontSize: FontSize.sm,
    color: Colors.cyan,
    letterSpacing: 2,
  },
  // Toast
  toast: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.greenAlpha(0.15),
    borderBottomWidth: 1,
    borderBottomColor: Colors.green,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  toastText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.green,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
