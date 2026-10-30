# Pesquisa de interface — fx-991LA X

A fotografia LA X fornecida foi inspecionada diretamente. As fotos anteriores mostravam a EX; quando divergem, a LA X tem prioridade. O mapa das famílias de teclas e do direcional está em [GEOMETRIA-LAX.md](GEOMETRIA-LAX.md).

## Fontes verificadas

- [Guia oficial Casio fx-991LA X](https://edu.casio.com/support/qsg_es/pdf/991LAX/ALL_CASIO_QuickStartGuide_fx-991LA_X_es.pdf), pp. 2–3: 12 modos, ícones, ordem, grade visível de 4×2, item selecionado invertido, legenda inferior e acesso por setas, = e atalhos. A segunda janela mostra 5–8 e 9/A/B/C. O novo seletor redesenha ícones e segue essa organização; não usa imagem de firmware.
- [Emulador ClassWiz oficial para ClassPad.net](https://edu.casio.com/intl/software/emulators/classwiz-cpnet/): a Casio lista a fx-991LA X. O serviço é separado, requer acesso/licença; não foi criada conta ou incorporado código.
- [Manual completo da LA X, cópia de documento Casio em servidor de terceiros](https://manuals.plus/m/31b4dff109bb5df03098f415a0f0d4114e74ac0e5073dfe8b4f7e95d21addd9a.pdf): complementa o guia para SETUP e telas internas. O projeto não utiliza firmware ou ROM.
- [CasioEmuX](https://github.com/gamingwithevets/CasioEmuX) e [CasioEmu](https://github.com/user202729/CasioEmu): projetos GPL para pesquisa; não foram instalados nem incorporados, e firmware de terceiros não foi obtido. Outros clones encontrados não apresentaram licença clara para reutilização de código.
- A fonte local VT323 foi criada pelo projeto VT323 e é distribuída sob SIL OFL 1.1; cópia e aviso em `public/fonts/VT323-OFL.txt`. É uma aproximação independente, não uma fonte Casio. A fonte comunitária ClasswizDisplayFont declara OFL mas seu aviso também identifica copyright Casio; sem confirmação da autorização sobre essa parcela, ela não foi incorporada.

## Estado da implementação

O menu principal usa 4×2, inversão da seleção, rolagem para a segunda janela e botões/setas/números/ALPHA. O cálculo, o armazenamento e os modos existentes usam motor próprio. SETUP e os modos avançados foram reconstruídos no visor com menus numerados, grades e seleção invertida; alguns comandos auxiliares ainda usam formulários compactos. Essas telas são implementações próprias, não reproduções pixel a pixel comprovadas do aparelho. A comparação do direcional e teclas mostra diferenças de relevo e proporção. A fonte VT323 e a resolução visual não são equivalentes comprovadas à matriz do dispositivo. Ver [PARIDADE.md](PARIDADE.md) e [design-qa.md](design-qa.md).

A reconstrução posterior inclui editores de cálculo avançado no LCD para Complexos, Base-N, Matriz, Vetor, Estatística, Distribuição, Planilha, Tabela, Equação/Função, Desigualdade e Proporção. Os comandos físicos e a seleção invertida são implementações próprias; os roteiros `qa/native-*.mjs` cobrem fluxos específicos, e os limites de cada modo estão em PARIDADE.md. SETUP e comandos auxiliares não oferecem ainda todos os ajustes ou telas da unidade física.
