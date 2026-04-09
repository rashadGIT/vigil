'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Dynamic import prevents SSR error — react-signature-canvas accesses document
const SignatureCanvasComponent = dynamic(
  () => import('react-signature-canvas'),
  {
    ssr: false,
    loading: () => <div className="h-40 w-full border rounded-md bg-gray-50 animate-pulse" />
  }
);

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
}

export function SignatureCapture({ onSave }: SignatureCanvasProps) {
  const [canvasInstance, setCanvasInstance] = useState<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function handleSave() {
    if (canvasInstance && !canvasInstance.isEmpty()) {
      onSave(canvasInstance.getTrimmedCanvas().toDataURL('image/png'));
    }
  }

  function handleClear() {
    if (canvasInstance) {
      canvasInstance.clear();
      setIsEmpty(true);
    }
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-hidden bg-white">
        <SignatureCanvasComponent
          penColor="black"
          canvasProps={{ className: 'w-full h-40', width: 600, height: 160 }}
          onEnd={() => setIsEmpty(false)}
          {...({ ref: (ref: any) => setCanvasInstance(ref) } as any)}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isEmpty}>Save Signature</Button>
        <Button size="sm" variant="outline" onClick={handleClear}>Clear</Button>
      </div>
    </div>
  );
}
