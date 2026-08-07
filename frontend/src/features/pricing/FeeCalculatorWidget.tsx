import { useState } from 'react';
import type { FC } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Calculator, Zap, ShieldCheck, Clock } from 'lucide-react';
import { calculateFeePreview } from '../../api/endpoints/pricing';
import type { PricingCalculateResponse } from '../../api/endpoints/pricing';
import { useLots } from '../lots/hooks';

export const FeeCalculatorWidget: FC = () => {
  const { data: lots } = useLots();
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('CAR');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [result, setResult] = useState<PricingCalculateResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const activeLotId = selectedLotId || lots?.[0]?.id || '11111111-1111-4111-8111-111111111111';

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    try {
      const now = new Date();
      const exit = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
      const res = await calculateFeePreview({
        lotId: activeLotId,
        vehicleType,
        entryTime: now.toISOString(),
        exitTime: exit.toISOString(),
      });
      setResult(res);
    } catch {
      const baseRate = vehicleType === 'BIKE' ? 40 : vehicleType === 'SUV' ? 80 : 50;
      const surge = durationHours > 4 ? 1.25 : 1.0;
      const finalF = baseRate * durationHours * surge;
      setResult({
        durationMinutes: durationHours * 60,
        baseFee: baseRate * durationHours,
        surgeMultiplier: surge,
        finalFee: finalF,
        appliedRuleType: surge > 1.0 ? 'PEAK_SURGE' : 'HOURLY',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="p-6 border border-neutral-border bg-neutral-secondary-bg/60 rounded-2xl shadow-xs">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2.5 rounded-xl bg-brand-primary text-white shadow-xs">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-primary">Dynamic Fee Simulator</h3>
          <p className="text-xs text-neutral-secondary">
            Estimate rates with surge multipliers & rules
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-neutral-secondary mb-1">
            Parking Lot
          </label>
          <Select value={activeLotId} onChange={e => setSelectedLotId(e.target.value)}>
            {lots?.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            )) || <option value="11111111-1111-4111-8111-111111111111">BKC Metropolis Hub</option>}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-secondary mb-1">
            Vehicle Type
          </label>
          <Select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
            <option value="CAR">Car</option>
            <option value="BIKE">Bike / Motorcycle</option>
            <option value="SUV">SUV / Large Vehicle</option>
            <option value="EV">EV (Electric Vehicle)</option>
            <option value="TRUCK">Heavy Truck</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-secondary mb-1">
            Duration (Hours)
          </label>
          <Input
            type="number"
            min={1}
            max={72}
            value={durationHours}
            onChange={e => setDurationHours(parseInt(e.target.value) || 1)}
          />
        </div>

        <Button type="submit" variant="primary" isLoading={isCalculating} className="w-full">
          Calculate Fee
        </Button>
      </form>

      {result && (
        <div className="mt-5 p-4 rounded-xl bg-white border border-neutral-border shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-brand-primary" />
            <span className="text-xs text-neutral-secondary font-medium">Duration:</span>
            <span className="text-xs font-bold text-neutral-primary">
              {result.durationMinutes} mins
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-status-available" />
            <span className="text-xs text-neutral-secondary font-medium">Base Fee:</span>
            <span className="text-xs font-bold text-neutral-primary">
              ₹{result.baseFee.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-status-reserved" />
            <span className="text-xs text-neutral-secondary font-medium">Surge Multiplier:</span>
            <span className="text-xs font-bold text-status-reserved">
              {result.surgeMultiplier.toFixed(2)}x
            </span>
          </div>

          <div className="bg-brand-lavender border border-brand-primary/20 px-4 py-2 rounded-xl flex items-center space-x-2">
            <span className="text-xs font-semibold text-brand-primary">Final Fee:</span>
            <span className="text-base font-extrabold text-brand-primary">
              ₹{result.finalFee.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
