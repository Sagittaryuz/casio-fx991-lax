# Estatística e distribuições

`src/statistics.js` é um módulo independente em ponto flutuante IEEE-754. `node --test tests/statistics.test.mjs` valida seus resultados, inclusive os exemplos da lista de alturas (p. 20), dos quatro pares (p. 24), dos seis lançamentos de dado (p. 25–26) e do percentil de altura (p. 27) no [guia oficial fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf). Não significa que todos os fluxos do aparelho ou todos os modos estejam implementados.

## Estatística

- `oneVariable([x, ...])` aceita números ou `[valor, frequência]`. Retorna `n`, `sum`, `sumSquares`, `mean`, `populationSD`, `sampleSD`, `min`, `q1`, `median`, `q3` e `max`. A frequência é inteira não negativa; o quartil é a mediana das metades ordenadas, excluindo a mediana quando n é ímpar. Para n=1, desvio amostral e quartis são `NaN`.
- `twoVariable([[x,y], ...])` aceita opcionalmente `[x,y,frequência]` e retorna somas, média e desvio populacional de cada variável.
- `regression(pares, modelo)` aceita `linear` (y=a+bx), `quadratic` (y=a+bx+cx²), `logarithmic` (y=a+b ln x), `exponential` (y=a·e^(bx)), `power` (y=a·x^b) e `inverse` (y=a+b/x). Retorna coeficientes e `predict(x)`; `r` é fornecido nos modelos transformados não quadráticos. Domínios inválidos ou sistemas singulares geram `Math ERROR`.

## Distribuição

- `normalPDF(x, media, desvio)`, `normalCDF(x, media, desvio)`, `normalInterval(inferior, superior, media, desvio)` e `inverseNormal(probabilidade, media, desvio)`; média e desvio têm padrão 0 e 1. A CDF usa aproximação cuja margem absoluta é da ordem de 8×10⁻⁸; a inversa usa aproximação de Acklam. Probabilidades extremas podem sofrer cancelamento numérico.
- `binomialPDF(x,n,p)` e `binomialCDF(x,n,p)`; `poissonPDF(x,lambda)` e `poissonCDF(x,lambda)`. A CDF soma de zero até x. O limite de parâmetros inteiros é 10.000; frequências, probabilidades e parâmetros inválidos geram `Math ERROR`.

Estes cálculos são APIs matemáticas, não firmware Casio. Disponibilidade pela interface deve ser verificada separadamente. Não há promessa de equivalência integral ou precisão arbitrária.
