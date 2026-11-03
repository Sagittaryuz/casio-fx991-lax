# Protótipo iOS SwiftUI

Este diretório é independente da aplicação web. `FX991.xcodeproj` contém uma interface SwiftUI com componentes separados, reutiliza as imagens otimizadas do aplicativo e executa uma cópia empacotada dos módulos matemáticos do projeto em JavaScriptCore. A avaliação é feita numa fila serial fora da interface; resultados obsoletos são descartados quando o usuário altera a entrada ou pressiona ON. Não é WebView nem firmware oficial.

## Estado atual

Implementado como protótipo: interface responsiva, dígitos, aritmética, entrada linear, parênteses, funções trigonométricas, potências, raízes, logaritmos, fração como texto linear, alternância parcial exato/decimal, SHIFT/ALPHA parcial, Ans, STO/RECALL, memória M, DEG/RAD/GRAD, ON para limpar a sessão, MENU e navegação por setas. A ponte reutiliza os módulos `src/engine.js`, `src/exact.js` e `src/scientific.js`; usa os mesmos limites matemáticos e não prova equivalência ao firmware.

**Ainda não substitui o aplicativo web.** As telas nativas têm uma operação inicial por modo: soma de complexos, conversão de bases, determinante de matriz 2×2, produto escalar de vetores 3D, estatística de três dados, distribuição normal acumulada, edição por endereço de célula da planilha, tabela de uma função, equação quadrática, desigualdade quadrática e proporção. CALC/SOLVE (x, A e B), integral, derivada, somatório e Pol/Rec têm entradas no visor; os motores são os módulos matemáticos já existentes. Em cada modo, use as setas para selecionar o campo, teclas para editar e `=` para calcular. A planilha salva seu conteúdo no aparelho, e ON apaga a sessão, planilha e unidade angular salvas. Não há migração dos dados do site.

As telas de cada modo são simplificadas e **não cobrem todas as operações ou fluxos da calculadora web ou do aparelho**. Os dígitos do visor usam os contornos vetoriais da HP12C já utilizados pela web, mas o editor de entrada linear ainda não reproduz frações empilhadas ou seleção por toque. OPTN, DMS, ENG, catálogo e várias funções secundárias ainda não estão implementados; o menu usa rótulos em vez dos ícones originais. Navegação, persistência e desempenho em iPhone físico, haptics, VoiceOver e fidelidade visual não foram verificados. Delta percentual ainda não foi implementado.

## Verificação e build

`node ios/scripts/build-engine.mjs` recria a ponte a partir dos arquivos web sem alterá-los. `node --test ios/tests/*.test.mjs` testa a ponte em Node; `npm test` mantém os testes web. A ação `.github/workflows/ios-simulator.yml`, somente para `ios/swiftui`, compila sem assinatura, instala num simulador disponível, executa um teste de estado/motor em Debug e salva uma captura. Ela não assina, não publica e não instala em iPhone físico. Nenhum teste de desempenho real ou acessibilidade é substituído por essa compilação.

Para compilar localmente num Mac: `xcodebuild -project ios/FX991.xcodeproj -scheme FX991 -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`. Instalar em aparelho requer o fluxo de assinatura escolhido e testes do aparelho; uma compilação sem assinatura não é instalável diretamente. Não armazenar credenciais Apple ou certificados no repositório.
