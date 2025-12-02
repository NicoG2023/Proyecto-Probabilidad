-- Sembrado de 4 quices con preguntas aleatorizadas, autocorrección MCQ
-- y abiertas (numéricas autocalificables / textuales manuales).

----------------------------------------------------------------
-- P R I M E R   C O R T E   (C1)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C1', 'Primer Corte', TRUE, now());

-- P1: Multinomial (aleatorio con % en enunciado) — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$Las probabilidades de contagio por entrar al ascensor exclusivo de una UCI en una clínica son de {p_covid|percent} para Covid-19, {p_omicron|percent} para Omicron, y {p_n1h1|percent} para N1H1. La probabilidad de contagiarse {x_covid} Jóvenes de Covid-19, {x_omicron} Mayores de Omicron, y {x_n1h1} Niño de N1H1, es:$$,
  $$
En este problema tenemos **3 tipos de contagio posibles** (Covid-19, Omicron y N1H1),
cada uno con su propia probabilidad:

- \[p_1 = p_{Covid} = {p_covid}\],
- \[p_2 = p_{Omicron} = {p_omicron}\],
- \[p_3 = p_{N1H1} = {p_n1h1}\].

Además, queremos exactamente:

- \[x_1 = x_{Covid} = {x_covid}\] personas contagiadas de Covid-19,
- \[x_2 = x_{Omicron} = {x_omicron}\] personas contagiadas de Omicron,
- \[x_3 = x_{N1H1} = {x_n1h1}\] personas contagiadas de N1H1.

El número total de personas que se contagian es

\[
n = x_1 + x_2 + x_3
  = {x_covid} + {x_omicron} + {x_n1h1}.
\]

Como **cada persona entra al ascensor y puede contagiarse de exactamente una
de las 3 enfermedades (o se asume que ya estamos condicionando a que se
contagia de alguna)**, y los contagios de cada persona se modelan como
independientes, el modelo adecuado es la **distribución multinomial** con
parámetros \[n\] y probabilidades \[p_1, p_2, p_3\].

La fórmula general de la multinomial para la probabilidad conjunta

\[
P(X_1 = x_1, X_2 = x_2, X_3 = x_3)
\]

es

\[
P =
\dfrac{n!}{x_1!\,x_2!\,x_3!}\,
p_1^{x_1} p_2^{x_2} p_3^{x_3},
\quad
\text{donde } n = x_1 + x_2 + x_3.
\]

En nuestro caso concreto:

- \[n = {x_covid} + {x_omicron} + {x_n1h1}\],
- \[x_1 = {x_covid}\], \[x_2 = {x_omicron}\], \[x_3 = {x_n1h1}\],
- \[p_1 = {p_covid}\], \[p_2 = {p_omicron}\], \[p_3 = {p_n1h1}\].

Por lo tanto, la probabilidad pedida es

\[
P =
\dfrac{( {x_covid} + {x_omicron} + {x_n1h1} )!}
      { {x_covid}!\,{x_omicron}!\,{x_n1h1}! }
( {p_covid} )^{ {x_covid} }
( {p_omicron} )^{ {x_omicron} }
( {p_n1h1} )^{ {x_n1h1} }.
\]

Esta es exactamente la expresión que aparece como opción correcta:

\[
\boxed{
\dfrac{( {x_covid} + {x_omicron} + {x_n1h1} )!}
      { {x_covid}!\,{x_omicron}!\,{x_n1h1}! }
( {p_covid} )^{ {x_covid} }
( {p_omicron} )^{ {x_omicron} }
( {p_n1h1} )^{ {x_n1h1} }
}
\]

y cualquier otra opción que:

- omita el coeficiente multinomial,
- no utilice bien los exponentes \[x_i\],
- o reemplace alguna probabilidad por \[1-p_i\] sin justificación,

