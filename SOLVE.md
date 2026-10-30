# CALC e SOLVE: motor numérico

`src/solve.js` fornece `expressionVariables(expressão)`, `calculate(expressão, variáveis, opções)` e `solve(expressão, variável, estimativa, variáveis, opções)`. As variáveis reconhecidas são `A`–`F`, `x`, `y` e `M`, com nomes sensíveis a maiúsculas e valores reais finitos. CALC devolve a expressão avaliada ou, para uma igualdade, a diferença entre seus lados. SOLVE devolve raiz, resíduo `L − R` e número de iterações; a interface é responsável por solicitar os valores, cancelar sem alterar o estado e decidir como exibi-los.

SOLVE usa Newton com derivadas por diferenças finitas, redução do passo e até 80 iterações. Ele procura uma raiz real próxima da estimativa; pode deixar de encontrar uma solução existente com ponto inicial inadequado, derivada nula, domínio restrito ou função mal condicionada. A verificação do resíduo e do tamanho do passo não garante detecção de todas as descontinuidades, raízes espúrias ou perdas de precisão. É uma implementação própria em ponto flutuante, sem alegação de paridade com o algoritmo físico.

`node --test tests/solve.test.mjs` cobre substituição de variáveis, erros e dois exemplos do [guia oficial fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf), página 5: resolver `x² + Ax + B = 0` a partir de −5 com A=5 e B=6, e resolver A com x=1 e B=4.
