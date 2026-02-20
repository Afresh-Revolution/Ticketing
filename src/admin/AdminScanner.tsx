import { useState, useRef, useEffect, useCallback } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

type VerifyResult =
  | { valid: true; message: string; fullName?: string; eventTitle?: string; scanCount?: number; totalQuantity?: number; fullyUsed?: boolean }
  | { valid: false; reason: string; message: string; fullName?: string; eventTitle?: string; scanCount?: number; totalQuantity?: number };

const AdminScanner = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRef = useRef<number | null>(null);

  const verifyCode = useCallback(async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/verify-ticket'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      setResult(data as VerifyResult);
      if (data.valid) setCode('');
    } catch (err) {
      setResult({ valid: false, reason: 'error', message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(code);
  };

  const supportsBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!cameraOn || !supportsBarcodeDetector || !videoRef.current) return;
    let cancelled = false;
    const video = videoRef.current;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().catch(() => {});
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        function scan() {
          if (cancelled || !streamRef.current || video.readyState < 2) {
            scanRef.current = requestAnimationFrame(scan);
            return;
          }
          detector
            .detect(video)
            .then((codes) => {
              if (cancelled) return;
              if (codes.length > 0 && codes[0].rawValue) {
                verifyCode(codes[0].rawValue);
                setCameraOn(false);
                return;
              }
              scanRef.current = requestAnimationFrame(scan);
            })
            .catch(() => {
              scanRef.current = requestAnimationFrame(scan);
            });
        }
        scanRef.current = requestAnimationFrame(scan);
      })
      .catch(() => setCameraOn(false));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (scanRef.current != null) cancelAnimationFrame(scanRef.current);
    };
  }, [cameraOn, supportsBarcodeDetector, verifyCode]);

  const turnOffCamera = () => {
    setCameraOn(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return turnOffCamera;
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-scanner-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Ticket Scanner</h1>
          <p className="admin-scanner-subtitle">Verify tickets for your events. Scan QR or enter code.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-scanner-form">
          <label htmlFor="ticket-code" className="admin-login-label">
            Ticket code
          </label>
          <div className="admin-scanner-input-wrap">
            <input
              id="ticket-code"
              type="text"
              className="admin-login-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. A1B2C3D4E5F6"
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" className="admin-scanner-verify-btn" disabled={loading || !code.trim()}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </form>

        {supportsBarcodeDetector && (
          <div className="admin-scanner-camera">
            {!cameraOn ? (
              <button type="button" className="admin-scanner-camera-btn" onClick={() => setCameraOn(true)}>
                📷 Scan with camera
              </button>
            ) : (
              <div className="admin-scanner-camera-wrap">
                <video ref={videoRef} muted playsInline className="admin-scanner-video" />
                <button type="button" className="admin-scanner-camera-off" onClick={turnOffCamera}>
                  Stop camera
                </button>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`admin-scanner-result ${result.valid ? 'admin-scanner-result-valid' : 'admin-scanner-result-invalid'}`}>
            <h3>{result.valid ? '✓ Verified' : '✗ Not valid'}</h3>
            <p className="admin-scanner-result-message">{result.message}</p>
            {result.fullName && <p><strong>Name:</strong> {result.fullName}</p>}
            {result.eventTitle && <p><strong>Event:</strong> {result.eventTitle}</p>}
            {!result.valid && result.reason === 'already_used' && result.scanCount != null && result.totalQuantity != null && (
              <p>Used {result.scanCount} of {result.totalQuantity} scan(s).</p>
            )}
            {result.valid && result.scanCount != null && result.totalQuantity != null && (
              <p>Scan {result.scanCount} of {result.totalQuantity}{result.fullyUsed ? ' (fully used)' : ''}.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScanner;
