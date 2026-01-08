/**
 * Customer Landing Page
 * 
 * This page is served when customer opens the download link:
 * https://support.remotex.com/join/{SESSION_ID}
 * 
 * Features:
 * - Auto-detects platform (Windows/Mac/Linux)
 * - Auto-downloads customer-only client
 * - Pre-fills session ID
 * - NO admin code present
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Download, Check, AlertCircle, Loader } from 'lucide-react';
import { customerAPI } from '../services/CustomerAPIService';

export d

efault function CustomerLandingPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const [validationStatus, setValidationStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
    const [errorMessage, setErrorMessage] = useState('');
    const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux'>('windows');
    const [downloadStarted, setDownloadStarted] = useState(false);

    // Detect platform
    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('win')) setPlatform('windows');
        else if (userAgent.includes('mac')) setPlatform('mac');
        else setPlatform('linux');
    }, []);

    // Validate session on mount
    useEffect(() => {
        if (!sessionId) {
            setValidationStatus('invalid');
            setErrorMessage('Invalid or missing session ID');
            return;
        }

        validateSession();
    }, [sessionId]);

    const validateSession = async () => {
        try {
            const response = await customerAPI.validateSession(sessionId!);

            if (response.valid) {
                setValidationStatus('valid');
                // Auto-download after 2 seconds
                setTimeout(startDownload, 2000);
            } else {
                setValidationStatus('invalid');
                setErrorMessage(response.message || 'Session is invalid or expired');
            }
        } catch (error) {
            setValidationStatus('invalid');
            setErrorMessage('Failed to validate session. Please contact your support technician.');
        }
    };

    const startDownload = () => {
        setDownloadStarted(true);

        // Determine download URL based on platform
        const downloadURLs = {
            windows: `/downloads/RemoteX-Customer-${sessionId}-Setup.exe`,
            mac: `/downloads/RemoteX-Customer-${sessionId}.dmg`,
            linux: `/downloads/RemoteX-Customer-${sessionId}.AppImage`,
        };

        // Trigger download
        const link = document.createElement('a');
        link.href = downloadURLs[platform];
        link.download = `RemoteX-Customer-Setup${platform === 'windows' ? '.exe' : ''}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Alternative: Deep link for installed app
        setTimeout(() => {
            window.location.href = `remotex://join/${sessionId}`;
        }, 1000);
    };

    if (validationStatus === 'validating') {
        return <LoadingView />;
    }

    if (validationStatus === 'invalid') {
        return <ErrorView message={errorMessage} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-md w-full">
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-200">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2">
                            RemoteX Support
                        </h1>
                        <p className="text-sm text-slate-500 font-semibold">
                            Secure Remote Assistance Session
                        </p>
                    </div>

                    {/* Session ID Display */}
                    <div className="mb-8">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                            Session Code
                        </label>
                        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                            <p className="text-center font-mono text-2xl font-black text-indigo-600 tracking-[0.3em]">
                                {sessionId}
                            </p>
                        </div>
                    </div>

                    {/* Download Status */}
                    <div className="space-y-4">
                        {!downloadStarted ? (
                            <>
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                                    <Check className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        Session validated successfully
                                    </span>
                                </div>

                                <button
                                    onClick={startDownload}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <Download className="w-5 h-5" />
                                    Download for {platform === 'windows' ? 'Windows' : platform === 'mac' ? 'macOS' : 'Linux'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                                    <Download className="w-5 h-5 text-emerald-600 animate-bounce" />
                                    <span className="text-sm font-semibold text-emerald-900">
                                        Download started...
                                    </span>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <h3 className="font-black text-xs text-slate-600 uppercase tracking-widest mb-3">
                                        Next Steps:
                                    </h3>
                                    <ol className="space-y-2 text-sm text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="font-black text-indigo-600">1.</span>
                                            <span>Open the downloaded file</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-black text-indigo-600">2.</span>
                                            <span>Run RemoteX Customer App</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-black text-indigo-600">3.</span>
                                            <span>Your session will connect automatically</span>
                                        </li>
                                    </ol>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Platform Selector */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-500 text-center mb-3 font-semibold">
                            Wrong platform?
                        </p>
                        <div className="flex gap-2 justify-center">
                            {(['windows', 'mac', 'linux'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${platform === p
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-xs text-amber-900 text-center">
                            <strong>Security Notice:</strong> Only download from this official link.
                            Do not share your session code with others.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>© 2026 RemoteX. Secure Remote Support Platform.</p>
                </div>
            </div>
        </div>
    );
}

// Loading View
function LoadingView() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700">Validating session...</p>
            </div>
        </div>
    );
}

// Error View
function ErrorView({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-2xl text-center">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-4">
                    Session Invalid
                </h1>
                <p className="text-sm text-slate-600 mb-8">{message}</p>
                <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">
                        Please contact your support technician for a new link.
                    </p>
                </div>
            </div>
        </div>
    );
}
