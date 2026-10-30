# Matriz de paridade — fx-991LA X

Esta matriz é um inventário **verificável, não uma certificação de equivalência**. Referência: [guia oficial Casio fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf), capa e páginas 2–48. As fotos fornecidas são da fx-991EX; a capa do guia identifica a LA X e usa vírgula decimal. Este levantamento descreve o código local em evolução, incluindo o painel restrito ao visor, as novas funções científicas e a persistência da planilha e das configurações. A publicação, os testes e os commits correspondentes devem ser conferidos no relatório da versão; não se assume que código em andamento esteja publicado.

**Legenda:** `P` = parcialmente implementado: existe comportamento útil, mas não comprovado ou sem a interface/comportamento completo do aparelho; `A` = ausente ou explicitamente “NÃO DISPONÍVEL”; `—` = nenhuma função Alpha ou Shift identificada/implementada para esta tecla no código. Mesmo `P` não implica validação no aparelho físico. A coluna Alpha indica o que o aplicativo implementa, não é garantia de que toda a serigrafia regional da LA X foi identificada. As fontes de verdade de comportamento são `src/main.js` (`keys`, `alphaKeys`, `press`) e `src/modes-ui.js`, não os rótulos impressos.

## Inventário físico: corpo e teclas de controle

| Tecla | Principal no app | Shift no app | Alpha no app / lacuna |
|---|---|---|---|
| SHIFT | P — modifica a próxima ação; indicação S. | — | — |
| ALPHA | P — modifica a próxima ação; indicação A. | — | — |
| ◀ | P — move cursor no campo de expressão. | — | — |
| ▶ | P — move cursor no campo de expressão. | — | — |
| ▲ | P — move para numerador de fração `(...) / (...)`, inclusive grupos aninhados reconhecidos; fora desse padrão, não faz nada. Sem histórico de cálculos. | — | — |
| ▼ | P — move para denominador de fração `(...) / (...)`, inclusive grupos aninhados reconhecidos; fora desse padrão, não faz nada. Sem histórico de cálculos. | — | — |
| MENU | P — abre painel restrito ao visor, mantendo as teclas acessíveis; modos são selecionados em lista e usam formulários, não menu de ícones nem navegação idêntica à do aparelho. | P — SETUP com DEG/RAD/GRAD e FIX/SCI/NORM persistentes; não cobre todos os ajustes físicos. | — |
| ON | P — reexibe visor desligado; não reproduz ciclo de energia físico. | — | — |

## Teclas científicas

