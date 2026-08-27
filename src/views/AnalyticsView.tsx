import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Film,
  Calendar,
  Sparkles,
  Trophy,
  ArrowUpRight,
  Info,
  Layers,
} from 'lucide-react';
import {
  formatMinutesDisplay,
  formatSecondsDigital,
  formatSecondsHuman,
  formatCurrency,
} from '../lib/calculations';

export const AnalyticsView: React.FC = () => {
  const {
    contract,
    videos,
    progress,
    analytics,
    monthlyStats,
  } = useApp();

  // Prepare chart data
  const chartData = monthlyStats.map((stat) => ({
    name: stat.monthLabel.split(' ')[0], // e.g. "August"
    fullName: stat.monthLabel,
    minutes: Math.round(stat.totalMinutes * 10) / 10,
    videos: stat.videoCount,
    percentage: Math.round(stat.percentageOfReference),
  }));

  return (
    <div id="analytics-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Productivity &amp; Production Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical production pacing, average video runtimes, and contract completion forecast
          </p>
        </div>
      </div>

      {/* Hero Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Monthly Production */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Avg Monthly Production</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {formatMinutesDisplay(analytics.averageMonthlyMinutes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {analytics.activeMonthsCount} recorded active {analytics.activeMonthsCount === 1 ? 'month' : 'months'}
          </p>
        </div>

        {/* Average Video Duration */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Avg Video Duration</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {analytics.averageVideoDurationFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total of {analytics.totalVideos} videos edited
          </p>
        </div>

        {/* Estimated Months Remaining */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Forecast Remaining</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {analytics.estimatedMonthsRemainingFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {progress.isContractCompleted
              ? 'Goal reached'
              : `At ${formatMinutesDisplay(analytics.averageMonthlyMinutes)}/month pace`}
          </p>
        </div>

        {/* Highest Month */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Peak Production Month</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {analytics.highestProductionMonth ? formatMinutesDisplay(analytics.highestProductionMonth.totalMinutes) : '0 min'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {analytics.highestProductionMonth ? analytics.highestProductionMonth.monthLabel : 'No data'}
          </p>
        </div>
      </div>

      {/* Monthly Production Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-100">Monthly Completed Editing Runtime</h2>
            <p className="text-xs text-slate-400">
              Productivity analysis vs the 90-minute reference monthly target (Green dashed line)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Completed Minutes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-emerald-400" />
              <span className="text-slate-400">90m Target</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No completed video records to display in chart
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-slate-100">{data.fullName}</p>
                          <p className="text-emerald-400 font-mono font-semibold">
                            Runtime: {data.minutes} minutes ({data.percentage}% of reference target)
                          </p>
                          <p className="text-slate-400">Videos Completed: {data.videos}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={contract.monthly_reference_minutes}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.minutes >= contract.monthly_reference_minutes ? '#10b981' : '#38bdf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Production Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Longest Video */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Film className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Longest Single Video</span>
          </div>
          {analytics.longestVideo ? (
            <div>
              <p className="text-sm font-bold text-slate-100">{analytics.longestVideo.title}</p>
              <p className="text-xs font-mono text-emerald-400 mt-1">
                Runtime: {formatSecondsDigital(analytics.longestVideo.duration_seconds, true)} ({formatSecondsHuman(analytics.longestVideo.duration_seconds)}) • {analytics.longestVideo.completion_date}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No videos recorded</p>
          )}
        </div>

        {/* Shortest Video */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Film className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">Shortest Single Video</span>
          </div>
          {analytics.shortestVideo ? (
            <div>
              <p className="text-sm font-bold text-slate-100">{analytics.shortestVideo.title}</p>
              <p className="text-xs font-mono text-sky-400 mt-1">
                Runtime: {formatSecondsDigital(analytics.shortestVideo.duration_seconds, true)} ({formatSecondsHuman(analytics.shortestVideo.duration_seconds)}) • {analytics.shortestVideo.completion_date}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No videos recorded</p>
          )}
        </div>
      </div>

      {/* Detailed Monthly History Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Monthly Production Breakdown</h2>
            <p className="text-xs text-slate-400">
              Calendar month performance, milestone threshold crossings, and minute carry-overs
            </p>
          </div>
        </div>

        {monthlyStats.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No monthly records available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4">Videos</th>
                  <th className="py-3.5 px-4 font-mono">Produced Runtime</th>
                  <th className="py-3.5 px-4 font-mono">% of 90m Ref</th>
                  <th className="py-3.5 px-4 font-mono">Avg Duration</th>
                  <th className="py-3.5 px-4">Milestones Reached</th>
                  <th className="py-3.5 px-4 font-mono">Carried Forward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {monthlyStats.map((stat) => (
                  <tr key={stat.monthKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-100">
                      {stat.monthLabel}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {stat.videoCount}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-200">
                      {formatMinutesDisplay(stat.totalMinutes)}
                      <span className="text-[11px] text-slate-400 block font-normal">
                        {formatSecondsDigital(stat.totalSeconds, true)}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className={`font-bold ${
                        stat.percentageOfReference >= 100 ? 'text-emerald-400' : 'text-sky-400'
                      }`}>
                        {Math.round(stat.percentageOfReference)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {formatSecondsHuman(stat.averageVideoDurationSeconds)}
                    </td>

                    <td className="py-4 px-4">
                      {stat.milestonesCompletedInMonth.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {stat.milestonesCompletedInMonth.map((mNum) => (
                            <span
                              key={mNum}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold"
                            >
                              <Trophy className="w-3 h-3" /> #{mNum} (+{formatCurrency(contract.milestone_payment)})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None in month</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      <span className="font-semibold text-emerald-400">
                        {formatMinutesDisplay(stat.carryOverMinutesToNextMonth)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        toward next milestone
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
