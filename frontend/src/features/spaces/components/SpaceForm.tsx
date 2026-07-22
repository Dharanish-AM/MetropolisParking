import type { FC } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";

const spaceSchema = z.object({
  spaceNumber: z.string().min(1, "Space number is required"),
  type: z.enum(["CAR", "BIKE", "SUV", "TRUCK", "EV"]),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"]),
});

export type SpaceFormValues = z.infer<typeof spaceSchema>;

interface SpaceFormProps {
  onSubmit: (data: SpaceFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<SpaceFormValues>;
}

export const SpaceForm: FC<SpaceFormProps> = ({ onSubmit, isLoading, defaultValues }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      spaceNumber: defaultValues?.spaceNumber || "",
      type: defaultValues?.type || "CAR",
      status: defaultValues?.status || "AVAILABLE",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Space Number"
        error={errors.spaceNumber?.message}
        {...register("spaceNumber")}
      />
      <Select
        label="Type"
        error={errors.type?.message}
        {...register("type")}
      >
        <option value="CAR">Car</option>
        <option value="BIKE">Bike</option>
        <option value="SUV">SUV</option>
        <option value="TRUCK">Truck</option>
        <option value="EV">EV</option>
      </Select>
      <Select
        label="Status"
        error={errors.status?.message}
        {...register("status")}
      >
        <option value="AVAILABLE">Available</option>
        <option value="OCCUPIED">Occupied</option>
        <option value="RESERVED">Reserved</option>
        <option value="OUT_OF_SERVICE">Out of Service</option>
      </Select>
      <Button type="submit" isLoading={isLoading} className="w-full">
        Save Space
      </Button>
    </form>
  );
};
