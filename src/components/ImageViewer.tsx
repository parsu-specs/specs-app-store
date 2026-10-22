import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
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

const zoomClasses = ["h-full w-full", "h-[150%] w-[150%]", "h-[200%] w-[200%]"];

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
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const image = images[index];

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  useEffect(() => {
    const pointerId = drag.current?.pointerId;
    drag.current = null;
    setDragging(false);
    if (viewport.current) {
      if (pointerId !== undefined && viewport.current.hasPointerCapture(pointerId))
        viewport.current.releasePointerCapture(pointerId);
      viewport.current.scrollTop = 0;
      viewport.current.scrollLeft = 0;
    }
  }, [index, zoom]);

  if (!image) return null;

  return (
    <Modal id={id} title={title} onClose={onClose}>
      <div
        ref={viewport}
        role="region"
        aria-label="Image preview"
        tabIndex={0}
        onPointerDown={(event) => {
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
          <div className={zoomClasses[zoom]}>
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
            onClick={() => setZoom((current) => current - 1)}
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
            {zoom === 0 ? "Fit" : `${100 + zoom * 50}%`}
          </Button>
          <Button
            variant="icon"
            type="button"
            aria-label="Zoom in"
            disabled={zoom === zoomClasses.length - 1 || failed}
            onClick={() => setZoom((current) => current + 1)}
            className="min-h-11 min-w-11"
          >
            <MagnifyingGlassPlus size={20} weight="bold" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
