import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../lib/quiz';
import type { I18nDictionary } from './constants';
import type { ExamMode, PracticeAction } from './types';
import {
  calculateDashboardStats,
  getBookmarkedQuestions,
  getWeakQuestions,
  sampleWeakDrillQuestions,
  sampleBookmarkedQuestions,
  downloadStudyProgressFile,
  importStudyProgressJson,
  clearAllStudyProgress,
  setQuestionBookmark,
  isPersistentStorageSupported,
  recordLastStudiedSession,
  getLastStudiedSession,
  EVENT_PROGRESS_UPDATED,
  EVENT_BOOKMARKS_CHANGED,
  EVENT_STREAK_UPDATED,
  type StudyDashboardStats,
  type LastStudiedState,
} from '../../lib/study-progress';

interface StudyDashboardProps {
  allQuestions: Question[];
  t: I18nDictionary;
  currentLocale: string;
  dispatch: React.Dispatch<PracticeAction>;
  onStartExam: (mode: ExamMode, categoryId: number | null) => void;
}

export default function StudyDashboard({
  allQuestions,
  t,
  currentLocale,
  dispatch,
  onStartExam,
}: StudyDashboardProps) {
  const [stats, setStats] = useState<StudyDashboardStats>(() =>
    calculateDashboardStats(allQuestions),
  );
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  const [showWeakList, setShowWeakList] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importNotice, setImportNotice] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  const [lastStudied, setLastStudied] = useState<LastStudiedState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh stats on storage updates or mounts
  const refreshStats = () => {
    setStats(calculateDashboardStats(allQuestions));
    setLastStudied(getLastStudiedSession());
  };

  useEffect(() => {
    refreshStats();

    const handleUpdate = () => refreshStats();
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_PROGRESS_UPDATED, handleUpdate);
      window.addEventListener(EVENT_BOOKMARKS_CHANGED, handleUpdate);
      window.addEventListener(EVENT_STREAK_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_PROGRESS_UPDATED, handleUpdate);
        window.removeEventListener(EVENT_BOOKMARKS_CHANGED, handleUpdate);
        window.removeEventListener(EVENT_STREAK_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [allQuestions]);

  const weakCandidates = getWeakQuestions(allQuestions);
  const bookmarkedQuestions = getBookmarkedQuestions(allQuestions);
  const persistentSupported = isPersistentStorageSupported();

  // Handlers
  const handleStartWeakDrill = () => {
    const sampled = sampleWeakDrillQuestions(allQuestions, 20);
    if (sampled.length === 0) return;

    recordLastStudiedSession({
      mode: 'weak_drill',
      categoryId: null,
      label: t.weakDrillTitle,
      timestamp: Date.now(),
    });

    dispatch({
      type: 'START_EXAM',
      payload: {
        questions: sampled,
        mode: 'weak_drill',
        selectedCategory: null,
      },
    });
  };

  const handleStartBookmarkedDrill = () => {
    const sampled = sampleBookmarkedQuestions(allQuestions, 20);
    if (sampled.length === 0) return;

    recordLastStudiedSession({
      mode: 'bookmarked_drill',
      categoryId: null,
      label: t.bookmarksTitle,
      timestamp: Date.now(),
    });

    dispatch({
      type: 'START_EXAM',
      payload: {
        questions: sampled,
        mode: 'bookmarked_drill',
        selectedCategory: null,
      },
    });
  };

  const handleExport = () => {
    downloadStudyProgressFile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importStudyProgressJson(content);
        if (res.success) {
          setImportNotice({
            text: t.importSuccess(res.questionCount ?? 0),
            isError: false,
          });
          refreshStats();
          setTimeout(() => {
            setShowImportModal(false);
            setImportNotice(null);
            setImportJsonText('');
          }, 1500);
        } else {
          setImportNotice({
            text: res.error || 'Failed to import JSON',
            isError: true,
          });
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleManualImport = () => {
    if (!importJsonText.trim()) return;
    const res = importStudyProgressJson(importJsonText.trim());
    if (res.success) {
      setImportNotice({
        text: t.importSuccess(res.questionCount ?? 0),
        isError: false,
      });
      refreshStats();
      setTimeout(() => {
        setShowImportModal(false);
        setImportNotice(null);
        setImportJsonText('');
      }, 1500);
    } else {
      setImportNotice({
        text: res.error || 'Failed to import JSON',
        isError: true,
      });
    }
  };

  const handleReset = () => {
    if (window.confirm(t.resetConfirm)) {
      clearAllStudyProgress();
      refreshStats();
    }
  };

  const cat1 = stats.byCategory[1];
  const cat2 = stats.byCategory[2];

  return (
    <div className="space-y-6">
      {/* 1. Daily Streak & Quick Habit Banner */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-white text-2xl shadow-xs">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-amber-950 sm:text-lg">
                  {t.studyStreakBadge(stats.streak.currentStreak)}
                </span>
                {stats.streak.longestStreak > 1 && (
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                    {t.streakLongest(stats.streak.longestStreak)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-amber-800">
                {stats.practicedToday ? t.streakActiveToday : t.streakKeepGoing}
              </p>
            </div>
          </div>

          {/* Quick study coverage badge */}
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs backdrop-blur-xs">
            <span className="text-slate-500">Coverage:</span>
            <span className="font-mono font-black text-blue-700">
              {stats.seenQuestions} / {stats.totalQuestions}
            </span>
            <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-800">
              {stats.coveragePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Private Browsing Warning if applicable */}
      {!persistentSupported && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed font-semibold text-amber-900 shadow-2xs">
          ⚠️ {t.privateBrowsingNotice}
        </div>
      )}

      {/* 2. Primary Study Habit Action Cards: Weak Drill & Bookmarks */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Card A: Weak-Question Drill (Single most useful study feature) */}
        <div className="relative flex flex-col justify-between rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 p-5 shadow-sm transition hover:border-rose-400">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-black tracking-wide text-white uppercase shadow-2xs">
                <span>🎯</span>
                <span>{t.weakDrillTitle}</span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                  weakCandidates.length > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {weakCandidates.length > 0
                  ? `${weakCandidates.length} Missed`
                  : '0 Missed'}
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
              {t.weakDrillDesc}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {weakCandidates.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handleStartWeakDrill}
                  className="flex min-h-[46px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 sm:text-sm"
                >
                  <span>🔥</span>
                  <span>{t.weakDrillAction(weakCandidates.length)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWeakList(!showWeakList)}
                  className="w-full text-center text-xs font-bold text-rose-700 hover:underline"
                >
                  {showWeakList
                    ? 'Hide weak questions list'
                    : `Inspect ${weakCandidates.length} weak questions list →`}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white/80 p-3 text-center text-xs font-semibold text-slate-600">
                {stats.seenQuestions > 0
                  ? t.weakDrillAllGood
                  : t.weakDrillEmpty}
              </div>
            )}
          </div>
        </div>

        {/* Card B: Bookmarked Questions */}
        <div className="relative flex flex-col justify-between rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 p-5 shadow-sm transition hover:border-sky-400">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-700 px-3 py-1 text-xs font-black tracking-wide text-white uppercase shadow-2xs">
                <span>🔖</span>
                <span>{t.bookmarksTitle}</span>
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-extrabold text-sky-800">
                {bookmarkedQuestions.length} Saved
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
              {t.bookmarksDesc}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {bookmarkedQuestions.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handleStartBookmarkedDrill}
                  className="flex min-h-[46px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-sm transition hover:bg-sky-800 active:scale-95 sm:text-sm"
                >
                  <span>✨</span>
                  <span>{t.bookmarksAction(bookmarkedQuestions.length)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookmarksList(!showBookmarksList)}
                  className="w-full text-center text-xs font-bold text-sky-700 hover:underline"
                >
                  {showBookmarksList
                    ? t.hideBookmarks
                    : `${t.manageBookmarks} →`}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white/80 p-3 text-center text-xs font-semibold text-slate-600">
                {t.bookmarksEmpty}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Questions Preview Drawer */}
      {showWeakList && weakCandidates.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900">
              Questions Most Frequently Missed ({weakCandidates.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowWeakList(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕ Close
            </button>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {weakCandidates.map(
              ({ question: q, progress: p, weaknessScore }) => {
                const trans =
                  q.translations[currentLocale] || q.translations.en;
                const misses = p.timesSeen - p.timesCorrect;
                return (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs transition hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-800">
                          Missed {misses}x / {p.timesSeen} seen
                        </span>
                        <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {q.category_id === 1 ? 'Rules' : 'Signs'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 font-semibold text-slate-800">
                        {trans?.question}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-[11px] font-bold text-rose-700">
                        Score {Math.round(weaknessScore)}
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Bookmarked Questions Preview Drawer */}
      {showBookmarksList && bookmarkedQuestions.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900">
              {t.savedBookmarksList} ({bookmarkedQuestions.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowBookmarksList(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕ Close
            </button>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {bookmarkedQuestions.map((q) => {
              const trans = q.translations[currentLocale] || q.translations.en;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs transition hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-black text-sky-800">
                      {q.category_id === 1 ? 'Traffic Rules' : 'Road Signs'}
                    </span>
                    <p className="mt-1 line-clamp-2 font-semibold text-slate-800">
                      {trans?.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionBookmark(q.id, false);
                      refreshStats();
                    }}
                    className="shrink-0 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    title={t.removeBookmark}
                  >
                    ✕ {t.removeBookmark}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Resume Study Card (if last studied session exists and no active exam) */}
      {lastStudied && (
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
              {t.resumeStudy}
            </span>
            <p className="mt-0.5 text-xs font-bold text-slate-800 sm:text-sm">
              {lastStudied.label ||
                (lastStudied.mode === 'mock_exam'
                  ? t.modeMockExam
                  : t.modePractice)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (lastStudied.mode === 'weak_drill') {
                handleStartWeakDrill();
              } else if (lastStudied.mode === 'bookmarked_drill') {
                handleStartBookmarkedDrill();
              } else {
                onStartExam(lastStudied.mode, lastStudied.categoryId);
              }
            }}
            className="inline-flex min-h-[42px] cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-extrabold text-slate-900 shadow-2xs transition hover:bg-slate-900 hover:text-white active:scale-95 sm:text-sm"
          >
            <span>▶</span>
            <span>{t.resumeStudyBtn(lastStudied.label || 'Last Session')}</span>
          </button>
        </div>
      )}

      {/* 4. Complete Dashboard: Coverage & Per-Category Breakdown */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              {t.dashboardTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-600">
              {t.dashboardDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-stone-50 active:scale-95"
              title="Download your progress as JSON"
            >
              <span>💾</span>
              <span className="hidden sm:inline">{t.exportProgress}</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-stone-50 active:scale-95"
              title="Restore progress from JSON"
            >
              <span>📂</span>
              <span className="hidden sm:inline">{t.importProgress}</span>
              <span className="sm:hidden">Import</span>
            </button>
          </div>
        </div>

        {/* Big 4 Status Metrics Tally */}
        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
            <span className="text-2xl font-black text-emerald-700 sm:text-3xl">
              {stats.masteredCount}
            </span>
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-black text-emerald-800 uppercase">
              <span>🟢</span>
              <span>{t.mastered}</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-center">
            <span className="text-2xl font-black text-amber-700 sm:text-3xl">
              {stats.learningCount}
            </span>
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-black text-amber-800 uppercase">
              <span>🟡</span>
              <span>{t.learning}</span>
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-center">
            <span className="text-2xl font-black text-rose-700 sm:text-3xl">
              {stats.weakCount}
            </span>
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-black text-rose-800 uppercase">
              <span>🔴</span>
              <span>{t.weak}</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 text-center">
            <span className="text-2xl font-black text-slate-600 sm:text-3xl">
              {stats.unseenCount}
            </span>
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-black text-slate-500 uppercase">
              <span>⚪</span>
              <span>{t.unseen}</span>
            </div>
          </div>
        </div>

        {/* Global Bank Progress Bar */}
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{t.overallCoverage}</span>
            <span className="font-mono text-blue-700">
              {t.coverageOfTotal(
                stats.seenQuestions,
                stats.totalQuestions,
                stats.coveragePercent,
              )}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100 p-0.5 ring-1 ring-stone-200">
            <div className="flex h-full overflow-hidden rounded-full">
              <div
                style={{
                  width: `${(stats.masteredCount / stats.totalQuestions) * 100}%`,
                }}
                className="bg-emerald-500 transition-all duration-300"
                title={`${stats.masteredCount} Mastered`}
              />
              <div
                style={{
                  width: `${(stats.learningCount / stats.totalQuestions) * 100}%`,
                }}
                className="bg-amber-400 transition-all duration-300"
                title={`${stats.learningCount} Learning`}
              />
              <div
                style={{
                  width: `${(stats.weakCount / stats.totalQuestions) * 100}%`,
                }}
                className="bg-rose-500 transition-all duration-300"
                title={`${stats.weakCount} Weak`}
              />
            </div>
          </div>
        </div>

        {/* Per-Category Breakdown Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Category 1: Traffic Rules */}
          {cat1 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 uppercase">
                  <span>🚦</span>
                  <span>{t.rulesCategory}</span>
                </span>
                <span className="font-mono text-xs font-extrabold text-amber-800">
                  {cat1.seenQuestions} / {cat1.totalQuestions} (
                  {cat1.coveragePercent}%)
                </span>
              </div>

              <div className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${cat1.coveragePercent}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                <div className="rounded-md bg-white/80 p-1 text-emerald-800">
                  <div>{cat1.masteredCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Mast.
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-amber-800">
                  <div>{cat1.learningCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Learn
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-rose-800">
                  <div>{cat1.weakCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Weak
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-slate-700">
                  <div>{cat1.accuracyPercent}%</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Acc.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category 2: Road Signs */}
          {cat2 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/30 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-black text-sky-900 uppercase">
                  <span>🛑</span>
                  <span>{t.signsCategory}</span>
                </span>
                <span className="font-mono text-xs font-extrabold text-sky-800">
                  {cat2.seenQuestions} / {cat2.totalQuestions} (
                  {cat2.coveragePercent}%)
                </span>
              </div>

              <div className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-sky-600"
                  style={{ width: `${cat2.coveragePercent}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                <div className="rounded-md bg-white/80 p-1 text-emerald-800">
                  <div>{cat2.masteredCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Mast.
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-amber-800">
                  <div>{cat2.learningCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Learn
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-rose-800">
                  <div>{cat2.weakCount}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Weak
                  </div>
                </div>
                <div className="rounded-md bg-white/80 p-1 text-slate-700">
                  <div>{cat2.accuracyPercent}%</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Acc.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions: Reset data */}
        <div className="mt-5 flex items-center justify-end border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-stone-400 hover:text-rose-600 hover:underline"
          >
            {t.resetProgress}
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {t.importModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportNotice(null);
                }}
                className="text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-600">{t.importModalDesc}</p>

            {importNotice && (
              <div
                className={`my-3 rounded-xl p-3 text-xs font-bold ${
                  importNotice.isError
                    ? 'border border-rose-300 bg-rose-50 text-rose-800'
                    : 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                }`}
              >
                {importNotice.text}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-2 text-xs font-extrabold text-slate-800 hover:border-slate-500 hover:bg-stone-100"
                >
                  <span>📁</span>
                  <span>{t.uploadFileBtn}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t.pasteJsonLabel}
                </label>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"version":1,"questions":{...}}'
                  className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 font-mono text-xs text-slate-800 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-stone-100"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleManualImport}
                  disabled={!importJsonText.trim()}
                  className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50"
                >
                  {t.confirmImportBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
