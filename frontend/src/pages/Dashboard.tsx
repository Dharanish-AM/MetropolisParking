import { useState } from "react";
import type { FC, FormEvent } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";
import { 
  Activity, 
  DollarSign, 
  Plus, 
  LogOut, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MapPin
} from "lucide-react";

interface RecentSession {
  id: string;
  plateNumber: string;
  spaceNumber: string;
  startTime: string;
  endTime: string | null;
  fee: number | null;
  status: string;
}

interface DashboardStats {
  financial: {
    totalRevenue: number;
    revenueByMethod: Record<string, number>;
  };
  occupancy: {
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    occupancyRate: number;
  };
  recentSessions: RecentSession[];
}

interface ParkingSpace {
  id: string;
  spaceNumber: string;
  type: string;
  status: string;
}

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

export const Dashboard: FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [entryPlate, setEntryPlate] = useState("");
  const [entrySpaceId, setEntrySpaceId] = useState("");
  const [exitPlate, setExitPlate] = useState("");
  
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await client.get("/dashboard");
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: lots } = useQuery<ParkingLot[]>({
    queryKey: ["parking-lots"],
    queryFn: async () => {
      const res = await client.get("/parking-lots");
      return res.data;
    }
  });

  const { data: spaces } = useQuery<ParkingSpace[]>({
    queryKey: ["spaces"],
    queryFn: async () => {
      const res = await client.get("/spaces");
      return res.data;
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async (payload: { plateNumber: string; spaceId: string }) => {
      return client.post("/sessions/start", payload);
    },
    onSuccess: () => {
      setNotification({ message: "Vehicle checked in successfully", type: "success" });
      setEntryPlate("");
      setEntrySpaceId("");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err: any) => {
      setNotification({ message: err.response?.data?.message || "Failed to check in", type: "error" });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async (payload: { plateNumber: string }) => {
      return client.post("/sessions/end", payload);
    },
    onSuccess: (res) => {
      const feeMsg = res.data.fee ? ` (Fee: $${res.data.fee})` : "";
      setNotification({ message: `Vehicle checked out successfully${feeMsg}`, type: "success" });
      setExitPlate("");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err: any) => {
      setNotification({ message: err.response?.data?.message || "Failed to check out", type: "error" });
    }
  });

  const handleCheckIn = (e: FormEvent) => {
    e.preventDefault();
    if (!entryPlate || !entrySpaceId) return;
    checkInMutation.mutate({ plateNumber: entryPlate, spaceId: entrySpaceId });
  };

  const handleCheckOut = (e: FormEvent) => {
    e.preventDefault();
    if (!exitPlate) return;
    checkOutMutation.mutate({ plateNumber: exitPlate });
  };

  const activeSpaces = spaces?.filter(s => s.status === "OCCUPIED") || [];

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col">
      <header className="border-b border-neutral-border bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="font-bold tracking-tight text-neutral-primary">Metropolis Control</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-neutral-primary">{user?.name}</span>
              <span className="text-xs text-neutral-secondary uppercase font-bold tracking-wider">{user?.role}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 border border-neutral-border rounded-xl text-neutral-secondary hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all duration-150 cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {notification && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
            notification.type === "success" 
              ? "bg-green-50 border-green-100 text-green-800" 
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <div className="text-sm font-semibold">{notification.message}</div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto text-xs font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-neutral-border rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center text-neutral-secondary">
              <span className="text-sm font-semibold">Occupancy Rate</span>
              <Activity className="w-5 h-5 stroke-[1.5]" />
            </div>
            {isLoading ? (
              <div className="h-9 w-24 bg-neutral-border animate-pulse rounded-lg" />
            ) : (
              <div className="space-y-2">
                <div className="text-4xl font-extrabold tracking-tight">
                  {stats?.occupancy.occupancyRate.toFixed(1)}%
                </div>
                <p className="text-sm text-neutral-secondary">
                  {stats?.occupancy.occupiedSpaces} of {stats?.occupancy.totalSpaces} spaces filled
                </p>
                <div className="w-full bg-neutral-border h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats?.occupancy.occupancyRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-neutral-border rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center text-neutral-secondary">
              <span className="text-sm font-semibold">Total Revenue</span>
              <DollarSign className="w-5 h-5 stroke-[1.5]" />
            </div>
            {isLoading ? (
              <div className="h-9 w-24 bg-neutral-border animate-pulse rounded-lg" />
            ) : (
              <div className="space-y-1">
                <div className="text-4xl font-extrabold tracking-tight">
                  ${stats?.financial.totalRevenue.toFixed(2)}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(stats?.financial.revenueByMethod || {}).map(([method, amt]) => (
                    <span key={method} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-border/50 text-neutral-secondary">
                      {method}: ${amt.toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-neutral-border rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center text-neutral-secondary">
              <span className="text-sm font-semibold">Active Lots</span>
              <TrendingUp className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold tracking-tight">
                {lots?.length || 0}
              </div>
              <div className="flex flex-col gap-1">
                {lots?.slice(0, 2).map((lot) => (
                  <div key={lot.id} className="flex items-center gap-1.5 text-xs text-neutral-secondary">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{lot.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-neutral-border rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-primary">Recent Parking Activity</h3>
                <span className="text-xs font-semibold text-neutral-secondary uppercase tracking-wider">Live Polling</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-border">
                  <thead className="bg-neutral-border/20 text-neutral-secondary text-left text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Vehicle</th>
                      <th className="px-6 py-3">Space</th>
                      <th className="px-6 py-3">Check In</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border text-sm text-neutral-primary">
                    {stats?.recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-neutral-secondary font-medium">
                          No recent parking sessions recorded
                        </td>
                      </tr>
                    ) : (
                      stats?.recentSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-neutral-border/10 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold tracking-tight">
                            {session.plateNumber}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {session.spaceNumber}
                          </td>
                          <td className="px-6 py-4 text-neutral-secondary text-xs">
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              session.status === "ACTIVE" 
                                ? "bg-status-available/10 text-status-available" 
                                : "bg-neutral-border text-neutral-secondary"
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-neutral-primary">
                            {session.fee ? `$${session.fee.toFixed(2)}` : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-neutral-border rounded-2xl shadow-xs p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-primary mb-1">Check In Vehicle</h3>
                <p className="text-xs text-neutral-secondary">Register a vehicle entry and assign a slot.</p>
              </div>
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-secondary mb-1.5">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={entryPlate}
                    onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. MH12AB1234"
                    className="block w-full px-3 py-2.5 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-secondary mb-1.5">
                    Available Parking Space
                  </label>
                  <select
                    value={entrySpaceId}
                    onChange={(e) => setEntrySpaceId(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    required
                  >
                    <option value="">Select a space</option>
                    {spaces?.filter(s => s.status === "AVAILABLE").map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.spaceNumber} ({space.type})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={checkInMutation.status === "pending"}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/95 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                  Check In Entry
                </button>
              </form>
            </div>

            <div className="bg-white border border-neutral-border rounded-2xl shadow-xs p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-primary mb-1">Check Out Vehicle</h3>
                <p className="text-xs text-neutral-secondary">Register exit and calculate outstanding fees.</p>
              </div>
              <form onSubmit={handleCheckOut} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-secondary mb-1.5">
                    Active Plate Number
                  </label>
                  <select
                    value={exitPlate}
                    onChange={(e) => setExitPlate(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                    required
                  >
                    <option value="">Select parked vehicle</option>
                    {activeSpaces.map((space) => {
                      const session = stats?.recentSessions.find(s => s.spaceNumber === space.spaceNumber && s.status === "ACTIVE");
                      return session ? (
                        <option key={session.id} value={session.plateNumber}>
                          {session.plateNumber} (Space: {space.spaceNumber})
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={checkOutMutation.status === "pending"}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-neutral-border bg-white text-neutral-primary hover:bg-neutral-border/30 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Key className="w-4 h-4 stroke-[1.5]" />
                  Process Checkout
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
