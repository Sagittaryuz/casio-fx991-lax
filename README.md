# Calculadora científica fx-991LA X

Webapp independente inspirado na calculadora Casio fx-991LA X. Não é produto oficial Casio e não contém firmware proprietário. O projeto HP12C Platinum permanece separado.

## Executar e testar

Requer Node 22+. Execute `npm ci`, `npm run dev` e, para validação, `npm test` e `npm run build`.

## Uso e cobertura

Na tela principal, digite com o teclado da calculadora ou do computador. SHIFT ativa funções alternativas; SHIFT + MENU abre SETUP para DEG/RAD/GRAD e formatos FIX/SCI/NORM; SHIFT + 9 abre o mesmo painel com opções de reset. ALPHA introduz variáveis, STO seguido da tecla da variável guarda o último resultado, e M+ acumula o último resultado. S⇔D alterna entre forma exata suportada e decimal; SHIFT + S⇔D alterna fração imprópria e número misto suportados. SHIFT + fração insere um número misto e ALPHA + DEL desfaz ou refaz a última edição no editor principal. O menu inicial usa ícones e navegação pelas teclas da calculadora. Os modos avançados oferecem telas próprias de LCD com seleção invertida e navegação por teclas; alguns comandos auxiliares ainda usam formulários compactos. Os fluxos e a apresentação não foram demonstrados como idênticos ao aparelho.

OPTN apresenta opções contextuais disponíveis; o QR permanece desativado e não transmite dados. SHIFT + 7 abre CONST (47 constantes) e SHIFT + 8 abre CONV (40 direções), com confirmação para inserir ou aplicar. Fontes e convenções numéricas estão em [CATALOG.md](CATALOG.md). CALC e SOLVE pedem variáveis no visor; as teclas ∫ e SHIFT acionam integral, derivada e somatório em formulários. SOLVE é numérico, depende da estimativa inicial e pode não convergir. O motor inclui aritmética, trigonometria, logaritmos, frações e algumas raízes exatas; há operações de complexos, Base-N, tabelas, matrizes, vetores, estatística, distribuições, planilha, derivadas e integrais numéricas, somatórios, sistemas lineares, polinômios, desigualdades e proporções. Consulte [ENGINE.md](ENGINE.md), [SOLVE.md](SOLVE.md), [SCIENTIFIC.md](SCIENTIFIC.md), [LINEAR.md](LINEAR.md), [STATISTICS.md](STATISTICS.md), [MODES.md](MODES.md) e [SPREADSHEET.md](SPREADSHEET.md) para a cobertura detalhada e limites numéricos. OPTN oferece somente controles já implementados no modo, UNDO tem um nível e cobre apenas o editor principal; mistos aceitam componentes inteiros não negativos com sinal externo. Nem todas as teclas secundárias e funções da calculadora real estão disponíveis. O aplicativo não foi verificado como equivalente ao firmware ou ao conjunto completo de funções do aparelho.

As duas fotos anteriores retratam a fx-991EX; uma foto posterior fornecida retrata a fx-991LA X. A imagem da fx-991LA X no [guia oficial](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf) confirma a identificação LA X e a tecla decimal com vírgula. A estrutura visual aproxima o aparelho usando camadas e controles individuais; a fidelidade física e o comportamento em iPhone real ainda precisam de validação.

Após o primeiro carregamento completo, o cache permite uso offline; testado localmente no Chromium, ainda não em iPhone físico.

A matriz de cobertura detalhada está em [PARIDADE.md](PARIDADE.md). Peças exportáveis em alta resolução estão em [assets-export](assets-export/README.md). A planilha guarda dados no armazenamento local do navegador, sujeito a remoção ou indisponibilidade.

A calculadora usa a estrutura de viewport da HP12C: viewport-fit=cover, 100dvh, áreas seguras e redisposição em paisagem. Navegador Chromium emulado foi verificado; modo instalado e iPhone físico não foram verificados. Os modos usam o visor e as teclas da calculadora; a edição natural cobre um subconjunto de estruturas aninhadas. Consulte PARIDADE.md para lacunas.

O menu inicial foi reconstruído a partir das páginas 2–3 do guia oficial LA X: grade 4×2, seleção por setas, =, números e ALPHA+A/B/C. As telas internas foram reconstruídas independentemente e ainda não estão comprovadas como idênticas às do aparelho. A fonte pixel VT323 é uma aproximação independente por Peter Hull, sob SIL OFL 1.1; licença em public/fonts/VT323-OFL.txt e fonte https://github.com/google/fonts/tree/main/ofl/vt323. Não é fonte oficial Casio.
