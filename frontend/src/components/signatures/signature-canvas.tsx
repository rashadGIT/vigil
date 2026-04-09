'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
}

export function SignatureCapture({ onSave }: SignatureCanvasProps) {
  const canvasRef = useRef<SignatureCanvas>(null);

  function handleSave() {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      onSave(canvasRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-hidden bg-white">
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{ className: 'w-full h-40', width: 600, height: 160 }}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>Save Signature</Button>
        <Button size="sm" variant="outline" onClick={() => canvasRef.current?.clear()}>Clear</Button>
      </div>
    </div>
  );
}
