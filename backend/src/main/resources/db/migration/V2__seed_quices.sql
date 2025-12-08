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
En este problema tenemos ***3 tipos de contagio posibles*** (Covid-19, Omicron y N1H1),
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

Como ***cada persona entra al ascensor y puede contagiarse de exactamente una
de las 3 enfermedades (o se asume que ya estamos condicionando a que se
contagia de alguna)***, y los contagios de cada persona se modelan como
independientes, el modelo adecuado es la ***distribución multinomial*** con
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

El modelo correcto, ***si conociéramos las probabilidades de contagio*** de cada grupo,
sería un modelo Bernoulli independiente por persona:

\[P = C(J, {x_jov})\, p_J^{x_jov} (1-p_J)^{J-{x_jov}}
    · C(M, {x_may})\, p_M^{x_may} (1-p_M)^{M-{x_may}}
    · C(N, {x_nino})\, p_N^{x_nino} (1-p_N)^{N-{x_nino}}.\]

Donde:
- \[J = {jovenes_tot}\] es el número de jóvenes,
- \[M = {mayores_tot}\] es el número de mayores,
- \[N = {ninos_tot}\] es el número de niños,
- \[p_J, p_M, p_N\] son las probabilidades de contagio de un joven, un mayor y un niño, respectivamente.

***Problema del enunciado:*** en el texto original ***nunca se dan los valores de***
\[p_J, p_M\] y \[p_N\]. No se dice, por ejemplo, “cada joven se contagia con probabilidad 0.2”, etc.
Al no conocer esos valores:

- No podemos sustituir números en la fórmula.
- Cualquier número concreto de probabilidad que aparezca en las opciones
  solo sería válido para algún conjunto específico de \[(p_J, p_M, p_N)\]
  que el enunciado no especifica.
- Por lo tanto, ***ninguna opción numérica está justificada*** con la información disponible.

Conclusión: con el enunciado tal como está, la única respuesta razonable es
***“Ninguna de las anteriores”***, porque ***no se puede calcular*** la probabilidad
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
  $$En este ejercicio tenemos una ***serie 3 de 4*** entre Millonarios (equipo A) y Santafé (equipo B).

- Denotemos por \[p_A\] la probabilidad de que Millos gane un partido.
- Entonces la probabilidad de que Santafé gane un partido es \[p_B = 1 - p_A\].

En el enunciado se nos dice que el campeón es quien gane ***3 de 4*** partidos. Si modelamos la serie como 4 partidos jugados de forma independiente, esto significa que Santafé gana el torneo si, en esos 4 partidos, obtiene ***al menos 3 victorias***.

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

La probabilidad de un patrón específico del tipo ***B, B, B, A*** es:

\[ (1 - p_A)^3 \cdot p_A. \]

Pero hay muchas formas de ubicar esa única derrota de Santafé entre los 4 partidos. El número de formas de elegir ***3 partidos*** de los 4 para que Santafé gane es:

\[ \binom{4}{3}. \]

Por lo tanto, la probabilidad de que Santafé gane ***exactamente 3*** de los 4 partidos es:

\[ P(\text{Santafé gana exactamente 3}) = \binom{4}{3} (1 - p_A)^3 p_A. \]

---

### 2. Santafé gana los 4 partidos

En este caso, Santafé gana ***todos*** los partidos, así que en cada uno ocurre el evento “B gana” con probabilidad \[1 - p_A\]. Como los 4 partidos son independientes, la probabilidad de que Santafé gane los 4 es:

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

Los dos casos anteriores son ***mutuamente excluyentes*** (no se pueden dar al mismo tiempo) y cubren todas las formas en que Santafé puede ganar el torneo en una serie 3 de 4. Por la regla de la suma:

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
  $$En este ejercicio queremos la probabilidad de que ***más de un átomo*** decaiga en un intervalo de tiempo dado.

1. ***Modelo de partida: Binomial***

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

2. ***Parámetro de Poisson \[\lambda\]***

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

3. ***Probabilidades en la Poisson***

