"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Plus, Trash2 } from "lucide-react";
import { Field, Notice } from "../ui";
import { generateQuote } from "@/services/quotes";
import {
  quoteFonts,
  quoteMoney,
  quoteTotals,
  type QuoteInput,
} from "@/lib/quote";
import type { Business, Client, Event, ServicePackage } from "@/types/domain";
import "@fontsource/lato/latin-400.css";
import "@fontsource/dm-serif-display/latin-400.css";

type Item = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: string;
};
export function QuoteForm({
  business,
  logoSrc,
  clients,
  events,
  packages,
  date,
}: {
  business: Business;
  logoSrc: string | null;
  clients: Client[];
  events: Event[];
  packages: ServicePackage[];
  date: string;
}) {
  const [items, setItems] = useState<Item[]>([
    { id: 0, description: "", quantity: 1, unitPrice: "0" },
  ]);
  const [nextId, setNextId] = useState(1);
  const [font, setFont] = useState<QuoteInput["font"]>("lato");
  const [tax, setTax] = useState<0 | 16>(0);
  const [recipient, setRecipient] = useState({ name: "", contact: "" });
  const [event, setEvent] = useState({
    title: "",
    date: "",
    location: "",
    guests: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.url);
    },
    [download],
  );
  const totals = quoteTotals({ items, taxPercent: tax });
  const family = {
    lato: "Lato",
    instrument: "Instrument Serif",
    dm: "DM Serif Display",
  }[font];
  function selectClient(id: string) {
    const client = clients.find((c) => c.id === id);
    if (client)
      setRecipient({
        name: client.name,
        contact: [client.phone, client.email].filter(Boolean).join(" · "),
      });
  }
  function addItem(description = "", unitPrice = "0") {
    if (items.length >= 8) return;
    setDownload(null);
    setItems([...items, { id: nextId, description, quantity: 1, unitPrice }]);
    setNextId(nextId + 1);
  }
  function updateItem(id: number, patch: Partial<Item>) {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <div className="sd-quote-layout">
      <form
        className="panel padded"
        onChange={() => {
          if (download) setDownload(null);
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const value = (key: string) => String(form.get(key) || "");
          setPending(true);
          setError("");
          setDownload(null);
          try {
            const result = await generateQuote({
              font,
              reference: value("reference"),
              issueDate: value("issueDate"),
              validUntil: value("validUntil"),
              clientName: recipient.name,
              clientContact: recipient.contact,
              eventTitle: event.title,
              eventDate: event.date,
              location: event.location,
              guests: event.guests,
              items: items.map(({ description, quantity, unitPrice }) => ({
                description,
                quantity,
                unitPrice,
              })),
              taxPercent: tax,
              deposit: value("deposit"),
              notes: value("notes"),
              terms: value("terms"),
            });
            if (result.error) setError(result.error);
            if (result.pdf && result.filename) {
              const bytes = Uint8Array.from(atob(result.pdf), (char) =>
                char.charCodeAt(0),
              );
              const url = URL.createObjectURL(
                new Blob([bytes], { type: "application/pdf" }),
              );
              setDownload({ url, filename: result.filename });
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = result.filename;
              document.body.append(anchor);
              anchor.click();
              anchor.remove();
            }
          } catch {
            setError(
              "No pudimos generar el PDF. Revisa tu conexión e inténtalo de nuevo.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <fieldset disabled={pending} className="sd-quote-fields">
          <h2>Los detalles de tu propuesta</h2>
          <div className="form-grid">
            <Field label="Referencia *">
              <input
                name="reference"
                placeholder="COT-001"
                maxLength={30}
                required
              />
            </Field>
            <Field label="Tipografía">
              <select
                value={font}
                onChange={(e) => setFont(e.target.value as QuoteInput["font"])}
              >
                {Object.entries(quoteFonts).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de emisión *">
              <input
                type="date"
                name="issueDate"
                defaultValue={date}
                min="1900-01-01"
                max="2199-12-31"
                required
              />
            </Field>
            <Field label="Válida hasta *">
              <input
                type="date"
                name="validUntil"
                min="1900-01-01"
                max="2199-12-31"
                required
              />
            </Field>
          </div>
          <h2>Cliente y evento</h2>
          <div className="form-grid">
            <Field label="Usar un cliente registrado">
              <select
                defaultValue=""
                onChange={(e) => selectClient(e.target.value)}
              >
                <option value="">Seleccionar (opcional)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Usar un evento registrado">
              <select
                defaultValue=""
                onChange={(e) => {
                  const selected = events.find(
                    (item) => item.id === e.target.value,
                  );
                  if (selected) {
                    setEvent({
                      title: selected.title,
                      date: selected.event_date,
                      location: selected.location || "",
                      guests: selected.guest_count
                        ? String(selected.guest_count)
                        : "",
                    });
                    selectClient(selected.client_id);
                  }
                }}
              >
                <option value="">Seleccionar (opcional)</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre del cliente *">
              <input
                value={recipient.name}
                onChange={(e) =>
                  setRecipient({ ...recipient, name: e.target.value })
                }
                maxLength={150}
                required
              />
            </Field>
            <Field label="Contacto del cliente">
              <input
                value={recipient.contact}
                onChange={(e) =>
                  setRecipient({ ...recipient, contact: e.target.value })
                }
                maxLength={300}
                placeholder="Teléfono o correo"
              />
            </Field>
            <Field label="Nombre del evento *">
              <input
                value={event.title}
                onChange={(e) => setEvent({ ...event, title: e.target.value })}
                maxLength={150}
                required
              />
            </Field>
            <Field label="Fecha del evento *">
              <input
                type="date"
                value={event.date}
                onChange={(e) => setEvent({ ...event, date: e.target.value })}
                min="1900-01-01"
                max="2199-12-31"
                required
              />
            </Field>
            <Field label="Lugar">
              <input
                value={event.location}
                onChange={(e) =>
                  setEvent({ ...event, location: e.target.value })
                }
                maxLength={200}
              />
            </Field>
            <Field label="Personas">
              <input
                type="number"
                min="1"
                max="999999"
                step="1"
                value={event.guests}
                onChange={(e) => setEvent({ ...event, guests: e.target.value })}
              />
            </Field>
          </div>
          <h2>¿Qué incluye?</h2>
          {packages.some((p) => p.active) && (
            <Field label="Agregar desde tus paquetes">
              <select
                value=""
                disabled={items.length >= 8}
                onChange={(e) => {
                  const pack = packages.find((p) => p.id === e.target.value);
                  if (pack) addItem(pack.name, String(pack.base_price));
                }}
              >
                <option value="">Seleccionar paquete</option>
                {packages
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {items.map((item, index) => (
            <div className="sd-quote-item" key={item.id}>
              <Field label={`Concepto ${index + 1} *`}>
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  maxLength={180}
                  placeholder="Barra de snacks, montaje, transporte…"
                  required
                />
              </Field>
              <Field label="Cantidad *">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  value={Number.isNaN(item.quantity) ? "" : item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, { quantity: e.target.valueAsNumber })
                  }
                  required
                />
              </Field>
              <Field label="Precio unitario (MXN) *">
                <input
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(item.id, { unitPrice: e.target.value })
                  }
                  required
                />
              </Field>
              <button
                type="button"
                className="button"
                aria-label={`Eliminar concepto ${index + 1}`}
                disabled={items.length === 1}
                onClick={() => {
                  setDownload(null);
                  setItems(items.filter((row) => row.id !== item.id));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button"
            disabled={items.length >= 8}
            onClick={() => addItem()}
          >
            <Plus size={16} /> Agregar concepto
          </button>
          <p className="muted">
            Hasta ocho conceptos. Puedes reunir varios servicios en una
            descripción.
          </p>
          <div className="form-grid">
            <Field label="IVA">
              <select
                value={tax}
                onChange={(e) => setTax(Number(e.target.value) as 0 | 16)}
              >
                <option value={0}>Sin IVA adicional</option>
                <option value={16}>Agregar 16%</option>
              </select>
            </Field>
            <Field label="Anticipo solicitado (MXN)">
              <input
                name="deposit"
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                defaultValue="0"
                required
              />
            </Field>
            <Field label="Notas">
              <textarea
                name="notes"
                maxLength={600}
                placeholder="Detalles del servicio o una nota para tu cliente."
              />
            </Field>
            <Field label="Condiciones">
              <textarea
                name="terms"
                maxLength={400}
                placeholder="Forma de pago, reserva, cancelaciones…"
              />
            </Field>
          </div>
          <p className="muted">
            El PDF se descarga en una sola página. Si el texto es demasiado
            largo, te pediremos acortarlo. La cotización no registra un evento
            ni un pago.
          </p>
          <div className="form-actions">
            <Link href="/dashboard" className="button">
              Volver a Inicio
            </Link>
            <button className="button primary" disabled={pending}>
              <Download size={17} />
              {pending ? "Preparando PDF…" : "Descargar cotización"}
            </button>
          </div>
        </fieldset>
        {error && <Notice tone="error">{error}</Notice>}
        {download && (
          <Notice tone="success">
            Tu cotización está lista.{" "}
            <a href={download.url} download={download.filename}>
              Volver a descargar PDF
            </a>
          </Notice>
        )}
      </form>
      <aside
        className="sd-quote-summary panel padded"
        aria-label="Resumen de cotización"
      >
        {logoSrc && (
          <Image
            src={logoSrc}
            alt={`Logo de ${business.name}`}
            width={120}
            height={80}
            unoptimized
            style={{ objectFit: "contain", objectPosition: "left" }}
          />
        )}
        <p className="sd-eyebrow">TU COTIZACIÓN</p>
        <h2 style={{ fontFamily: family }}>{business.name}</h2>
        <p style={{ fontFamily: family }}>Una propuesta para celebrar.</p>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>
              {Number.isFinite(totals.subtotal)
                ? quoteMoney(totals.subtotal)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>IVA</dt>
            <dd>
              {Number.isFinite(totals.tax) ? quoteMoney(totals.tax) : "—"}
            </dd>
          </div>
          <div className="sd-quote-total">
            <dt>Total MXN</dt>
            <dd>
              {Number.isFinite(totals.total) ? quoteMoney(totals.total) : "—"}
            </dd>
          </div>
        </dl>
        <p className="muted">
          Tu nombre y logo se toman de{" "}
          <Link href="/settings">Configuración</Link>. Elige una tipografía y
          conserva ese estilo en el PDF.
        </p>
        {!business.logo_url && (
          <p className="muted">
            Aún no tienes un logo cargado. El PDF usará el nombre de tu negocio.
          </p>
        )}
      </aside>
    </div>
  );
}
