"use client";

import { Check, ClipboardCopy, Download, HelpCircle, MessageSquareText, RotateCcw, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoState } from "@/lib/demo-storage";

type Feedback = {
  id: string;
  category: "Error" | "No entiendo" | "Función faltante" | "Sugerencia";
  rating: number;
  comment: string;
  context: string;
  createdAt: string;
};

type Props = {
  context: string;
  onReset: () => void;
  onNotice: (message: string) => void;
};

const tours = [
  ["Acceso de visita", "Propietario → Accesos: autoriza dos personas. Cambia a Conserje, registra el ingreso y la salida. La junta puede anularlo."],
  ["Nueva placa", "Propietario → Accesos: solicita una placa. Cambia a Presidente → Personas y accesos para aprobarla."],
  ["Reserva", "Propietario → Reservas: solicita un área común. Cambia a Presidente → Reservas para revisar el desglose y anular si corresponde."],
  ["Pago", "Presidente o Tesorero → Finanzas: abre el pago A-203, vincula el movimiento, confirma la revisión y observa el nuevo estado."],
  ["Entrega de gestión", "Presidente o Secretario → Entrega de gestión: elige el tipo, revisa todos los bloques y acepta el expediente ficticio."],
] as const;

export function DemoTools({ context, onReset, onNotice }: Props) {
  const [panel, setPanel] = useState<"guide" | "feedback" | null>(null);
  const [feedback, setFeedback] = useDemoState<Feedback[]>("feedback", []);
  const [category, setCategory] = useState<Feedback["category"]>("Sugerencia");
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const exportText = useMemo(() => JSON.stringify(feedback, null, 2), [feedback]);

  useEffect(() => {
    const root = document.querySelector(".app-shell");
    if (!root) return;
    const applyHelp = () => root.querySelectorAll<HTMLElement>("button, select, input, textarea, .file-button").forEach((element) => {
      if (element.title) return;
      const fieldLabel = element.closest("label")?.querySelector("span")?.textContent?.trim();
      const label = element.getAttribute("aria-label") || fieldLabel || element.getAttribute("placeholder") || element.textContent?.replace(/\s+/g, " ").trim() || "esta opción";
      element.title = `Para qué sirve: ${label}. Qué hace: actualiza el escenario con datos ficticios. Objetivo: permitir evaluar este flujo sin realizar una operación real.`;
    });
    applyHelp();
    const observer = new MutationObserver(applyHelp);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!panel) return;
    panelRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(null); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [panel]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = comment.trim();
    if (clean.length < 5) return;
    setFeedback((current) => [{ id: crypto.randomUUID(), category, rating, comment: clean, context, createdAt: new Date().toLocaleString("es-PE") }, ...current]);
    setComment("");
    onNotice("Feedback guardado en este navegador. Puedes descargarlo para enviarlo al equipo.");
    setPanel(null);
  }

  function downloadFeedback() {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "feedback-stoka-habita.json";
    anchor.click();
    URL.revokeObjectURL(url);
    onNotice("Archivo de feedback descargado.");
  }

  async function copyFeedback() {
    await navigator.clipboard.writeText(exportText);
    onNotice("Feedback copiado al portapapeles.");
  }

  async function shareFeedback() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Feedback de Stoka Habita", text: exportText });
        onNotice("Feedback compartido desde el dispositivo.");
      } catch {
        // Closing the native share sheet is not an error for the demo.
      }
      return;
    }
    await copyFeedback();
  }

  return <>
    <div className="demo-tools" aria-label="Herramientas de la demostración">
      <button type="button" onClick={() => setPanel("guide")}><HelpCircle />Cómo probar</button>
      <button type="button" onClick={() => setPanel("feedback")}><MessageSquareText />Enviar feedback{feedback.length > 0 && <span>{feedback.length}</span>}</button>
      <button type="button" onClick={onReset}><RotateCcw />Reiniciar</button>
    </div>
    {panel && <div className="demo-panel-layer"><button className="drawer-scrim" aria-label="Cerrar panel" onClick={() => setPanel(null)} /><aside className="demo-side-panel" ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="demo-panel-title">
      <div className="drawer-head"><div><h2 id="demo-panel-title">{panel === "guide" ? "Cómo evaluar la demo" : "Enviar feedback"}</h2><p>{panel === "guide" ? "Cinco recorridos para comprobar la operación entre perfiles." : context}</p></div><button className="icon-button" aria-label="Cerrar" onClick={() => setPanel(null)}><X /></button></div>
      {panel === "guide" ? <div className="demo-tour-list">{tours.map(([title, detail]) => <article key={title}><span><Check /></span><div><strong>{title}</strong><p>{detail}</p></div></article>)}</div> : <>
        <form className="feedback-form" onSubmit={submit}>
          <label className="field"><span>Tipo de comentario</span><select value={category} onChange={(event) => setCategory(event.target.value as Feedback["category"])}><option>Error</option><option>No entiendo</option><option>Función faltante</option><option>Sugerencia</option></select></label>
          <label className="field"><span>Facilidad de uso</span><select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5,4,3,2,1].map((value) => <option value={value} key={value}>{value} de 5</option>)}</select></label>
          <label className="field"><span>Comentario</span><textarea required minLength={5} maxLength={1000} rows={6} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Cuéntanos qué intentabas hacer y qué ocurrió." /></label>
          <button className="primary-button" disabled={comment.trim().length < 5}><MessageSquareText />Guardar feedback</button>
          <small>Se guarda únicamente en este navegador; no se envía automáticamente.</small>
        </form>
        {feedback.length > 0 && <div className="feedback-export"><strong>{feedback.length} comentario{feedback.length === 1 ? "" : "s"} guardado{feedback.length === 1 ? "" : "s"}</strong><div><button className="secondary-button compact" onClick={shareFeedback}><Share2 />Compartir</button><button className="secondary-button compact" onClick={copyFeedback}><ClipboardCopy />Copiar</button><button className="secondary-button compact" onClick={downloadFeedback}><Download />Descargar</button></div></div>}
      </>}
    </aside></div>}
  </>;
}