Para una variable Poisson con parámetro \(\lambda\), tenemos:
\[
P(N = k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 0,1,2,\dots
\]

En particular:
- Probabilidad de ***cero*** decaimientos:
  \[
  P(N = 0) = e^{-\lambda}.
  \]
- Probabilidad de ***exactamente un*** decaimiento:
  \[
  P(N = 1) = \lambda e^{-\lambda}.
  \]

---

4. ***Evento “más de un átomo decae”***

El evento “más de un átomo decae” es:
\[
\{N > 1\} = \{2,3,4,\dots\}.
\]

Es más fácil trabajar con el ***complemento***:
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

5. ***Conexión con las opciones tipo \(1 - 5/e^4\)***

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
    $$Usamos la aproximación normal a la binomial con corrección por continuidad.

Primero definimos la variable de interés.  
Sea \[X\] el número de artículos defectuosos en la muestra de tamaño \[n = {n}\].

Como cada artículo es defectuoso con probabilidad \[p = {pdef}\] e independiente de los demás, entonces:
\[
X \sim \text{Binomial}(n = {n},\, p = {pdef}).
\]

***1. Parámetros de la distribución normal aproximada***

La media y la varianza de una binomial son:
\[
\mu = \mathbb{E}[X] = n p,\qquad
\sigma^2 = \text{Var}(X) = n p(1-p).
\]

En nuestro caso:
\[
\mu = n p = {n}\,{pdef},\qquad
\sigma = \sqrt{n p(1-p)} = \sqrt{{n}\,{pdef}\,\bigl(1-{pdef}\bigr)}.
\]

Aproximamos \[X\] por una normal:
\[
X \approx Y \sim \mathcal{N}(\mu,\, \sigma^2).
\]

### 2. Probabilidad \[P(X > {e})\]

La condición \[X > {e}\] en una variable discreta se escribe con corrección por continuidad como:
\[
P(X > {e}) \approx P\bigl(Y > {e} + 0.5\bigr).
\]

Estandarizamos usando:
\[
Z = \frac{Y - \mu}{\sigma} \sim \mathcal{N}(0,1).
\]

Entonces:
\[
P\bigl(Y > {e} + 0.5\bigr)
= P\left(Z > \frac{{e} + 0.5 - \mu}{\sigma}\right)
= 1 - \Phi\!\left(\frac{{e} + 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right).
\]

Es decir:
\[
P(X > {e}) \approx 1 - \Phi\!\left(\frac{{e} + 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right).
\]

### 3. Probabilidad \[P(X < {m})\]

La condición \[X < {m}\] se aproxima con corrección por continuidad como:
\[
P(X < {m}) \approx P\bigl(Y < {m} - 0.5\bigr).
\]

De nuevo estandarizamos:
\[
P\bigl(Y < {m} - 0.5\bigr)
= P\left(Z < \frac{{m} - 0.5 - \mu}{\sigma}\right)
= \Phi\!\left(\frac{{m} - 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right).
\]

Entonces:
\[
P(X < {m}) \approx \Phi\!\left(\frac{{m} - 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right).
\]

### 4. Resumen de las expresiones usadas

Con todo lo anterior, las aproximaciones finales que usa la plantilla son:
\[
P(X > {e}) \approx 1 - \Phi\!\left(\frac{{e} + 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right),
\]
\[
P(X < {m}) \approx \Phi\!\left(\frac{{m} - 0.5 - n\,{pdef}}{\sqrt{n\,{pdef}\,\bigl(1-{pdef}\bigr)}}\right).
\]
$$,

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
    "spread_right": 0.12,

    "left_toleranceAbs":  0.001,
    "right_toleranceAbs": 0.001,

    "practice_correct_display_expr":
      "$ 1 - \\Phi\\!\\left( \\dfrac{{e} + 0.5 - {n}\\,{pdef}}{\\sqrt{{n}\\,{pdef}\\,(1-{pdef})}} \\right) ,\\; \\Phi\\!\\left( \\dfrac{{m} - 0.5 - {n}\\,{pdef}}{\\sqrt{{n}\\,{pdef}\\,(1-{pdef})}} \\right) $"
  }'::jsonb,
  'A', 1;

-- P2: Exponencial CDF — MCQ AUTO con opciones tipo 1ª imagen
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$La vida de cierto dispositivo tiene una tasa de falla anunciada de {lambda} por hora. 
Si la tasa de falla es constante y se aplica la distribución exponencial, entonces 
la probabilidad de que transcurran menos de {t} horas antes de que se observe una falla es$$,

  $$Sea \[T\] la variable aleatoria que representa el ***tiempo de vida*** (en horas) del dispositivo.

Supondremos que \[T\] sigue una distribución exponencial con tasa de falla constante
\[
T \sim \text{Exponencial}(\lambda = {lambda}),
\]
donde \[\lambda > 0\] es la ***tasa de falla por hora***.

---

***1. Recordatorio: densidad y función de distribución exponencial***

Para una variable \[T \sim \text{Exponencial}(\lambda)\], se tiene:

- La ***función de densidad***:
\[
f_T(t) = \lambda e^{-\lambda t}, \quad t \ge 0.
\]

- La ***función de distribución acumulada (CDF)***:
\[
F_T(t) = P(T \le t) = 1 - e^{-\lambda t}, \quad t \ge 0.
\]

Esta \[F_T(t)\] da la probabilidad de que la falla ocurra ***antes o en*** el tiempo \[t\].

---

*** 2. Probabilidad pedida en el enunciado***

El problema pide:
\[
P(T < {t}),
\]
es decir, la probabilidad de que el dispositivo falle ***antes de {t} horas***.

Como en la distribución exponencial (con densidad continua) no hay diferencia entre \[T < t\] y \[T \le t\], podemos escribir:
\[
P(T < {t}) = P(T \le {t}) = F_T({t}).
\]

Usando la CDF exponencial:
\[
F_T({t}) = 1 - e^{-\lambda {t}}.
\]

En nuestro caso, sustituimos \[\lambda = {lambda}\] y \[t = {t}\]:
\[
P(T < {t}) = 1 - e^{-{lambda}\,{t}}.
\]

---

*** 3. Expresión final***

Por tanto, la probabilidad de que ***transcurran menos de {t} horas*** antes de observar una falla es:

\[
P(T < {t}) = 1 - e^{-{lambda}\,{t}}.
\]

Esta es la expresión teórica que se usa para construir la respuesta correcta y las opciones de respuesta en el quiz.
$$,

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

    "correct_expr":   " 1 - exp(-lambda*t) ",
    "correct_display": "$1 - e^{-{lambda_t}}$",

    "distractor_exprs": [
      " exp(-lambda*t) ",
      " 1 - 2*exp(-lambda*t) ",
      " 1 - exp(-2*lambda*t) ",
      " 0.0 "
    ],
    "distractor_display": [
      "$e^{-{lambda_t}}$",
      "N.A.",
      "$1 - e^{-2{lambda_t}}$",
      "$1 - 2 e^{-{lambda_t}}$"
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
    $$Sea \[T\] la vida de servicio (en años) de la batería.

En una distribución de Weibull con parámetros \[\alpha = {alpha}\] (forma) y \[\beta = {beta}\] (escala),
la función de distribución acumulada (CDF) viene dada por

\[
F(t) = P(T \le t) = 1 - e^{ -\left(\frac{t}{\beta}\right)^{\alpha} },\quad t \ge 0.
\]

La función de supervivencia es la probabilidad de que la variable supere un tiempo dado \[t\]:

\[
S(t) = P(T > t) = 1 - F(t).
\]

Sustituyendo la expresión de \[F(t)\] obtenemos

\[
S(t) = 1 - \Bigl[1 - e^{ -\left(\frac{t}{\beta}\right)^{\alpha} }\Bigr]
     = e^{ -\left(\frac{t}{\beta}\right)^{\alpha} }.
\]

En particular, para el tiempo específico \[t = {t_weibull}\] años que aparece en el enunciado, la probabilidad de que 
la batería siga funcionando después de ese tiempo es

\[
P(T > {t_weibull}) = S({t_weibull}) = e^{ -\left(\frac{{t_weibull}}{{beta}}\right)^{{alpha}} }.
\]

Por tanto, la expresión general de la función de supervivencia de una Weibull es

\[
S(t) = e^{ -\left(\frac{t}{\beta}\right)^{\alpha} }.
\]
$$,

  'weibull_supervivencia',
  '{
    "alpha": { "values": [0.5, 1.0, 1.5] },
    "beta":  { "values": [1.5, 2.0, 3.0] },
    "t_weibull":  { "values": [1, 2, 3] }
  }'::jsonb,
    '{
      "mode": "mcq_auto",
      "num_options": 5,
      "format": "number",
      "decimals": 4,
      "practice_decimals": 20,
      "spread": 0.0,

      "correct_expr": " exp( - pow( t_weibull / beta, alpha ) ) ",
      "correct_display": null,

      "practice_correct_display":
        "$ e^{ -\\left( \\dfrac{ {t_weibull} }{ {beta} } \\right)^{ {alpha} } } $",

      "distractor_exprs": [
        " 1 - exp( - pow( t_weibull / beta, alpha ) ) ",
        " exp( - pow( t_weibull / beta, 2 * alpha ) ) ",
        " exp( - t_weibull / beta ) ",
        " 0.0 "
      ],
      "distractor_display": [
        "$ 1 - e^{ -\\left( \\dfrac{ {t_weibull} }{ {beta} } \\right)^{ {alpha} } } $",
        "$ e^{ -\\left( \\dfrac{ {t_weibull} }{ {beta} } \\right)^{ 2 {alpha} } } $",
        "$ e^{ - \\dfrac{ {t_weibull} }{ {beta} } } $",
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
    $$Sea \(X\) el peso del chocolate tipo Crema y \(Y\) el peso del tipo Chicloso, con densidad conjunta

\[
f(x,y) = {c}\,x y,\quad 0 \le x \le y,\; 0 \le y \le 1,\; x + y \le 1.
\]

Definimos la variable aleatoria
\[
Z = X + Y.
\]

La densidad de \(Z\), denotada por \(h(z)\), se obtiene integrando la densidad conjunta sobre todas
las parejas \((x,y)\) tales que \(x + y = z\). Usamos el cambio \(y = z - x\):

\[
h(z) = \int f\bigl(x, z - x\bigr)\,dx.
\]

Primero determinamos el intervalo de integración.  
De las restricciones originales tenemos:

- \(0 \le x \le y\)   \(\Rightarrow\)  \(0 \le x \le z - x \Rightarrow 0 \le x \le \dfrac{z}{2}\),
- \(x + y \le 1\)     \(\Rightarrow\)  \(z \le 1\),
- \(0 \le y \le 1\)   \(\Rightarrow\)  \(0 \le z - x \le 1\).

Para \(0 < z < 1\), estas condiciones se resumen en
\[
0 < z < 1,\qquad 0 \le x \le \frac{z}{2}.
\]

Entonces, para \(0 < z < 1\),

\[
h(z) = \int_{0}^{z/2} f\bigl(x, z - x\bigr)\,dx
     = \int_{0}^{z/2} {c}\,x(z - x)\,dx.
\]

Desarrollamos el integrando:

\[
x(z - x) = z x - x^{2},
\]

así que

\[
h(z) = {c} \int_{0}^{z/2} \bigl(z x - x^{2}\bigr)\,dx
     = {c} \left[ \frac{z x^{2}}{2} - \frac{x^{3}}{3} \right]_{0}^{z/2}.
\]

Evaluando en los límites:

\[
\frac{z}{2}\left(\frac{z}{2}\right)^{2} = \frac{z^{3}}{8}, \qquad
\left(\frac{z}{2}\right)^{3} = \frac{z^{3}}{8},
\]

por lo que

\[
h(z) = {c} \left( \frac{z^{3}}{8} - \frac{1}{3}\cdot\frac{z^{3}}{8} \right)
     = {c}\,z^{3} \left( \frac{1}{8} - \frac{1}{24} \right)
     = {c}\,z^{3} \cdot \frac{2}{24}
     = \frac{{c}}{12} z^{3}, \quad 0 < z < 1.
\]

Comparando con la forma propuesta

\[
h(z) = k z^{3},\quad 0 < z < 1,
\]

se concluye que

\[
k = \frac{{c}}{12}.
\]
$$,

  'densidad_conjunta_choc',
  '{
    "c": { "values": [16, 24, 32] }
  }'::jsonb,
  '{
    "mode": "open_numeric",
    "expected_expr": " c / 12 ",
    "format": "number",
    "decimals": 4,
    "toleranceAbs": 0.05,
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
  $$Sea X el diámetro de las esferas, medido en centímetros. Por hipótesis,
\[
X \sim N(\mu, \sigma^2),
\]
donde en esta plantilla \[\mu = {mu}\] y \[\sigma = {sigma}.\]

Las especificaciones del proceso exigen que el diámetro esté dentro del intervalo
\[
[\text{centro} - \text{tol},\; \text{centro} + \text{tol}]
= [{centro} - {tol},\; {centro} + {tol}].
\]
Llamemos
\[
a = {centro} - {tol}, \quad b = {centro} + {tol}.
\]

La proporción de esferas que cumplen las especificaciones es la probabilidad
\[
P(a \le X \le b).
\]

Para poder calcular esta probabilidad usamos la estandarización de la Normal:
definimos
\[
Z = \frac{X - \mu}{\sigma},
\]
de modo que \[Z \sim N(0,1)\]. Entonces
\[
P(a \le X \le b)
= P\!\left(\frac{a - \mu}{\sigma} \le Z \le \frac{b - \mu}{\sigma}\right).
\]

Si denotamos por \[\Phi(\cdot)\] a la función de distribución acumulada de la Normal estándar, obtenemos
\[
P(a \le X \le b)
= \Phi\!\left(\frac{b - \mu}{\sigma}\right)
 - \Phi\!\left(\frac{a - \mu}{\sigma}\right).
\]

En términos de los parámetros de la plantilla:
\[
a = {centro} - {tol}, \quad
b = {centro} + {tol},
\]
de modo que la expresión que se evalúa numéricamente en el sistema es
\[
P(a \le X \le b)
= \Phi\!\left(\frac{{centro} + {tol} - {mu}}{{sigma}}\right)
 - \Phi\!\left(\frac{{centro} - {tol} - {mu}}{{sigma}}\right).
\]

Esta probabilidad se convierte luego a porcentaje para generar las opciones de respuesta de la pregunta de selección múltiple.$$,
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
  $$
  Sea \[X\] la variable aleatoria que cuenta el ***número de componentes buenos***
  en una muestra de tamaño \[n\] tomada ***sin reemplazo*** de un lote finito.

  En el lote hay:
  \[
    K \text{ buenos},\quad D \text{ defectuosos},\quad
    N = K + D \text{ componentes en total}.
  \]

  Entonces \[X\] tiene una distribución ***hipergeométrica***:
  \[
    X \sim \text{Hipergeom}(N, K, n),
  \]
  donde:
  - \[N\] es el tamaño de la población;
  - \[K\] es el número de éxitos (buenos) en la población;
  - \[n\] es el tamaño de la muestra.

  ---  

  ***1. Media \[E[X]\]***

  En una distribución hipergeométrica, la media se puede ver como
  \[
    E[X] = n \cdot \frac{K}{N}.
  \]

  Intuitivamente: la proporción de buenos en el lote es \[K/N\], y de los \[n\]
  que se extraen, en promedio se espera esa misma proporción:
  \[
    E[X] = n \cdot \frac{K}{K + D}.
  \]

  En la plantilla esto se programa como
  \[
    \texttt{left\_expr} = n * K / (K + D).
  \]

  ---  

  ***2. Varianza \[Var[X]\]***

  Para la distribución hipergeométrica, la varianza es
  \[
    Var[X]
      = n \cdot \frac{K}{N}\left(1 - \frac{K}{N}\right)
        \cdot \frac{N - n}{N - 1}.
  \]

  Sustituyendo \[N = K + D\] se obtiene
  \[
    Var[X]
      = n \cdot \frac{K}{K + D}
          \left(1 - \frac{K}{K + D}\right)
          \cdot \frac{(K + D) - n}{(K + D) - 1}.
  \]

  Esta expresión es la que se codifica en el esquema como
  \[
    \texttt{right\_expr}
      = n * (K / (K + D))
          * (1 - K / (K + D))
          * ((K + D - n) / (K + D - 1)).
  \]

  De esta forma, el sistema genera automáticamente la media (lado izquierdo del par)
  y la varianza (lado derecho) para los valores específicos de \[K\], \[D\] y \[n\]
  que se usen en cada instancia de la pregunta.
  $$,
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
    "spread_right": 0.10,

    "practice_correct_display_expr": "$ {n} \\cdot \\frac{{K}}{{K}+{D}}, {n} \\cdot \\frac{{K}}{{K}+{D}}\\left(1 - \\frac{{K}}{{K}+{D}}\\right)\\cdot \\frac{{K}+{D}-{n}}{{K}+{D}-1} $"

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
  $$
  Sea \[Y\] la ***ganancia total en comisiones*** (en millones de pesos) que obtiene el agente en ese día.

  Definimos las variables aleatorias indicadoras:

  \[
    I_1 =
    \begin{cases}
      1, & \text{si se cierra el negocio con el primer cliente},\\
      0, & \text{en otro caso},
    \end{cases}
    \qquad
    I_2 =
    \begin{cases}
      1, & \text{si se cierra el negocio con el segundo cliente},\\
      0, & \text{en otro caso}.
    \end{cases}
  \]

  Entonces:
  - La probabilidad de éxito con el primer cliente es \[P(I_1 = 1) = p_1\], y \[P(I_1 = 0) = 1 - p_1\].
  - La probabilidad de éxito con el segundo cliente es \[P(I_2 = 1) = p_2\], y \[P(I_2 = 0) = 1 - p_2\].

  Cada comisión (en ***millones***) se puede escribir como:

  \[
    Y_1 = c_1 I_1, \qquad
    Y_2 = c_2 I_2,
  \]
  donde:
  - \[Y_1\] es la comisión (en millones) del primer cliente,
  - \[Y_2\] es la comisión (en millones) del segundo cliente,
  - \[c_1\] y \[c_2\] son los montos de comisión (en millones).

  La ganancia total en comisiones en el día es la suma:

  \[
    Y = Y_1 + Y_2 = c_1 I_1 + c_2 I_2.
  \]

  ---

  ***1. Valor esperado de cada comisión***

  Usamos que para una variable indicadora \[I\] con \[P(I = 1) = p\] y \[P(I = 0) = 1-p\], se tiene:

  \[
    E[I] = 0\cdot(1-p) + 1\cdot p = p.
  \]

  En nuestro caso:

  \[
    E[Y_1] = E[c_1 I_1] = c_1 E[I_1] = c_1 p_1,
    \qquad
    E[Y_2] = E[c_2 I_2] = c_2 E[I_2] = c_2 p_2.
  \]

  Obsérvese que aquí \[c_1\] y \[c_2\] ya están medidos en ***millones de pesos***, así que el resultado final también estará en millones.

  ---

  ***2. Linealidad de la esperanza***

  La esperanza es lineal, es decir, para cualquier dos variables aleatorias \[Y_1\] y \[Y_2\]:

  \[
    E[Y_1 + Y_2] = E[Y_1] + E[Y_2],
  \]
  y esto ***no requiere independencia*** (aunque en el enunciado se mencione que las citas son independientes).

  Aplicando esto a \[Y = Y_1 + Y_2\]:

  \[
    E[Y]
      = E[Y_1 + Y_2]
      = E[Y_1] + E[Y_2]
      = c_1 p_1 + c_2 p_2.
  \]

  Ese es el valor esperado de la ***ganancia total en comisiones*** del agente para ese día, en millones de pesos.

  ---

  ***3. Conexión con la plantilla***

  En el esquema de la base de datos se programa como:

  \[
    \texttt{correct\_expr} = \; p_1 \, c_1 + p_2 \, c_2.
  \]

  Dado que \[c_1\] y \[c_2\] se dan en millones, el resultado de \[E[Y]\] también se interpreta directamente como
  “\[E\] millones de pesos”, que es lo que se muestra en las opciones con el prefijo \["\$"\] y el sufijo \[" millones"\].
  $$,
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
  $$Sea \[ μ \] el tiempo promedio en horas de servicio que presta un Dron antes de tener una falla, y \[ \$ \, {coef_costo} μ^2 \] su costo total. 
El ingreso por \[ T \] horas de servicio es \[ \$ \, {coef_ingreso} T \]. 
Entonces la Utilidad Esperada Máxima del Dron es \[ \$ \]____ (complete sobre el espacio).$$,
  $$
  Sea \[ μ \] el ***tiempo promedio de servicio*** (en horas) que presta el dron antes de fallar.

  - El ***costo total esperado*** asociado a ese tiempo promedio se modela como
    \[
      C(μ) = {coef_costo}\, μ^2.
    \]
  - El ***ingreso total esperado*** si el dron presta en promedio \[ μ \] horas de servicio se modela como
    \[
      I(μ) = {coef_ingreso}\, μ.
    \]
    (Aquí interpretamos \[T\] como el tiempo efectivo de servicio, y en promedio \[T = μ\].)

  La ***utilidad esperada*** (ingresos menos costos) como función de \[ μ \] es:
  \[
    U(μ) = I(μ) - C(μ)
         = {coef_ingreso}\, μ - {coef_costo}\, μ^2.
  \]

  Esta es una ***función cuadrática cóncava*** en \[ μ \] porque el coeficiente de \[ μ^2 \] es negativo (\[-{coef_costo} < 0\]).  
  Por tanto, su máximo se encuentra en el vértice de la parábola.

  ---

  ***1. Derivada y condición de primer orden***

  Calculamos la derivada de \[ U(μ) \] respecto a \[ μ \]:
  \[
    U(μ) = \frac{d}{dμ}\bigl({coef_ingreso} μ - {coef_costo} μ^2\bigr)
          = {coef_ingreso} - 2 {coef_costo} μ.
  \]

  Para hallar el valor de \[ μ \] que maximiza la utilidad, imponemos la condición de primer orden
  \[
    U(μ) = 0.
  \]

  Entonces:
  \[
    {coef_ingreso} - 2 {coef_costo} μ = 0
    \quad \Rightarrow \quad
    2 {coef_costo} μ = {coef_ingreso}
    \quad \Rightarrow \quad
    μ^* = \frac{{coef_ingreso}}{2 {coef_costo}}.
  \]

  ---

  ***2. Condición de segundo orden (máximo)***

  La segunda derivada es
  \[
    U(μ) = \frac{d}{dμ} U(μ)
           = \frac{d}{dμ}\bigl({coef_ingreso} - 2 {coef_costo} μ\bigr)
           = -2 {coef_costo}.
  \]

  Como \[{coef_costo} > 0\], se tiene
  \[
    U''(μ) = -2 {coef_costo} < 0,
  \]
  lo que confirma que \[ μ^* \] corresponde a un ***máximo global*** de la utilidad.

  ---

  ***3. Sustituir \[ μ^* \] en la utilidad para obtener \[ U_{\max} \]***

  Ahora evaluamos la utilidad en el punto óptimo:
  \[
    U_{\max} = U(μ^*)
             = {coef_ingreso} μ^* - {coef_costo} (μ^*)^2.
  \]

  Sustituyendo \[ μ^* = \dfrac{{coef_ingreso}}{2 {coef_costo}} \]:
  \[
    U_{\max}
      = {coef_ingreso} \left( \frac{{coef_ingreso}}{2 {coef_costo}} \right)
        - {coef_costo}
          \left( \frac{{coef_ingreso}}{2 {coef_costo}} \right)^2.
  \]

  Simplificamos paso a paso:

  \[
    {coef_ingreso} \left( \frac{{coef_ingreso}}{2 {coef_costo}} \right)
      = \frac{{coef_ingreso}^2}{2 {coef_costo}},
  \]

  y

  \[
    {coef_costo}
      \left( \frac{{coef_ingreso}}{2 {coef_costo}} \right)^2
      = {coef_costo}
        \frac{{coef_ingreso}^2}{4 {coef_costo}^2}
      = \frac{{coef_ingreso}^2}{4 {coef_costo}}.
  \]

  Entonces:

  \[
    U_{\max}
      = \frac{{coef_ingreso}^2}{2 {coef_costo}}
        - \frac{{coef_ingreso}^2}{4 {coef_costo}}
      = \left( \frac{2}{4} - \frac{1}{4} \right)
        \frac{{coef_ingreso}^2}{{coef_costo}}
      = \frac{1}{4}\,\frac{{coef_ingreso}^2}{{coef_costo}}
      = \frac{{coef_ingreso}^2}{4 {coef_costo}}.
  \]

  Ese es el valor numérico que debe escribir el estudiante en el espacio en blanco
  (en unidades monetarias \[ \$ \]).

  ---

  ***4. Conexión con la plantilla***

  En el esquema de la pregunta esto se programa como:

  \[
    \texttt{expected\_expr}
      = \frac{{coef\_ingreso}^2}{4\,{coef\_costo}},
  \]
  que en la sintaxis del evaluador se escribe:

  \[
    \texttt{"expected\_expr"} = " (coef\_ingreso * coef\_ingreso) / (4.0 * coef\_costo) ".
  \]

  El sistema evalúa esta expresión para los valores concretos de \[{coef_ingreso}\] y \[{coef_costo}\]
  que tenga cada instancia de la pregunta, y compara la respuesta numérica del estudiante
  con ese valor dentro de la tolerancia especificada.
  $$,
  'max_utilidad_cuad',
  '{
    "coef_ingreso": { "values": [24, 26, 28, 30] },
    "coef_costo":   { "values": [3, 4, 5] }
  }'::jsonb,
  '{
    "mode": "open_numeric",

    "expected_expr": " (coef_ingreso * coef_ingreso) / (4.0 * coef_costo) ",

    "toleranceAbs": 0.0077,
    "tolerancePct": 0.0,

    "format": "number",
    "decimals": 2,

    "latex": "U_{\\max}=\\dfrac{{coef_ingreso}^2}{4{coef_costo}}"
  }'::jsonb,
  'A', 1;



-- P5: Transformación Y = c X^3 — ABIERTA TEXTUAL (LaTeX, parametrizada y aleatoria)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Dada la variable aleatoria continua \[X\] con la función de distribución de probabilidad 
  \[
    f(x) = 2x, \quad 0 < x < 1,
  \]
  y 0 en otro caso, entonces la distribución de probabilidad de
  \[
    Y = {c}X^3.
  \] es
  Complete sobre el espacio: $$,
  $$***Paso 1. Transformación e inversa.***
  Definimos \[Y={c}X^3 con {c}>0\]. Como \[x\mapsto {c}x^3\] es estrictamente creciente en \[0,1\],
  podemos usar el método de cambio de variable para transformaciones monótonas.
  A partir de
  \[
    y = {c}x^3
    \quad\Longrightarrow\quad
    x = \bigl(y/{c}\bigr)^{1/3},
  \]
  vemos que cuando \[x\in(0,1)\] se tiene \[y\in(0,{c})\]. Por tanto, el soporte de $Y$ es
  \[
    0 < y < {c}.
  \]
  
  ***Paso 2. Derivada del inverso.***
  La derivada de \[x(y) = \bigl(y/{c}\bigr)^{1/3}\] es
  \[
    \frac{dx}{dy}
      = \frac{1}{3}\Bigl(\frac{y}{c}\Bigr)^{-2/3}\frac{1}{c}
      = \frac{1}{3\,{c}^{1/3}y^{2/3}}.
  \]
  
  ***Paso 3. Densidad de Y.***
  Usamos la fórmula de cambio de variable para densidades continuas:
  \[
    f_Y(y)
      = f_X\bigl(x(y)\bigr)\,\bigl|\tfrac{dx}{dy}\bigr|.
  \]
  Sustituyendo \[x(y) = \bigl(y/{c}\bigr)^{1/3}\] obtenemos
  \[
    f_Y(y)
      = 2\Bigl(\frac{y}{c}\Bigr)^{1/3}\cdot
        \frac{1}{3\,{c}^{1/3}y^{2/3}}
      = \frac{2}{3\,{c}^{2/3}y^{1/3}}, \quad 0<y<{c}.
  \]
  
  En conclusión, la densidad de $Y$ es
  \[
    f_Y(y)=\frac{2}{3\,{c}^{2/3}y^{1/3}},\quad 0<y<{c}.
  \]$$,
  'transformacion_y_2x3',
  '{
    "c": { "values": [2, 3, 4] }
  }'::jsonb,
  '{
    "mode":   "open_text",
    "format": "latex",
    "practice_format": "latex_text",

    "canonical":     "f(y)=\\frac{2}{3\\cdot {c}^{\\frac23}\\cdot y^{\\frac13}},0<y<{c}",
    "expected_text": "f(y)=\\frac{2}{3\\cdot {c}^{\\frac23}\\cdot y^{\\frac13}},0<y<{c}",

    "accept": [
      "f(y)=\\frac{2}{3\\cdot {c}^{\\frac23}\\cdot y^{\\frac13}},0<y<{c}",
      "\\frac{2}{3\\cdot {c}^{\\frac23}\\cdot y^{\\frac13}},0<y<{c}"
    ],

    "caseSensitive": false,
    "trim": true,
    "latex": "f(y)=\\frac{2}{3\\cdot {c}^{2/3} y^{1/3}},\\quad 0<y<{c}"
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
  $$
Sea \[X\] la variable aleatoria que representa el tiempo de vida (en horas)
de una bacteria solar. El enunciado nos dice que
\[
  X \sim \mathcal{N}(\mu, \sigma^2),
\]
con media \[\mu = {mu}\] horas y desviación estándar \[\sigma = {sigma}\] horas.

Nos piden calcular la probabilidad de que una bacteria dure entre \[{a}\] y \[{b}\] horas, es decir,
\[
  P({a} < X < {b}).
\]

---

***1. Planteamiento de la probabilidad***

Escribimos directamente la probabilidad sobre \[X\]:
\[
  P({a} < X < {b})
  = P(X < {b}) - P(X \le {a}).
\]

Para poder usar tablas o funciones estándar de la normal, convertimos \[X\] a una normal estándar.

---

***2. Estandarización a una normal estándar***

Definimos la variable tipificada
\[
  Z = \frac{X - \mu}{\sigma},
\]
que cumple
\[
  Z \sim \mathcal{N}(0,1).
\]

Al aplicar esta transformación a los límites \[{a}\] y \[{b}\], obtenemos:
\[
  z_a = \frac{{a} - \mu}{\sigma}, \qquad
  z_b = \frac{{b} - \mu}{\sigma}.
\]

Entonces la probabilidad pedida se convierte en
\[
  P({a} < X < {b})
  = P\!\left( z_a < Z < z_b \right)
  = P(Z < z_b) - P(Z \le z_a).
\]

---

***3. Uso de la función de distribución \[\Phi\]***

Denotamos por \[\Phi(z)\] a la función de distribución acumulada de la normal estándar:
\[
  \Phi(z) = P(Z \le z).
\]

Con esta notación, la expresión anterior se escribe como
\[
  P({a} < X < {b})
  = \Phi(z_b) - \Phi(z_a)
  = \Phi\!\left(\frac{{b} - \mu}{\sigma}\right)
    - \Phi\!\left(\frac{{a} - \mu}{\sigma}\right).
\]
$$,
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




-- P2: Discreta {0,1,2} – (media, varianza) — MCQ AUTO PAIR (parametrizada con porcentajes)
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Un dispositivo tiene dos resistores, cada uno puede tener resistencia entre {r_min} y {r_max} ohmios. 
En un circuito integrado las probabilidades de que cumplan las especificaciones de rango son: 
{p2_pct}\[ \% \] para ambos, {p1_pct}\[ \% \] para uno solo, y {p0_pct}\[ \% \] para ninguno. 
La media y la varianza de la variable aleatoria que indica la cantidad de resistores con las especificaciones requeridas son (aprox. más cercana):$$,

  $$
Sea \[X\] la variable aleatoria que representa ***el número de resistores*** que cumplen las
especificaciones de resistencia en el circuito.

Como hay dos resistores, \[X\] solo puede tomar los valores
\[
  X \in \{0,1,2\}.
\]

Según el enunciado, las probabilidades (a partir de los porcentajes) son:
\[
  P(X=0) = p_0 = \frac{{p0\_pct}}{100},\quad
  P(X=1) = p_1 = \frac{{p1\_pct}}{100},\quad
  P(X=2) = p_2 = \frac{{p2\_pct}}{100},
\]
y se cumple que \[p_0 + p_1 + p_2 = 1\].

---

1. Media \[E[X]\]

Para una variable discreta,
\[
  E[X] = \sum_x x\,P(X=x).
\]

En este caso, como \[X\] puede ser 0, 1 o 2:
\[
  E[X] = 0\cdot P(X=0) + 1\cdot P(X=1) + 2\cdot P(X=2)
       = 0\cdot p_0 + 1\cdot p_1 + 2\cdot p_2.
\]

Sustituyendo los valores en función de los porcentajes:
\[
  E[X]
  = 0\cdot \frac{{p0\_pct}}{100}
    + 1\cdot \frac{{p1\_pct}}{100}
    + 2\cdot \frac{{p2\_pct}}{100}.
\]

Este es el primer número que debe aparecer en la respuesta (la ***media*** de \[X\]).

---

***2. Segundo momento \[E[X^2]\]***

Para poder calcular la varianza, primero encontramos el segundo momento:
\[
  E[X^2] = \sum_x x^2\,P(X=x).
\]

En nuestro caso:
\[
  E[X^2] = 0^2 P(X=0) + 1^2 P(X=1) + 2^2 P(X=2)
         = 0^2 p_0 + 1^2 p_1 + 2^2 p_2.
\]

Usando los porcentajes:
\[
  E[X^2]
  = 0^2\frac{{p0\_pct}}{100}
    + 1^2\frac{{p1\_pct}}{100}
    + 2^2\frac{{p2\_pct}}{100}.
\]

---

***3. Varianza \[Var[X]\]***

La varianza se define como
\[
  Var[X] = E[X^2] - (E[X])^2.
\]

Es decir,
\[
  Var[X]
  = \bigl(0^2 p_0 + 1^2 p_1 + 2^2 p_2\bigr)
    - \bigl(0 p_0 + 1 p_1 + 2 p_2\bigr)^2.
\]

En la práctica, primero se calcula \[E[X]\] con la fórmula anterior,
luego \[E[X^2]\], y finalmente se hace la resta
\[
  Var[X] = E[X^2] - (E[X])^2.
\]

De este modo, la respuesta que se muestra al estudiante es un par de números:
el primero corresponde a la media \[E[X]\] y el segundo a la varianza \[Var[X]\],
ambas calculadas a partir de los porcentajes \[{p0\_pct}\%, {p1\_pct}\%\] y \[{p2\_pct}\%\].
$$,

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

    "sep":  " , ",

    "num_options": 4,
    "spread_left":  0.08,
    "spread_right": 0.08,

    "practice_correct_display_expr": "$ 0\\cdot \\dfrac{{p0_pct}}{100} + 1\\cdot \\dfrac{{p1_pct}}{100} + 2\\cdot \\dfrac{{p2_pct}}{100}, \\left(0^{2}\\cdot \\dfrac{{p0_pct}}{100} + 1^{2}\\cdot \\dfrac{{p1_pct}}{100} + 2^{2}\\cdot \\dfrac{{p2_pct}}{100}\\right) - \\left(0\\cdot \\dfrac{{p0_pct}}{100} + 1\\cdot \\dfrac{{p1_pct}}{100} + 2\\cdot \\dfrac{{p2_pct}}{100}\\right)^{2} $"
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
  $$
El agente tiene dos oportunidades de obtener comisión: una por el primer cliente y otra por el segundo.
Sea:
\[
p_1 = \frac{{p1\_pct}}{100}, \qquad
p_2 = \frac{{p2\_pct}}{100},
\]
las probabilidades de éxito (ya convertidas a valores entre 0 y 1), y
\[
c_1 = {c1\_mill}, \qquad
c_2 = {c2\_mill},
\]
las ganancias en millones de pesos asociadas a cada cliente si el negocio se cierra con éxito.

---

***1. Valor esperado de una ganancia individual***

Para un evento que ocurre con probabilidad \[p\] y produce una ganancia de \[c\] si ocurre, el valor esperado es:
\[
E[\text{ganancia}] = p \cdot c.
\]

Esto representa la ganancia promedio a largo plazo si se repite el escenario muchas veces.

---

***2. Primer cliente***

La ganancia esperada del primer cliente es:
\[
E_1 = p_1 \, c_1
     = \left(\frac{{p1\_pct}}{100}\right){c1\_mill}.
\]

---

***3. Segundo cliente***

La ganancia esperada del segundo cliente es:
\[
E_2 = p_2 \, c_2
     = \left(\frac{{p2\_pct}}{100}\right){c2\_mill}.
\]

---

***4. Valor esperado total***

Como las dos citas son independientes, la ganancia total esperada es simplemente la suma de ambas:
\[
E_{\text{total}} = E_1 + E_2
= \frac{p_1}{100}\,c_1 + \frac{p_2}{100}\,c_2.
\]

Esta cantidad está medida en ***millones de pesos***, pues \[c_1\] y \[c_2\] ya están dados en millones.

---

***5. Interpretación***

El resultado representa el ingreso promedio que el agente obtendría por comisiones en un día con dos citas como estas, si ese escenario se repitiera muchas veces.

Por eso, la respuesta final se expresa como:
\[
E_{\text{total}} = \frac{p_1}{100}\,c_1 + \frac{p_2}{100}\,c_2
\quad\text{(en millones de pesos)}.
\]
$$,

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
$$
Sea \[\mu\] el tiempo promedio (en horas) que un Dron puede trabajar antes de fallar.
El ingreso que genera es proporcional al tiempo de operación, mientras que el costo
crece cuadráticamente debido al desgaste y mantenimiento.

El enunciado da la función de utilidad esperada:
\[
U(\mu) = {income\_rate}\,\mu \;-\; {cost\_rate}\,\mu^{2}.
\]

Esta es una función cuadrática cóncava (abre hacia abajo), por lo que posee un
***máximo único***. Para determinarlo, usamos cálculo diferencial.

---

### 1. Derivada de la utilidad

\[
\frac{dU}{d\mu}
= {income\_rate} - 2\,{cost\_rate}\,\mu.
\]

---

### 2. Condición de primer orden (máximo)

El máximo ocurre cuando la derivada es igual a cero:
\[
\frac{dU}{d\mu} = 0
\quad\Longrightarrow\quad
{income\_rate} - 2\,{cost\_rate}\,\mu = 0.
\]

Despejamos \[\mu\]:
\[
\mu^{*} = \frac{{income\_rate}}{2\,{cost\_rate}}.
\]

---

### 3. Utilidad máxima \[U_{\max}\]

Sustituimos \[\mu^{*}\] en \[U(\mu)\]:

\[
U_{\max}
= {income\_rate}\left(\frac{{income\_rate}}{2\,{cost\_rate}}\right)
  - {cost\_rate}\left(\frac{{income\_rate}}{2\,{cost\_rate}}\right)^2.
\]

Simplificando:

\[
{income\_rate}\left(\frac{{income\_rate}}{2\,{cost\_rate}}\right)
= \frac{{income\_rate}^2}{2\,{cost\_rate}},
\]

\[
{cost\_rate}\left(\frac{{income\_rate}^2}{4\,{cost\_rate}^2}\right)
= \frac{{income\_rate}^2}{4\,{cost\_rate}}.
\]

Restando:

\[
U_{\max}
= \frac{{income\_rate}^2}{4\,{cost\_rate}}.
\]

---

### 4. Resultado final

\[
U_{\max} = \frac{{income\_rate}^2}{4\,{cost\_rate}}
\]

Esta es la ***máxima utilidad esperada*** generada por el Dron.

$$,
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
  (SELECT id 
   FROM quices 
   WHERE corte = 'C3B' 
     AND titulo = 'Tercer Corte – Segundo Modelo' 
   LIMIT 1),

  $$Dada la variable aleatoria continua \[X\] con la función de distribución de probabilidad
\[
  f_X(x) = 2(1-x), \quad 0 < x < 1,
\]
y \[0\] en otro caso, entonces la distribución de probabilidad de
\[
  Y = {c}X^2
\]
es ________ (complete sobre el espacio).$$,

  $$***Paso 1. Transformación e inversa.***

Definimos
\[
  Y = {c}X^2,\quad {c} > 0.
\]
Como la función
\[
  x \mapsto {c}x^2
\]
es estrictamente creciente en el intervalo \[0 < x < 1\], podemos usar el método estándar
de cambio de variable para transformaciones monótonas.

A partir de
\[
  y = {c}x^2
  \quad\Longrightarrow\quad
  x = \sqrt{\frac{y}{c}},
\]
vemos que, cuando \[x \in (0,1)\], el valor de \[y\] recorre el intervalo
\[
  0 < y < {c}.
\]
Por tanto, el soporte de \[Y\] es
\[
  0 < y < {c}.
\]

***Paso 2. Derivada de la inversa.***

La inversa puede escribirse como
\[
  x(y) = \sqrt{\frac{y}{c}}.
\]
Entonces,
\[
  \frac{dx}{dy}
    = \frac{1}{2\sqrt{c y}}.
\]

***Paso 3. Densidad de \[Y\].***

Usamos la fórmula de cambio de variable para densidades continuas:
\[
  f_Y(y)
    = f_X\bigl(x(y)\bigr)\,\left|\frac{dx}{dy}\right|.
\]
Sustituyendo \[x(y) = \sqrt{\tfrac{y}{c}}\] y \[f_X(x) = 2(1-x)\] obtenemos
\[
  f_Y(y)
    = 2\left(1 - \sqrt{\frac{y}{c}}\right)\cdot
      \frac{1}{2\sqrt{c y}}
    = \frac{1 - \sqrt{y/c}}{\sqrt{c y}},
    \quad 0 < y < {c}.
\]

***Paso 4. Simplificación final.***

Notamos que
\[
  \sqrt{\frac{y}{c}} = \frac{\sqrt{y}}{\sqrt{c}},
\]
de modo que
\[
  \frac{1 - \sqrt{y/c}}{\sqrt{c y}}
  = \frac{1}{\sqrt{c}\sqrt{y}}
    - \frac{1}{c},
  \quad 0 < y < {c}.
\]

En conclusión, la densidad de \[Y\] es
\[
  f(y)
    = \frac{1}{\sqrt{c}\sqrt{y}} - \frac{1}{c},\quad 0 < y < {c}.
\]$$,

  'transformacion_y_cx2',

  '{
    "c": { "values": [2, 3, 4] }
  }'::jsonb,

  '{
    "mode":   "open_text",
    "format": "latex",
    "practice_format": "latex_text",

    "canonical": "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}},\\;0<y<{c}",

    "expected_template": "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}},\\;0<y<{c}",

    "accept": [
      "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}},0<y<{c}",

      "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}},\\;0<y<{c}",

      "f(y)=\\frac{1}{\\sqrt{{c}y}}-\\frac{1}{{c}},0<y<{c}",
      "f(y)=\\frac{1}{\\sqrt{{c}y}}-\\frac{1}{{c}},\\;0<y<{c}",

      "f(y)=\\frac{1-\\sqrt{y/{c}}}{\\sqrt{{c}y}},0<y<{c}",
      "f(y)=\\frac{1-\\sqrt{y/{c}}}{\\sqrt{{c}y}},\\;0<y<{c}",

      "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}}\\quad 0<y<{c}",
      "f(y)=\\frac{1}{\\sqrt{{c}y}}-\\frac{1}{{c}}\\quad 0<y<{c}",
      "f(y)=\\frac{1-\\sqrt{y/{c}}}{\\sqrt{{c}y}}\\quad 0<y<{c}"
    ],

    "caseSensitive": false,
    "trim": true,

    "latex": "f(y)=\\frac{1}{\\sqrt{{c}}\\sqrt{y}}-\\frac{1}{{c}},\\;0<y<{c}"
  }'::jsonb,
  'A', 1;



