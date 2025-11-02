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
    "spread": 0.15,
    "correct_expr": " nCr(x_covid + x_omicron + x_n1h1, x_covid) * nCr(x_omicron + x_n1h1, x_omicron) * pow(p_covid, x_covid) * pow(p_omicron, x_omicron) * pow(p_n1h1, x_n1h1) "
  }'::jsonb,
  'A', 1;

-- P2: Combinatoria por grupos — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$En un ascensor exclusivo de una UCI ingresan {jovenes_tot} Jóvenes, {mayores_tot} Mayores y {ninos_tot} Niños.
    La probabilidad de que se contagien exactamente {x_jov} Jóvenes, {x_may} Mayores y 1 Niño es:$$,
  $$Modelo Bernoulli independiente por persona.
    P = C(J, x_jov) p_J^{x_jov} (1-p_J)^{J-x_jov}
        \cdot C(M, x_may) p_M^{x_may} (1-p_M)^{M-x_may}
        \cdot C(N, 1) p_N (1-p_N)^{N-1}.$$,
  'combinatoria_mixta',
  '{
    "jovenes_tot": { "values": [3,4,5] },
    "mayores_tot": { "values": [3,4,5] },
    "ninos_tot":   { "values": [1,2,3] },

    "x_jov":       { "min": 1, "max": 3 },
    "x_may":       { "min": 1, "max": 3 },

    "p_jov":       { "values": [0.15, 0.20, 0.25] },
    "p_may":       { "values": [0.20, 0.25, 0.30] },
    "p_nino":      { "values": [0.10, 0.15, 0.20] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 6,
    "spread": 0.15,
    "correct_expr": " nCr(jovenes_tot, x_jov) * pow(p_jov, x_jov) * pow(1-p_jov, jovenes_tot - x_jov) * nCr(mayores_tot, x_may) * pow(p_may, x_may) * pow(1-p_may, mayores_tot - x_may) * nCr(ninos_tot, 1) * p_nino * pow(1-p_nino, ninos_tot - 1) "
  }'::jsonb,
  'A', 1;

-- P3: Serie 3 de 4 (prob B campeón) — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C1' AND titulo = 'Primer Corte' LIMIT 1),
  $$Los equipos capitalinos de fútbol, Millos y Santafé, se enfrentan en un torneo donde el ganador es quien gane {gana} de {total} partidos entre ellos. Si Millos tiene el {pA|percent} de probabilidad de ganar cada partido, la probabilidad de que Santafé le gane el torneo es:$$,
  $$Para 3 de 4: P(B)= \binom{4}{3}(1-p_A)^3 p_A + \binom{4}{4}(1-p_A)^4.$$,
  'serie_mejor_4',
  '{
    "gana":  { "values": [3] },
    "total": { "values": [4] },
    "pA":    { "values": [0.50, 0.55, 0.60, 0.65] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 4,
    "spread": 0.15,
    "correct_expr": " nCr(4,3)*pow(1-pA,3)*pow(pA,1) + nCr(4,4)*pow(1-pA,4) "
  }'::jsonb,
  'A', 1;

-- P4: Poisson aprox (más de 1 en t min) — MCQ AUTO
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
    "num_options": 5,
    "format": "number",
    "decimals": 5,
    "spread": 0.12,
    "correct_expr": " 1 - exp(-(m*pmin*t)) * (1 + (m*pmin*t)) "
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

-- P2: Exponencial CDF — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$La vida de cierto dispositivo tiene una tasa de falla anunciada de {lambda} por hora. Si la tasa de falla es constante y se aplica la distribución exponencial entonces la probabilidad de que transcurran menos de {t} horas antes de que se observe una falla es$$,
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
    "spread": 0.12,
    "correct_expr": " 1 - exp(-lambda * t) "
  }'::jsonb,
  'A', 1;

-- P3: Weibull supervivencia — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$Suponga que la vida de servicio, en años, de la batería de un aparato para reducir la sordera es una variable aleatoria que tiene una distribución de Weibull con α = {alpha}, β = {beta}. Entonces, la probabilidad de que tal batería esté en operación después de {t} años es$$,
  $$S(t)=\exp(-(t/β)^{α}).$$,
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
    "spread": 0.15,
    "correct_expr": " exp(- pow(t/beta, alpha)) "
  }'::jsonb,
  'A', 1;

