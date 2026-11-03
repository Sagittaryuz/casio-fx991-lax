# Protótipo iOS SwiftUI

Este diretório é independente da aplicação web. `FX991.xcodeproj` contém uma interface SwiftUI com componentes separados, reutiliza as imagens otimizadas do aplicativo e executa uma cópia empacotada dos módulos matemáticos do projeto em JavaScriptCore. A avaliação é feita numa fila serial fora da interface; resultados obsoletos são descartados quando o usuário altera a entrada ou pressiona ON. Não é WebView nem firmware oficial.

## Estado atual

Implementado como protótipo: interface responsiva, dígitos, aritmética, entrada linear, parênteses, funções trigonométricas, potências, raízes, logaritmos, fração como texto linear, alternância parcial exato/decimal, SHIFT/ALPHA parcial, Ans, STO/RECALL, memória M, DEG/RAD/GRAD, ON para limpar a sessão, MENU e navegação por setas. A ponte reutiliza os módulos `src/engine.js`, `src/exact.js` e `src/scientific.js`; usa os mesmos limites matemáticos e não prova equivalência ao firmware.

**Ainda não substitui o aplicativo web.** Consulte [PARIDADE.md](PARIDADE.md) para os modos, operações e limitações específicas. A interface dos modos usa campos simplificados; OPTN escolhe operações, cima/baixo muda de campo e esquerda/direita move o cursor. A planilha apresenta uma grade navegável com conteúdo bruto: selecione a célula com as setas e pressione `=` para editar; `=` salva e retorna à grade. A planilha é persistida localmente e ON limpa os dados da calculadora nativa. Não há migração de dados do site.

SHIFT 7 e SHIFT 8 abrem os catálogos de constantes e conversões do projeto. DMS, fatoração e ENG usam telas próprias; o SETUP oferece unidade angular e formatos NORM, FIX e SCI. O menu e os fluxos não são cópias completas do aparelho. O cursor da expressão principal pode ser posicionado tocando um símbolo ou o fim de um trecho. A renderização natural de frações, raízes quadradas e expoentes é parcial; operadores ocultos podem exigir as setas. Navegação, persistência e desempenho em iPhone físico, haptics, VoiceOver e fidelidade visual não foram verificados. No cálculo principal, OPTN → 1 abre Δ%, calculado por (final − inicial) / inicial × 100; valor inicial zero retorna erro.

## Verificação e build

`node ios/scripts/build-engine.mjs` recria a ponte a partir dos arquivos web sem alterá-los. `node ios/scripts/build-catalog.mjs` recria o catálogo local. `node --test ios/tests/*.test.mjs` testa a ponte em Node; `npm test` mantém os testes web. A ação `.github/workflows/ios-simulator.yml`, somente para `ios/swiftui`, compila sem assinatura, instala num simulador disponível, executa um teste de estado/motor em Debug e salva uma captura. Ela não assina, não publica e não instala em iPhone físico. Nenhum teste de desempenho real ou acessibilidade é substituído por essa compilação.

Para compilar localmente num Mac: `xcodebuild -project ios/FX991.xcodeproj -scheme FX991 -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`. Instalar em aparelho requer o fluxo de assinatura escolhido e testes do aparelho; uma compilação sem assinatura não é instalável diretamente. Não armazenar credenciais Apple ou certificados no repositório.
