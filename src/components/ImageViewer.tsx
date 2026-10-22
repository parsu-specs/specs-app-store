import { useEffect, useLayoutEffect, useId, useRef, useState, type PointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import { Button } from "./Button";
import Modal from "./Modal";

type ImageViewerProps = {
  images: { src: string; alt: string }[];
  initialIndex?: number;
  title: string;
  onClose: () => void;
};

const clampZoom = (value: number) => Math.max(0, Math.min(2, value));

export default function ImageViewer({
  images,
  initialIndex = 0,
  title,
  onClose,
}: ImageViewerProps) {
  const id = useId();
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, images.length - 1)));
  const [zoom, setZoom] = useState(0);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const touchDistance = () => {
    const [a, b] = [...touches.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const image = images[index];

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const navigate = (direction: number) => {
    setIndex((current) => Math.max(0, Math.min(current + direction, images.length - 1)));
    setZoom(0);
    setFailed(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (images.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        setIndex((current) =>
          Math.max(0, Math.min(current + (event.key === "ArrowLeft" ? -1 : 1), images.length - 1)),
        );
        setZoom(0);
        setFailed(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length]);

  useLayoutEffect(() => {
    const pointerId = drag.current?.pointerId;
    drag.current = null;
    setDragging(false);
    if (viewport.current) {
      if (pointerId !== undefined && viewport.current.hasPointerCapture(pointerId))
        viewport.current.releasePointerCapture(pointerId);
      viewport.current.scrollTop =
        (viewport.current.scrollHeight - viewport.current.clientHeight) / 2;
      viewport.current.scrollLeft =
        (viewport.current.scrollWidth - viewport.current.clientWidth) / 2;
    }
  }, [index, zoom]);

  useEffect(() => {
    touches.current.clear();
    pinch.current = null;
  }, [index, failed]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || failed) return;
      event.preventDefault();
      setZoom((current) => clampZoom(((1 + current / 2) * Math.exp(-event.deltaY * 0.01) - 1) * 2));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [failed]);

  if (!image) return null;

  return (
    <Modal id={id} title={title} onClose={onClose}>
      <div
        ref={viewport}
        role="region"
        aria-label="Image preview"
        tabIndex={0}
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          if (failed) return;
          if (event.pointerType === "touch") {
            touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            event.currentTarget.setPointerCapture(event.pointerId);
            if (touches.current.size === 2) {
              pinch.current = { distance: touchDistance(), zoom };
              drag.current = null;
              setDragging(false);
              return;
            }
          }
          if (zoom === 0 || failed || !event.isPrimary || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (touches.current.has(event.pointerId)) {
            touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pinch.current && touches.current.size === 2) {
              const start = pinch.current;
              if (start.distance > 0)
                setZoom(
                  clampZoom((((1 + start.zoom / 2) * touchDistance()) / start.distance - 1) * 2),
                );
              return;
            }
          }
          const start = drag.current;
          if (!start || start.pointerId !== event.pointerId) return;
          event.currentTarget.scrollLeft = start.left + start.x - event.clientX;
          event.currentTarget.scrollTop = start.top + start.y - event.clientY;
        }}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onLostPointerCapture={stopDragging}
        className={`h-[min(50dvh,28rem)] min-w-0 overflow-auto overscroll-contain rounded-xl border-2 border-outline bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary ${zoom > 0 && !failed ? `touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}` : ""}`}
      >
        {failed ? (
          <p
            role="status"
            className="flex h-full items-center justify-center p-4 text-center font-bold text-white"
          >
            This image could not be loaded.
          </p>
        ) : (
          <div style={{ height: `${100 + zoom * 50}%`, width: `${100 + zoom * 50}%` }}>
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              draggable={false}
              onError={() => setFailed(true)}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
      <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
        {images.length > 1 && (
          <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Image navigation">
            <Button
              variant="icon"
              type="button"
              aria-label="Previous image"
              disabled={index === 0}
              onClick={() => navigate(-1)}
              className="min-h-11 min-w-11"
            >
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <span aria-live="polite" aria-atomic="true" className="text-sm font-bold">
              {index + 1} / {images.length}
            </span>
            <Button
              variant="icon"
              type="button"
              aria-label="Next image"
              disabled={index === images.length - 1}
              onClick={() => navigate(1)}
              className="min-h-11 min-w-11"
            >
              <ArrowRight size={20} weight="bold" />
            </Button>
          </div>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Image zoom">
          <Button
            variant="icon"
            type="button"
            aria-label="Zoom out"
            disabled={zoom === 0 || failed}
            onClick={() => setZoom((current) => clampZoom(current - 1))}
            className="min-h-11 min-w-11"
          >
            <MagnifyingGlassMinus size={20} weight="bold" />
          </Button>
          <Button
            variant="outline"
            type="button"
            aria-label="Fit image to view"
            disabled={zoom === 0 || failed}
            onClick={() => setZoom(0)}
            className="min-h-11"
          >
            {zoom === 0 ? "Fit" : `${Math.round(100 + zoom * 50)}%`}
          </Button>
          <Button
            variant="icon"
            type="button"
            aria-label="Zoom in"
            disabled={zoom === 2 || failed}
            onClick={() => setZoom((current) => clampZoom(current + 1))}
            className="min-h-11 min-w-11"
          >
            <MagnifyingGlassPlus size={20} weight="bold" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
