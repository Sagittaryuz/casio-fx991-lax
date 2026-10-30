# Operações científicas auxiliares

`src/scientific.js` implementa operações numéricas independentes da interface. Não utiliza firmware proprietário e não garante equivalência com os limites internos da fx-991LA X.

- `toDMS(decimal)` retorna sinal, graus, minutos e segundos; `fromDMS(graus,minutos,segundos,negativo)` faz a conversão inversa. Componentes devem ser não negativos, minutos e segundos menores que 60; segundos são arredondados a nove casas decimais.
- `primeFactors(n)` retorna fatores e expoentes para inteiros entre 2 e 9.999.999.999. O limite é desta implementação; a comparação completa com a máquina física permanece pendente.
- `engineering(valor, deslocamento)` retorna mantissa e expoente múltiplo de três. O deslocamento inteiro em unidades de três permite avançar ou retroceder. Resultados usam 10 algarismos significativos; expoentes fora do intervalo suportado pela dupla precisão geram erro.
- `polar(x,y,unidade)` e `rectangular(r,ângulo,unidade)` aceitam `DEG`, `RAD` e `GRAD`; raio negativo é rejeitado. Precisão segue `Math`/ponto flutuante JavaScript.
- `roundToDisplay(valor,formato,dígitos)` aceita `FIX` com 0–9 casas e `SCI`/`NORM` com 1–10 algarismos significativos. Usa arredondamento de JavaScript sobre a representação binária, que pode diferir de uma máquina decimal em empates.
- `logBase(base,valor)` exige base positiva diferente de 1 e valor positivo. `nthRoot(índice,valor)` rejeita índice zero, raiz par ou não inteira de radicando negativo e zero elevado a índice negativo; índice inteiro ímpar permite raiz real negativa.

Entradas inválidas geram `Math ERROR`. `node --test tests/scientific.test.mjs` testa valores numéricos, limites, modos angulares e erros de domínio. Exemplos do [guia oficial da fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf), página 4, incluem logaritmo de base 1/2 de 16 e raiz de índice 5 de 64. Os testes verificam os resultados numéricos, não a sequência nem apresentação física das teclas.
