# Desempenho e textura

Medição local com Chromium headless, Vite de desenvolvimento em localhost, 1200×900 CPU normal e 393×852 com CPU 4× mais lenta pelo CDP. Não é teste em iPhone físico nem INP de usuários reais. `qa/performance-browser.mjs` executa 35 teclas, 15 cálculos 7+8, 15 aberturas de menu e 10 rajadas sintéticas de 30 cliques. Tempo é do clique programático até dois requestAnimationFrame (aproximação conservadora de apresentação, não latência de toque real nem confirmação do compositor). Amostras pequenas, suscetíveis à carga da máquina; p95 da rajada é o pior de 10. O comparativo usa a revisão 51517f8 anterior e este código, com mesmas dimensões e throttling; a nova textura integra o resultado posterior.

| Medida (ms; mediana / p95) | Desktop antes | Desktop depois | Mobile 4× antes | Mobile 4× depois |
|---|---:|---:|---:|---:|
| Tecla | 33,3 / 190,9 | 33,3 / 37,1 | 33,6 / 39,8 | 33,5 / 46,7 |
| Cálculo | 33,3 / 34,6 | 33,4 / 47,3 | 34,2 / 135,6 | 33,6 / 67,5 |
| Menu | 33,4 / 36,1 | 33,8 / 102,5 | 42,7 / 151,8 | 50,2 / 99,6 |
| Rajada de 30 | 73,1 / 184,8 | 33,4 / 50,1 | 218,0 / 278,9 | 34,6 / 54,6 |

A rajada aciona todos os cliques na mesma tarefa para estressar a atualização do visor; não equivale ao ritmo físico de digitação. Os registros de mutação do visor nessa rajada caíram de mediana 1.860 para 62. Entrada de 30 dígitos foi conferida sem perda ou duplicação. Na simulação móvel, as tarefas longas observadas incluíram várias rajadas de 173–262 ms antes; depois houve 302 ms no carregamento e outras de 52–84 ms. A contagem total de tarefas longas depende do tempo de início e da carga do host, não é uma garantia de desempenho.

Causa identificada: foco, seleção, clique e teclado agendavam várias microtarefas que reconstruíam o visor matemático e consultavam geometria mesmo sem alteração de texto/cursor. Agora atualizações pendentes são agrupadas e a visualização idêntica não é reconstruída. O cálculo e a representação dos números permanecem inalterados; operações numéricas pesadas continuam síncronas. Não houve benefício consistente demonstrado para todas as métricas de tecla/menu.

A imagem fornecida foi preservada em `references/texture-source.jpeg` (434.408 bytes, 777×1536); o recorte interior foi reduzido para 342×702 e convertido em `public/texture-user.webp` (66.228 bytes), servido como fundo estático. A textura anterior tinha 605.158 bytes; o novo arquivo utilizado é 89% menor. A fonte VT323 e o JavaScript continuam no bundle inicial; a textura antiga fica no repositório para os geradores históricos e não é o fundo aplicado. Build Vite minificado: JS 151.570 bytes (48,02 kB gzip), CSS 33.220 bytes (7,61 kB gzip). Os tempos de carregamento locais com Vite de desenvolvimento variaram e não estabelecem melhora confiável de carregamento em rede real.

Referências: [web.dev, otimizar atraso de entrada](https://web.dev/articles/optimize-input-delay); [Chrome Developers, orientação de desempenho](https://developer.chrome.com/docs/modern-web-guidance/guides/performance/performance). Evitamos atrasar ou descartar eventos de tecla e não aplicamos otimizações globais de `will-change`.
