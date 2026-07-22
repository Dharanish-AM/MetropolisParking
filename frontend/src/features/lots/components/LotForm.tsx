import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const lotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

export type LotFormValues = z.infer<typeof lotSchema>;

interface LotFormProps {
  onSubmit: (data: LotFormValues) => void;
  isLoading?: boolean;
}

export const LotForm: FC<LotFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      name: '',
      location: '',
      capacity: 10,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Lot Name" error={errors.name?.message} {...register('name')} />
      <Input label="Location" error={errors.location?.message} {...register('location')} />
      <Input
        type="number"
        label="Capacity"
        error={errors.capacity?.message}
        {...register('capacity', { valueAsNumber: true })}
      />
      <Button type="submit" isLoading={isLoading} className="w-full">
        Create Lot
      </Button>
    </form>
  );
};