-- P4: Densidad conjunta (texto) — ABIERTA TEXTUAL MANUAL
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C2' AND titulo = 'Segundo Corte' LIMIT 1),
  $$Una máquina empaca cajas de un kilogramo de chocolates combinando los tipos Crema, Chicloso y Envinado. Las variables aleatorias X e Y representan los pesos de los tipos Crema y Chicloso, respectivamente, con función de densidad conjunta f(x,y) = {c}xy, si 0 ≤ x ≤ y, 0 ≤ y ≤ 1, x+y ≤ 1, e igual a 0 en otro caso. Si Z = X + Y es la variable aleatoria de la cantidad de pesos de los tipos Crema y Chiclosos, entonces, la función de densidad de probabilidad h(z) para 0 < z < 1 es igual a$$,
  $$Derivación por integración en 0≤x≤y, x+y≤1 (resultado simbólico).$$,
  'densidad_conjunta_choc',
  '{
    "c": { "values": [16, 24, 32] }
  }'::jsonb,
  '{
    "mode": "open_text",
    "expected_text": "h(z) = (c/12) z^3, 0<z<1",
    "accept": [
      "(c/12) z^3",
      "c*z^3/12",
      "c/12 * z^3"
    ],
    "regex": [
      ".*(c\\s*[/]?\\s*12).*z\\s*\\^\\s*3.*"
    ],
    "caseSensitive": false,
    "trim": true,
    "latex": "h(z)=\\frac{c}{12} z^{3},\\quad 0<z<1"
  }'::jsonb,
  'A', 1;

----------------------------------------------------------------
-- T E R C E R   C O R T E — P R I M E R   M O D E L O  (C3A)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C3A', 'Tercer Corte – Primer Modelo', TRUE, now());

-- P1: Normal – dentro de tolerancia — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Se fabrican esferas cuyos diámetros se distribuyen normalmente con media de {mu} cm y desviación estándar de {sigma} cm. Las especificaciones requieren que el diámetro esté dentro del intervalo {centro} ± {tol} cm. La proporción de esferas que probablemente cumplirán las especificaciones es (aprox. más cercana):$$,
  $$P(a\le X\le b)=\Phi((b-μ)/σ) - \Phi((a-μ)/σ),\; a=centro-tol,\; b=centro+tol.$$,
  'normal_intervalo',
  '{
    "mu":    { "values": [2.505] },
    "sigma": { "values": [0.003] },
    "centro":{ "values": [2.5] },
    "tol":   { "values": [0.01] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 4,
    "spread": 0.10,
    "correct_expr": " phi(( (centro+tol)-mu )/sigma) - phi(( (centro-tol)-mu )/sigma) "
  }'::jsonb,
  'A', 1;

-- P2: Hipergeométrica – (media, varianza) — MCQ AUTO PAIR
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Se sabe que un lote de 7 componentes tiene {K} buenos y {D} defectuosos. Un inspector prueba 3 componentes. Para la variable aleatoria que cuenta el número de componentes buenos la media y la varianza son (aprox. más cercana):$$,
  $$E[X]=n·K/N,\; Var[X]=n(K/N)(1-K/N)\frac{N-n}{N-1}.$$,
  'hipergeom_media_var',
  '{
    "N": { "values": [7] },
    "K": { "values": [3,4,5] },
    "D": { "values": [4,3,2] },
    "n": { "values": [3] }
  }'::jsonb,
  '{
    "mode": "mcq_auto_pair",

    "left_expr":  " n * K / N ",
    "right_expr": " n * (K / N) * (1 - K / N) * ((N - n) / (N - 1)) ",

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

-- P3: Valor esperado comisiones — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$En un dia un agente vendedor tiene dos citas independientes para cerrar dos negocios. Con el primer cliente la probabilidad exitosa es del 30% y se ganaría $1 millón por comisión, y con el segundo cliente tiene una probabilidad exitosa del 50% y ganaría $1.5 millones por comisión. El valor esperado de ganancia por las comisiones con sus dos clientes en ese día (aprox. más cercana) es:$$,
  $$E = 0.30·1\,000\,000 + 0.50·1\,500\,000.$$,
  'esperanza_lineal',
  '{
    "p1": { "values": [0.30] },
    "c1": { "values": [1000000] },
    "p2": { "values": [0.50] },
    "c2": { "values": [1500000] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "integer",
    "decimals": 0,
    "spread": 0.15,
    "correct_expr": " p1*c1 + p2*c2 "
  }'::jsonb,
  'A', 1;

