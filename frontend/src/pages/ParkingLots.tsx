import { useState } from "react";
import type { FC } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";
import { theme } from "../styles/theme";
import { Navbar } from "../components/Navbar";
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  Zap, 
  Accessibility, 
  SlidersHorizontal 
} from "lucide-react";

interface ParkingSpace {
  id: string;
  parkingLevelId: string;
  spaceNumber: string;
  type: "STANDARD" | "COMPACT" | "EV_CHARGING" | "ACCESSIBLE" | string;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE" | string;
}

interface ParkingLevel {
  id: string;
  parkingLotId: string;
  levelName: string;
  floorNumber: number;
}

interface ParkingLot {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export const ParkingLots: FC = () => {
  const queryClient = useQueryClient();
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("ALL");
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: lots, isLoading: loadingLots } = useQuery<ParkingLot[]>({
    queryKey: ["parking-lots"],
    queryFn: async () => {
      const res = await client.get("/parking-lots");
      if (res.data.length > 0 && !selectedLotId) {
        setSelectedLotId(res.data[0].id);
      }
      return res.data;
    },
  });

  const activeLotId = selectedLotId || (lots && lots.length > 0 ? lots[0].id : "");

  const { data: levels } = useQuery<ParkingLevel[]>({
    queryKey: ["levels", activeLotId],
    queryFn: async () => {
      if (!activeLotId) return [];
      const res = await client.get(`/parking-lots/${activeLotId}/levels`);
      return res.data;
    },
    enabled: !!activeLotId,
  });

  const { data: spaces } = useQuery<ParkingSpace[]>({
    queryKey: ["spaces"],
    queryFn: async () => {
      const res = await client.get("/spaces");
      return res.data;
    },
    refetchInterval: 5000,
  });

  const updateSpaceStatusMutation = useMutation({
    mutationFn: async ({ spaceId, status }: { spaceId: string; status: string }) => {
      return client.patch(`/spaces/${spaceId}/status`, { status });
    },
    onSuccess: () => {
      setNotification({ message: "Space status updated successfully", type: "success" });
      setSelectedSpace(null);
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err: any) => {
      setNotification({ message: err.response?.data?.message || "Failed to update status", type: "error" });
    }
  });

  const filteredSpaces = spaces?.filter((space) => {
    if (selectedLevelId !== "ALL" && space.parkingLevelId !== selectedLevelId) {
      return false;
    }
    return true;
  }) || [];

  const getSpaceIcon = (type: string) => {
    switch (type) {
      case "EV_CHARGING":
        return <Zap className="w-3.5 h-3.5" />;
      case "ACCESSIBLE":
        return <Accessibility className="w-3.5 h-3.5" />;
      default:
        return <Car className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return theme.colors.status.AVAILABLE.badge;
      case "OCCUPIED":
        return theme.colors.status.OCCUPIED.badge;
      case "RESERVED":
        return theme.colors.status.RESERVED.badge;
      case "OUT_OF_SERVICE":
        return theme.colors.status.OUT_OF_SERVICE.badge;
      default:
        return "bg-neutral-border text-neutral-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-primary tracking-tight">
              Parking Lots & Floor Layouts
            </h1>
            <p className="mt-1 text-sm text-neutral-secondary">
              Real-time slot occupancy visualization, level indices, and space management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-border text-xs font-semibold bg-white text-neutral-secondary">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Auto-Polling 5s
            </span>
          </div>
        </div>

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

        <section className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {loadingLots ? (
              <div className="h-10 w-48 bg-neutral-border animate-pulse rounded-xl" />
            ) : (
              lots?.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => {
                    setSelectedLotId(lot.id);
                    setSelectedLevelId("ALL");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    activeLotId === lot.id
                      ? "bg-brand-primary text-white shadow-xs"
                      : "bg-white border border-neutral-border text-neutral-secondary hover:text-neutral-primary hover:bg-neutral-border/20"
                  }`}
                >
                  <Building2 className="w-4 h-4 stroke-[1.75]" />
                  <span>{lot.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    activeLotId === lot.id ? "bg-white/20 text-white" : "bg-neutral-border/60 text-neutral-secondary"
                  }`}>
                    {lot.capacity} slots
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 bg-white p-4 border border-neutral-border rounded-2xl flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-secondary mr-2">
              <Layers className="w-4 h-4" />
              Levels:
            </div>
            <button
              onClick={() => setSelectedLevelId("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedLevelId === "ALL"
                  ? "bg-neutral-primary text-white"
                  : "bg-neutral-border/40 text-neutral-secondary hover:text-neutral-primary"
              }`}
            >
              All Floors
            </button>
            {levels?.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLevelId === level.id
                    ? "bg-neutral-primary text-white"
                    : "bg-neutral-border/40 text-neutral-secondary hover:text-neutral-primary"
                }`}
              >
                {level.levelName} (Floor {level.floorNumber})
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-neutral-border rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-primary">Interactive Slot Grid</h2>
              <span className="text-xs text-neutral-secondary font-semibold">({filteredSpaces.length} slots loaded)</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-available" />
                <span className="text-neutral-secondary">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-occupied" />
                <span className="text-neutral-secondary">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-reserved" />
                <span className="text-neutral-secondary">Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-out-of-service" />
                <span className="text-neutral-secondary">Out of Service</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredSpaces.map((space) => {
              return (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpace(space)}
                  className={`p-4 border rounded-2xl flex flex-col items-center justify-between gap-3 transition-all duration-150 hover:scale-[1.02] cursor-pointer text-center relative overflow-hidden ${
                    getStatusBadgeStyle(space.status)
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-xs font-semibold">
                    <span className="font-mono">{space.spaceNumber}</span>
                    {getSpaceIcon(space.type)}
                  </div>
                  <div className="text-sm font-extrabold tracking-tight uppercase">
                    {space.status.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    {space.type}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedSpace && (
          <div className="fixed inset-0 bg-neutral-primary/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-neutral-border rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-neutral-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-primary">Manage Space {selectedSpace.spaceNumber}</h3>
                  <p className="text-xs text-neutral-secondary">Update space operational status.</p>
                </div>
                <button 
                  onClick={() => setSelectedSpace(null)}
                  className="text-neutral-secondary hover:text-neutral-primary text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-secondary">
                  Set New Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"].map((statusOption) => (
                    <button
                      key={statusOption}
                      onClick={() => updateSpaceStatusMutation.mutate({ spaceId: selectedSpace.id, status: statusOption })}
                      disabled={updateSpaceStatusMutation.status === "pending"}
                      className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                        selectedSpace.status === statusOption
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-neutral-border bg-white text-neutral-secondary hover:text-neutral-primary hover:bg-neutral-border/20"
                      }`}
                    >
                      {statusOption.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-border flex justify-end">
                <button
                  onClick={() => setSelectedSpace(null)}
                  className={theme.components.buttonSecondary}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
