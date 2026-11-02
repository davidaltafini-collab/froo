import { motion } from 'motion/react';
import { IOSWheelPicker } from '../SharedUI';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import { SheetGrabber } from '../SheetGrabber';

export function QtyPickerOverlay({ value, onChange, onClose }: { value: number, onChange: (v: number) => void, onClose: () => void }) {
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 1 }}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 420, bounceDamping: 40 }}
        onDragEnd={finishVerticalDrag}
        className="bg-white w-full rounded-t-[32px] flex flex-col shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 text-slate-200">
          <SheetGrabber />
        </div>
        <div className="flex flex-col p-6 pb-10">
          <div className="flex items-center justify-between mb-6 touch-none" onPointerDown={startVerticalDrag}>
             <div className="w-16"></div>
             <h3 className="text-lg font-bold text-slate-800">Quantity</h3>
             <button onClick={onClose} className="w-16 text-right text-green-600 font-bold text-base">Done</button>
          </div>

          <div className="px-8">
            <IOSWheelPicker value={value} onChange={onChange} max={99} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
