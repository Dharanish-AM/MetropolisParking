import type { FC } from "react";
import { Navbar } from "../components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVehicles } from "../features/vehicles/hooks";
import { Mail, ShieldAlert, Car, Building } from "lucide-react";

export const Profile: FC = () => {
  const { user } = useAuth();
  const { data: vehicles } = useVehicles();

  const myVehicles = (vehicles || []).filter((v) => v.ownerId === user?.id);

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            Manage your credentials and view your system authorization level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-extrabold text-2xl">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <Badge variant="default" className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <hr className="border-neutral-border" />

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-neutral-secondary stroke-[1.5]" />
                <div>
                  <p className="text-neutral-secondary text-xs font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-neutral-primary">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <ShieldAlert className="w-5 h-5 text-neutral-secondary stroke-[1.5]" />
                <div>
                  <p className="text-neutral-secondary text-xs font-bold uppercase tracking-wider">Role Access Type</p>
                  <p className="font-semibold text-neutral-primary">
                    {user?.role === "ADMIN" && "System Administrator (Full Read/Write Access)"}
                    {user?.role === "OPERATOR" && "Parking Attendant / Operator (Operational Access)"}
                    {user?.role === "CUSTOMER" && "Standard Parking Customer (Basic Access)"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="bg-brand-primary/5 border-brand-primary/10">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-brand-primary flex items-center gap-1.5">
                  <Car className="w-5 h-5" /> Account Summary
                </CardTitle>
                <CardDescription>Metrics tied to your registration profile.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {user?.role === "CUSTOMER" ? (
                  <div className="space-y-2">
                    <div className="text-4xl font-extrabold text-brand-primary">
                      {myVehicles.length}
                    </div>
                    <p className="text-xs text-neutral-secondary font-semibold">
                      Registered vehicle{myVehicles.length === 1 ? "" : "s"} under your account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-neutral-secondary flex items-center gap-2">
                      <Building className="w-4 h-4 text-brand-primary" /> Management Access
                    </div>
                    <p className="text-xs text-neutral-secondary font-semibold leading-relaxed">
                      You are authorized as an employee. Navigate through the headers above to edit parking configurations, monitor levels, and process ticketing logs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
