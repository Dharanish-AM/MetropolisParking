import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Navbar } from '../components/Navbar';
import { qrApi } from '../api/endpoints/qr';
import type { QrScanResponse } from '../api/endpoints/qr';
import { getSessions } from '../api/endpoints/sessions';
import { getReservations } from '../api/endpoints/reservations';
import type { ReservationItem } from '../api/endpoints/reservations';
import { getVehicles } from '../api/endpoints/vehicles';
import { getSpaces } from '../api/endpoints/spaces';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ticket,
  Camera,
  CameraOff,
  Upload,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { Skeleton } from '../components/ui/Skeleton';

export const QrScannerPage: FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scan' | 'passes'>('scan');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<QrScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [activePasses, setActivePasses] = useState<
    {
      id: string;
      type: 'SESSION' | 'RESERVATION';
      title: string;
      subtitle: string;
      details: {
        lotName?: string;
        spaceNumber?: string;
        vehiclePlate?: string;
        startTime?: string;
        status?: string;
        fee?: string;
      };
    }[]
  >([]);

  const [selectedPass, setSelectedPass] = useState<{
    id: string;
    type: 'SESSION' | 'RESERVATION';
  } | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [passLoading, setPassLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchUserPasses();
  }, [user]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isCameraActive) {
      setCameraError(null);
      html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          decodedText => {
            setQrInput(decodedText);
            setIsCameraActive(false);
            executeScan(decodedText);
          },
          () => {}
        )
        .catch(() => {
          setCameraError('Unable to access webcam or camera. Please check camera permissions.');
          setIsCameraActive(false);
        });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode?.clear();
          })
          .catch(() => {});
      }
    };
  }, [isCameraActive]);

  const fetchUserPasses = async () => {
    try {
      const [vehiclesList, sessions, resList, spacesList] = await Promise.all([
        getVehicles().catch(() => []),
        getSessions(true).catch(() => []),
        getReservations().catch(() => []),
        getSpaces().catch(() => []),
      ]);

      const myVehicleIds = vehiclesList
        .filter((v: any) => v.ownerId === user?.id)
        .map((v: any) => v.id);

      const passes: {
        id: string;
        type: 'SESSION' | 'RESERVATION';
        title: string;
        subtitle: string;
        details: {
          lotName?: string;
          spaceNumber?: string;
          vehiclePlate?: string;
          startTime?: string;
          status?: string;
          fee?: string;
        };
      }[] = [];

      sessions.forEach(s => {
        if (!s.exitTime && myVehicleIds.includes(s.vehicleId)) {
          const veh = vehiclesList.find((v: any) => v.id === s.vehicleId);
          const sp = spacesList.find((sp: any) => sp.id === s.spaceId);
          passes.push({
            id: s.id,
            type: 'SESSION',
            title: `Active Parking Session`,
            subtitle: `Session ID: ${s.id.slice(0, 8)}...`,
            details: {
              spaceNumber:
                s.spaceNumber ||
                sp?.spaceNumber ||
                (s.spaceId ? `Space #${s.spaceId.slice(0, 6)}` : 'N/A'),
              vehiclePlate: s.plateNumber || veh?.plateNumber || 'Registered Vehicle',
              startTime: s.entryTime ? new Date(s.entryTime).toLocaleString() : undefined,
              status: s.status || 'ACTIVE',
            },
          });
        }
      });

      resList.forEach((r: ReservationItem) => {
        if (r.status === 'CONFIRMED' || r.status === 'PENDING') {
          passes.push({
            id: r.id,
            type: 'RESERVATION',
            title: `Reservation for Space ${r.spaceNumber}`,
            subtitle: `Lot: ${r.lotName} (${r.status})`,
            details: {
              lotName: r.lotName,
              spaceNumber: r.spaceNumber,
              startTime: r.startTime ? new Date(r.startTime).toLocaleString() : undefined,
              status: r.status,
              fee: r.fee !== undefined ? `$${r.fee.toFixed(2)}` : undefined,
            },
          });
        }
      });

      setActivePasses(passes);
      if (passes.length > 0 && !selectedPass) {
        setSelectedPass({ id: passes[0].id, type: passes[0].type });
      }
    } catch {
      setActivePasses([]);
    }
  };

  useEffect(() => {
    if (selectedPass) {
      loadQrPass(selectedPass.type, selectedPass.id);
    }
  }, [selectedPass]);

  useEffect(() => {
    if (qrToken) {
      QRCode.toDataURL(qrToken, { width: 220, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    } else {
      setQrCodeUrl('');
    }
  }, [qrToken]);

  const loadQrPass = async (type: 'SESSION' | 'RESERVATION', id: string) => {
    setPassLoading(true);
    setQrToken(null);
    try {
      const res = await qrApi.generatePass(type, id);
      setQrToken(res.qrToken);
    } catch {
      setQrToken(null);
    } finally {
      setPassLoading(false);
    }
  };

  const executeScan = async (token: string) => {
    if (!token.trim()) return;

    setLoading(true);
    setScanResult(null);
    setErrorMessage(null);

    try {
      const res = await qrApi.scanPass(token.trim());
      setScanResult(res);
      setQrInput('');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to validate QR Code. Invalid token format.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    executeScan(qrInput);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            setIsCameraActive(false);
          })
          .catch(() => {
            setIsCameraActive(false);
          });
      } else {
        setIsCameraActive(false);
      }
    } else {
      setIsCameraActive(true);
    }
  };

  const currentPass = activePasses.find(p => p.id === selectedPass?.id);

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-primary tracking-tight flex items-center gap-3">
              <QrCode className="w-8 h-8 text-brand-primary" />
              QR Code Gate Entry & Passes
            </h1>
            <p className="text-neutral-secondary text-sm mt-1">
              Scan gate QR tokens to process entry/checkout or display your digital parking pass.
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-neutral-border shadow-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-neutral-secondary hover:text-neutral-primary'
              }`}
            >
              <Scan className="w-4 h-4" />
              Gate Scanner
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'passes'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-neutral-secondary hover:text-neutral-primary'
              }`}
            >
              <Ticket className="w-4 h-4" />
              My Digital Passes ({activePasses.length})
            </button>
          </div>
        </div>

        {activeTab === 'scan' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-neutral-border shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-primary flex items-center gap-2">
                    <Camera className="w-5 h-5 text-brand-primary" />
                    Scan Gate QR Pass
                  </h2>
                  <p className="text-sm text-neutral-secondary mt-0.5">
                    Use live webcam / mobile camera or paste a signed QR token string.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    isCameraActive
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-4 h-4" /> Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Use Camera Scanner
                    </>
                  )}
                </button>
              </div>

              {isCameraActive && (
                <div className="mb-6 p-3 bg-neutral-900 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center">
                  <div
                    id="qr-reader-container"
                    className="w-full max-w-sm rounded-xl overflow-hidden"
                  />
                  <p className="text-[11px] text-neutral-400 mt-2 font-medium">
                    Point webcam or phone camera at QR Code
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <form onSubmit={handleScanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-secondary mb-1">
                    QR Token String
                  </label>
                  <textarea
                    rows={4}
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value)}
                    placeholder="Paste JWT QR Token payload here..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-border text-sm font-mono focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !qrInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Scan className="w-5 h-5" />
                    )}
                    Validate & Open Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrInput('');
                      setScanResult(null);
                      setErrorMessage(null);
                    }}
                    className="px-4 py-3 border border-neutral-border text-neutral-secondary hover:bg-neutral-50 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </form>

              {errorMessage && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Validation Error</h4>
                    <p className="text-xs mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-border shadow-xs flex flex-col justify-center">
              {scanResult ? (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-6 text-center space-y-4 animate-scale-up">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-full mb-2">
                      {scanResult.action} SUCCESSFUL
                    </span>
                    <h3 className="text-xl font-bold text-neutral-primary">{scanResult.message}</h3>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-emerald-100 text-left grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-secondary block font-semibold">
                        Entity Type
                      </span>
                      <span className="font-bold text-neutral-primary">
                        {scanResult.entityType}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-secondary block font-semibold">
                        Vehicle Plate
                      </span>
                      <span className="font-bold text-neutral-primary">
                        {scanResult.plateNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-secondary block font-semibold">
                        Space Number
                      </span>
                      <span className="font-bold text-neutral-primary">
                        {scanResult.spaceNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-secondary block font-semibold">Status</span>
                      <span className="font-bold text-emerald-600">{scanResult.status}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-secondary space-y-3">
                  <Upload className="w-12 h-12 mx-auto stroke-1 text-neutral-400" />
                  <h3 className="font-bold text-neutral-primary text-base">Awaiting Gate Scan</h3>
                  <p className="text-xs max-w-xs mx-auto">
                    Scan a driver's QR code pass to trigger automated check-in or checkout.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-neutral-border shadow-xs lg:col-span-1">
              <h2 className="text-lg font-bold mb-4 text-neutral-primary">Active Passes</h2>
              {activePasses.length === 0 ? (
                <div className="text-center py-8 text-neutral-secondary text-xs">
                  No active session or reservation passes found.
                </div>
              ) : (
                <div className="space-y-3">
                  {activePasses.map(pass => {
                    const isSelected = selectedPass?.id === pass.id;
                    return (
                      <button
                        key={pass.id}
                        onClick={() => setSelectedPass({ id: pass.id, type: pass.type })}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/5 shadow-xs'
                            : 'border-neutral-border hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold uppercase text-brand-primary tracking-wider">
                            {pass.type}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <h4 className="font-bold text-neutral-primary text-sm">{pass.title}</h4>
                        <p className="text-xs text-neutral-secondary mt-0.5">{pass.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-border shadow-xs lg:col-span-2 flex flex-col items-center justify-center min-h-[500px]">
              {selectedPass ? (
                passLoading ? (
                  <div className="text-center space-y-6 py-8 w-full max-w-lg mx-auto flex flex-col items-center animate-pulse">
                    <div className="space-y-2 w-full text-center">
                      <Skeleton className="h-6 w-48 mx-auto" />
                      <Skeleton className="h-4 w-64 mx-auto" />
                    </div>
                    <Skeleton className="w-56 h-56 rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : qrToken ? (
                  <div className="text-center space-y-6 py-4 animate-fade-in w-full max-w-lg mx-auto flex flex-col items-center">
                    <div>
                      <h3 className="text-xl font-extrabold text-neutral-primary">
                        Digital Gate Pass
                      </h3>
                      <p className="text-xs text-neutral-secondary mt-1">
                        Show this QR code at the entrance or exit gate scanner.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-3xl border border-neutral-border inline-block shadow-sm">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-xl w-[220px] h-[220px]" />
                      ) : (
                        <div className="w-[220px] h-[220px] flex items-center justify-center text-neutral-secondary font-semibold text-xs">
                          Generating QR Code...
                        </div>
                      )}
                    </div>

                    {currentPass?.details && (
                      <div className="w-full bg-neutral-50 rounded-2xl p-4 border border-neutral-border text-left grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-neutral-secondary block font-semibold">
                            Pass Type
                          </span>
                          <span className="font-extrabold uppercase text-brand-primary tracking-wider">
                            {selectedPass.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-secondary block font-semibold">Status</span>
                          <span className="font-bold text-emerald-600">
                            {currentPass.details.status || 'ACTIVE'}
                          </span>
                        </div>
                        {currentPass.details.lotName && (
                          <div>
                            <span className="text-neutral-secondary block font-semibold">
                              Parking Lot
                            </span>
                            <span className="font-bold text-neutral-primary text-xs truncate block">
                              {currentPass.details.lotName}
                            </span>
                          </div>
                        )}
                        {currentPass.details.spaceNumber && (
                          <div>
                            <span className="text-neutral-secondary block font-semibold">
                              Space Number
                            </span>
                            <span className="font-mono font-bold text-brand-primary text-xs">
                              {currentPass.details.spaceNumber}
                            </span>
                          </div>
                        )}
                        {currentPass.details.vehiclePlate && (
                          <div>
                            <span className="text-neutral-secondary block font-semibold">
                              Vehicle Plate
                            </span>
                            <span className="font-mono font-bold text-neutral-primary text-xs">
                              {currentPass.details.vehiclePlate}
                            </span>
                          </div>
                        )}
                        {currentPass.details.startTime && (
                          <div>
                            <span className="text-neutral-secondary block font-semibold">
                              Start / Entry Time
                            </span>
                            <span className="font-medium text-neutral-primary text-[11px]">
                              {currentPass.details.startTime}
                            </span>
                          </div>
                        )}
                        {currentPass.details.fee && (
                          <div>
                            <span className="text-neutral-secondary block font-semibold">
                              Total Fee
                            </span>
                            <span className="font-bold text-brand-primary text-xs">
                              {currentPass.details.fee}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-border text-left">
                      <span className="text-[10px] font-bold text-neutral-secondary uppercase block mb-1">
                        Signed Pass Token
                      </span>
                      <p className="text-[11px] font-mono text-neutral-primary break-all select-all">
                        {qrToken}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-neutral-secondary space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-neutral-primary">Failed to load gate pass</p>
                      <p className="text-xs text-neutral-secondary mt-1">Please try again.</p>
                    </div>
                    <button
                      onClick={() => loadQrPass(selectedPass.type, selectedPass.id)}
                      className="px-4 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl text-xs font-bold hover:bg-brand-primary/20 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-16 text-neutral-secondary">
                  <QrCode className="w-16 h-16 mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm font-semibold">
                    Select a pass from the left to display its QR code.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
