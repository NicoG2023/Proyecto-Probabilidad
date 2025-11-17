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
  $$Multinomial (3 categorías): \binom{n}{x_1}\binom{n-x_1}{x_2} p_1^{x_1}p_2^{x_2}p_3^{x_3},\; n=x_1+x_2+x_3.$$,
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
  $$Modelo Bernoulli independiente por persona:
P = C(J, x_jov)\, p_J^{x_jov} (1-p_J)^{J-x_jov}
    \cdot C(M, x_may)\, p_M^{x_may} (1-p_M)^{M-x_may}
    \cdot C(N, x_nino)\, p_N^{x_nino} (1-p_N)^{N-x_nino}.$$,
  'combinatoria_mixta',
  '{
    "jovenes_tot": { "values": [3,4,5] },
    "mayores_tot": { "values": [3,4,5] },

    "ninos_tot":   { "values": [2,3,4] },

    "x_jov":       { "min": 1, "max": 3 },
    "x_may":       { "min": 1, "max": 3 },

    "x_nino":      { "min": 1, "max": 2 },

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
      " 4.0/35.0 ",
      " 22.0/1803 ",
      " 4.0/35.0 ",
      " 8.0/27.0 ",
      " 24.0/35.0 ",
      " 56.0/11.0 ",
      " 33.0/20.0 ",
      " 25.0/1652.0 ",
      " 27.0/1133.0 "
    ]
  }'::jsonb,
  'A', 1;



-- P3: Serie 3 de 4 — MCQ AUTO + fracciones
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$Los equipos capitalinos de fútbol, Millos y Santafé, se enfrentan en un torneo donde el ganador es quien gane {gana} de {total} partidos entre ellos. Si Millos tiene el {pA|percent} de probabilidad de ganar cada partido, la probabilidad de que Santafé le gane el torneo es:$$,
  $$\text{Para } 3 \text{ de } 4:\quad
    P(B)= \binom{4}{3}(1-p_A)^3 p_A + \binom{4}{4}(1-p_A)^4.$$,
  'serie_mejor_4',
  '{
    "gana":  { "values": [3] },
    "total": { "values": [4] },
    "pA":    { "values": [0.50, 0.55, 0.60, 0.65] }
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
  $$Poisson con \lambda=m\cdot p \cdot t,\; P(N>1)=1-e^{-\lambda}(1+\lambda).$$,
  'poisson_aprox',
  '{
    "m":    { "values": [8000, 10000, 12000] },
    "pmin": { "values": [0.00015, 0.0002, 0.00025] },
    "t":    { "values": [2,3] }
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