| Tecla no corpo | Principal no app | Shift no app | Alpha no app / lacuna |
|---|---|---|---|
| OPTN | A — informa indisponível; falta menu contextual de opções. | A — QR indisponível. | — |
| CALC | P — CALC pede valores para variáveis em formulário, calcula e permite aplicar ou cancelar. | P — SOLVE usa estimativa inicial e exibe raiz e resíduo; Newton numérico pode não convergir ou detectar descontinuidades. | — |
| ∫ | P — abre formulário de integral definida numérica no visor. | P — abre formulário de derivada numérica no visor; aproximações podem falhar em descontinuidades. | — |
| x | P — insere `x`. | P — abre formulário de somatório numérico no visor. | — |
| Fração | P — insere `()/()` com cursor inicial no numerador, apresenta fração empilhada e permite deslocar entre campos reconhecidos, inclusive aninhados, com ▲/▼; `exactResult` resolve subconjunto racional. Toque escolhe a fronteira visual mais próxima e arrasto seleciona; falta editor estrutural completo e validação em aparelho físico. | A — número misto não implementado. | — |
| √ | P — insere `sqrt(` e apresenta radical para entradas reconhecidas, inclusive parêntese aberto; alguns radicais quadráticos são exatos. | P — insere `cbrt(`; precisão/apresentação não equivalentes comprovadas. | — |
| x² | P — insere `^2`. | P — insere `^3`. | — |
| xʸ | P — insere `^`; apresentação visual em sobrescrito quando há operandos reconhecidos. Não há editor estrutural geral de expoente. | P — insere template `nthroot(índice;valor)`; domínio real verificado. | — |
| log | P — `log(`, base 10. | P — `10^`. | — |
| ln | P — `ln(`. | P — `e^`. | — |
| (−) | P — insere sinal `-`; não distingue uma tecla negativa física nem todas as precedências físicas. | P — insere template `logbase(base;valor)`; exige base positiva diferente de 1 e valor positivo. | P — `A`, variável em sessão. |
| ° ′ ″ | P — converte decimal para graus/minutos/segundos e de volta; entrada por componentes quando vazia. | P — fatoração prima de inteiros de 2 a 9.999.999.999. | P — `B`, variável em sessão. |
| x⁻¹ | P — insere `^(-1)`. | P — insere fatorial `!`; inteiro não negativo até 170 no motor. | P — `C`, variável em sessão. |
| sin | P — seno DEG/RAD/GRAD. | P — inversa `asin` DEG/RAD/GRAD; entrada linear. | P — `D`, variável em sessão. |
| cos | P — cosseno DEG/RAD/GRAD. | P — inversa `acos` DEG/RAD/GRAD; entrada linear. | P — `E`, variável em sessão. |
| tan | P — tangente DEG/RAD/GRAD, rejeita proximidade de singularidade. | P — inversa `atan` DEG/RAD/GRAD; entrada linear. | P — `F`, variável em sessão. |
| STO | P — armazena `Ans` na variável selecionada; não reproduz todos os fluxos do aparelho. | P — RECALL insere valor de variável; em sessão. | — |
| ENG | P — mostra notação de engenharia e avança o expoente em múltiplos de 3. | P — desloca expoente na direção inversa. | — |
| ( | P — abre parêntese; fecha automaticamente parênteses pendentes no cálculo. | P — insere `abs(`. | — |
| ) | P — fecha parêntese. | — | P — `x`, variável em sessão. |
| S⇔D | P — alterna exato/decimal somente se `exactResult` suportar expressão. | A — conversão mista/imprópria indisponível. | P — `y`, variável em sessão. |
| M+ | P — soma `Ans` à variável M. | P — subtrai `Ans` de M. | P — insere `M`; conteúdo de memória não persiste ao recarregar neste checkpoint. |

## Teclas numéricas e operadoras

| Tecla | Principal no app | Shift no app | Alpha no app / lacuna |
|---|---|---|---|
| 7 | P — dígito. | A — CONST: catálogo de constantes físicas não disponível. | — |
| 8 | P — dígito. | A — CONV: catálogo de conversões de unidade não disponível. | — |
| 9 | P — dígito. | P — abre RESET/SETUP; apagar todos os dados exige confirmação explícita. | — |
| DEL | P — apaga seleção ou caractere anterior. | P — mostra “INSERÇÃO ATIVA”; a edição sempre insere, sem alternância de modo comprovada. UNDO não existe. | — |
| AC | P — limpa entrada e resultado. | P — OFF oculta o visor até ON; não é desligamento físico. | — |
| 4 | P — dígito. | — | — |
| 5 | P — dígito. | — | — |
| 6 | P — dígito. | — | — |
| × | P — multiplicação. | P — insere `npr(primeiro;segundo)`, usando o texto anterior; não é template natural. | — |
| ÷ | P — divisão numérica e, quando suportado, resultado racional exato. | P — insere `ncr(primeiro;segundo)`, usando o texto anterior; não é template natural. | — |
| 1 | P — dígito. | — | — |
| 2 | P — dígito. | — | — |
| 3 | P — dígito. | — | — |
| + | P — adição. | P — abre formulário Pol retangular→polar; apresenta dois resultados. | — |
| − | P — subtração. | P — abre formulário Rec polar→retangular; apresenta dois resultados. | — |
| 0 | P — dígito. | P — arredonda o resultado ao formato atual; representação binária pode diferir do aparelho. | — |
| , | P — separador decimal na entrada. | P — Ran# insere valor de `Math.random`; distribuição e apresentação física não verificadas. | — |
| ×10ˣ | P — insere `*10^`; a apresentação natural mostra expoente quando encontra operandos reconhecidos, mas não há editor estrutural geral. | P — insere π; saídas exatas envolvendo π não são completas. | P — insere constante `e`, não registrador gravável. |
| Ans | P — insere resultado numérico anterior. | P — `%` (divisão por 100 no motor); sem confirmação de todos os contextos do aparelho. | — |
| = | P — avalia e exibe resultado, usando exato onde suportado; arredondamento de 10 dígitos significativos no decimal. | P — se houver resultado concluído, mostra aproximação decimal; outros contextos não reproduzidos. | — |

