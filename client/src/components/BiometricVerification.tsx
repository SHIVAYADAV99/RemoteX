import React, { useState, useEffect, useRef } from 'react';
import { Camera, Shield, CheckCircle2, AlertTriangle, ScanFace } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';

interface BiometricVerificationProps {
    onVerified: () => void;
    onCancel: () => void;
}

export default function BiometricVerification({ onVerified, onCancel }: BiometricVerificationProps) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Mock camera start
        if (status === 'scanning' || status === 'idle') {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access failed", err);
            // Fallback for demo if no camera
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleStartScan = () => {
        setStatus('scanning');
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setStatus('verified');
                setTimeout(() => {
                    onVerified();
                }, 1000);
            }
        }, 50);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <GlassCard className="max-w-md w-full p-6 text-center border-t-4 border-t-purple-500" variant="dark">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600">
                            <ScanFace className={`w-10 h-10 ${status === 'scanning' ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                        </div>
                        {status === 'verified' && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-4 border-slate-900">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Identity Verification</h2>
                <p className="text-slate-400 mb-6 text-sm">
                    This secure session requires biometric authentication. Please look at the camera.
                </p>

                <div className="relative w-64 h-64 mx-auto mb-6 bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />

                    {/* Scanning Overlay */}
                    {status === 'scanning' && (
                        <div className="absolute inset-0 border-2 border-purple-500/50 rounded-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-scan-line"></div>
                            <div className="absolute inset-x-0 bottom-4 text-center">
                                <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur text-xs font-mono text-purple-300 rounded-full border border-purple-500/30">
                                    ANALYZING FEATURES... {progress}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {status === 'idle' && (
                    <NeonButton onClick={handleStartScan} size="lg" className="w-full" variant="primary">
                        <Camera className="w-5 h-5 mr-2" />
                        Start Face Scan
                    </NeonButton>
                )}

                {status === 'scanning' && (
                    <div className="text-purple-400 font-mono text-sm animate-pulse">
                        Verifying identity...
                    </div>
                )}

                {status === 'verified' && (
                    <div className="text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                        <Shield className="w-5 h-5" />
                        Access Granted
                    </div>
                )}

                <button
                    onClick={onCancel}
                    className="mt-4 text-slate-500 hover:text-white text-sm transition-colors"
                >
                    Cancel Verification
                </button>
            </GlassCard>
        </div>
    );
}
