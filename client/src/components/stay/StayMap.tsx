import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, MapPin, RotateCcw } from "lucide-react";
import { villaPrice, type VillaListing } from "@/data/villa-examples";
import "@/styles/stay-map.css";

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export default function StayMap({
  villas,
  activeId,
  onSelect,
  onHover,
  onBoundsChange,
  embedded = false,
}: {
  villas: VillaListing[];
  activeId?: string | null;
  onSelect: (villa: VillaListing) => void;
  onHover?: (id: string | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  embedded?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<
    Map<string, { marker: MapLibreMarker; element: HTMLButtonElement }>
  >(new Map());
  const callbacks = useRef({ onSelect, onHover, onBoundsChange, activeId });
  callbacks.current = { onSelect, onHover, onBoundsChange, activeId };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [style, setStyle] = useState<"mediterranean" | "landscape">(
    "mediterranean"
  );
  const fitRef = useRef<() => void>(() => {});
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let map: MapLibreMap | undefined;
    setReady(false);
    setError(false);
    let timer = 0;
    async function initialize() {
      timer = window.setTimeout(() => {
        if (!cancelled) setError(true);
      }, 18000);
      try {
        const lib = await import("maplibre-gl");
        if (cancelled || !container.current) return;
        lib.setWorkerUrl(workerUrl);
        map = new lib.Map({
          container: container.current,
          style: "/maps/mediterranean.json",
          center: [12.6, 41.7],
          zoom: 5.1,
          minZoom: 2,
          maxZoom: 18,
          renderWorldCopies: false,
          attributionControl: false,
          scrollZoom: !embedded,
          cooperativeGestures: embedded,
          locale: {
            "NavigationControl.ZoomIn": "Ingrandisci",
            "NavigationControl.ZoomOut": "Riduci",
            "NavigationControl.ResetBearing": "Orienta verso nord",
          },
        });
        mapRef.current = map;
        map.addControl(
          new lib.NavigationControl({ showCompass: false }),
          "bottom-right"
        );
        map.addControl(
          new lib.AttributionControl({ compact: true }),
          "bottom-left"
        );
        map.on("load", () => {
          if (!cancelled) {
            clearTimeout(timer);
            setError(false);
            setReady(true);
          }
        });
        map.on("moveend", () => {
          if (!map) return;
          const bounds = map.getBounds();
          callbacks.current.onBoundsChange?.({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        });
        map.on("error", event => {
          if (!cancelled && !map?.isStyleLoaded())
            console.warn("Map loading:", event.error?.message);
        });
        observer = new ResizeObserver(() => {
          map?.resize();
          fitRef.current();
        });
        observer.observe(container.current);
      } catch {
        if (!cancelled) {
          clearTimeout(timer);
          setError(true);
        }
      }
    }
    // Defer the WebGL engine on the homepage until the map nears the viewport.
    const intersection = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          intersection.disconnect();
          initialize();
        }
      },
      { rootMargin: "350px" }
    );
    if (container.current) intersection.observe(container.current);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      intersection.disconnect();
      observer?.disconnect();
      markers.current.forEach(item => item.marker.remove());
      markers.current.clear();
      map?.remove();
      mapRef.current = null;
      fitRef.current = () => {};
    };
  }, [retry, embedded]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    let cancelled = false;
    import("maplibre-gl").then(lib => {
      if (cancelled) return;
      markers.current.forEach(item => item.marker.remove());
      markers.current.clear();
      const points = villas.filter(villa => villa.coordinates);
      for (const villa of points) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "stay-price-pin";
        element.classList.toggle(
          "is-active",
          callbacks.current.activeId === villa.id
        );
        element.setAttribute(
          "aria-pressed",
          String(callbacks.current.activeId === villa.id)
        );
        element.textContent = villaPrice(villa.pricePerNight);
        element.setAttribute(
          "aria-label",
          `${villa.isDemo ? "Esempio di villa: " : ""}${villa.title}, ${villaPrice(villa.pricePerNight)} a notte`
        );
        element.addEventListener("click", event => {
          event.stopPropagation();
          callbacks.current.onSelect(villa);
        });
        element.addEventListener("mouseenter", () =>
          callbacks.current.onHover?.(villa.id)
        );
        element.addEventListener("mouseleave", () =>
          callbacks.current.onHover?.(null)
        );
        element.addEventListener("focus", () =>
          callbacks.current.onHover?.(villa.id)
        );
        element.addEventListener("blur", () =>
          callbacks.current.onHover?.(null)
        );
        const marker = new lib.Marker({ element, anchor: "bottom" })
          .setLngLat([villa.coordinates!.lng, villa.coordinates!.lat])
          .addTo(map);
        markers.current.set(villa.id, { marker, element });
      }
      fitRef.current = () => {
        if (points.length === 1) {
          map.flyTo({
            center: [points[0].coordinates!.lng, points[0].coordinates!.lat],
            zoom: 10,
            duration: reducedMotion() ? 0 : 700,
          });
        } else if (points.length) {
          const bounds = new lib.LngLatBounds();
          points.forEach(villa =>
            bounds.extend([villa.coordinates!.lng, villa.coordinates!.lat])
          );
          map.fitBounds(bounds, {
            padding: embedded ? 70 : 85,
            maxZoom: 11,
            duration: reducedMotion() ? 0 : 750,
          });
        } else map.flyTo({ center: [12.6, 41.7], zoom: 5.1, duration: 0 });
      };
      fitRef.current();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, villas, embedded]);

  useEffect(() => {
    markers.current.forEach((item, id) => {
      item.element.classList.toggle("is-active", id === activeId);
      item.element.style.zIndex = id === activeId ? "5" : "1";
      item.element.setAttribute("aria-pressed", String(id === activeId));
    });
  }, [activeId, ready, villas]);

  function changeStyle(next: typeof style) {
    setStyle(next);
    mapRef.current?.setStyle(
      next === "mediterranean"
        ? "/maps/mediterranean.json"
        : "https://tiles.openfreemap.org/styles/liberty"
    );
  }

  return (
    <div className={`stay-map ${embedded ? "stay-map-embedded" : ""}`}>
      <div
        ref={container}
        className="stay-map-canvas"
        aria-label="Mappa interattiva delle ville"
        role="region"
      />
      <div className="stay-map-top">
        <div
          className="stay-map-style"
          role="group"
          aria-label="Stile della cartina"
        >
          <button
            type="button"
            aria-pressed={style === "mediterranean"}
            onClick={() => changeStyle("mediterranean")}
          >
            Mediterraneo
          </button>
          <button
            type="button"
            aria-pressed={style === "landscape"}
            onClick={() => changeStyle("landscape")}
          >
            Paesaggio
          </button>
        </div>
        <button
          type="button"
          className="stay-map-fit"
          onClick={() => fitRef.current()}
          aria-label="Mostra tutte le ville sulla mappa"
        >
          <LocateFixed size={18} />
        </button>
      </div>
      {!ready && !error && (
        <div className="stay-map-loading" role="status">
          <MapPin size={22} strokeWidth={1.3} />
          <span>Disegniamo il tuo prossimo viaggio…</span>
        </div>
      )}
      {error && (
        <div className="stay-map-loading stay-map-error" role="status">
          <MapPin size={24} />
          <strong>La cartina si fa attendere.</strong>
          <span>Puoi continuare a esplorare le ville nell’elenco.</span>
          <button type="button" onClick={() => setRetry(value => value + 1)}>
            <RotateCcw size={14} />
            Ricarica la mappa
          </button>
        </div>
      )}
      <span className="stay-map-caption">LUXURYSTAY · LUOGHI DA VIVERE</span>
    </div>
  );
}