no corresponde al modelo multinomial correcto en este contexto.
  $$,
  'multinomial_3',
  '{
    "p_covid":   { "values": [0.20, 0.25, 0.30, 0.35] },
    "p_omicron": { "values": [0.25, 0.30, 0.35, 0.40] },
    "p_n1h1":    { "values": [0.30, 0.35, 0.40, 0.45] },
    "x_covid":   { "min": 1, "max": 3 },
    "x_omicron": { "min": 1, "max": 3 },
    "x_n1h1":    { "min": 1, "max": 2 }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 6,
    "spread": 0.0,

    "correct_expr": " nCr(x_covid + x_omicron + x_n1h1, x_covid) * nCr(x_omicron + x_n1h1, x_omicron) * pow(p_covid, x_covid) * pow(p_omicron, x_omicron) * pow(p_n1h1, x_n1h1) ",

    "correct_display": "$ \\dfrac{( {x_covid} + {x_omicron} + {x_n1h1} )!}{ {x_covid}!\\,{x_omicron}!\\,{x_n1h1}! } ( {p_covid} )^{ {x_covid} } ( {p_omicron} )^{ {x_omicron} } ( {p_n1h1} )^{ {x_n1h1} } $",

    "distractor_exprs": [
      " pow(p_covid, x_covid) * pow(p_omicron, x_omicron) * pow(p_n1h1, x_n1h1) ",
      " nCr(x_covid + x_omicron + x_n1h1, x_covid) * pow(p_covid, x_covid) * pow(p_omicron, x_omicron) * pow(p_n1h1, x_n1h1) ",
      " nCr(x_covid + x_omicron + x_n1h1, x_covid) * nCr(x_omicron + x_n1h1, x_omicron) * pow(p_covid, x_covid) * pow(1-p_omicron, x_omicron) * pow(p_n1h1, x_n1h1) ",
      " 0 "
    ],

    "distractor_display": [
      "$ ( {p_covid} )^{ {x_covid} } ( {p_omicron} )^{ {x_omicron} } ( {p_n1h1} )^{ {x_n1h1} } $",
      "$ ( {p_covid} )^{ {x_covid} } ( {p_omicron} )^{ {x_omicron} } ( {p_n1h1} )^{ {x_n1h1} } $",
      "$ \\dfrac{( {x_covid} + {x_omicron} + {x_n1h1} )!}{ {x_covid}!\\,{x_omicron}!\\,{x_n1h1}! } ( {p_covid} )^{ {x_covid} } ( 1-{p_omicron} )^{ {x_omicron} } ( {p_n1h1} )^{ {x_n1h1} } $",
      "NINGUNA DE LAS ANTERIORES"
    ]
  }'::jsonb,
  'A', 1;

-- P2: Combinatoria por grupos — MCQ AUTO con opciones en fracción
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$En un ascensor exclusivo de una UCI ingresan {jovenes_tot} Jóvenes, {mayores_tot} Mayores y {ninos_tot} Niños.
La probabilidad de que se contagien exactamente {x_jov} Jóvenes, {x_may} Mayores y {x_nino} Niños es:$$,
  $$En este problema queremos la probabilidad de que se contagien exactamente
{x_jov} jóvenes, {x_may} mayores y {x_nino} niños.

El modelo correcto, **si conociéramos las probabilidades de contagio** de cada grupo,
sería un modelo Bernoulli independiente por persona:

\[P = C(J, {x_jov})\, p_J^{x_jov} (1-p_J)^{J-{x_jov}}
    · C(M, {x_may})\, p_M^{x_may} (1-p_M)^{M-{x_may}}
    · C(N, {x_nino})\, p_N^{x_nino} (1-p_N)^{N-{x_nino}}.\]

Donde:
- \[J = {jovenes_tot}\] es el número de jóvenes,
- \[M = {mayores_tot}\] es el número de mayores,
- \[N = {ninos_tot}\] es el número de niños,
- \[p_J, p_M, p_N\] son las probabilidades de contagio de un joven, un mayor y un niño, respectivamente.

**Problema del enunciado:** en el texto original **nunca se dan los valores de**
\[p_J, p_M\] y \[p_N\]. No se dice, por ejemplo, “cada joven se contagia con probabilidad 0.2”, etc.
Al no conocer esos valores:

- No podemos sustituir números en la fórmula.
- Cualquier número concreto de probabilidad que aparezca en las opciones
  solo sería válido para algún conjunto específico de \[(p_J, p_M, p_N)\]
  que el enunciado no especifica.
- Por lo tanto, **ninguna opción numérica está justificada** con la información disponible.

Conclusión: con el enunciado tal como está, la única respuesta razonable es
**“Ninguna de las anteriores”**, porque **no se puede calcular** la probabilidad
numérica sin conocer \[p_J, p_M, p_N\].

Si el problema sí incluyera las probabilidades, por ejemplo
\[p_J = {p_jov}\], \[p_M = {p_may}\], \[p_N = {p_nino}\],
entonces bastaría con sustituir esos valores en la fórmula de arriba
para obtener el valor numérico correcto de \[P\].$$,
  'combinatoria_mixta',
  '{
    "jovenes_tot": { "min": 1, "max": 10 },
    "mayores_tot": { "min": 1, "max": 10 },
    "ninos_tot":   { "min": 1, "max": 10 },

    "x_jov":       { "min": 1, "max": 10 },
    "x_may":       { "min": 1, "max": 10 },
    "x_nino":      { "min": 1, "max": 10 },

    "p_jov":       { "values": [0.15, 0.20, 0.25] },
    "p_may":       { "values": [0.20, 0.25, 0.30] },
    "p_nino":      { "values": [0.10, 0.15, 0.20] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format": "fraction",
    "max_denominator": 10000,
    "spread": 0.15,

    "correct_expr": " nCr(jovenes_tot, x_jov) * pow(p_jov, x_jov) * pow(1-p_jov, jovenes_tot - x_jov) * nCr(mayores_tot, x_may) * pow(p_may, x_may) * pow(1-p_may, mayores_tot - x_may) * nCr(ninos_tot, x_nino) * pow(p_nino, x_nino) * pow(1-p_nino, ninos_tot - x_nino) ",

    "distractor_exprs": [
      " 2.0/105.0 ",
      "  4.0/35.0 ",
      " 22.0/1803 ",
      "  4.0/35.0 ",
      "  8.0/27.0 ",
      " 24.0/35.0 ",
      " 56.0/11.0 ",
      " 33.0/20.0 ",
      " 25.0/1652.0 ",
      " 27.0/1133.0 "
    ],

    "practice_mode": "open_text",
    "practice_format": "plain",
    "canonical": "Ninguna de las anteriores",
    "accept": [
      "Ninguna de las anteriores",
      "ninguna de las anteriores",
      "Ninguna",
      "ninguna",
      "NA",
      "N.A.",
      "N/A"
    ],

    "caseSensitive": false,
    "trim": true,

    "practice_correct_display": "Ninguna de las anteriores"
  }'::jsonb,
  'A', 1;



