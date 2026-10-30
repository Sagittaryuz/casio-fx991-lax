# Álgebra linear e polinômios

`src/linear.js` implementa operações numéricas independentes da interface, sem copiar firmware. As matrizes são arrays de linhas retangulares com 1 a 4 linhas e colunas; vetores são arrays de 2 ou 3 números. Entradas precisam ser finitas.

- `matrixAdd(a,b)`, `matrixSubtract(a,b)`, `matrixMultiply(a,b)`, `matrixScale(a,s)`, `matrixTranspose(a)`, `matrixIdentity(n)`, `determinant(a)`, `matrixInverse(a)`.
- `solveSystem(a,b)` resolve `a · x = b`, com matriz quadrada até 4×4 e vetor `b`. Sistemas singulares são recusados, sem classificar soluções inexistentes ou infinitas.
- `vectorAdd`, `vectorSubtract`, `vectorScale`, `vectorDot`, `vectorCross` (3D), `vectorNorm`, `vectorUnit` e `vectorAngle(a,b,'DEG'|'RAD')`.
- `polynomialRoots(coefficients)` aceita 3 a 5 coeficientes reais em ordem decrescente e retorna as raízes como `{re, im}`, incluindo raízes complexas. Usa método iterativo e acusa falta de convergência; não produz apresentação exata simbólica, nem classifica desigualdades. Raízes repetidas reais são reconhecidas numericamente; casos muito mal condicionados podem ser imprecisos ou não convergir.

A aritmética usa ponto flutuante de dupla precisão. Erros de dimensões, domínio ou singularidade geram exceções. Os testes em `tests/linear.test.mjs` verificam as entradas de matriz (p. 13–14) e vetores (p. 17) do [guia oficial fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf), além de testes independentes de sistemas, determinantes, inversão, quadráticas, cúbicas, quárticas e raízes repetidas. A existência da API não significa que todos os comandos estejam integrados no teclado.
