import type { FC } from "react";
import { ArrowLeft, Check, Compass, Info, MoreVertical } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

interface LotDetailsDrawerProps {
  lot: ParkingLot;
  onBack: () => void;
  spacesCount: number;
}

export const LotDetailsDrawer: FC<LotDetailsDrawerProps> = ({ lot, onBack }) => {
  const rates = [
    { duration: "Up to 1 hour", rate: "$5.99" },
    { duration: "Up to 2 hours", rate: "$10.00" },
    { duration: "Up to 3 hours", rate: "$15.00" },
    { duration: "Up to 4 hours", rate: "$18.00" },
    { duration: "Up to 5 hours", rate: "$22.00" },
    { duration: "Up to 6 hours", rate: "$40.00" },
    { duration: "Up to 12 hours", rate: "$50.00" },
  ];

  return (
    <div className="w-full flex flex-col bg-white h-full animate-fade-in">
      <div className="flex justify-between items-center px-4 py-4 border-b border-neutral-border">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-neutral-primary hover:bg-neutral-border/50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm text-neutral-primary">Location details</span>
        <button className="p-1.5 rounded-lg text-neutral-secondary hover:bg-neutral-border/50 transition-all cursor-pointer">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-primary leading-tight">
            {lot.name}
          </h2>
          <p className="text-sm text-neutral-secondary">
            Entrance: {lot.location}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-secondary pt-1 font-semibold">
            <Compass className="w-4 h-4 text-brand-purple" />
            <span>178 min (8.9mi)</span>
          </div>
          <div className="pt-2">
            <Badge variant="AVAILABLE" className="bg-emerald-50 text-emerald-700 border-emerald-100 py-1 px-3">
              <Check className="w-3 h-3 mr-1 inline" /> Free cancellation & changes
              <Info className="w-3.5 h-3.5 ml-1 inline opacity-60" />
            </Badge>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-neutral-border">
          <div>
            <h3 className="text-lg font-bold text-neutral-primary">Drive-up rates</h3>
            <p className="text-xs text-neutral-secondary">
              Drive-up rates may differ from the reservation rates
            </p>
          </div>

          <div className="divide-y divide-neutral-border">
            {rates.map((item) => (
              <div key={item.duration} className="flex justify-between items-center py-3.5 text-sm font-semibold">
                <span className="text-neutral-primary">{item.duration}</span>
                <span className="text-neutral-primary font-bold">{item.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-border bg-white flex gap-3">
        <Button className="w-full" variant="primary">
          Reserve Parking
        </Button>
      </div>
    </div>
  );
};