Nas teclas sem entrada Alpha mapeada, o app não oferece um segundo comando Alpha correspondente; o código atual pode processar a ação principal após consumir o modificador. A listagem não pretende afirmar que a LA X física não tenha outras legendas regionais.

## Os 12 modos do guia oficial

O guia lista os 12 modos na página 2. Todos abaixo são **parciais**: a navegação usa painel contido no visor com formulários/tabelas próprios e teclas do corpo, não o menu de ícones e a edição em duas dimensões da máquina. O painel é rolável e seus formulários podem exigir rolagem em tela pequena; os dados dos modos ficam em sessão ao voltar/reabrir, com persistência adicional somente na planilha. Operações numéricas em dupla precisão não demonstram precisão nem comportamento idêntico ao aparelho.

| Modo | O que está acessível no aplicativo | Lacunas específicas / verificação |
|---|---|---|
| Calcular | Aritmética, parênteses, trigonometria DEG/RAD/GRAD, logs naturais/decimais, valor absoluto, fatorial, combinatória, subconjunto de frações/radicais; formulário numérico para derivada, integral e soma. | Sem catálogos CONST/CONV, editor estrutural natural completo, número misto e simplificação simbólica geral; CALC/SOLVE e DEG/RAD/GRAD estão disponíveis por formulários, com limitações numéricas; a apresentação parcial empilha frações aninhadas reconhecidas e mostra raízes e potências com operandos reconhecidos; derivada/integral não garantem detectar singularidades ou descontinuidades. `tests/engine.test.mjs`, `tests/exact.test.mjs`, `tests/calculus.test.mjs`; exemplos guia pp. 3–5 e 29. |
| Complexos | Soma, subtração, produto, quociente e conversão retangular/polar por campos. | Não há editor complexo integrado ao visor principal nem cobertura completa de funções complexas; operações numéricas. `tests/modes.test.mjs`, guia pp. 11–12. |
| Base-N | Binário, octal, decimal, hexadecimal; conversão, +/−/×/÷, AND/OR/XOR/XNOR/NOT por campos. | Adota inteiros de 32 bits e complemento de dois; limites e formatação da LA X não foram verificados; sem sequência fiel de teclas. `tests/modes.test.mjs`. |
| Matriz | A+B, A−B, A×B, determinante, inversa e transposta em matrizes até 4×4 por grade. | Identidade e escala existem no módulo `linear.js`, mas não têm opção no formulário; sem registradores MatA/MatB/MatC/MatD do fluxo físico ou entrada natural. `tests/linear.test.mjs`, guia pp. 13–16. |
| Vetor | Soma/subtração, produto escalar/vetorial, módulo, unitário e ângulo 2D/3D. | Escala existe no módulo, não no formulário; sem registradores ou fluxo físico; ângulo em formulário próprio. `tests/linear.test.mjs`, guia pp. 17–19. |
| Estatística | Uma/duas variáveis, frequências, quartis e regressões linear, quadrática, logarítmica, exponencial, potência e inversa. | Nem todos os parâmetros, operações, limites de amostra, apresentação e sequência do aparelho foram comparados; sem persistência de dados estatísticos. `tests/statistics.test.mjs`, guia p. 20 e seguintes. |
| Distribuição | Normal densidade, acumulada, intervalo e inversa; binomial e Poisson densidade/acumulada. | Aproximações e caudas têm limites; não foi demonstrada equivalência dos intervalos/limites ou interface do aparelho. `STATISTICS.md`, `tests/statistics.test.mjs`, guia pp. 24–27. |
| Planilha | Grade A–E, linhas 1–45, fórmulas básicas, SUM/MEAN, cópia/movimentação/preenchimento e referências relativas/absolutas. | Snapshots são salvos no armazenamento local ao editar e após copiar/mover/preencher; falha de armazenamento é sinalizada, e dados ilegíveis são preservados até o usuário iniciar nova planilha. Esse armazenamento pode ser limpo pelo navegador. Mover não reescreve referências externas; texto e várias funções não são suportados. `SPREADSHEET.md`, `tests/spreadsheet.test.mjs` incluem restauração, dados corrompidos e falha de armazenamento; guia pp. 29–33. |
| Tabela | Uma ou duas expressões, início/fim/passo; até 1000 linhas no módulo. | Limites de linhas e edição não foram comparados com o aparelho; domínio inválido vira célula de erro. `tests/modes.test.mjs`, guia p. 36. |
| Equação/Função | Sistemas 2–4 incógnitas e polinômios grau 2–4, com raízes complexas numéricas. | Sistemas singulares são rejeitados; polinômios mal condicionados podem não convergir; SOLVE numérico está disponível pela tecla CALC; não há editor físico idêntico. `tests/linear.test.mjs`, guia seção Equação. |
| Desigualdade | Polinômios reais até grau 4 e relações <, ≤, >, ≥, em intervalos numéricos. | Sem solução simbólica; raízes próximas/grandes e coeficientes mal condicionados podem ser inexatos; sequência física não reproduzida. `tests/modes.test.mjs`, guia p. 45. |
| Proporção | A:B=C:X e A:B=X:D por campos. | Não demonstrada equivalência de tratamento de entradas excepcionais e sequência de teclas. `tests/modes.test.mjs`, guia seção Proporção. |