-- P3: Serie 3 de 4 — MCQ AUTO + fracciones
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$Los equipos capitalinos de fútbol, Millos y Santafé, se enfrentan en un torneo donde el ganador es quien gane {gana} de {total} partidos entre ellos. Si Millos tiene el {pA|percent} de probabilidad de ganar cada partido, la probabilidad de que Santafé le gane el torneo es:$$,
  $$En este ejercicio tenemos una **serie 3 de 4** entre Millonarios (equipo A) y Santafé (equipo B).

- Denotemos por \[p_A\] la probabilidad de que Millos gane un partido.
- Entonces la probabilidad de que Santafé gane un partido es \[p_B = 1 - p_A\].

En el enunciado se nos dice que el campeón es quien gane **3 de 4** partidos. Si modelamos la serie como 4 partidos jugados de forma independiente, esto significa que Santafé gana el torneo si, en esos 4 partidos, obtiene **al menos 3 victorias**.

Eso se puede descomponer en dos casos excluyentes:

1. Santafé gana exactamente 3 de los 4 partidos.
2. Santafé gana los 4 partidos.

---

### 1. Santafé gana exactamente 3 de los 4 partidos

Pensemos en 4 partidos independientes. Cada partido es un “experimento” con dos resultados posibles:

- Gana Millos (A) con probabilidad \[p_A\].
- Gana Santafé (B) con probabilidad \[1 - p_A\].

Si queremos que Santafé gane exactamente 3 partidos y pierda 1, necesitamos:

- 3 victorias de B (cada una con probabilidad \[1 - p_A\]),
- 1 victoria de A (con probabilidad \[p_A\]),
- y escoger en qué 3 de los 4 partidos gana Santafé.

La probabilidad de un patrón específico del tipo **B, B, B, A** es:

\[ (1 - p_A)^3 \cdot p_A. \]

Pero hay muchas formas de ubicar esa única derrota de Santafé entre los 4 partidos. El número de formas de elegir **3 partidos** de los 4 para que Santafé gane es:

\[ \binom{4}{3}. \]

Por lo tanto, la probabilidad de que Santafé gane **exactamente 3** de los 4 partidos es:

\[ P(\text{Santafé gana exactamente 3}) = \binom{4}{3} (1 - p_A)^3 p_A. \]

---

### 2. Santafé gana los 4 partidos

En este caso, Santafé gana **todos** los partidos, así que en cada uno ocurre el evento “B gana” con probabilidad \[1 - p_A\]. Como los 4 partidos son independientes, la probabilidad de que Santafé gane los 4 es:

\[
P(\text{Santafé gana los 4}) = (1 - p_A)^4.
\]

Equivalente en notación combinatoria, hay solo una forma de elegir los 4 partidos (todos) para que gane Santafé:

\[
P(\text{Santafé gana los 4}) =
\binom{4}{4} (1 - p_A)^4.
\]

---

### 3. Probabilidad total de que Santafé gane el torneo

Los dos casos anteriores son **mutuamente excluyentes** (no se pueden dar al mismo tiempo) y cubren todas las formas en que Santafé puede ganar el torneo en una serie 3 de 4. Por la regla de la suma:

\[
P(\text{Santafé gana la serie}) =
P(\text{gana exactamente 3}) + P(\text{gana los 4}).
\]

Sustituyendo las expresiones obtenidas:

\[
P(\text{Santafé gana la serie}) =
\binom{4}{3} (1 - p_A)^3 p_A
\;+\;
\binom{4}{4} (1 - p_A)^4.
\]

Esta es justamente la fórmula que aparece en la solución:

\[
P(B)= \binom{4}{3}(1-p_A)^3 p_A + \binom{4}{4}(1-p_A)^4.
\]

En el contexto del problema, \[p_A\] es la probabilidad de que Millos gane un partido (por ejemplo, \[p_A = 0.6\] si Millos gana el 60\% de los partidos). A partir de ese valor se calcula numéricamente la probabilidad de que Santafé gane el torneo usando la expresión anterior.$$,
  'serie_mejor_4',
  '{
    "gana":  { "min": 1, "max": 5 },
    "total": { "min": 3, "max": 5 },
    "pA": { "values": [0.50, 0.60, 0.70, 0.80] }

  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format": "fraction",
    "max_denominator": 10000,
    "spread": 0.12,

    "correct_expr": " nCr(4,3)*pow(1-pA,3)*pow(pA,1) + nCr(4,4)*pow(1-pA,4) ",

    "distractor_exprs": [
      " 88.0/625.0 ",
      " 96.0/625.0 ",
      " 72.0/625.0 ",
      " 56.0/625.0 ",
      " 1.0/4.0 ",
      " 3.0/10.0 ",
      " 2.0/5.0 "
    ]
  }'::jsonb,
  'A', 1;


