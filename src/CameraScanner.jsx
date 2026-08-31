import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

export default function CameraScanner({ onScan, onClose, inline = false }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  
  // Keep the ref updated without triggering re-renders of the scanner
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);
  
  useEffect(() => {
    // Initialize the scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };
    
    const scanner = new Html5QrcodeScanner('reader', config, false);
    
    let lastScanTime = 0;
    
    scanner.render(
      (decodedText) => {
        if (!decodedText || !decodedText.trim()) return;
        const now = Date.now();
        if (now - lastScanTime < 2000) return; // 2 second cooldown between scans
        lastScanTime = now;
        
        if (onScanRef.current) {
          onScanRef.current(decodedText.trim());
        }
      },
      (errorMessage) => {
        // Ignored, happens when no barcode is in front of camera
      }
    );
    
    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const scannerContent = (
    <>
      <div id="reader" style={{ width: '100%', border: 'none', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p className="modal-subtitle" style={{ textAlign: 'center', margin: '16px 0 0 0' }}>
        Point your camera at the barcode
      </p>
    </>
  );

  if (inline) {
    return <div style={{ padding: '16px' }}>{scannerContent}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} /> Scan Barcode
          </span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        {scannerContent}
      </div>
    </div>
  );
}
