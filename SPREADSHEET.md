# Planilha

`src/spreadsheet.js` implementa um modelo independente com 5 colunas (A–E) e 45 linhas, conforme a capacidade descrita no guia oficial. `new Spreadsheet({angle:'DEG'|'RAD'})` cria uma planilha; `set('A1','40')`, `get('A1')`, `value('A1')`, `clear`, `copy`, `move` e `fill` manipulam células. Fórmulas começam com `=`, aceitam funções do motor real e referências, por exemplo `=A1*29.5735`, `=SUM(A1:A6)` ou `=MEAN(A1:A6)`. Células vazias são avaliadas como zero. Copiar/fill ajusta referências relativas; `$A$1` fixa linha e coluna. Referências circulares e endereços inválidos geram erro.

A operação de mover não reescreve referências em outras células, e o modelo não oferece editor gráfico, todas as funções da planilha original, persistência nem equivalência de capacidade de memória. Uma faixa fill que chega à borda pode falhar após preenchimentos anteriores. Fórmulas em ponto flutuante, com máximo de 45 linhas; valores de texto não são suportados. Estas decisões de implementação não foram todas comparadas ao dispositivo físico.

Testes em `tests/spreadsheet.test.mjs`, incluindo a conversão de 40 onças pela fórmula e média/soma, referências, cópia e ciclos. [Guia oficial fx-991LA X, páginas 29–33](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf).
