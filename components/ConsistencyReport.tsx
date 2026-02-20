'use client';

function scoreColor(score: number) {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400';
  if (score >= 0.5) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}

function PassBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">✓</span>
  ) : (
    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">✗</span>
  );
}

export default function ConsistencyReport({ report }: { report: any }) {
  const score: number = report.score ?? 0;
  const pct = Math.round(score * 100);

  return (
    <div className="space-y-5">
      {/* 종합 점수 */}
      <div className="flex items-center gap-4">
        <span className={`text-4xl font-extrabold tabular-nums ${scoreColor(score)}`}>{pct}점</span>
        <div className="flex-1">
          <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score >= 0.8 ? 'bg-green-500' : score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {score >= 0.8 ? '스토리 일관성이 우수합니다.' : score >= 0.5 ? '일부 문제가 발견되었습니다.' : '심각한 일관성 문제가 있습니다.'}
          </p>
        </div>
      </div>

      {/* 캐릭터 */}
      {report.report?.character_checks?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            👥 캐릭터 ({report.report.character_checks.filter((c: any) => c.passed).length}/{report.report.character_checks.length} 통과)
          </p>
          <div className="flex flex-wrap gap-2">
            {report.report.character_checks.map((c: any) => (
              <div
                key={c.name}
                className={`px-3 py-2 rounded-lg text-sm border ${c.passed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <PassBadge passed={c.passed} />
                  <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                </div>
                {c.issues?.length > 0 && (
                  <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5 list-disc list-inside">
                    {c.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 세계관 */}
      {report.report?.world_checks && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">🌍 세계관</p>
          <div className={`px-3 py-2 rounded-lg text-sm border ${report.report.world_checks.passed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}
          >
            {report.report.world_checks.passed
              ? '이상 없음'
              : (report.report.world_checks.issues || []).map((issue: string, i: number) => (
                  <p key={i} className="flex gap-1"><span>•</span><span>{issue}</span></p>
                ))}
          </div>
        </div>
      )}

      {/* 플롯 */}
      {report.report?.plot_checks && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">📖 플롯</p>
          <div className={`px-3 py-2 rounded-lg text-sm border ${report.report.plot_checks.passed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}
          >
            {report.report.plot_checks.passed
              ? '이상 없음'
              : (report.report.plot_checks.issues || []).map((issue: string, i: number) => (
                  <p key={i} className="flex gap-1"><span>•</span><span>{issue}</span></p>
                ))}
          </div>
        </div>
      )}

      {/* 권고사항 */}
      {report.recommendations?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">💡 권고사항</p>
          <ul className="space-y-1.5">
            {report.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 rounded-lg">
                <span className="font-bold flex-shrink-0">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
