import { useState } from 'react';
import type { FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { FeeCalculatorWidget } from './FeeCalculatorWidget';
import { getPricingRules, createPricingRule, deletePricingRule } from '../../api/endpoints/pricing';
import type { PricingRule, PricingRuleCreatePayload } from '../../api/endpoints/pricing';
import { useLots } from '../lots/hooks';
import { useToast } from '../../context/ToastContext';
import { Tag, Plus, Trash2, Zap, Clock, ShieldAlert } from 'lucide-react';

export const PricingRulesFeature: FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: lots } = useLots();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<PricingRuleCreatePayload>({
    ruleType: 'HOURLY',
    rate: 50,
    vehicleType: 'CAR',
    lotId: undefined,
    startHour: 8,
    endHour: 18,
    occupancyThreshold: 75,
    surgeMultiplier: 1.25,
    minFee: 10,
    maxDailyCap: 250,
  });

  const { data: rules, isLoading } = useQuery<PricingRule[]>({
    queryKey: ['pricingRules'],
    queryFn: getPricingRules,
  });

  const createMutation = useMutation({
    mutationFn: createPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      setIsModalOpen(false);
      showToast('Pricing rule created successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create pricing rule.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      showToast('Pricing rule deleted.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete pricing rule.', 'error');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getRuleTypeBadge = (ruleType: string) => {
    switch (ruleType.toUpperCase()) {
      case 'PEAK_SURGE':
        return (
          <Badge variant="warning">
            <Zap className="w-3 h-3 mr-1 inline" />
            Peak Surge
          </Badge>
        );
      case 'OCCUPANCY_BASED':
        return (
          <Badge variant="danger">
            <ShieldAlert className="w-3 h-3 mr-1 inline" />
            Dynamic Occupancy
          </Badge>
        );
      case 'DAILY':
        return (
          <Badge variant="success">
            <Clock className="w-3 h-3 mr-1 inline" />
            Daily Flat Rate
          </Badge>
        );
      default:
        return (
          <Badge variant="info">
            <Tag className="w-3 h-3 mr-1 inline" />
            Standard Hourly
          </Badge>
        );
    }
  };

  const getLotName = (lotId?: string) => {
    if (!lotId) return 'Global (All Lots)';
    const lot = lots?.find((l: any) => l.id === lotId);
    return lot ? lot.name : 'Selected Lot';
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-primary">
            Dynamic Pricing & Rate Rules
          </h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            Configure automated peak hour surge tariffs, vehicle rates, and occupancy thresholds.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Pricing Rule</span>
        </Button>
      </div>

      <FeeCalculatorWidget />

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-neutral-primary">Active Rate Rules Registry</h3>
          <span className="text-xs text-neutral-secondary font-medium">
            Total Rules: {rules?.length || 0}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rules && rules.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Type</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Target Lot</TableHead>
                  <TableHead>Peak Hours</TableHead>
                  <TableHead>Surge Multiplier</TableHead>
                  <TableHead>Max Daily Cap</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-semibold">
                      {getRuleTypeBadge(rule.ruleType)}
                    </TableCell>
                    <TableCell className="font-bold text-neutral-primary">
                      ₹{rule.rate.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-subtle text-neutral-primary border border-neutral-border">
                        {rule.vehicleType || 'ALL'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-secondary">
                      {getLotName(rule.lotId)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-neutral-secondary">
                      {rule.startHour}:00 - {rule.endHour}:00
                    </TableCell>
                    <TableCell className="font-bold text-status-reserved">
                      {rule.surgeMultiplier > 1.0 ? `${rule.surgeMultiplier}x` : '1.0x (Standard)'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-neutral-secondary">
                      ₹{rule.maxDailyCap.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        className="text-status-occupied hover:bg-status-occupied/10 hover:text-status-occupied"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 border border-dashed border-neutral-border rounded-xl bg-neutral-secondary-bg/50">
            <Tag className="w-12 h-12 text-brand-primary/40 mx-auto mb-3" />
            <h4 className="text-base font-bold text-neutral-primary">
              No Pricing Rules Configured
            </h4>
            <p className="text-xs text-neutral-secondary max-w-md mx-auto mb-4 mt-1">
              Standard default hourly rates apply dynamically across all parking lots. Create custom
              peak surge or vehicle rate rules to optimize yield.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Pricing Rule</span>
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Dynamic Pricing Rule"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Rule Type
              </label>
              <Select
                value={formData.ruleType}
                onChange={e => setFormData({ ...formData, ruleType: e.target.value })}
              >
                <option value="HOURLY">Hourly Standard</option>
                <option value="PEAK_SURGE">Peak Surge Hours</option>
                <option value="OCCUPANCY_BASED">Dynamic Occupancy Surge</option>
                <option value="DAILY">Daily Flat Rate</option>
                <option value="OVERNIGHT">Overnight Special</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Base Rate (₹)
              </label>
              <Input
                type="number"
                min={1}
                step={0.5}
                value={formData.rate}
                onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Vehicle Type
              </label>
              <Select
                value={formData.vehicleType || 'CAR'}
                onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
              >
                <option value="CAR">Car</option>
                <option value="BIKE">Bike / Motorcycle</option>
                <option value="SUV">SUV / Heavy Vehicle</option>
                <option value="EV">EV (Electric Vehicle)</option>
                <option value="TRUCK">Truck</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Target Parking Lot
              </label>
              <Select
                value={formData.lotId || ''}
                onChange={e => setFormData({ ...formData, lotId: e.target.value || undefined })}
              >
                <option value="">All Lots (Global)</option>
                {lots?.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Peak Start Hour (0-23)
              </label>
              <Input
                type="number"
                min={0}
                max={23}
                value={formData.startHour}
                onChange={e =>
                  setFormData({ ...formData, startHour: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Peak End Hour (1-24)
              </label>
              <Input
                type="number"
                min={1}
                max={24}
                value={formData.endHour}
                onChange={e =>
                  setFormData({ ...formData, endHour: parseInt(e.target.value) || 24 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Occupancy Surge Threshold (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.occupancyThreshold}
                onChange={e =>
                  setFormData({ ...formData, occupancyThreshold: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Surge Multiplier (x)
              </label>
              <Input
                type="number"
                min={1.0}
                max={5.0}
                step={0.05}
                value={formData.surgeMultiplier}
                onChange={e =>
                  setFormData({ ...formData, surgeMultiplier: parseFloat(e.target.value) || 1.0 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Minimum Fee (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={formData.minFee}
                onChange={e =>
                  setFormData({ ...formData, minFee: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-secondary mb-1">
                Maximum Daily Cap (₹)
              </label>
              <Input
                type="number"
                min={10}
                value={formData.maxDailyCap}
                onChange={e =>
                  setFormData({ ...formData, maxDailyCap: parseFloat(e.target.value) || 100 })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Pricing Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
