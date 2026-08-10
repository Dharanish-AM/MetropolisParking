import { useState } from 'react';
import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
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
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    rev: number;
    sessions: number;
  } | null>(null);

  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['revenueAnalytics', selectedLotId],
    queryFn: () => getRevenueAnalytics(selectedLotId || undefined),
  });

  const renderTrendChart = (points: AnalyticsResponse['trendPoints']) => {
    if (!points || points.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title="No revenue data"
          description="No historical revenue points available."
        />
      );
    }

    const maxRev = Math.max(...points.map(p => p.revenue), 100);
    const height = 200;
    const width = 600;
    const padding = 35;

    const pointsCoords = points.map((p, i) => {
      const x = padding + (i / Math.max(points.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - (p.revenue / maxRev) * (height - 2 * padding);
      return { x, y, date: p.date, rev: p.revenue, sessions: p.sessionCount };
    });

    const pathD = pointsCoords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div className="w-full relative">
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-60 font-sans select-none">
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map(ratio => {
              const y = height - padding - ratio * (height - 2 * padding);
              return (
                <g key={ratio}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="var(--color-neutral-border)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padding - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-neutral-secondary font-medium"
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
              stroke="var(--color-brand-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {pointsCoords.map((pt, i) => {
              const step = Math.max(1, Math.floor(pointsCoords.length / 6));
              const showLabel = i % step === 0 || i === pointsCoords.length - 1;
              const isHovered = hoveredPoint?.date === pt.date;

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? '5' : '3'}
                    fill="var(--color-brand-primary)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={height - 8}
                      textAnchor="middle"
                      className="text-[10px] fill-neutral-secondary font-medium"
                    >
                      {pt.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {hoveredPoint && (
          <div className="absolute top-2 right-2 px-3 py-1.5 bg-white border border-neutral-border rounded-lg shadow-xs text-xs pointer-events-none z-10 flex gap-3 items-center">
            <span className="text-neutral-secondary font-medium">{hoveredPoint.date}</span>
            <span className="font-bold text-brand-primary">
              ₹{hoveredPoint.rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-neutral-secondary">({hoveredPoint.sessions} sessions)</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-primary">
            Revenue &amp; Occupancy Analytics
          </h1>
          <p className="text-neutral-secondary text-xs font-medium mt-0.5">
            Financial metrics and parking lot revenue breakdowns.
          </p>
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedLotId}
            onChange={e => setSelectedLotId(e.target.value)}
          >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-secondary">Total Revenue</p>
                <h3 className="text-xl font-bold text-neutral-primary mt-1">
                  ₹
                  {(analytics?.summary.totalRevenue || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="p-2 bg-neutral-subtle text-neutral-secondary rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-secondary">Today's Revenue</p>
                <h3 className="text-xl font-bold text-neutral-primary mt-1">
                  ₹
                  {(analytics?.summary.todayRevenue || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="p-2 bg-neutral-subtle text-neutral-secondary rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-secondary">Completed Sessions</p>
                <h3 className="text-xl font-bold text-neutral-primary mt-1">
                  {analytics?.summary.totalSessions || 0}
                </h3>
              </div>
              <div className="p-2 bg-neutral-subtle text-neutral-secondary rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-secondary">Avg Session Fee</p>
                <h3 className="text-xl font-bold text-neutral-primary mt-1">
                  ₹{(analytics?.summary.avgSessionFee || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-2 bg-neutral-subtle text-neutral-secondary rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              Revenue Trend
            </h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-56" />
          ) : (
            renderTrendChart(analytics?.trendPoints || [])
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-neutral-primary mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-primary" />
            Revenue by Vehicle Type
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : !analytics?.vehicleBreakdown || analytics.vehicleBreakdown.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No data"
              description="No vehicle breakdown available."
            />
          ) : (
            <div className="space-y-3">
              {analytics.vehicleBreakdown.map(item => (
                <div key={item.vehicleType} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-primary flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-neutral-secondary" />
                      {item.vehicleType}
                    </span>
                    <span className="text-neutral-secondary">
                      ₹{item.totalRevenue.toFixed(2)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-neutral-primary mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-primary" />
          Revenue Distribution Across Parking Lots
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : !analytics?.lotBreakdown || analytics.lotBreakdown.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No data"
            description="No parking lot revenue breakdown available."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {analytics.lotBreakdown.map(lot => (
              <div
                key={lot.lotId}
                className="p-3.5 rounded-xl border border-neutral-border bg-neutral-subtle/50"
              >
                <p className="text-xs font-medium text-neutral-secondary truncate">
                  {lot.lotName}
                </p>
                <p className="text-lg font-bold text-neutral-primary mt-1">
                  ₹{lot.totalRevenue.toFixed(2)}
                </p>
                <span className="text-[11px] text-neutral-secondary mt-0.5 block">
                  {lot.sessionCount} sessions
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