-- P4: Poisson aprox (más de 1 en t min) — MCQ AUTO + expresiones tipo 1-5/e^4
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$Una masa contiene {m} átomos de una sustancia radiactiva. La probabilidad de que un átomo decaiga en un periodo de un minuto es de {pmin}. La probabilidad de que más de un átomo decaiga en {t} minutos es:$$,
  $$En este ejercicio queremos la probabilidad de que **más de un átomo** decaiga en un intervalo de tiempo dado.

1. **Modelo de partida: Binomial**

Supongamos que tenemos \[m = {m}\] átomos. Para un solo átomo, la probabilidad de que decaiga en un minuto es \[p = {pmin}\].

Si miramos un intervalo de \[t = {t}\] minutos y la probabilidad por minuto es pequeña, podemos pensar que el número de decaimientos en ese intervalo se comporta aproximadamente como una variable Poisson. La idea es:

- Cada átomo “decide” de forma independiente si decae o no.
- La probabilidad de decaimiento en un intervalo corto es pequeña.
- Tenemos muchísimos átomos.

En un modelo binomial, el número de átomos que decaen en un minuto sería:
\[
X \sim \text{Binomial}(m, p).
\]

Si miramos \[t\] minutos y asumimos que la probabilidad por minuto es pequeña, el número total de decaimientos en \[t\] minutos se puede aproximar con un modelo de Poisson.

---

2. **Parámetro de Poisson \[\lambda\]**

La aproximación clásica es:
\[
\lambda = m \cdot p \cdot t.
\]

En nuestro caso:
- \[m\] es el número de átomos,
- \[p\] es la probabilidad de decaimiento de un átomo en un minuto,
- \[t\] es el número de minutos del intervalo.

Así, el número de decaimientos en \(t\) minutos se modela como:
\[
N \sim \text{Poisson}(\lambda), \quad \lambda = m \cdot p \cdot t.
\]

---

3. **Probabilidades en la Poisson**

Para una variable Poisson con parámetro \(\lambda\), tenemos:
\[
P(N = k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 0,1,2,\dots
\]

En particular:
- Probabilidad de **cero** decaimientos:
  \[
  P(N = 0) = e^{-\lambda}.
  \]
- Probabilidad de **exactamente un** decaimiento:
  \[
  P(N = 1) = \lambda e^{-\lambda}.
  \]

---

4. **Evento “más de un átomo decae”**

El evento “más de un átomo decae” es:
\[
\{N > 1\} = \{2,3,4,\dots\}.
\]

Es más fácil trabajar con el **complemento**:
\[
P(N > 1) = 1 - P(N \le 1)
         = 1 - \big(P(N = 0) + P(N = 1)\big).
\]

Sustituyendo las probabilidades de Poisson:
\[
P(N > 1) = 1 - \left(e^{-\lambda} + \lambda e^{-\lambda}\right)
         = 1 - e^{-\lambda}(1 + \lambda).
\]

Con \[\lambda = m \cdot p \cdot t\], la respuesta teórica final es:
\[
P(N > 1) = 1 - e^{-m p t}\,\big(1 + m p t\big).
\]

---

5. **Conexión con las opciones tipo \(1 - 5/e^4\)**

En muchos enunciados de examen se reemplaza el valor numérico de \[\lambda = m p t\]
por un número concreto (por ejemplo, \[\lambda = 4\]) y se simplifica la expresión
a algo del estilo:
\[
P(N > 1) = 1 - e^{-4}(1+4) = 1 - \frac{5}{e^{4}},
\]
lo que da opciones de respuesta tipo:
\[
1 - \frac{4}{e^{2}}, \quad
1 - \frac{5}{e^{4}}, \quad
1 - \frac{5}{e^{2}}, \dots
\]

En nuestro generador, usamos la expresión general de Poisson
\[
P(N>1)=1-e^{-\lambda}(1+\lambda),
\]
y luego, dependiendo de los valores concretos de \[m\], \[p\] y \[t\],
se puede evaluar numéricamente o compararla con las expresiones propuestas en las opciones.$$,
  'poisson_aprox',
  '{
    "m":    { "values": [8000, 10000, 12000] },
    "pmin": { "values": [0.00015, 0.0002, 0.00025] },
    "t":    { "values": [2, 3] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,
    "format": "number",
    "decimals": 5,
    "spread": 0.0,

    "correct_expr": " 1 - exp(-(m*pmin*t)) * (1 + (m*pmin*t)) ",

    "correct_display": "NINGUNA DE LAS ANTERIORES",

    "distractor_exprs": [
      " 1 - 5*exp(-4) ",
      " 1 - 5*exp(-2) ",
      " 1 - 4*exp(-2) "
    ],
    "distractor_display": [
      "$ 1 - 5/e^{4} $",
      "$ 1 - 5/e^{2} $",
      "$ 1 - 4/e^{2} $"
    ]
  }'::jsonb,
  'A', 1;


----------------------------------------------------------------
-- S E G U N D O   C O R T E   (C2)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C2', 'Segundo Corte', TRUE, now());

-- P1: Binomial aprox (dos probabilidades) — MCQ AUTO PAIR
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$Un proceso produce {pdef|percent} de artículos defectuosos. Si se seleccionan al azar {n} artículos del proceso las probabilidades de que el número de defectuosos exceda los {e} artículos, y de que sea menor de {m} artículos, respectivamente son (aprox. más cercana):$$,
  $$Normal aprox. con corrección de continuidad: 
P(X>e)\approx 1-\Phi\!\big(\frac{e+0.5-np}{\sqrt{np(1-p)}}\big),\;
P(X<m)\approx \Phi\!\big(\frac{m-0.5-np}{\sqrt{np(1-p))}}\big).$$,
  'binomial_normal_doble',
  '{
    "pdef": { "values": [0.08, 0.10, 0.12] },
    "n":    { "values": [80, 100, 120] },
    "e":    { "values": [10, 12, 13, 14] },
    "m":    { "values": [6, 7, 8, 9] }
  }'::jsonb,
  '{
    "mode": "mcq_auto_pair",

    "left_expr":  " 1 - phi( ((e + 0.5) - n*pdef)/sqrt(n*pdef*(1-pdef)) ) ",
    "right_expr": " phi( ((m - 0.5) - n*pdef)/sqrt(n*pdef*(1-pdef)) ) ",

    "left_format":  "number",
    "left_decimals": 4,
    "right_format": "number",
    "right_decimals": 4,
    "sep": " , ",

    "num_options": 5,
    "spread_left":  0.12,
    "spread_right": 0.12
  }'::jsonb,
  'A', 1;

