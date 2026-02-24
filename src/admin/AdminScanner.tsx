import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    if (!cameraOn || !videoRef.current) return;
    setCameraError(null);
    let cancelled = false;
    const video = videoRef.current;
    const canvas = canvasRef.current;

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

        if (supportsBarcodeDetector) {
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
        } else if (canvas) {
          // Fallback: jsQR on canvas (Safari, Firefox, etc.)
          const ctx = canvas.getContext('2d');
          if (ctx) {
            function fallbackScan() {
              if (cancelled || !streamRef.current || video.readyState < 2 || !video.videoWidth || !canvas || !ctx) {
                scanRef.current = requestAnimationFrame(fallbackScan);
                return;
              }
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qr = jsQR(imageData.data, imageData.width, imageData.height);
              if (qr?.data) {
                verifyCode(qr.data);
                setCameraOn(false);
                return;
              }
              scanRef.current = requestAnimationFrame(fallbackScan);
            }
            scanRef.current = requestAnimationFrame(fallbackScan);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError('Could not access camera. Allow camera permission and try again.');
          setCameraOn(false);
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (scanRef.current != null) cancelAnimationFrame(scanRef.current);
    };
  }, [cameraOn, supportsBarcodeDetector, verifyCode]);

  const turnOffCamera = () => {
    setCameraOn(false);
    setCameraError(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return turnOffCamera;
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-scanner-container">
        {/* Camera button first and always visible */}
        <section className="admin-scanner-camera-section" aria-label="Scan QR with camera">
          {!cameraOn ? (
            <button
              type="button"
              className="admin-scanner-camera-btn admin-scanner-camera-btn-primary"
              onClick={() => setCameraOn(true)}
              disabled={loading}
              aria-label="Open camera to scan QR code"
              title="Open camera to scan QR code"
              style={{ display: 'inline-flex', opacity: 1, visibility: 'visible' }}
            >
              <span className="admin-scanner-camera-btn-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                </svg>
              </span>
              <span className="admin-scanner-camera-btn-label">Open camera to scan QR code</span>
            </button>
          ) : (
            <div className="admin-scanner-camera-wrap">
              <video ref={videoRef} muted playsInline className="admin-scanner-video" />
              <canvas ref={canvasRef} className="admin-scanner-canvas" aria-hidden />
              <button type="button" className="admin-scanner-camera-off" onClick={turnOffCamera}>
                Stop camera
              </button>
            </div>
          )}
          {cameraError && <p className="admin-scanner-camera-error">{cameraError}</p>}
        </section>

        <div className="admin-page-header">
          <h1 className="admin-page-title">Ticket Scanner</h1>
          <p className="admin-scanner-subtitle">Verify tickets for your events. Open the camera to scan a QR code or enter the code below.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-scanner-form">
          <label htmlFor="ticket-code" className="admin-login-label">
            Or enter ticket code
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
