import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Tesseract from 'tesseract.js';
import { client } from '../api/client';
import { Navbar } from '../components/Navbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import {
  Camera,
  CameraOff,
  ScanLine,
  ArrowRightLeft,
  CheckCircle2,
  Receipt,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Video,
} from 'lucide-react';

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface AnprEntryResponse {
  sessionId: string;
  plateNumber: string;
  spaceNumber: string;
  levelNumber: number;
  entryTime: string;
}

interface AnprExitResponse {
  sessionId: string;
  plateNumber: string;
  durationMinutes: number;
  fee: number;
  paymentStatus: string;
}

export const AnprSimulator: FC = () => {
  const [selectedLotId, setSelectedLotId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [entryResult, setEntryResult] = useState<AnprEntryResponse | null>(null);
  const [exitResult, setExitResult] = useState<AnprExitResponse | null>(null);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const enumerateDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setCameraDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch {
      setCameraDevices([]);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  const { data: lots } = useQuery<ParkingLot[]>({
    queryKey: ['parking-lots'],
    queryFn: async () => {
      const resp = await client.get('/parking-lots');
      return resp.data;
    },
  });

  const entryMutation = useMutation({
    mutationFn: async (data: { plateNumber: string; lotId: string }) => {
      const resp = await client.post('/anpr/entry', data);
      return resp.data;
    },
  });

  const exitMutation = useMutation({
    mutationFn: async (data: { plateNumber: string }) => {
      const resp = await client.post('/anpr/exit', data);
      return resp.data;
    },
  });

  const startCamera = async (deviceId?: string) => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      setCameraDevices(videoDevices);
    } catch {
      setError(
        'Could not access camera. Make sure permissions are granted and the selected device is connected.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    streamRef.current = null;
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      await startCamera(deviceId);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanPlate = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsOcrProcessing(true);
    setError(null);
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'eng', {
        logger: m => {
          if (m.status === 'recognizing') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const recognizedText = result.data.text;
      const cleaned = recognizedText
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .trim();

      if (cleaned.length >= 4) {
        setPlateNumber(cleaned);
      } else {
        setError(
          'No valid plate characters detected. Ensure the plate is clear, well-lit and centered in the frame.'
        );
      }
    } catch {
      setError('OCR processing failed. Please try again or enter the plate manually.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const generateMockPlate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const rand = (s: string) => s.charAt(Math.floor(Math.random() * s.length));
    const plate = `${rand(chars)}${rand(chars)}-${rand(nums)}${rand(nums)}-${rand(chars)}${rand(chars)}-${rand(nums)}${rand(nums)}${rand(nums)}${rand(nums)}`;
    setPlateNumber(plate);
    setError(null);
  };

  const handleEntry = () => {
    if (!selectedLotId) {
      setError('Please select a parking lot.');
      return;
    }
    if (!plateNumber) {
      setError('Please scan or enter a license plate number.');
      return;
    }
    setEntryResult(null);
    setExitResult(null);
    setError(null);
    entryMutation.mutate(
      { plateNumber, lotId: selectedLotId },
      {
        onSuccess: (data: AnprEntryResponse) => setEntryResult(data),
        onError: (err: any) =>
          setError(err.response?.data?.message || 'Failed to process gate entry.'),
      }
    );
  };

  const handleExit = () => {
    if (!plateNumber) {
      setError('Please scan or enter a license plate number.');
      return;
    }
    setEntryResult(null);
    setExitResult(null);
    setError(null);
    exitMutation.mutate(
      { plateNumber },
      {
        onSuccess: (data: AnprExitResponse) => setExitResult(data),
        onError: (err: any) =>
          setError(
            err.response?.data?.message || 'No active session found for this license plate.'
          ),
      }
    );
  };

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ANPR Camera Simulator</h1>
          <p className="text-neutral-secondary text-sm mt-1">
            Use any connected camera — including <strong>iVCam</strong> — to scan license plates in
            real time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand-primary" />
                  <span className="font-bold text-sm uppercase tracking-wider">Camera Source</span>
                </div>
              </CardHeader>
              <div className="p-6 space-y-4">
                {cameraDevices.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-secondary uppercase tracking-wider">
                      Select Camera / iVCam Device
                    </label>
                    <Select value={selectedDeviceId} onChange={e => switchCamera(e.target.value)}>
                      {cameraDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                    <p className="text-[11px] text-neutral-secondary">
                      iVCam, DroidCam or any virtual webcam will appear in this list once its app is
                      running on your phone.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      No cameras detected. Start iVCam on your iPhone or grant browser permissions
                      first.
                    </span>
                  </div>
                )}

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-border flex items-center justify-center">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-[3px] border-dashed border-brand-primary/50 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                        <ScanLine className="w-8 h-8 text-brand-primary animate-pulse" />
                      </div>
                      {selectedDeviceId && cameraDevices.length > 0 && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg font-mono truncate max-w-[80%]">
                          {cameraDevices.find(d => d.deviceId === selectedDeviceId)?.label}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center space-y-2">
                      <CameraOff className="w-12 h-12 text-neutral-secondary mx-auto" />
                      <p className="text-sm text-neutral-secondary">Camera stream inactive</p>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2">
                  {isCameraActive ? (
                    <>
                      <Button variant="secondary" onClick={stopCamera} className="flex-1">
                        Turn Off
                      </Button>
                      <Button onClick={scanPlate} isLoading={isOcrProcessing} className="flex-1">
                        Scan Plate
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => startCamera(selectedDeviceId || undefined)}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={cameraDevices.length === 0}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Stream</span>
                    </Button>
                  )}
                </div>

                {isOcrProcessing && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-brand-primary">
                      <span>Analyzing Frame...</span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-brand-primary" />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    Gate Operation Console
                  </span>
                </div>
              </CardHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-primary">
                    Select Parking Lot
                  </label>
                  <Select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)}>
                    <option value="">Select lot...</option>
                    {lots?.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-neutral-primary">
                      License Plate Number
                    </label>
                    <button
                      onClick={generateMockPlate}
                      className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Random</span>
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. MH-12-AB-1234"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                    className="font-mono text-center text-lg tracking-wider font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleEntry}
                    isLoading={entryMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Simulate Entry
                  </Button>
                  <Button
                    onClick={handleExit}
                    isLoading={exitMutation.isPending}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    Simulate Exit
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex gap-3 items-start animate-shake">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">Error: </span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {entryResult && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 space-y-6 animate-scale-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">Entry Gate Opened</h3>
                    <p className="text-emerald-700 text-xs mt-0.5">
                      Vehicle registered and space allocated
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-emerald-100/50 rounded-2xl p-4">
                    <span className="text-[10px] text-emerald-800/60 uppercase font-bold tracking-wider">
                      Assigned Level
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                      Level {entryResult.levelNumber}
                    </p>
                  </div>
                  <div className="bg-white border border-emerald-100/50 rounded-2xl p-4">
                    <span className="text-[10px] text-emerald-800/60 uppercase font-bold tracking-wider">
                      Parking Space
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                      Space {entryResult.spaceNumber}
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-emerald-50 pb-3">
                    <span className="text-emerald-800/60 font-medium">Scanned Plate</span>
                    <span className="font-mono font-extrabold text-emerald-950 bg-emerald-100/50 px-2 py-0.5 rounded-lg">
                      {entryResult.plateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-800/60 font-medium">Check-In Time</span>
                    <span className="font-semibold text-emerald-950">
                      {new Date(entryResult.entryTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {exitResult && (
              <div className="bg-brand-primary/[0.03] border border-brand-primary/10 rounded-3xl p-8 space-y-6 animate-scale-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-primary">
                      Exit Gate Bill Summary
                    </h3>
                    <p className="text-neutral-secondary text-xs mt-0.5">
                      Departure scanned &amp; payment auto-settled
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-neutral-border rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-neutral-border pb-3">
                    <span className="text-neutral-secondary font-medium">Scanned Plate</span>
                    <span className="font-mono font-extrabold text-neutral-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-lg border border-brand-primary/10">
                      {exitResult.plateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-neutral-border pb-3">
                    <span className="text-neutral-secondary font-medium">Total Duration</span>
                    <span className="font-bold text-neutral-primary">
                      {exitResult.durationMinutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-neutral-border pb-3">
                    <span className="text-neutral-secondary font-medium">Calculated Fee</span>
                    <span className="text-xl font-extrabold text-brand-primary">
                      ${exitResult.fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-secondary font-medium">Payment Settlement</span>
                    <Badge variant="success">AUTO_PAID (CARD)</Badge>
                  </div>
                </div>
              </div>
            )}

            {!entryResult && !exitResult && !error && (
              <div className="bg-neutral-card/50 border border-neutral-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                <HelpCircle className="w-12 h-12 text-neutral-border" />
                <h4 className="font-bold text-neutral-primary">Awaiting Scan</h4>
                <p className="text-neutral-secondary text-sm max-w-sm">
                  Select your <strong>iVCam</strong> or any connected camera, start the stream,
                  point it at a license plate, then hit <em>Scan Plate</em> to auto-fill the number.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