-- P2: Exponencial CDF — MCQ AUTO con opciones tipo 1ª imagen
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$La vida de cierto dispositivo tiene una tasa de falla anunciada de {lambda} por hora. 
    Si la tasa de falla es constante y se aplica la distribución exponencial entonces 
    la probabilidad de que transcurran menos de {t} horas antes de que se observe una falla es$$,
  $$F(t)=1-e^{-\lambda t}.$$,
  'exponencial_cdf',
  '{
    "lambda": { "values": [0.005, 0.01, 0.02] },
    "t":      { "values": [100, 150, 200] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 4,
    "spread": 0.0,

    "correct_expr": " 1 - 2*exp(-1) ",

    "correct_display": "$ 1 - 2e^{-1} $",

    "distractor_exprs": [
      " exp(-1) ",
      " exp(-2) ",
      " 1 - exp(-2) ",
      " 0.0 "
    ],
    "distractor_display": [
      "$ e^{-1} $",
      "$ e^{-2} $",
      "$ 1 - e^{-2} $",
      "N.A."
    ]
  }'::jsonb,
  'A', 2;


-- P3: Weibull supervivencia — MCQ AUTO con opciones tipo 2ª imagen
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$Suponga que la vida de servicio, en años, de la batería de un aparato para reducir la sordera 
    es una variable aleatoria que tiene una distribución de Weibull con \[ α = {alpha} \], \[ β = {beta} \].
    Entonces, la probabilidad de que tal batería esté en operación después de {t} años es$$,
  $$S(t)=\exp\bigl(-(t/\beta)^{\alpha}\bigr).$$,
  'weibull_supervivencia',
  '{
    "alpha": { "values": [0.5, 1.0, 1.5] },
    "beta":  { "values": [1.5, 2.0, 3.0] },
    "t":     { "values": [1, 2, 3] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 4,
    "spread": 0.0,

    "correct_expr": " 1 - exp(-pow(2, 0.5)) ",

    "correct_display": "$ 1 - e^{-2^{1/2}} $",

    "distractor_exprs": [
      " exp(-1) ",
      " 1 - 2*exp(-1) ",
      " exp(-2) ",
      " 0.0 "
    ],
    "distractor_display": [
      "$ e^{-1} $",
      "$ 1 - 2e^{-1} $",
      "$ e^{-2} $",
      "N.A."
    ]
  }'::jsonb,
  'A', 2;


-- P4: Densidad conjunta (texto) — ABIERTA TEXTUAL MANUAL
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$Una máquina empaca cajas de un kilogramo de chocolates combinando los tipos Crema, Chicloso y Envinado. 
Las variables aleatorias X e Y representan los pesos de los tipos Crema y Chicloso, respectivamente, 
con función de densidad conjunta 
\[
f(x,y) = {c}\,x y,\quad 0 \le x \le y,\; 0 \le y \le 1,\; x + y \le 1,
\]
e igual a 0 en otro caso. 

Si Z = X + Y es la variable aleatoria de la cantidad de pesos de los tipos Crema y Chiclosos, 
se puede demostrar que su función de densidad de probabilidad para 0 < z < 1 es de la forma
\[
h(z) = k z^{3},\quad 0 < z < 1.
\]

