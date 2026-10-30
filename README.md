# Calculadora científica fx-991LA X

Webapp independente inspirado na calculadora Casio fx-991LA X. Não é produto oficial Casio e não contém firmware proprietário. O projeto HP12C Platinum permanece separado.

## Executar e testar

Requer Node 22+. Execute `npm ci`, `npm run dev` e, para validação, `npm test` e `npm run build`.

## Uso e cobertura

Na tela principal, digite com o teclado da calculadora ou do computador. SHIFT ativa funções alternativas; SHIFT + MENU alterna graus/radianos. ALPHA introduz variáveis, STO seguido da tecla da variável guarda o último resultado, e M+ acumula o último resultado. S⇔D alterna entre forma exata suportada e decimal. O menu abre formulários e tabelas para as operações científicas. Digite em cada campo pelo teclado do dispositivo ou pelo teclado de apoio do próprio menu. O menu ainda não replica o fluxo de ícones ou os editores naturais do aparelho.

O motor inclui aritmética, trigonometria, logaritmos, frações e algumas raízes exatas; há operações de complexos, Base-N, tabelas, matrizes, vetores, estatística, distribuições, planilha, derivadas e integrais numéricas, somatórios, sistemas lineares, polinômios, desigualdades e proporções. Consulte [ENGINE.md](ENGINE.md), [LINEAR.md](LINEAR.md), [STATISTICS.md](STATISTICS.md) e [MODES.md](MODES.md) e [SPREADSHEET.md](SPREADSHEET.md) para a cobertura detalhada e limites numéricos. Nem todas as teclas secundárias e funções da calculadora real estão disponíveis. O aplicativo não foi verificado como equivalente ao firmware ou ao conjunto completo de funções do aparelho.

As duas fotos fornecidas retratam a fx-991EX. A imagem da fx-991LA X no [guia oficial](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf) confirma a identificação LA X e a tecla decimal com vírgula. A estrutura visual aproxima o aparelho usando camadas e controles individuais; a fidelidade física e o comportamento em iPhone real ainda precisam de validação.

Após o primeiro carregamento completo, o cache permite uso offline; testado localmente no Chromium, ainda não em iPhone físico.
