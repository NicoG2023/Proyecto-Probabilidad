package com.probabilidad.servicios.Estudiante;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.InstanciaPregunta.TipoInstancia;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.Respuesta;
import com.probabilidad.entidades.dominio.EstadoIntento;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class RespuestaService {

    // ========= MCQ =========
    @Transactional
    public Respuesta guardarRespuestaOpcion(IntentoQuiz intento, Long instanciaId, String chosenKey) {
        validarEstadoYPropiedad(intento, instanciaId);

        InstanciaPregunta ip = InstanciaPregunta.findById(instanciaId);
        if (ip.tipo != TipoInstancia.MCQ) {
            throw new IllegalArgumentException("La instancia no es de opción múltiple (tipo=" + ip.tipo + ")");
        }

        Respuesta r = Respuesta.find("instanciaPregunta.id = ?1", instanciaId).firstResult();
        if (r == null) {
            r = new Respuesta();
            r.instanciaPregunta = ip;
            r.partialPoints = BigDecimal.ZERO;
        }

        // Limpiar campos de abierta
        r.chosenValue = null;
        r.chosenNumber = null;

        r.chosenKey = chosenKey;
        r.isCorrect = (chosenKey != null && chosenKey.equalsIgnoreCase(ip.llaveCorrecta));
        r.partialPoints = r.isCorrect ? BigDecimal.ONE : BigDecimal.ZERO;
        r.persist();
        return r;
    }

    // ========= ABIERTAS (numéricas / texto) =========
    @Transactional
    public Respuesta guardarRespuestaLibre(IntentoQuiz intento, Long instanciaId, String valorTexto, BigDecimal valorNumero) {
        validarEstadoYPropiedad(intento, instanciaId);

        InstanciaPregunta ip = InstanciaPregunta.findById(instanciaId);
        if (ip.tipo == TipoInstancia.MCQ) {
            throw new IllegalArgumentException("La instancia es MCQ; use guardarRespuestaOpcion");
        }

        Respuesta r = Respuesta.find("instanciaPregunta.id = ?1", instanciaId).firstResult();
        if (r == null) {
            r = new Respuesta();
            r.instanciaPregunta = ip;
            r.partialPoints = BigDecimal.ZERO;
        }

        // Limpiar MCQ
        r.chosenKey = null;

        // Asignar libres
        r.chosenValue  = valorTexto;
        r.chosenNumber = valorNumero;

        // Validaciones rápidas por tipo
        if (ip.tipo == TipoInstancia.OPEN_NUM) {
            if (r.chosenNumber == null) {
                throw new IllegalArgumentException("Se esperaba un número para esta pregunta.");
            }
        } else if (ip.tipo == TipoInstancia.OPEN_TEXT) {
            if (r.chosenValue == null || r.chosenValue.isBlank()) {
                throw new IllegalArgumentException("Se esperaba texto para esta pregunta.");
            }
        }

        // Evaluación inmediata
        boolean ok = evaluarLibre(ip, r);
        r.isCorrect = ok;
        r.partialPoints = ok ? BigDecimal.ONE : BigDecimal.ZERO;

        r.persist();
        return r;
    }

    private void validarEstadoYPropiedad(IntentoQuiz intento, Long instanciaId) {
        if (intento.status != EstadoIntento.EN_PROGRESO)
            throw new IllegalStateException("El intento ya no admite respuestas");

        InstanciaPregunta ip = InstanciaPregunta.findById(instanciaId);
        if (ip == null || !ip.intento.id.equals(intento.id))
            throw new IllegalArgumentException("Instancia inválida para este intento");
    }

    /**
     * Guarda lote heterogéneo (MCQ + abiertas).
     * items: cada entrada puede traer opcionMarcada, o valorNumero/valorTexto.
     */
    @Transactional
    public void guardarRespuestasEnLote(IntentoQuiz intento, List<ItemLote> items) {
        for (ItemLote it : items) {
            if (it.opcionMarcada != null) {
                guardarRespuestaOpcion(intento, it.instanciaId, it.opcionMarcada);
            } else if (it.valorNumero != null || (it.valorTexto != null && !it.valorTexto.isBlank())) {
                guardarRespuestaLibre(intento, it.instanciaId, it.valorTexto, it.valorNumero);
            } else {
                // Si llega un item vacío, lo ignoramos (o podrías limpiar respuesta).
            }
        }
    }

    // === Evaluador de abiertas ===
    private boolean evaluarLibre(InstanciaPregunta ip, Respuesta r) {
        if (ip.tipo == TipoInstancia.OPEN_NUM) {
            Map<String,Object> cv = ip.correctValue;
            if (cv == null || !"number".equals(cv.get("type"))) return false;

            double expected = asDouble(cv.get("value"));
            double tolAbs   = cv.get("toleranceAbs") instanceof Number n ? n.doubleValue() : 0.0;
            double tolPct   = cv.get("tolerancePct") instanceof Number n2 ? n2.doubleValue() : 0.0;

            if (r.chosenNumber == null) return false;
            double ans  = r.chosenNumber.doubleValue();
            double diff = Math.abs(ans - expected);

            boolean okAbs = tolAbs > 0 && diff <= tolAbs;
            boolean okPct = tolPct > 0 && diff <= Math.abs(expected) * (tolPct / 100.0);
            return (tolAbs == 0 && tolPct == 0) ? (diff == 0.0) : (okAbs || okPct);
        }

        if (ip.tipo == TipoInstancia.OPEN_TEXT) {
            Map<String,Object> cv = ip.correctValue;
            if (r.chosenValue == null) return false;

            // Si no hay especificación de correctValue, por defecto quedan para revisión manual
            if (cv == null || !"text".equals(cv.get("type"))) return false;

            // Configuración
            boolean caseSensitive = Boolean.TRUE.equals(cv.get("caseSensitive"));
            boolean trim = (cv.get("trim") == null) || Boolean.TRUE.equals(cv.get("trim"));

            Object fmtObj = cv.get("format");
            String format = (fmtObj instanceof String s) ? s : "plain";

            String normAns = normalizeText(r.chosenValue, format, caseSensitive, trim);

            // 1) canonical (forma modelo)
            Object canonObj = cv.get("canonical");
            String canonical = null;
            if (canonObj instanceof String cs) {
                canonical = cs;
            } else if (cv.get("value") instanceof String vs) {
                // compat: si no hay canonical pero sí value, úsalo como modelo
                canonical = vs;
            }
            if (canonical != null) {
                String normCanonical = normalizeText(canonical, format, caseSensitive, trim);
                if (normAns.equals(normCanonical)) return true;
            }

            // 2) accept[]
            Object acc = cv.get("accept");
            if (acc instanceof List<?> lst) {
                for (Object o : lst) {
                    if (o == null) continue;
                    String s = String.valueOf(o);
                    String norm = normalizeText(s, format, caseSensitive, trim);
                    if (norm.equals(normAns)) return true;
                }
            }

            // 3) regex[]
            Object regs = cv.get("regex");
            if (regs instanceof List<?> lst2) {
                for (Object o : lst2) {
                    if (o == null) continue;
                    String pat = String.valueOf(o);

                    int flags = caseSensitive ? 0 : java.util.regex.Pattern.CASE_INSENSITIVE;
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile(pat, flags);

                    if (p.matcher(normAns).matches()) return true;
                }
            }

            return false;
        }

        // Por defecto, falso
        return false;
    }

    private double asDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(o));
    }

    private String normalizeText(String s, String format, boolean caseSensitive, boolean trim) {
        if (s == null) return null;
        String out = s;

        if (trim) {
            out = out.trim();
        }

        if (!caseSensitive) {
            // OJO: en LaTeX casi todo es case-sensitive, pero para tus expresiones esto está bien
            out = out.toLowerCase(Locale.ROOT);
        }

        if ("latex".equalsIgnoreCase(format)) {
            // Quitar espacios y comandos de espaciado típicos
            out = out.replaceAll("\\s+", "");
            out = out
                    .replace("\\,", "")
                    .replace("\\;", "")
                    .replace("\\!", "")
                    .replace("\\ ", "")
                    .replace("~", "");

            // Quitar \left y \right para no penalizar esas variaciones
            out = out.replace("\\left", "")
                    .replace("\\right", "");
        } else {
            // Formato "plain": colapsar espacios internos a uno solo
            out = out.replaceAll("\\s+", " ");
        }

        return out;
    }


    /** Califica todo el intento y actualiza score/scorePoints. */
    @Transactional
    public void calificarIntento(IntentoQuiz intento) {
        List<InstanciaPregunta> instancias = InstanciaPregunta.list("intento.id = ?1", intento.id);

        Map<Long, Respuesta> existentes = Respuesta.<Respuesta>list("instanciaPregunta.intento.id = ?1", intento.id)
                .stream().collect(Collectors.toMap(r -> r.instanciaPregunta.id, r -> r));

        for (InstanciaPregunta ip : instancias) {
            Respuesta r = existentes.get(ip.id);
            if (r == null) {
                r = new Respuesta();
                r.instanciaPregunta = ip;
                r.chosenKey = null;
                r.chosenValue = null;
                r.chosenNumber = null;
                r.isCorrect = false;
                r.partialPoints = BigDecimal.ZERO;
                r.persist();
            } else {
                // Revalida abiertas por si acaso
                if (ip.tipo != TipoInstancia.MCQ) {
                    boolean ok = evaluarLibre(ip, r);
                    r.isCorrect = ok;
                    r.partialPoints = ok ? BigDecimal.ONE : BigDecimal.ZERO;
                    r.persist();
                }
            }
        }

        long total = instancias.size();
        long correctas = Respuesta.stream("instanciaPregunta.intento.id = ?1 and isCorrect = true", intento.id).count();

        intento.maxPoints = BigDecimal.valueOf(total);
        intento.scorePoints = BigDecimal.valueOf(correctas);
        intento.score = total == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(correctas * 100.0 / total).setScale(2, RoundingMode.HALF_UP);
        intento.persist();
    }

    // === helper DTO para lote (lo usa el Recurso) ===
    public static class ItemLote {
        public Long instanciaId;
        public String opcionMarcada;    // MCQ
        public BigDecimal valorNumero;  // OPEN_NUM
        public String valorTexto;       // OPEN_TEXT
    }
}