¿Cuál es el valor numérico de k?$$,
  $$Derivación por integración en 0≤x≤y, x+y≤1 (resultado simbólico).$$,
  'densidad_conjunta_choc',
  '{
    "c": { "values": [16, 24, 32] }
  }'::jsonb,
  '{
    "mode": "open_numeric",
    "expected_expr": " c / 12 ",
    "format": "number",
    "decimals": 4,
    "toleranceAbs": 0.0001,
    "tolerancePct": 0.0,
    "latex": "h(z)=k z^{3},\\quad 0<z<1"
  }'::jsonb,
  'A', 1;

----------------------------------------------------------------
-- T E R C E R   C O R T E — P R I M E R   M O D E L O  (C3A)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C3A', 'Tercer Corte – Primer Modelo', TRUE, now());

-- P1: Normal – dentro de tolerancia — MCQ AUTO (aleatorio, en %)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Se fabrican esferas cuyos diámetros se distribuyen normalmente con media de {mu} cm y desviación estándar de {sigma} cm. 
Las especificaciones requieren que el diámetro esté dentro del intervalo {centro} ± {tol} cm. 
La proporción de esferas que probablemente cumplirán las especificaciones es (aprox. más cercana):$$,
  $$P(a\le X\le b)=\Phi((b-\mu)/\sigma) - \Phi((a-\mu)/\sigma),\; a=\text{centro}-\text{tol},\; b=\text{centro}+\text{tol}.$$,
  'normal_intervalo',
  '{
    "mu":     { "values": [2.495, 2.500, 2.505] },
    "sigma":  { "values": [0.003, 0.004] },
    "centro": { "values": [2.50] },
    "tol":    { "values": [0.01] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format": "percent",
    "decimals": 2,
    "spread": 0.10,

    "correct_expr":
      " phi(((centro+tol)-mu)/sigma) - phi(((centro-tol)-mu)/sigma) "
  }'::jsonb,
  'A', 1;




-- P2: Hipergeométrica – (media, varianza) — MCQ AUTO PAIR
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Se sabe que un lote contiene componentes de los cuales {K} son buenos y {D} son defectuosos.
Un inspector prueba {n} componentes. 
Para la variable aleatoria que cuenta el número de componentes buenos, la media y la varianza son (aprox. más cercana):$$,
  $$E[X]=n\cdot K/N,\quad Var[X]=n(K/N)(1-K/N)\frac{N-n}{N-1},\; N=K+D.$$,
  'hipergeom_media_var',
  '{
    "K": { "values": [3,4,5] },
    "D": { "values": [4,3,2] },
    "n": { "values": [3] }
  }'::jsonb,
  '{
    "mode": "mcq_auto_pair",

    "left_expr":  " n * K / (K + D) ",

    "right_expr": " n * (K / (K + D)) * (1 - K / (K + D)) * ((K + D - n) / (K + D - 1)) ",

    "left_format":  "number",
    "left_decimals": 2,
    "right_format": "number",
    "right_decimals": 2,
    "sep": " , ",

    "num_options": 5,
    "spread_left":  0.10,
    "spread_right": 0.10
  }'::jsonb,
  'A', 1;



-- P3: Valor esperado comisiones — MCQ AUTO (aleatorio, con “millones”)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$En un día un agente vendedor tiene dos citas independientes para cerrar dos negocios.
Con el primer cliente la probabilidad exitosa es del {p1|percent} y se ganaría \[ \$ \]{c1} millones de pesos por comisión.
Con el segundo cliente la probabilidad exitosa es del {p2|percent} y se ganaría \[ \$ \]{c2} millones de pesos por comisión.
El valor esperado de ganancia por las comisiones con sus dos clientes en ese día (en millones de pesos, aprox. más cercana) es:$$,
  $$E = p_1 c_1 + p_2 c_2\ \text{(en millones)}.$$,
  'esperanza_lineal',
  '{
    "p1": { "values": [0.30, 0.35, 0.40] },
    "c1": { "values": [1.00, 1.20, 1.35] },

    "p2": { "values": [0.40, 0.50, 0.60] },
    "c2": { "values": [1.30, 1.50, 1.55] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format":   "number",
    "decimals": 2,
    "spread":   0.12,

    "correct_expr": " p1*c1 + p2*c2 ",

    "prefix": "$",
    "suffix": " millones"
  }'::jsonb,
  'A', 1;

