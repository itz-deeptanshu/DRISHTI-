import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SAMPLE_PRESETS } from '../data/mockData';
import {
  ArrowLeft,
  Camera,
  Upload,
  Sun,
  Hand,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  ShieldCheck,
  Eye,
  Video,
  VideoOff,
  RefreshCw,
} from 'lucide-react';

export const Capture: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateSession, loadPreset, t } = useScreening();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera state
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'unsupported'
  >('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'preset'>('camera');

  // Selected Preset / Upload
  const [selectedPresetId, setSelectedPresetId] = useState<string>(session.presetKey || 'sample-moderate');
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [isCapturingAnimation, setIsCapturingAnimation] = useState<boolean>(false);

  // Optical alignment guides
  const [lightingOk] = useState<boolean>(true);
  const [steadyOk] = useState<boolean>(true);

  // Require patient to be registered before proceeding with capture
  useEffect(() => {
    if (!session.patientId) {
      navigate('/patient-details');
    }
  }, [session.patientId, navigate]);

  // Real Camera Access
  const requestCameraAccess = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    // Check API support and secure context
    if (!navigator?.mediaDevices?.getUserMedia) {
      const isNotSecure = typeof window !== 'undefined' && !window.isSecureContext;
      setCameraStatus('unsupported');
      setCameraError(
        isNotSecure
          ? 'Camera access requires a secure origin (HTTPS or http://localhost). In non-secure contexts (such as an IP address over HTTP), browsers disable the MediaDevices camera API.'
          : 'Your browser does not support the Camera MediaDevices API. Please use a modern browser or upload an image.'
      );
      return;
    }

    // Stop existing stream tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setCameraStatus('requesting');
    setCameraError(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (constraintErr) {
        // Fallback for laptops/webcams where facingMode constraint may throw
        console.warn('FacingMode constraint failed, falling back to basic video input', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video playback notice:', playErr);
        }
      }

      setCameraStatus('active');
      setActiveMode('camera');

      // Check available video inputs for front/back switch
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        } catch (devErr) {
          console.warn('Could not enumerate media devices:', devErr);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setCameraError(
          'Camera permission was dismissed or blocked by the browser. Please allow camera access in your browser address bar, or click "Request Camera Access" below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('error');
        setCameraError('No camera hardware was detected on this device. You can upload an image or select a preset.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraStatus('error');
        setCameraError('The camera is currently locked or in use by another application.');
      } else {
        setCameraStatus('error');
        setCameraError(err.message || 'Unable to start camera.');
      }
    }
  }, [facingMode]);

  // Request camera on mount and clean up on unmount
  useEffect(() => {
    requestCameraAccess('environment');

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [requestCameraAccess]);

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    requestCameraAccess(nextFacing);
  };

  const handleCapture = () => {
    setIsCapturingAnimation(true);

    setTimeout(() => {
      // 1. If live camera is active and user didn't switch to preset/upload
      if (activeMode === 'camera' && cameraStatus === 'active' && videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              // Stop stream before moving to next screen
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
              }

              if (blob) {
                const file = new File([blob], `retinal-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                updateSession({
                  imageUrl: dataUrl,
                  imageFile: file,
                  presetKey: 'live-camera-capture',
                });
              }
              navigate('/quality-check');
            },
            'image/jpeg',
            0.95
          );
          return;
        }
      }

      // Stop camera before leaving
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // 2. If user uploaded a custom image
      if (activeMode === 'upload' && customImageSrc) {
        updateSession({
          imageUrl: customImageSrc,
          imageFile: customImageFile,
          presetKey: 'custom-upload',
        });
        navigate('/quality-check');
        return;
      }

      // 3. Fallback: Preset selection
      loadPreset(selectedPresetId);
      navigate('/quality-check');
    }, 450);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomImageSrc(result);
        setActiveMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    setCustomImageSrc(null);
    setCustomImageFile(null);
    setActiveMode('preset');
    loadPreset(presetId);
  };

  return (
    <div id="capture-page" className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden">
      {/* Capture Flash Animation Effect */}
      {isCapturingAnimation && (
        <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-20">
        <button
          id="capture-back-btn"
          type="button"
          onClick={() => {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
            }
            navigate('/patient-details');
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')} to {t('patientDetails')}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono">
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            <span>
              {session.patientId || 'PAT-TEMP'} • {session.eye} Eye ({session.eye === 'Left' ? 'OS' : 'OD'})
            </span>
          </div>
        </div>

        {/* Camera controls: Flip Lens or Retry */}
        <div className="flex items-center gap-2">
          {hasMultipleCameras && cameraStatus === 'active' && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              title="Switch camera lens"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Flip Camera</span>
            </button>
          )}

          {cameraStatus !== 'active' && (
            <button
              type="button"
              onClick={() => requestCameraAccess(facingMode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-white px-3 py-1.5 rounded-lg bg-teal-900/50 hover:bg-teal-800 border border-teal-700/60 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Request Camera Access</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Status & Permission Alert Banner */}
      {cameraStatus === 'denied' && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm z-20 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Camera Permission Blocked or Dismissed</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {cameraError || 'Please allow camera access in your browser address bar, then click "Retry Camera Access".'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => requestCameraAccess(facingMode)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Retry Camera Access
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 font-semibold text-xs rounded-lg border border-amber-500/30 cursor-pointer"
            >
              Upload Image
            </button>
          </div>
        </div>
      )}

      {cameraStatus === 'unsupported' && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm z-20 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <VideoOff className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-300">Secure Camera Context Required</p>
              <p className="text-xs text-rose-200/80 mt-0.5">{cameraError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            Upload Clinical Image
          </button>
        </div>
      )}

      {cameraStatus === 'error' && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">Hardware Camera Unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5">{cameraError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requestCameraAccess(facingMode)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Center Viewport Area (Circular Frame Overlay & Live Indicators) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <span>{t('cameraFeed')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Center the optic disc and macula inside the circular targeting reticle.
          </p>
        </div>

        {/* Viewfinder Circular Container */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden border-4 border-teal-500/80 shadow-[0_0_50px_rgba(13,148,136,0.25)] flex items-center justify-center bg-black">
          {/* 1. Live Camera Feed Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              activeMode === 'camera' && cameraStatus === 'active' ? 'block' : 'hidden'
            }`}
          />

          {/* 2. Custom Uploaded Image */}
          {activeMode === 'upload' && customImageSrc && (
            <img
              src={customImageSrc}
              alt="Uploaded Fundus"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {/* 3. Preset Fundus Graphic when in preset mode */}
          {activeMode === 'preset' && (
            <div className="relative w-full h-full">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <radialGradient id="camFundus" cx="48%" cy="50%" r="52%">
                  <stop offset="0%" stopColor="#c84d28" />
                  <stop offset="50%" stopColor="#8d2a13" />
                  <stop offset="100%" stopColor="#300d05" />
                </radialGradient>
                <circle cx="200" cy="200" r="200" fill="url(#camFundus)" />
                <ellipse cx="120" cy="195" rx="30" ry="36" fill="#ffd89b" opacity="0.9" />
                <circle cx="260" cy="200" r="45" fill="#4a1508" />
                <circle cx="260" cy="200" r="10" fill="#250803" />
                <path
                  d="M 120 185 C 135 150, 175 110, 230 95 C 275 85, 330 110, 360 150"
                  stroke="#5c0e08"
                  strokeWidth="5"
                  fill="none"
                />
                <path
                  d="M 120 205 C 135 240, 175 290, 235 305 C 280 315, 335 295, 365 255"
                  stroke="#5c0e08"
                  strokeWidth="5"
                  fill="none"
                />
              </svg>
            </div>
          )}

          {/* 4. Requesting Camera State Spinner */}
          {activeMode === 'camera' && cameraStatus === 'requesting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-10">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-white">Connecting to Camera...</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Please click <strong className="text-teal-300">Allow</strong> if prompted by your browser to grant camera access.
              </p>
            </div>
          )}

          {/* 5. Camera Inactive / Denied Placeholder */}
          {activeMode === 'camera' && (cameraStatus === 'denied' || cameraStatus === 'error' || cameraStatus === 'unsupported') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-10">
              <VideoOff className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-300">Camera Feed Inactive</p>
              <button
                type="button"
                onClick={() => requestCameraAccess(facingMode)}
                className="mt-3 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Request Camera Permission
              </button>
            </div>
          )}

          {/* Clinical Circular Reticle Target Frame */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Center target crosshair */}
            <div className="w-8 h-8 border border-teal-400/60 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
            </div>
            {/* Corner alignment crosshairs */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-teal-400/80" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-teal-400/80" />
            <div className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 w-4 bg-teal-400/80" />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 h-0.5 w-4 bg-teal-400/80" />

            {/* Subtle rotating guide ring */}
            <div className="absolute inset-4 rounded-full border border-dashed border-teal-400/30 animate-spin" style={{ animationDuration: '60s' }} />
          </div>
        </div>

        {/* Live-style Status Indicators */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Sun className="w-4 h-4 text-emerald-400" />
            <span>{t('goodLighting')}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Hand className="w-4 h-4 text-emerald-400" />
            <span>{t('holdSteady')}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          </div>

          {activeMode !== 'camera' && (
            <button
              type="button"
              onClick={() => {
                setActiveMode('camera');
                if (cameraStatus !== 'active') {
                  requestCameraAccess(facingMode);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-500/50 text-xs text-teal-200 hover:bg-teal-800 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Switch to Live Camera</span>
            </button>
          )}
        </div>

        {/* Sample Retina Presets Selector */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl">
          <span className="text-xs text-slate-400 font-semibold w-full text-center mb-1">
            Or select a calibrated fundus case for demo:
          </span>
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                selectedPresetId === p.id && activeMode === 'preset'
                  ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name.split('(')[1]?.replace(')', '') || p.patientName}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="p-4 sm:p-5 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4 z-20">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Secondary: Upload Button */}
        <button
          id="upload-image-fallback-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4 text-teal-400" />
          <span>{t('uploadImage')}</span>
        </button>

        {/* Primary Action: Capture Button */}
        <button
          id="capture-image-btn"
          type="button"
          onClick={handleCapture}
          className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>
            {activeMode === 'camera' && cameraStatus === 'active'
              ? 'Capture Retinal Photo'
              : activeMode === 'upload'
              ? 'Proceed with Upload'
              : 'Analyze Selected Image'}
          </span>
        </button>
      </div>
    </div>
  );
};