## Evidência e limites de teste

- `npm test` executa os testes Node em `tests/*.test.mjs`, incluindo `solve.test.mjs`, `scientific.test.mjs`, `settings.test.mjs` e `grad.test.mjs`; os casos específicos são identificados nas tabelas e documentos citados. Testes numéricos de módulo **não** provam que cada tecla ou cada fluxo tenha sido testado no navegador.
- Os ensaios locais cobriram exemplos de matriz/vetor/sistema/polinômio, complexo e Base-N, estatística, tabela/planilha, persistência com falhas simuladas, e atalhos do corpo. No visor natural foram testados `7/8`, alternância decimal, mudança de numerador 7→5, `√24`, `2^3`, `(1+2/3)/4=5/12` e `√(9/4)^2=9/4`; em Chromium móvel emulado, um toque alterou o denominador e arrasto de mouse selecionou caracteres (`qa/natural-nested-browser.mjs`); não constituem uma varredura de todas as combinações Shift/Alpha. A leitura acima usa ramificações reais do código, e ausências não devem ser tratadas como testes passados.
- Não há comparação com firmware, dispositivo físico nem suíte oficial de 552 funções. Não foi verificada fidelidade de fontes, exatidão colorimétrica, tempo de resposta, áudio, vibração ou instalação no iPhone.

## Lacunas que impedem declarar o pedido integralmente atendido

O pedido inclui as funcionalidades da fx‑991LA X; por isso, os itens abaixo impedem declarar paridade funcional completa, mesmo que exista um caminho alternativo no aplicativo:

1. OPTN e QR permanecem indisponíveis; QR não transmite dados. Catálogos CONST e CONV e parte dos ajustes SETUP permanecem ausentes. CALC, SOLVE, integral, derivada, somatório e RESET são acessíveis pelas teclas usando formulários no visor; o fluxo não reproduz a máquina física.
2. DMS, FACT, ENG, logaritmo de base e raiz de índice, Pol/Rec e Rnd agora têm caminhos pelas teclas, mas carecem de comparação abrangente de limites e apresentação. Número misto e UNDO permanecem ausentes.
3. Representações matemáticas e edição estruturada completas, incluindo todos os formatos exatos, frações mistas, estruturas aninhadas arbitrárias, posição/seleção por toque idênticas e histórico de navegação. O posicionamento usa fronteiras visuais e foi exercitado em emulação, não comprovado em iPhone físico. A apresentação e os resultados exatos cobrem subconjuntos documentados, e não foram comparados exaustivamente ao aparelho.
4. Os modos avançados não reproduzem integralmente o menu de ícones, sequência de teclas, registradores Mat/Vct, opções contextuais, limites e formatos da LA X. A análise por formulário e testes numéricos comprovam apenas as operações nomeadas na tabela, não todas as funções dos modos físicos.
5. Os limites numéricos e comportamento em casos mal condicionados, singularidades, arredondamento, overflow, memória e erros não têm comparação completa com o aparelho. A memória das variáveis e o conjunto estatístico não persistem entre recargas; a planilha depende do armazenamento do navegador.

As lacunas funcionais são trabalho de implementação e validação pendente; não há base para classificá-las como impossíveis apenas por não usar firmware proprietário. Também não há teste em iPhone físico nem comparação integral com uma unidade LA X. Esses limites visuais e de validação impedem afirmar réplica fiel, mesmo onde há resultados numéricos testados.