-- P4: Máximo utilidad — ABIERTA NUMÉRICA AUTO (parametrizada y aleatoria)
-- U(μ)=aμ-bμ^2 -> μ* = a/(2b) -> Umax = a^2/(4b)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Sea \[ μ \] el tiempo promedio en horas de servicio que presta un Dron antes de tener una falla, y \[ \$ {coef_costo}μ^2 \] su costo total. 
El ingreso por \[ T \] horas de servicio es \[ \$ {coef_ingreso}T \]. 
Entonces la Utilidad Esperada Máxima del Dron es \[ \$ \]____ (Complete sobre el espacio).$$,
  $$U(μ)={coef_ingreso}μ-{coef_costo}μ^2 \Rightarrow μ^*=\frac{{coef_ingreso}}{2{coef_costo}},\; U_{\max}=\frac{{coef_ingreso}^2}{4{coef_costo}}.$$,
  'max_utilidad_cuad',
  '{
    "coef_ingreso": { "values": [24, 26, 28, 30] },
    "coef_costo":   { "values": [3, 4, 5] }
  }'::jsonb,
  '{
    "mode": "open_numeric",

    "expected_expr": " (coef_ingreso * coef_ingreso) / (4.0 * coef_costo) ",

    "toleranceAbs": 0.001,
    "tolerancePct": 0.0,

    "format": "number",
    "decimals": 2,

    "latex": "U_{\\max}=\\dfrac{a^2}{4b}"
  }'::jsonb,
  'A', 1;


-- P5: Transformación Y = c X^3 — ABIERTA TEXTUAL (LaTeX, parametrizada y aleatoria)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Dada la variable aleatoria continua X con la función de distribución de probabilidad 
\[ f(x) = 2x \], cuando \[ 0 < x < 1 \], y 0 en otro caso, entonces la distribución de probabilidad de 
\[ Y = {c}X^3 \] es ____ (complete sobre el espacio).$$,
  $$Y={c}X^3 \Rightarrow y\in(0,{c}),\; 
f_Y(y)=f_X\!\big((y/{c})^{1/3}\big)\,\frac{1}{3\,{c}^{1/3}y^{2/3}}.$$,
  'transformacion_y_2x3',
  '{
    "c": { "values": [2, 3, 4] }
  }'::jsonb,
  '{
    "mode":   "open_text",
    "format": "latex",

    "canonical":      "f_Y(y)=\\frac{2}{3 {c}^{2/3} y^{1/3}},0<y<{c}",
    "expected_text":  "f_Y(y)=\\frac{2}{3 {c}^{2/3} y^{1/3}},\\quad 0<y<{c}",

    "accept": [
      "f_Y(y)=\\frac{2}{3 {c}^{2/3} y^{1/3}},0<y<{c}",
      "f_Y(y)=\\frac{2}{3 {c}^{2/3} y^{1/3}},\\quad 0<y<{c}",
      "\\frac{2}{3 {c}^{2/3} y^{1/3}},0<y<{c}"
    ],

    "caseSensitive": false,
    "trim": true,
    "latex": "f_Y(y)=\\frac{2}{3 {c}^{2/3} y^{1/3}},\\quad 0<y<{c}"
  }'::jsonb,
  'A', 1;



----------------------------------------------------------------
-- T E R C E R   C O R T E — S E G U N D O   M O D E L O  (C3B)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C3B', 'Tercer Corte – Segundo Modelo', TRUE, now());

-- P1: Normal intervalo — MCQ AUTO (en %) con parámetros aleatorios
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Los tiempos de vida de cierto tipo de bacterias solares se distribuyen normalmente con media de {mu} horas y desviación estándar de {sigma} horas. La probabilidad de que una de ellas, elegida al azar, dure entre {a} y {b} horas es (aprox. más cercana):$$,
  $$\Phi((b-μ)/σ) - \Phi((a-μ)/σ).$$,
  'normal_intervalo',
  '{
    "mu":    { "values": [48, 50, 52] },
    "sigma": { "values": [4, 5, 6] },
    "a":     { "values": [40, 42, 44] },
    "b":     { "values": [50, 52, 54] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format":   "percent",
    "decimals": 2,
    "spread":   0.12,

    "correct_expr": " phi((b-mu)/sigma) - phi((a-mu)/sigma) "
  }'::jsonb,
  'A', 1;




-- P2: Discreta {0,1,2} – (media, varianza) — MCQ AUTO PAIR (parametrizada con Ohmios)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Un dispositivo tiene dos resistores, cada uno puede tener resistencia entre {r_min} y {r_max} ohmios. 
En un circuito integrado las probabilidades de que cumplan las especificaciones de rango son: 
{p2_pct}\[ \% \] para ambos, {p1_pct}\[ \% \] para uno solo, y {p0_pct}\[ \% \] para ninguno. 
La media y la varianza de la variable aleatoria que indica la cantidad de resistores con las especificaciones requeridas son (aprox. más cercana):$$,
  $$E[X]=\sum_x x\,P(X=x),\; Var[X]=E[X^2]-E[X]^2.$$,
  'discreta_0_1_2',
  '{
    "r_min":  { "values": [98, 99, 100] },
    "r_max":  { "values": [101, 102, 103] },

    "p0_pct": { "values": [16] },
    "p1_pct": { "values": [48] },
    "p2_pct": { "values": [36] }
  }'::jsonb,
  '{
    "mode": "mcq_auto_pair",

    "left_expr":  " 0*(p0_pct/100.0) + 1*(p1_pct/100.0) + 2*(p2_pct/100.0) ",
    "right_expr": " (0^2*(p0_pct/100.0) + 1^2*(p1_pct/100.0) + 2^2*(p2_pct/100.0)) - pow( 0*(p0_pct/100.0) + 1*(p1_pct/100.0) + 2*(p2_pct/100.0), 2 ) ",

    "left_format":    "number",
    "left_decimals":  2,
    "right_format":   "number",
    "right_decimals": 2,

    "sep":  " y ",
    "unit": "Ohmios",

    "num_options": 4,
    "spread_left":  0.08,
    "spread_right": 0.08
  }'::jsonb,
  'A', 1;




