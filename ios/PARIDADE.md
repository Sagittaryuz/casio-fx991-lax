# Cobertura da versão iOS

A versão nativa usa o motor matemático da web via JavaScriptCore, com interface SwiftUI própria. Os fluxos abaixo são reconstruções e não representam equivalência com o firmware ou todos os recursos do site.

| Modo | Disponível | Limitações principais |
| --- | --- | --- |
| Calcular | Aritmética, funções científicas, frações, memória e Ans; cálculos exatos selecionados | Editor natural e SHIFT/ALPHA parciais; seleção por toque em trechos visíveis; delta percentual no menu OPTN |
| Complexos | Quatro operações retangulares e conversões retangular/polar | Operações avançadas e fluxo físico incompletos |
| Base-N | Conversão e operações selecionadas, incluindo XNOR | Conjunto e fluxo não completos |
| Matriz | Determinante, inversa, transposta, soma, subtração, produto e multiplicação por escalar, 2×2 a 4×4 | Sem gestão completa dos registradores e do editor físico |
| Vetor | Soma, subtração, produto escalar, norma e ângulo 2D/3D; produto vetorial 3D, normalização e multiplicação por escalar | Sem todos os comandos e registradores do aparelho |
| Estatística | Uma variável e seis regressões, com linhas adicionais | Até 200 campos; sem frequências nem todas as opções e apresentações |
| Distribuição | Operações selecionadas das distribuições normal, binomial e Poisson | Fluxo e cobertura não completos |
| Planilha | Grade navegável A1–E45, edição por célula, fórmulas, copiar/preencher e persistência local | Sem migração da web; valores usam precisão numérica aproximada |
| Tabela | Uma ou duas funções | Apresentação e navegação simplificadas |
| Equação | Polinômios de grau 2 a 4 e sistemas 2×2 a 4×4 | Fluxo de coeficientes e resultados simplificado |
| Desigualdade | Polinômios de graus 2 a 4, quatro comparadores | Resultados numéricos aproximados; fluxo físico pendente |
| Proporção | Cálculo de incógnita | Interface simplificada |

CALC/SOLVE aceitam x, A e B. Integrais, derivadas, somatórios e Pol/Rec usam os motores existentes. DMS, fatoração e ENG abrem telas próprias; SHIFT 7 e SHIFT 8 acessam o catálogo de constantes e conversões do projeto web. Resultados numéricos de modos avançados podem ser levados ao cálculo principal por Ans. SETUP oferece DEG/RAD/GRAD e formatos NORM, FIX e SCI; não inclui todas as opções do aparelho. Nos campos de modos avançados, esquerda/direita movem o cursor e cima/baixo mudam de campo; estatística acrescenta linhas ao avançar. ON limpa estado e dados persistidos da calculadora nativa, conforme personalização solicitada.

OPTN no cálculo principal oferece Δ% = (final − inicial) / inicial × 100; inicial zero retorna erro. Desfazer até 100 edições no editor principal por ALPHA DEL e refazer por OPTN → 2; histórico não persiste ao sair e desfazer nos modos, menus e funções secundárias restantes, estruturas matemáticas naturais adicionais e equivalência de precisão/formatação seguem pendentes. O menu usa rótulos em vez dos ícones originais. O modelo de posicionamento do cursor é testado no simulador; o toque físico, a fidelidade visual, desempenho, acessibilidade e assinatura e instalação em iPhone físico não foram verificados.

O visor estrutura frações e números mistos, raízes quadradas/cúbicas/de índice, logaritmos com base e expoentes comuns, inclusive em expressões aninhadas. Toque antes de um símbolo ou no fim de um trecho para posicionar o cursor; operadores estruturais ocultos e expressões mais complexas podem exigir as setas. A representação de todas as construções do aparelho continua pendente.

Na grade da planilha, OPTN abre Copiar ou Preencher; a origem é a célula selecionada e o destino deve ser informado. Preencher exige destino abaixo e à direita da origem; fórmulas preservam referências absolutas e ajustam as relativas. MENU cancela e retorna à grade. Erros não salvam uma alteração parcial.
