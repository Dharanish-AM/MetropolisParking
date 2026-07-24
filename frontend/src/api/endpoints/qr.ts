import { client } from '../client';

export interface QrGenerateResponse {
  qrToken: string;
  payload: string;
}

export interface QrScanResponse {
  action: string;
  entityId: string;
  entityType: string;
  plateNumber: string;
  spaceNumber: string;
  status: string;
  message: string;
}

export const qrApi = {
  generatePass: async (entityType: string, entityId: string): Promise<QrGenerateResponse> => {
    const res = await client.get<QrGenerateResponse>(`/qr/generate?entityType=${entityType}&entityId=${entityId}`);
    return res.data;
  },
  scanPass: async (qrToken: string): Promise<QrScanResponse> => {
    const res = await client.post<QrScanResponse>('/qr/scan', { qrToken });
    return res.data;
  },
};
