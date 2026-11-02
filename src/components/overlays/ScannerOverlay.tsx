import React from 'react';
import { motion } from 'motion/react';
import { X, ScanLine } from 'lucide-react';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import { SheetGrabber } from '../SheetGrabber';

export function ScannerOverlay({ onClose }: { onClose: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
        setHasPermission(false);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 1 }}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 420, bounceDamping: 40 }}
        onDragEnd={finishVerticalDrag}
        className="bg-white w-full md:max-w-md md:rounded-[32px] rounded-t-[32px] p-6 flex flex-col shadow-2xl border border-slate-100 h-[80vh] md:max-h-[90vh]"
        onClick={event => event.stopPropagation()}
      >
        <div
          className="w-12 mx-auto mb-[17px] md:hidden shrink-0 text-slate-200 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={startVerticalDrag}
        >
          <SheetGrabber />
        </div>

        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Scanner</h2>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative flex flex-col items-center justify-center bg-slate-900 rounded-[32px] overflow-hidden shadow-inner mb-6 min-h-[300px]">
          {hasPermission === null && (
            <div className="text-white/70 animate-pulse text-sm z-10 relative">Requesting camera access...</div>
          )}
          {hasPermission === false && (
            <div className="text-white text-center p-8 z-10 relative">
              <ScanLine className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <p className="font-bold mb-2">Camera Access Required</p>
              <p className="text-sm text-white/70">Please enable camera permissions to use the scanner.</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scanner Reticle Overlay */}
          {hasPermission && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] aspect-square max-w-[280px] relative">
                 {/* Box shadow to dim the background */}
                 <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-[32px] pointer-events-none border border-white/20"></div>
                 {/* Corner markers */}
                 <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-[32px]"></div>
                 <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-[32px]"></div>
                 <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-[32px]"></div>
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-[32px]"></div>

                 {/* Scanning line animation */}
                 <motion.div
                   animate={{ top: ["0%", "100%", "0%"] }}
                   transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                   className="absolute left-6 right-6 h-0.5 bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)] z-10 rounded-full"
                 />
              </div>
            </div>
          )}
        </div>

        <div className="text-center pb-2 shrink-0">
          <p className="text-slate-500 text-sm font-medium">Point your camera at a barcode to add to your list, or scan a store QR code.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