-- P4: Máximo utilidad — ABIERTA NUMÉRICA AUTO
-- U(μ)=30μ-5μ^2 -> μ*=3 -> Umax = 45
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Sea μ el tiempo promedio en horas de servicio que presta un Dron antes de tener una falla, y $5μ^2 su costo total. El ingreso por T horas de servicio es $30T, entonces la Utilidad Esperada Máxima del Dron es $____ (Complete sobre el espacio)$$,
  $$U(μ)=30μ-5μ^2 \\Rightarrow μ^*=3,\\; U_{max}=45.$$ ,
  'max_utilidad_cuad',
  '{}'::jsonb,
  '{
    "mode": "open_numeric",
    "expected_expr": "45",
    "toleranceAbs": 0.001,
    "tolerancePct": 0.0,
    "format": "number",
    "decimals": 2,
    "latex": "U_{\\max}=45"
  }'::jsonb,
  'A', 1;

-- P5: Transformación Y=2X^3 — ABIERTA TEXTUAL MANUAL
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3A' AND titulo = 'Tercer Corte – Primer Modelo' LIMIT 1),
  $$Dada la variable aleatoria continua X con la función de distribución de probabilidad f(x) = 2x, cuando 0 < x < 1, y 0 en otro caso, entonces la distribución de probabilidad de Y = 2X^3 es ____ (complete sobre el espacio).$$,
  $$Y=2X^3 \\Rightarrow y\\in(0,2),\\; f_Y(y)=f_X(\\sqrt[3]{y/2})\\frac{1}{3( y/2 )^{2/3}}.$$,
  'transformacion_y_2x3',
  '{}'::jsonb,
  '{
    "mode": "open_text",
    "expected_text": "f_Y(y) = 2^{1/3} / (3 y^{1/3}), 0<y<2",
    "accept": [
      "2^(1/3)/(3*y^(1/3))",
      "(2**(1/3))/(3*y**(1/3))",
      "(1/3)*(2/y)^(1/3)"
    ],
    "regex": [
      ".*2\\s*\\^\\s*\\(?1\\/?3\\)?\\s*\\/?\\s*\\(?3\\s*\\*\\s*y\\s*\\^\\s*\\(?1\\/?3\\)?\\)?.*",
      ".*\\(1\\s*\\/\\s*3\\)\\s*\\*\\s*\\(?2\\s*\\/\\s*y\\)?\\s*\\^\\s*\\(?1\\/?3\\)?.*"
    ],
    "caseSensitive": false,
    "trim": true,
    "latex": "f_Y(y)=\\frac{2^{1/3}}{3\\,y^{1/3}},\\quad 0<y<2"
  }'::jsonb,
  'A', 1;

----------------------------------------------------------------
-- T E R C E R   C O R T E — S E G U N D O   M O D E L O  (C3B)
----------------------------------------------------------------
INSERT INTO quices (corte, titulo, es_activo, creado_en)
VALUES ('C3B', 'Tercer Corte – Segundo Modelo', TRUE, now());

-- P1: Normal intervalo — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Los tiempos de vida de cierto tipo de bacterias solares se distribuyen normalmente con media de {mu} horas y desviación estándar de {sigma} horas. La probabilidad de que una de ellas, elegida al azar, dure entre {a} y {b} horas es (aprox. más cercana):$$,
  $$\Phi((b-μ)/σ) - \Phi((a-μ)/σ).$$,
  'normal_intervalo',
  '{
    "mu":    { "values": [50] },
    "sigma": { "values": [5] },
    "a":     { "values": [42] },
    "b":     { "values": [52] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "number",
    "decimals": 4,
    "spread": 0.12,
    "correct_expr": " phi((b-mu)/sigma) - phi((a-mu)/sigma) "
  }'::jsonb,
  'A', 1;

