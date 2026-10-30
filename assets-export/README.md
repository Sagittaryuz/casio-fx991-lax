# Componentes visuais exportáveis

Nove peças independentes inspiradas nas duas fotos da fx-991EX e na capa do guia oficial da fx-991LA X. São reconstruções para revisão visual, não recortes de uma fotografia nem medidas físicas calibradas. O aplicativo atualmente desenha os seus controles em HTML/CSS; estas imagens são exportações complementares, não substituem os botões funcionais.

Cada peça está em SVG e PNG com fundo transparente. Os PNGs foram rasterizados no Chromium a 2× da dimensão do SVG. O visor e as teclas estão sem texto para permitir que valores e legendas continuem dinâmicos no aplicativo.

| Peça | PNG (pixels) | Conteúdo |
|---|---:|---|
| 01-moldura | 2400 × 5140 | Aro prateado com centro transparente |
| 02-placa | 2280 × 4940 | Painel grafite com textura |
| 03-visor | 2400 × 980 | Aro e vidro LCD com matriz discreta |
| 04-painel-solar | 1400 × 460 | Painel escuro segmentado |
| 05-tecla-clara | 1000 × 560 | Tecla numérica clara |
| 06-tecla-azul | 1000 × 560 | Tecla azul DEL/AC |
| 07-tecla-escura | 1000 × 560 | Tecla científica escura |
| 08-tecla-metalica | 700 × 700 | Tecla circular metálica |
| 09-direcional | 1400 × 980 | Comando com quatro segmentos e setas |

Os SVGs são escaláveis; a placa incorpora a textura raster original gerada para o projeto em WebP. As demais formas, cores e brilhos são vetoriais. As representações de material e as proporções aproximam o projeto atual e ainda exigem comparação e eventual ajuste com o aparelho real. `gerar-svg.py` produz os SVGs usando `public/face-texture.webp`; a rasterização foi feita em Chromium com fundo transparente.