-- P3: Valor esperado comisiones — MCQ AUTO (parámetros aleatorios, en millones con símbolo $)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$En un día un agente vendedor tiene dos citas independientes para cerrar dos negocios. 
Con el primer cliente la probabilidad exitosa es del {p1_pct}\[ \% \] y se ganaría \[ \$ \]{c1_mill} millones por comisión, 
y con el segundo cliente tiene una probabilidad exitosa del {p2_pct}\[ \% \] y ganaría \[ \$ \]{c2_mill} millones por comisión. 
El valor esperado de ganancia por las comisiones con sus dos clientes en ese día (aprox. más cercana) es:$$,
  $$E = \frac{p_1}{100}\,c_1 + \frac{p_2}{100}\,c_2\; \text{(en millones de pesos)}.$$ ,
  'esperanza_lineal',
  '{
    "p1_pct":  { "values": [60, 70, 80] },
    "p2_pct":  { "values": [30, 40, 50] },
    "c1_mill": { "values": [1.0, 1.1, 1.2] },
    "c2_mill": { "values": [1.3, 1.4, 1.5] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 4,

    "format":   "number",
    "decimals": 2,
    "spread":   0.10,

    "correct_expr": " (p1_pct/100.0) * c1_mill + (p2_pct/100.0) * c2_mill ",

    "prefix": "$",
    "suffix": " millones"
  }'::jsonb,
  'A', 1;




-- P4: Máximo utilidad — ABIERTA NUMÉRICA AUTO (parametrizada)
-- U(μ)=aμ-bμ^2 -> μ*=a/(2b) -> Umax = a^2/(4b)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id
   FROM quices
   WHERE corte = 'C3B'
     AND titulo = 'Tercer Corte – Segundo Modelo'
   LIMIT 1),
  $$Sea \[ μ \] el tiempo promedio en horas de servicio que presta un Dron antes de tener una falla,
y \[ \$ {cost_rate}μ^2 \] su costo total. El ingreso por \[ T \] horas de servicio es
\[ \$ {income_rate}T \], entonces la Utilidad Esperada Máxima del Dron es \[ \$ \]____
(complete sobre el espacio).$$,
  $$U(μ) = {income_rate}μ - {cost_rate}μ^2 \Rightarrow μ^* = \frac{{income_rate}}{2{cost_rate}},\;
U_{\max} = \frac{{income_rate}^2}{4{cost_rate}}.$$,
  'max_utilidad_cuad',
  '{
    "income_rate": { "values": [14, 16, 18, 20] },
    "cost_rate":   { "values": [2.0, 2.5, 3.0, 3.5] }
  }'::jsonb,
  '{
    "mode": "open_numeric",

    "expected_expr": "(income_rate * income_rate) / (4.0 * cost_rate)",

    "toleranceAbs": 0.01,
    "tolerancePct": 0.0,
    "format": "number",
    "decimals": 2,

    "latex": "U(\\mu) = {income_rate}\\mu - {cost_rate}\\mu^{2} \\\\Rightarrow \\mu^{*} = \\frac{{income_rate}}{2{cost_rate}},\\; U_{\\max} = \\frac{{income_rate}^{2}}{4{cost_rate}}"
  }'::jsonb,
  'A', 1;


-- P5: Transformación Y=cX^2 — ABIERTA TEXTUAL (LaTeX, parametrizada)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Dada la variable aleatoria continua X con la función de distribución de probabilidad
\[ f(x) = 2(1-x) \], \[ 0 < x < 1 \], y 0 en otro caso,
entonces la distribución de probabilidad de \[ Y = {c}X^2 \] es ____ (complete sobre el espacio).$$,
  $$Y={c}X^2,\; 0<y<{c}.\\;
f_Y(y)=f_X\!\left(\\sqrt{y/{c}}\\right)\\frac{1}{2\\sqrt{{c}y}}
=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}}.$$,
  'transformacion_y_cx2',
  '{
    "c": { "values": [2, 3, 4] }
  }'::jsonb,
  '{
    "mode": "open_text",
    "format": "latex",

    "canonical": "f_Y(y)=\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},\\\\;0<y<{c}",

    "expected_template": "f_Y(y)=\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},\\\\;0<y<{c}",

    "accept": [
      "f_Y(y)=\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},0<y<{c}",
      "f_Y(y)=\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},\\\\;0<y<{c}",
      "\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},0<y<{c}"
    ],

    "caseSensitive": false,
    "trim": true,

    "latex": "f_Y(y)=\\\\frac{1}{\\\\sqrt{{c}}\\\\sqrt{y}}-\\\\frac{1}{{c}},\\\\;0<y<{c}"
  }'::jsonb,
  'A', 1;