-- P2: Discreta {0,1,2} – (media, varianza) — MCQ AUTO PAIR
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Un dispositivo tiene dos resistores, cada uno puede tener resistencia entre 99 y 101 ohmios. En un circuito integrado las probabilidades de que cumplan las especificaciones de rango son: 36% para ambos, 48% para uno solo, y 16% para ninguno. La media y la varianza de la variable aleatoria que indica la cantidad de resistores con las especificaciones requeridas son (aprox. más cercana):$$,
  $$E[X]=0·0.16+1·0.48+2·0.36=1.2,\; Var[X]=1.92-1.44=0.48.$$,
  'discreta_0_1_2',
  '{}'::jsonb,
  '{
    "mode": "mcq_auto_pair",

    "left_expr":  " 0*0.16 + 1*0.48 + 2*0.36 ",
    "right_expr": " (0^2*0.16 + 1^2*0.48 + 2^2*0.36) - ( (0*0.16 + 1*0.48 + 2*0.36)^2 ) ",

    "left_format":  "number",
    "left_decimals": 2,
    "right_format": "number",
    "right_decimals": 2,
    "sep": " , ",

    "num_options": 5,
    "spread_left":  0.08,
    "spread_right": 0.08
  }'::jsonb,
  'A', 1;

-- P3: Valor esperado comisiones — MCQ AUTO
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$En un día un agente vendedor tiene dos citas independientes para cerrar dos negocios. Con el primer cliente la probabilidad exitosa es del 70% y se ganaría $1 millón por comisión, y con el segundo cliente tiene una probabilidad exitosa del 40% y ganaría $1.5 millones por comisión. El valor esperado de ganancia por las comisiones con sus dos clientes en ese día (aprox. más cercana) es:$$,
  $$E=0.70·1\,000\,000 + 0.40·1\,500\,000 = 1\,300\,000.$$ ,
  'esperanza_lineal',
  '{
    "p1": { "values": [0.70] },
    "c1": { "values": [1000000] },
    "p2": { "values": [0.40] },
    "c2": { "values": [1500000] }
  }'::jsonb,
  '{
    "mode": "mcq_auto",
    "num_options": 5,
    "format": "integer",
    "decimals": 0,
    "spread": 0.15,
    "correct_expr": " p1*c1 + p2*c2 "
  }'::jsonb,
  'A', 1;

-- P4: Máximo utilidad — ABIERTA NUMÉRICA AUTO
-- U(μ)=18μ-3μ^2 -> μ*=3 -> Umax = 27
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Sea μ el tiempo promedio en horas de servicio que presta un Dron antes de tener una falla, y $3μ^2 su costo total. El ingreso por T horas de servicio es $18T, entonces la Utilidad Esperada Máxima del Dron es $____ (Complete sobre el espacio).$$,
  $$U(μ)=18μ-3μ^2 \\Rightarrow μ^*=3,\\; U_{max}=27.$$,
  'max_utilidad_cuad',
  '{}'::jsonb,
  '{
    "mode": "open_numeric",
    "expected_expr": "27",
    "toleranceAbs": 0.001,
    "tolerancePct": 0.0,
    "format": "number",
    "decimals": 2,
    "latex": "U_{\\max}=27"
  }'::jsonb,
  'A', 1;

-- P5: Transformación Y=2X^2 — ABIERTA TEXTUAL MANUAL
INSERT INTO question_templates
(quiz_id, stem_md, explanation_md, family, param_schema, option_schema, correct_key, version)
SELECT
  (SELECT id FROM quices WHERE corte = 'C3B' AND titulo = 'Tercer Corte – Segundo Modelo' LIMIT 1),
  $$Dada la variable aleatoria continua X con la función de distribución de probabilidad f(x) = 2(1-x), cuando 0 < x < 1, y 0 en otro caso, entonces la distribución de probabilidad de Y = 2X^2 es ____ (complete sobre el espacio).$$,
  $$Y=2X^2,\\; y\\in(0,2).\\; f_Y(y)=f_X(\\sqrt{y/2})\\frac{1}{4\\sqrt{y/2}}.$$,
  'transformacion_y_2x2',
  '{}'::jsonb,
  '{
    "mode": "open_text",
    "expected_text": "f_Y(y) = 0.5*(sqrt(2/y) - 1), 0<y<2",
    "accept": [
      "0.5*(sqrt(2/y)-1)",
      "1/2*(sqrt(2/y)-1)"
    ],
    "regex": [
      ".*(1\\/?2|0\\.5)\\s*\\*\\s*\\(\\s*sqrt\\(\\s*2\\s*\\/\\s*y\\s*\\)\\s*-\\s*1\\s*\\).*"
    ],
    "caseSensitive": false,
    "trim": true,
    "latex": "f_Y(y)=\\tfrac{1}{2}\\big(\\sqrt{2/y}-1\\big),\\quad 0<y<2"
  }'::jsonb,
  'A', 1;
