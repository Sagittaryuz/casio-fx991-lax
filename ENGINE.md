# Motor científico: cobertura e limites

`src/engine.js` avalia expressões reais sem executar código arbitrário. A API é `evaluate(expressão, {angle, ans, memory})` e `formatResult(número)`. `angle` é `DEG` (padrão) ou `RAD`. Erros de sintaxe e domínio são lançados como `Syntax ERROR` e `Math ERROR`.

O motor reconhece aritmética com precedência, potência, parênteses, multiplicação implícita, porcentagem, fatorial inteiro, constantes π/e, Ans/M, trigonometria e inversas, funções hiperbólicas e inversas, raiz quadrada e cúbica, logaritmos decimal/natural e de base arbitrária, exponenciais, valor absoluto, arranjos e combinações. Use `logbase(base, valor)`, `npr(n,r)` e `ncr(n,r)` para as funções de dois argumentos. Cada função exige parênteses completos. Arranjos, combinações e fatorial exigem inteiros válidos e limitam n a 170; a precisão é a de ponto flutuante JavaScript.

Os resultados são números reais em dupla precisão, apresentados com até dez algarismos significativos. A divisão representa frações numericamente; graus centesimais não estão implementados neste avaliador. O módulo exact.js cobre um subconjunto de frações e radicais exatos; módulos separados oferecem complexos, matrizes, vetores, estatística, tabelas, equações e Base-N. Cobertura do motor não implica disponibilidade de cada função pela interface. Não se afirma compatibilidade integral com a calculadora física.

`node --test tests/engine.test.mjs` testa precedência, ângulos, logaritmos, fatoriais, memória, erros, funções hiperbólicas e combinatórias. Inclui a conversão de 40 onças fluidas por 29,5735 do [guia oficial fx-991LA X, página 29](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf). Os demais casos são testes numéricos independentes, não uma validação completa contra o aparelho ou manual.

## Aritmética exata e edição

`exactResult(expressão)` em `src/exact.js` apresenta racionais e somas de radicais quadráticos simplificados, inclusive produtos, potências inteiras e divisão por um único termo radical. Os exemplos `√24 = 2√6` e `√24 + √150 = 7√6` são do guia oficial, páginas 3–4. O avaliador numérico deve ser executado antes para verificar domínio. A função exata retorna `null` para expressões fora desse subconjunto, incluindo funções trigonométricas, π, raízes aninhadas não racionais, denominadores com soma de radicais, potências fracionárias e argumentos muito grandes; nesse caso, apresentar a aproximação numérica. Não se trata de álgebra simbólica completa nem da apresentação natural em duas dimensões do aparelho.

`CalculatorEditor` em `src/editor.js` mantém texto, cursor, modificadores Shift/Alpha e variáveis A–F, x, y e M com restauração de snapshot. `evaluate` aceita essas variáveis via `options.variables` com maiúsculas/minúsculas distintas; a constante `e` permanece separada da variável `E`. A interface oferece Alpha, STO e memória em sessão; os registros não persistem após recarregar.

## Cálculo numérico

`src/calculus.js` exporta `derivative(expressão, x, opções)`, `integral(expressão, limiteInferior, limiteSuperior, opções)` e `summation(expressão, inícioInteiro, fimInteiro, opções)`. A variável de cálculo é `x`; opções de ângulo, Ans e memória são as mesmas de `evaluate`. Derivada usa diferenças centrais, integral usa Simpson adaptativo em intervalo finito e soma aceita até 100 mil termos. Erros de domínio, falta de convergência ou limites de trabalho lançam `Math ERROR`. Descontinuidades, singularidades e funções oscilatórias podem produzir estimativas incorretas sem detecção; não há garantia de erro nem equivalência com o algoritmo físico. Essas operações estão disponíveis no menu por entrada de argumentos.

`node --test tests/calculus.test.mjs` verifica os três exemplos da página 5 do guia oficial: Σ(x²+1), de −3 a 7 = 165; derivada de 4x²−5x em 0,2 = −17/5; integral de 1/x de 2 a 5 ≈ 0,9162907319. Também testa limites invertidos, trigonometria em radianos e erros de domínio.
