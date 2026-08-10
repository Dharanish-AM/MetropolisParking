import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Tesseract from 'tesseract.js';
import { client } from '../../../api/client';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
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

import { useToast } from '../../../context/ToastContext';

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

export const AnprFeature: FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedLotId, setSelectedLotId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [entryResult, setEntryResult] = useState<AnprEntryResponse | null>(null);
  const [exitResult, setExitResult] = useState<AnprExitResponse | null>(null);

  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const initWorker = async () => {
      try {
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
        });
        if (active) {
          workerRef.current = worker;
        } else {
          await worker.terminate();
        }
      } catch (err) {
        console.error(err);
      }
    };
    initWorker();
    return () => {
      active = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

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
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      enumerateDevices();
      navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    }
    return () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
      }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const exitMutation = useMutation({
    mutationFn: async (data: { plateNumber: string }) => {
      const resp = await client.post('/anpr/exit', data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanPlate = useCallback(async (): Promise<boolean> => {
    if (!videoRef.current || !canvasRef.current) return false;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const cropWidth = Math.round(videoWidth * 0.65);
    const cropHeight = Math.round(videoHeight * 0.35);
    const cropX = Math.round((videoWidth - cropWidth) / 2);
    const cropY = Math.round((videoHeight - cropHeight) / 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const newGray = factor * (gray - 128) + 128;
      data[i] = newGray;
      data[i + 1] = newGray;
      data[i + 2] = newGray;
    }
    ctx.putImageData(imageData, 0, 0);

    setOcrError(null);

    try {
      let recognizedText = '';
      if (workerRef.current) {
        const result = await workerRef.current.recognize(canvas.toDataURL('image/png'));
        recognizedText = result.data.text;
      } else {
        const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'eng');
        recognizedText = result.data.text;
      }

      const cleaned = recognizedText
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .trim();

      if (cleaned.length >= 4) {
        setPlateNumber(cleaned);
        setOcrError(null);
        return true;
      }
    } catch {
      setOcrError('OCR processing failed. Please try again or enter the plate manually.');
    }
    return false;
  }, []);

  useEffect(() => {
    let active = true;
    let timerId: any = null;

    const runLoop = async () => {
      if (!active || !isCameraActive) return;
      await scanPlate();
      if (active && isCameraActive) {
        timerId = setTimeout(runLoop, 1000);
      }
    };

    if (isCameraActive) {
      timerId = setTimeout(runLoop, 1000);
    }

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isCameraActive, scanPlate]);

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
        onSuccess: (data: AnprEntryResponse) => {
          setEntryResult(data);
          showToast(
            `Vehicle ${data.plateNumber} checked in (Space ${data.spaceNumber})`,
            'success'
          );
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || 'Failed to process gate entry.';
          setError(errMsg);
          showToast(errMsg, 'error');
        },
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
        onSuccess: (data: AnprExitResponse) => {
          setExitResult(data);
          showToast(
            `Vehicle ${data.plateNumber} checked out. Fee: ₹${data.fee.toFixed(2)}`,
            'success'
          );
        },
        onError: (err: any) => {
          const errMsg =
            err.response?.data?.message || 'No active session found for this license plate.';
          setError(errMsg);
          showToast(errMsg, 'error');
        },
      }
    );
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
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
                  <Select
                    data-testid="camera-select"
                    value={selectedDeviceId}
                    onChange={e => switchCamera(e.target.value)}
                  >
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
                <div className="flex items-start gap-2 p-3 bg-status-reserved/10 border border-status-reserved/20 rounded-xl text-status-reserved text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    No cameras detected. Start iVCam on your iPhone or grant browser permissions
                    first.
                  </span>
                </div>
              )}

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-brand-nav-dark border border-neutral-border flex items-center justify-center">
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
                  <Button variant="secondary" onClick={stopCamera} className="w-full">
                    Turn Off Camera
                  </Button>
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

              {isCameraActive && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-primary animate-pulse py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning for license plate continuously...</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
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
                <label className="text-sm font-bold text-neutral-primary">Select Parking Lot</label>
                <Select
                  data-testid="lot-select"
                  value={selectedLotId}
                  onChange={e => setSelectedLotId(e.target.value)}
                >
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
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
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
                  className="w-full bg-status-available hover:bg-status-available/90"
                >
                  Simulate Entry
                </Button>
                <Button
                  onClick={handleExit}
                  isLoading={exitMutation.isPending}
                  className="w-full bg-status-occupied hover:bg-status-occupied/90"
                >
                  Simulate Exit
                </Button>
              </div>
            </div>
          </Card>

          {ocrError && (
            <div className="p-4 bg-status-reserved/10 border border-status-reserved/20 rounded-2xl text-status-reserved text-sm flex gap-3 items-start animate-shake">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">OCR Warning: </span>
                <span>{ocrError}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-status-occupied/10 border border-status-occupied/20 rounded-2xl text-status-occupied text-sm flex gap-3 items-start animate-shake">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">Error: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {entryResult && (
            <div className="bg-status-available/10 border border-status-available/20 rounded-3xl p-8 space-y-6 animate-scale-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-status-available/20 flex items-center justify-center text-status-available">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-status-available">Entry Gate Opened</h3>
                  <p className="text-status-available text-xs mt-0.5">
                    Vehicle registered and space allocated
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-status-available/10 rounded-2xl p-4">
                  <span className="text-[10px] text-status-available/60 uppercase font-bold tracking-wider">
                    Assigned Level
                  </span>
                  <p className="text-2xl font-extrabold text-status-available mt-1">
                    Level {entryResult.levelNumber}
                  </p>
                </div>
                <div className="bg-white border border-status-available/10 rounded-2xl p-4">
                  <span className="text-[10px] text-status-available/60 uppercase font-bold tracking-wider">
                    Parking Space
                  </span>
                  <p className="text-2xl font-extrabold text-status-available mt-1">
                    Space {entryResult.spaceNumber}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-status-available/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-status-available/10 pb-3">
                  <span className="text-status-available/60 font-medium">Scanned Plate</span>
                  <span className="font-mono font-extrabold text-status-available bg-status-available/10 px-2 py-0.5 rounded-lg">
                    {entryResult.plateNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-status-available/60 font-medium">Check-In Time</span>
                  <span className="font-semibold text-status-available">
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
                  <h3 className="text-xl font-bold text-neutral-primary">Exit Gate Bill Summary</h3>
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
                    ₹{exitResult.fee.toFixed(2)}
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
                Select your <strong>iVCam</strong> or any connected camera, start the stream, point
                it at a license plate, then hit <em>Scan Plate</em> to auto-fill the number.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
