import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    file: File;
    onCancel: () => void;
    onSave: (file: File) => void;
};

type Box = { x: number; y: number; w: number; h: number };

export default function ImageEditorModal({ file, onCancel, onSave }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const cropRef = useRef<Box>({ x: 0, y: 0, w: 100, h: 100 });
    const dragRef = useRef<{
        mode: 'move' | 'draw' | null;
        startX: number;
        startY: number;
        origin: Box;
    }>({ mode: null, startX: 0, startY: 0, origin: { x: 0, y: 0, w: 0, h: 0 } });

    const [rotation, setRotation] = useState(0);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            setReady(true);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const sizeForRotation = (rot: number) => {
        const img = imageRef.current!;
        const q = Math.abs(rot % 180) === 90;
        return {
            w: q ? img.naturalHeight : img.naturalWidth,
            h: q ? img.naturalWidth : img.naturalHeight,
        };
    };

    const paint = (rot: number) => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const { w, h } = sizeForRotation(rot);
        const scale = Math.min(1, Math.min(560, window.innerWidth - 64) / w);
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));

        cropRef.current = {
            x: canvas.width * 0.1,
            y: canvas.height * 0.1,
            w: canvas.width * 0.8,
            h: canvas.height * 0.8,
        };

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(
            img,
            (-img.naturalWidth * scale) / 2,
            (-img.naturalHeight * scale) / 2,
            img.naturalWidth * scale,
            img.naturalHeight * scale,
        );
        ctx.restore();

        const box = cropRef.current;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.fill('evenodd');
        ctx.strokeStyle = '#B8E34B';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
    };

    const repaintCrop = (rot: number) => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;
        const { w, h } = sizeForRotation(rot);
        const scale = canvas.width / w;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const box = cropRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(
            img,
            (-img.naturalWidth * scale) / 2,
            (-img.naturalHeight * scale) / 2,
            img.naturalWidth * scale,
            img.naturalHeight * scale,
        );
        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.fill('evenodd');
        ctx.strokeStyle = '#B8E34B';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
    };

    useEffect(() => {
        if (!ready) return;
        paint(rotation);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, rotation]);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current!;
        const r = c.getBoundingClientRect();
        return {
            x: ((e.clientX - r.left) / r.width) * c.width,
            y: ((e.clientY - r.top) / r.height) * c.height,
        };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const box = cropRef.current;
        const p = pos(e);
        const inside =
            p.x >= box.x &&
            p.x <= box.x + box.w &&
            p.y >= box.y &&
            p.y <= box.y + box.h;
        dragRef.current = {
            mode: inside ? 'move' : 'draw',
            startX: p.x,
            startY: p.y,
            origin: { ...box },
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const drag = dragRef.current;
        if (!drag.mode) return;
        const p = pos(e);
        const c = canvasRef.current!;
        if (drag.mode === 'move') {
            cropRef.current = {
                ...drag.origin,
                x: Math.min(
                    Math.max(0, drag.origin.x + (p.x - drag.startX)),
                    c.width - drag.origin.w,
                ),
                y: Math.min(
                    Math.max(0, drag.origin.y + (p.y - drag.startY)),
                    c.height - drag.origin.h,
                ),
            };
        } else {
            const x = Math.max(0, Math.min(drag.startX, p.x));
            const y = Math.max(0, Math.min(drag.startY, p.y));
            const w = Math.min(c.width - x, Math.abs(p.x - drag.startX));
            const h = Math.min(c.height - y, Math.abs(p.y - drag.startY));
            if (w > 8 && h > 8) cropRef.current = { x, y, w, h };
        }
        repaintCrop(rotation);
    };

    const exportCropped = (): Promise<File> =>
        new Promise((resolve, reject) => {
            const img = imageRef.current;
            const canvas = canvasRef.current;
            if (!img || !canvas) {
                reject(new Error('no image'));
                return;
            }
            const crop = cropRef.current;
            const { w: rw, h: rh } = sizeForRotation(rotation);
            const scaleX = rw / canvas.width;
            const scaleY = rh / canvas.height;

            const rotated = document.createElement('canvas');
            rotated.width = rw;
            rotated.height = rh;
            const rctx = rotated.getContext('2d');
            if (!rctx) {
                reject(new Error('no ctx'));
                return;
            }
            rctx.translate(rw / 2, rh / 2);
            rctx.rotate((rotation * Math.PI) / 180);
            rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

            const out = document.createElement('canvas');
            out.width = Math.max(1, Math.round(crop.w * scaleX));
            out.height = Math.max(1, Math.round(crop.h * scaleY));
            const octx = out.getContext('2d');
            if (!octx) {
                reject(new Error('no out ctx'));
                return;
            }
            octx.drawImage(
                rotated,
                Math.round(crop.x * scaleX),
                Math.round(crop.y * scaleY),
                out.width,
                out.height,
                0,
                0,
                out.width,
                out.height,
            );

            const name = file.name.replace(/\.\w+$/, '') + '.jpg';
            out.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(
                            new File([blob], name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            }),
                        );
                        return;
                    }
                    // Fallback si toBlob falla
                    const dataUrl = out.toDataURL('image/jpeg', 0.92);
                    fetch(dataUrl)
                        .then((r) => r.blob())
                        .then((b) =>
                            resolve(
                                new File([b], name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                }),
                            ),
                        )
                        .catch(reject);
                },
                'image/jpeg',
                0.92,
            );
        });

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        try {
            const edited = await exportCropped();
            onSave(edited);
        } catch {
            setBusy(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/70 p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="border-b border-[#E3E5E0] px-4 py-3">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                        Recortar imagen
                    </h3>
                    <p className="text-xs text-[#6B7069]">
                        Arrastra el marco verde o dibuja uno nuevo fuera de él
                    </p>
                </div>
                <div className="flex justify-center overflow-auto bg-[#111315] p-3">
                    <canvas
                        ref={canvasRef}
                        className="max-w-full cursor-crosshair touch-none"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={() => {
                            dragRef.current.mode = null;
                        }}
                    />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E5E0] px-4 py-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="rounded-md border border-[#E3E5E0] px-3 py-1.5 text-sm"
                            onClick={() => setRotation((r) => r - 90)}
                        >
                            ↺ 90°
                        </button>
                        <button
                            type="button"
                            className="rounded-md border border-[#E3E5E0] px-3 py-1.5 text-sm"
                            onClick={() => setRotation((r) => r + 90)}
                        >
                            ↻ 90°
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="rounded-md border border-[#E3E5E0] px-3 py-1.5 text-sm"
                            onClick={onCancel}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={busy || !ready}
                            className="rounded-md bg-[#B8E34B] px-3 py-1.5 text-sm font-semibold text-[#111315] disabled:opacity-50"
                            onClick={handleSave}
                        >
                            {busy ? 'Aplicando…' : 'Usar recorte'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
