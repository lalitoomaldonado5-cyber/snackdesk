"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Check } from "lucide-react";
import { Brand } from "./design/brand";

const slides = [
  {
    title: "Eventos inolvidables, más simples.",
    text: "Gestiona clientes, fechas y detalles de tu barra en un solo lugar.",
    image: "/images/editorial/celebration.jpg",
    alt: "Servicio de postres y flores en una celebración al aire libre",
    note: "Cada detalle, en su lugar.",
    caption: "Más tiempo para celebrar",
  },
  {
    title: "Cotiza en minutos.",
    text: "Prepara propuestas profesionales con tus paquetes, extras y precios.",
    image: "/images/editorial/fruit-cups.jpg",
    alt: "Vasos de fruta fresca preparados para un evento",
    note: "Una presentación que se recuerda.",
    caption: "Tu siguiente capítulo",
  },
  {
    title: "Tu negocio siempre claro.",
    text: "Controla ingresos, gastos, anticipos y ganancias sin hojas de cálculo.",
    image: "/images/editorial/gathering.jpg",
    alt: "Mesa de catering con frutas frescas y botanas",
    note: "El orden también se disfruta.",
    caption: "Todo empieza con claridad",
  },
];

export function AuthCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || hover || focused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((value) => (value + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, hover, focused, reducedMotion]);
  function select(index: number) {
    setPaused(true);
    setActive((index + slides.length) % slides.length);
  }
  return (
    <section
      className="sd-auth-editorial"
      aria-label="Conoce Snackdesk"
      aria-roledescription="carrusel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div className="sd-editorial-brand">
        <Brand />
        <span>Tu negocio, en orden.</span>
      </div>
      <div
        className="sd-slides"
        aria-live={paused || reducedMotion ? "polite" : "off"}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`sd-slide ${active === index ? "is-active" : ""}`}
            aria-hidden={active !== index}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de 3`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="(max-width: 767px) 1px, 58vw"
              preload={index === 0}
              className="sd-slide-image"
            />
            <div className="sd-slide-shade" />
            <div className="sd-slide-copy">
              <span className="sd-eyebrow">
                0{index + 1} <span className="sd-editorial-rule" />{" "}
                {slide.caption}
              </span>
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
            </div>
            <div className="sd-photo-note">
              <span className="sd-note-icon">
                <Check size={17} />
              </span>
              <span>
                {slide.note}
                <small>Menos administración. Más celebraciones.</small>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="sd-carousel-footer">
        <div className="sd-slide-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => select(i)}
              aria-label={`Ver diapositiva ${i + 1}: ${slide.title}`}
              aria-current={active === i ? "true" : undefined}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="sd-carousel-actions">
          <span className="sd-slide-counter">0{active + 1} / 03</span>
          {!reducedMotion && (
            <button
              type="button"
              aria-label={paused ? "Reanudar carrusel" : "Pausar carrusel"}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          <button
            type="button"
            aria-label="Diapositiva anterior"
            onClick={() => select(active - 1)}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Diapositiva siguiente"
            onClick={() => select(active + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
