import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Navbar } from '../components/Navbar';
import { qrApi } from '../api/endpoints/qr';
import type { QrScanResponse } from '../api/endpoints/qr';
import { getSessions } from '../api/endpoints/sessions';
import { getReservations } from '../api/endpoints/reservations';
import type { ReservationItem } from '../api/endpoints/reservations';
import { QrCode, Scan, CheckCircle2, AlertCircle, RefreshCw, Ticket, Camera, Upload } from 'lucide-react';
import QRCode from 'qrcode';

export const QrScannerPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'passes'>('scan');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<QrScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activePasses, setActivePasses] = useState<{ id: string; type: 'SESSION' | 'RESERVATION'; title: string; subtitle: string }[]>([]);
  const [selectedPass, setSelectedPass] = useState<{ id: string; type: 'SESSION' | 'RESERVATION' } | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchUserPasses();
  }, []);

  const fetchUserPasses = async () => {
    try {
      const [sessions, resList] = await Promise.all([
        getSessions(true).catch(() => []),
        getReservations().catch(() => []),
      ]);

      const passes: { id: string; type: 'SESSION' | 'RESERVATION'; title: string; subtitle: string }[] = [];

      sessions.forEach(s => {
        if (!s.exitTime) {
          passes.push({
            id: s.id,
            type: 'SESSION',
            title: `Active Parking Session`,
            subtitle: `Session ID: ${s.id.slice(0, 8)}...`,
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
    if (qrToken && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrToken, { width: 220, margin: 2 }, (err: unknown) => {
        if (err) console.error(err);
      });
    }
  }, [qrToken]);

  const loadQrPass = async (type: 'SESSION' | 'RESERVATION', id: string) => {
    try {
      const res = await qrApi.generatePass(type, id);
      setQrToken(res.qrToken);
    } catch {
      setQrToken(null);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    setScanResult(null);
    setErrorMessage(null);

    try {
      const res = await qrApi.scanPass(qrInput.trim());
      setScanResult(res);
      setQrInput('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to validate QR Code. Invalid token format.');
    } finally {
      setLoading(false);
    }
  };

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
                activeTab === 'scan' ? 'bg-brand-primary text-white shadow-xs' : 'text-neutral-secondary hover:text-neutral-primary'
              }`}
            >
              <Scan className="w-4 h-4" />
              Gate Scanner
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'passes' ? 'bg-brand-primary text-white shadow-xs' : 'text-neutral-secondary hover:text-neutral-primary'
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
              <h2 className="text-xl font-bold mb-2 text-neutral-primary flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-primary" />
                Scan Gate QR Pass
              </h2>
              <p className="text-sm text-neutral-secondary mb-6">
                Paste or scan a signed QR token string to execute gate check-in or checkout.
              </p>

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
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                    Validate & Open Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQrInput(''); setScanResult(null); setErrorMessage(null); }}
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
                      <span className="text-neutral-secondary block font-semibold">Entity Type</span>
                      <span className="font-bold text-neutral-primary">{scanResult.entityType}</span>
                    </div>
                    <div>
                      <span className="text-neutral-secondary block font-semibold">Vehicle Plate</span>
                      <span className="font-bold text-neutral-primary">{scanResult.plateNumber}</span>
                    </div>
                    <div>
                      <span className="text-neutral-secondary block font-semibold">Space Number</span>
                      <span className="font-bold text-neutral-primary">{scanResult.spaceNumber}</span>
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

            <div className="bg-white rounded-2xl p-6 border border-neutral-border shadow-xs lg:col-span-2 flex flex-col items-center justify-center">
              {selectedPass && qrToken ? (
                <div className="text-center space-y-6 py-4 animate-fade-in">
                  <div>
                    <h3 className="text-xl font-extrabold text-neutral-primary">Digital Gate Pass</h3>
                    <p className="text-xs text-neutral-secondary mt-1">Show this QR code at the entrance or exit gate scanner.</p>
                  </div>

                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-border inline-block shadow-inner">
                    <canvas ref={canvasRef} className="mx-auto rounded-lg" />
                  </div>

                  <div className="max-w-md mx-auto bg-neutral-50 p-4 rounded-xl border border-neutral-border text-left">
                    <span className="text-[10px] font-bold text-neutral-secondary uppercase block mb-1">Signed Pass Token</span>
                    <p className="text-[11px] font-mono text-neutral-primary break-all select-all">{qrToken}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-secondary">
                  <QrCode className="w-16 h-16 mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm font-semibold">Select a pass from the left to display its QR code.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
