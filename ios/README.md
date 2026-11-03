# Protótipo iOS SwiftUI

Este diretório é independente da aplicação web. `FX991.xcodeproj` contém uma interface SwiftUI com componentes separados, reutiliza as imagens otimizadas do aplicativo e executa uma cópia empacotada dos módulos matemáticos do projeto em JavaScriptCore. A avaliação é feita numa fila serial fora da interface; resultados obsoletos são descartados quando o usuário altera a entrada ou pressiona ON. Não é WebView nem firmware oficial.

## Estado atual

Implementado como protótipo: interface responsiva, dígitos, aritmética, entrada linear, parênteses, funções trigonométricas, potências, raízes, logaritmos, fração como texto linear, alternância parcial exato/decimal, SHIFT/ALPHA parcial, Ans, STO/RECALL, memória M, DEG/RAD/GRAD, ON para limpar a sessão, MENU e navegação por setas. A ponte reutiliza os módulos `src/engine.js`, `src/exact.js` e `src/scientific.js`; usa os mesmos limites matemáticos e não prova equivalência ao firmware.

**Não está pronto para substituir o aplicativo web.** O visor usa texto monoespaçado e não replica o editor natural/dígitos vetoriais da versão web; seleção de cursor por toque e entrada estrutural não estão implementadas. Na calculadora nativa, os modos complexos, Base-N, matrizes, vetores, estatística, distribuição, planilha, tabela, equações, desigualdade e proporção aparecem no menu mas informam que estão em desenvolvimento. OPTN, CALC/SOLVE, integrais, DMS, ENG, catálogo e funções secundárias de algumas teclas ainda não têm interface nativa. Configurações e dados persistentes, ON após reabrir, acessibilidade completa, proporções físicas, haptics e delta percentual não estão implementados. Não alegamos mesma cobertura, fidelidade visual ou melhoria de latência em iPhone real.

## Verificação e build

`node ios/scripts/build-engine.mjs` recria a ponte a partir dos arquivos web sem alterá-los. `node --test ios/tests/*.test.mjs` testa a ponte em Node; `npm test` mantém os testes web. A ação `.github/workflows/ios-simulator.yml`, somente para `ios/swiftui`, tenta compilar sem assinatura, instalar num simulador disponível e salvar uma captura. Ela não assina, não publica e não instala em iPhone físico. Nenhum teste de desempenho real ou acessibilidade é substituído por essa compilação.

Para compilar localmente num Mac: `xcodebuild -project ios/FX991.xcodeproj -scheme FX991 -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`. Instalar em aparelho requer o fluxo de assinatura escolhido e testes do aparelho; uma compilação sem assinatura não é instalável diretamente. Não armazenar credenciais Apple ou certificados no repositório.
