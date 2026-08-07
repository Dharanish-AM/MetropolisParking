import { useState } from 'react';
import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { getRevenueAnalytics } from '../../api/endpoints/analytics';
import type { AnalyticsResponse } from '../../api/endpoints/analytics';
import { useLots } from '../lots/hooks';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  Car,
  PieChart,
  BarChart3,
  Activity,
} from 'lucide-react';

export const AnalyticsFeature: FC = () => {
  const { data: lots } = useLots();
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['revenueAnalytics', selectedLotId],
    queryFn: () => getRevenueAnalytics(selectedLotId || undefined),
  });

  const renderTrendChart = (points: AnalyticsResponse['trendPoints']) => {
    if (!points || points.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-neutral-secondary text-sm">
          No historical trend data available yet.
        </div>
      );
    }

    const maxRev = Math.max(...points.map(p => p.revenue), 100);
    const height = 200;
    const width = 600;
    const padding = 40;

    const pointsCoords = points.map((p, i) => {
      const x = padding + (i / Math.max(points.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - (p.revenue / maxRev) * (height - 2 * padding);
      return { x, y, date: p.date, rev: p.revenue, sessions: p.sessionCount };
    });

    const pathD = pointsCoords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 font-sans">
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5f59ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5f59ff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = height - padding - ratio * (height - 2 * padding);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-neutral-400 font-medium"
                >
                  ₹{Math.round(ratio * maxRev)}
                </text>
              </g>
            );
          })}

          {pointsCoords.length > 1 && (
            <path
              d={`${pathD} L ${pointsCoords[pointsCoords.length - 1].x} ${height - padding} L ${pointsCoords[0].x} ${height - padding} Z`}
              fill="url(#revenueGrad)"
            />
          )}

          <path
            d={pathD}
            fill="none"
            stroke="#5f59ff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pointsCoords.map((pt, i) => {
            const step = Math.max(1, Math.floor(pointsCoords.length / 6));
            const showLabel = i % step === 0 || i === pointsCoords.length - 1;
            return (
              <g key={i} className="group cursor-pointer">
                <circle cx={pt.x} cy={pt.y} r="4" fill="#5f59ff" stroke="#ffffff" strokeWidth="2" />
                {showLabel && (
                  <text
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="text-[11px] fill-neutral-500 font-semibold"
                  >
                    {pt.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-primary stroke-[2.25]" />
            Revenue & Occupancy Analytics
          </h1>
          <p className="text-sm text-neutral-secondary">
            Real-time financial performance, lot breakdowns, and yield management analytics.
          </p>
        </div>

        <div className="w-64">
          <Select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)}>
            <option value="">All Parking Lots</option>
            {lots?.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-brand-lavender/40 border border-brand-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-secondary">Total Revenue</p>
                <h3 className="text-2xl font-extrabold text-brand-primary mt-1">
                  ₹
                  {(analytics?.summary.totalRevenue || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-xs">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-emerald-50/50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-secondary">Today's Revenue</p>
                <h3 className="text-2xl font-extrabold text-emerald-950 mt-1">
                  ₹
                  {(analytics?.summary.todayRevenue || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="p-3 bg-status-available text-white rounded-2xl shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-sky-50/50 border border-sky-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-secondary">
                  Total Completed Sessions
                </p>
                <h3 className="text-2xl font-extrabold text-sky-950 mt-1">
                  {analytics?.summary.totalSessions || 0}
                </h3>
              </div>
              <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-xs">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-purple-50/50 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-secondary">Avg Session Fee</p>
                <h3 className="text-2xl font-extrabold text-purple-950 mt-1">
                  ₹{(analytics?.summary.avgSessionFee || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-neutral-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              Revenue Trend (Daily Time-Series)
            </h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            renderTrendChart(analytics?.trendPoints || [])
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-primary mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Revenue by Vehicle Type
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.vehicleBreakdown?.map(item => (
                <div key={item.vehicleType} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-primary flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-neutral-500" />
                      {item.vehicleType}
                    </span>
                    <span className="text-neutral-secondary">
                      ₹{item.totalRevenue.toFixed(2)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )) || (
                <p className="text-xs text-neutral-secondary text-center py-4">
                  No vehicle breakdown available
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-neutral-primary mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          Revenue Distribution Across Parking Lots
        </h3>

        {isLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics?.lotBreakdown?.map(lot => (
              <div
                key={lot.lotId}
                className="p-4 rounded-xl border border-neutral-border bg-neutral-50/50"
              >
                <p className="text-xs font-semibold text-neutral-secondary truncate">
                  {lot.lotName}
                </p>
                <p className="text-xl font-extrabold text-neutral-primary mt-1">
                  ₹{lot.totalRevenue.toFixed(2)}
                </p>
                <span className="text-[11px] text-neutral-secondary mt-1 inline-block font-medium">
                  {lot.sessionCount} Completed Sessions
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
