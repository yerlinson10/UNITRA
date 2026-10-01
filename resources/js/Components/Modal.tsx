import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import {
    PointerEvent as ReactPointerEvent,
    PropsWithChildren,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';

const CLOSE_DISTANCE = 280;
const CLOSE_MIN_FOR_FLICK = 120;
const EXPAND_DISTANCE = 100;
const COLLAPSE_DISTANCE = 110;
const VELOCITY_COMMIT = 1400;
const SHEET_EASE = '320ms cubic-bezier(0.22, 1, 0.36, 1)';
const EXIT_MS = 360;
const DECELERATION = 0.998;

function project(velocity: number, decelerationRate = DECELERATION) {
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
    return (
        (overshoot * dimension * constant) /
        (dimension + constant * Math.abs(overshoot))
    );
}

function prefersReducedMotion() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

function isMobileSheet() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 639px)').matches
    );
}

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    const panelRef = useRef<HTMLDivElement>(null);
    const collapsedHeightRef = useRef<number | null>(null);
    const closingRef = useRef(false);

    // Local visibility so Cancel / backdrop can finish the slide before unmount.
    const [open, setOpen] = useState(show);
    const [expanded, setExpanded] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [dragHeight, setDragHeight] = useState<number | null>(null);
    const [dragging, setDragging] = useState(false);
    const [exitingByDrag, setExitingByDrag] = useState(false);

    const gesture = useRef({
        active: false,
        pointerId: -1,
        startY: 0,
        startHeight: 0,
        lastY: 0,
        lastTime: 0,
        velocityY: 0,
        wasExpanded: false,
    });

    const resetSheet = () => {
        setExpanded(false);
        setDragY(0);
        setDragHeight(null);
        setDragging(false);
        setExitingByDrag(false);
        collapsedHeightRef.current = null;
        gesture.current.active = false;
        closingRef.current = false;
    };

    const playSlideExit = (fromY = 0) => {
        const panel = panelRef.current;
        const liveHeight = panel?.getBoundingClientRect().height ?? null;

        setExitingByDrag(true);
        setDragging(false);
        // Freeze current size so collapsing expanded → default doesn't jump.
        if (liveHeight != null) {
            setDragHeight(liveHeight);
        }
        setExpanded(false);
        setDragY(Math.max(fromY, 0));

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setDragY(window.innerHeight);
            });
        });
    };

    const finishClose = () => {
        if (!closeable || closingRef.current) {
            return;
        }
        closingRef.current = true;

        if (isMobileSheet() && !prefersReducedMotion()) {
            playSlideExit(0);
        }

        onClose();
    };

    useEffect(() => {
        if (show) {
            setOpen(true);
            resetSheet();
            return;
        }

        if (!open) {
            return;
        }

        const mobileExit = isMobileSheet() && !prefersReducedMotion();

        // Cancel / parent close: start the slide if drag-dismiss didn't already.
        if (!closingRef.current) {
            closingRef.current = true;
            if (mobileExit) {
                playSlideExit(0);
            }
        }

        const delay = mobileExit ? EXIT_MS : 200;
        const timer = window.setTimeout(() => {
            // Unmount only — keep dragY off-screen so leave doesn't snap back.
            setOpen(false);
        }, delay);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to show flips
    }, [show]);

    const dismissFromDrag = (fromY: number) => {
        if (!closeable || closingRef.current) {
            return;
        }
        closingRef.current = true;
        playSlideExit(fromY);
        onClose();
    };

    const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (
            !isMobileSheet() ||
            prefersReducedMotion() ||
            event.button !== 0 ||
            closingRef.current
        ) {
            return;
        }

        const panel = panelRef.current;
        if (!panel) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);

        const height = panel.getBoundingClientRect().height;
        if (!expanded) {
            collapsedHeightRef.current = height;
        }

        gesture.current = {
            active: true,
            pointerId: event.pointerId,
            startY: event.clientY,
            startHeight: height,
            lastY: event.clientY,
            lastTime: performance.now(),
            velocityY: 0,
            wasExpanded: expanded,
        };
    };

    const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g.active || event.pointerId !== g.pointerId) {
            return;
        }

        const now = performance.now();
        const dt = Math.max(now - g.lastTime, 1);
        const instantVelocity = ((event.clientY - g.lastY) / dt) * 1000;
        g.velocityY = g.velocityY * 0.7 + instantVelocity * 0.3;
        g.lastY = event.clientY;
        g.lastTime = now;

        const delta = event.clientY - g.startY;
        const viewportH = window.innerHeight;

        if (g.wasExpanded) {
            if (delta <= 0) {
                setDragY(-rubberband(-delta, viewportH * 0.2));
                setDragHeight(g.startHeight);
            } else {
                setDragY(0);
                setDragHeight(
                    Math.max(viewportH * 0.45, g.startHeight - delta),
                );
            }
            return;
        }

        if (delta >= 0) {
            setDragY(delta);
            setDragHeight(null);
            return;
        }

        setDragY(0);
        setDragHeight(Math.min(viewportH, g.startHeight + -delta));
    };

    const settleHeight = (nextExpanded: boolean) => {
        const panel = panelRef.current;
        const current = panel?.getBoundingClientRect().height ?? null;

        setExpanded(nextExpanded);
        setDragY(0);

        if (current == null) {
            setDragHeight(null);
            return;
        }

        setDragHeight(current);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (nextExpanded) {
                    setDragHeight(window.innerHeight);
                } else {
                    setDragHeight(
                        collapsedHeightRef.current ??
                            Math.min(window.innerHeight * 0.9, current),
                    );
                }
                window.setTimeout(() => setDragHeight(null), EXIT_MS);
            });
        });
    };

    const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g.active || event.pointerId !== g.pointerId) {
            return;
        }

        g.active = false;
        setDragging(false);

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
            // already released
        }

        const delta = event.clientY - g.startY;
        const projected = delta + project(g.velocityY);
        const flickDown =
            g.velocityY > VELOCITY_COMMIT && delta > CLOSE_MIN_FOR_FLICK;
        const flickUp = g.velocityY < -VELOCITY_COMMIT;

        if (g.wasExpanded) {
            const shouldClose =
                projected > window.innerHeight * 0.45 ||
                delta > window.innerHeight * 0.45;

            if (shouldClose) {
                dismissFromDrag(0);
                return;
            }

            if (projected > COLLAPSE_DISTANCE || delta > COLLAPSE_DISTANCE) {
                settleHeight(false);
                return;
            }

            settleHeight(true);
            return;
        }

        if (
            projected > CLOSE_DISTANCE ||
            delta > CLOSE_DISTANCE ||
            flickDown
        ) {
            dismissFromDrag(Math.max(delta, 0));
            return;
        }

        if (
            projected < -EXPAND_DISTANCE ||
            delta < -EXPAND_DISTANCE ||
            flickUp
        ) {
            settleHeight(true);
            return;
        }

        setDragY(0);
        setDragHeight(null);
    };

    const dismissProgress =
        !expanded && dragY > 0
            ? Math.min(1, dragY / CLOSE_DISTANCE)
            : expanded && dragY > 0
              ? Math.min(0.45, dragY / (CLOSE_DISTANCE * 2))
              : 0;

    const sheetGestureActive =
        dragging || dragY !== 0 || dragHeight != null || exitingByDrag;

    const panelStyle = sheetGestureActive
        ? {
              transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
              height: dragHeight != null ? `${dragHeight}px` : undefined,
              transition: dragging
                  ? 'none'
                  : `transform ${SHEET_EASE}, height ${SHEET_EASE}`,
          }
        : dragHeight != null || expanded
          ? {
                height: dragHeight != null ? `${dragHeight}px` : undefined,
                transition: `height ${SHEET_EASE}, border-radius ${SHEET_EASE}`,
            }
          : undefined;

    return (
        <Transition show={open} leave={exitingByDrag ? 'duration-0' : 'duration-200'}>
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-end justify-center sm:items-center sm:overflow-y-auto sm:px-4 sm:py-6"
                onClose={finishClose}
            >
                <TransitionChild
                    enter="ease-out duration-300 motion-reduce:duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave={
                        exitingByDrag
                            ? 'duration-0'
                            : 'ease-in duration-200 motion-reduce:duration-150'
                    }
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="absolute inset-0 bg-black/55 backdrop-blur-md"
                        style={{
                            opacity: exitingByDrag
                                ? Math.max(
                                      0,
                                      1 -
                                          dragY /
                                              (typeof window !== 'undefined'
                                                  ? window.innerHeight
                                                  : 1),
                                  )
                                : 1 - dismissProgress * 0.55,
                        }}
                    />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300 motion-reduce:duration-150"
                    enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95 motion-reduce:translate-y-0 motion-reduce:scale-100"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave={
                        exitingByDrag
                            ? 'duration-0'
                            : 'ease-in duration-200 motion-reduce:duration-150'
                    }
                    leaveFrom="opacity-100"
                    leaveTo={
                        exitingByDrag
                            ? 'opacity-0'
                            : 'opacity-0 translate-y-full sm:translate-y-0 sm:scale-95 motion-reduce:translate-y-0 motion-reduce:scale-100'
                    }
                >
                    <DialogPanel
                        ref={panelRef}
                        style={panelStyle}
                        className={`relative z-10 flex w-full transform flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)] shadow-xl will-change-transform sm:mb-0 sm:max-h-[calc(100vh-3rem)] sm:rounded-lg sm:pb-0 sm:mx-auto sm:w-full sm:transition-none ${
                            expanded
                                ? 'max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none'
                                : 'max-h-[90dvh] rounded-t-2xl'
                        } ${maxWidthClass}`}
                    >
                        <div
                            className="flex shrink-0 touch-none cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing sm:hidden"
                            onPointerDown={onDragStart}
                            onPointerMove={onDragMove}
                            onPointerUp={onDragEnd}
                            onPointerCancel={onDragEnd}
                            role="presentation"
                        >
                            <div className="h-1.5 w-12 rounded-full bg-[#D0D3CD]" />
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                            {children}
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}

export function ModalHeader({
    title,
    subtitle,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[#E3E5E0] px-6 py-4 ${className}`}
        >
            <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-[#111315]">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-1 text-sm text-[#6B7069]">{subtitle}</p>
                )}
            </div>
            {children}
        </div>
    );
}

export function ModalBody({
    children,
    className = '',
}: PropsWithChildren<{ className?: string }>) {
    return (
        <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function ModalFooter({
    children,
    className = '',
}: PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={`shrink-0 border-t border-[#E3E5E0] px-6 py-4 ${className}`}
        >
            {children}
        </div>
    );
}
