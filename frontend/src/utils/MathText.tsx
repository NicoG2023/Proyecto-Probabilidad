import React from "react";
import { BlockMath, InlineMath } from "react-katex";

// Heurística para detectar contenido LaTeX "puro" (sin mezclar texto largo)
function isLikelyMath(s?: string) {
  if (!s) return false;

  // Ya NO miramos '$' para evitar confundir precios
  return /\\frac|\\sqrt|\\sum|\\int|\\cdot|\\times|\\binom|\\begin\{|\\left|\\right|\\phi|\\Phi|\\lambda|\\mu|\\sigma/.test(
    s
  );

}

/**
 * Render inline que:
 * 1) Si el texto tiene bloques \[ ... \], los separa en texto + InlineMath.
 * 2) Si TODO el texto parece una fórmula, lo manda a InlineMath.
 * 3) Si no, lo deja como texto normal.
 */
export function MathInline({ text }: { text: string }) {
  if (!text) return null;

  // 0) Si el texto completo viene envuelto en $...$ o $$...$$,
  //    lo tratamos como math puro ANTES de partir por \[...\]
  const dollarMatch = text.match(/^\s*\${1,2}([\s\S]*?)\${1,2}\s*$/);
  if (dollarMatch) {
    const math = dollarMatch[1];
    return <InlineMath math={math} />;
  }

  // 1) Caso mixto: texto + \[ ... \]
  const displayRegex = /\\\[(.*?)\\\]/gs;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  while ((match = displayRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <span key={`t-${lastIndex}`} className="">
          {before}
        </span>
      );
    }

    const mathContent = match[1];
    parts.push(<InlineMath key={`m-${match.index}`} math={mathContent} />);

    lastIndex = displayRegex.lastIndex;
  }

  if (parts.length > 0) {
    const after = text.slice(lastIndex);
    if (after) {
      parts.push(
        <span key={`t-end`} className="">
          {after}
        </span>
      );
    }
    return <>{parts}</>;
  }

  // 2) Si NO hay \[...\] pero todo parece fórmula, úsalo como inline math
  if (isLikelyMath(text)) {
    const m = text.match(/^\$(.*)\$/s);
    const math = m ? m[1] : text.replace(/\$/g, "");
    return <InlineMath math={math} />;
  }

  // 3) Texto normal
  return <>{text}</>;
}



/**
 * Bloque de matemáticas o texto monoespaciado.
 * Usado típicamente para mostrar "valor esperado" en retroalimentación.
 */
export function MathBlock({ text }: { text: string }) {
  if (!text) return null;

  // 1) Si viene envuelto en $...$ o $$...$$, renderizar como bloque
  const dollarMatch = text.match(/^\s*\${1,2}([\s\S]*?)\${1,2}\s*$/);
  if (dollarMatch) {
    const math = dollarMatch[1];
    return (
      <div className="mt-1">
        <BlockMath math={math} />
      </div>
    );
  }

  // 2) Heurística de math “pura”
  if (isLikelyMath(text)) {
    const m = text.match(/^\$\$(.*)\$\$/s);
    const math = m ? m[1] : text.replace(/\$\$/g, "");
    return (
      <div className="mt-1">
        <BlockMath math={math} />
      </div>
    );
  }

  // 3) No es LaTeX → texto monoespaciado
  return <span className="font-mono">{text}</span>;
}

