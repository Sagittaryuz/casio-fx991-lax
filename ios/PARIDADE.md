# Cobertura da versão iOS

A versão nativa usa o motor matemático da web via JavaScriptCore, com interface SwiftUI própria. Os fluxos abaixo são reconstruções e não representam equivalência com o firmware ou todos os recursos do site.

| Modo | Disponível | Limitações principais |
| --- | --- | --- |
| Calcular | Aritmética, funções científicas, frações, memória e Ans; cálculos exatos selecionados | Editor natural e SHIFT/ALPHA parciais; sem seleção de cursor por toque; delta percentual no menu OPTN |
| Complexos | Quatro operações retangulares | Sem fluxo polar completo |
| Base-N | Conversão e operações selecionadas | Conjunto e fluxo não completos |
| Matriz | Determinante, inversa, transposta, soma e produto, 2×2 a 4×4 | Sem gestão completa dos registradores e do editor físico |
| Vetor | Soma, subtração, produto escalar, norma e ângulo 2D/3D; produto vetorial 3D | Sem todos os comandos e registradores do aparelho |
| Estatística | Uma variável e seis regressões, com linhas adicionais | Até 200 campos; sem frequências nem todas as opções e apresentações |
| Distribuição | Operações selecionadas das distribuições normal, binomial e Poisson | Fluxo e cobertura não completos |
| Planilha | Grade navegável A1–E45, edição por célula, fórmulas e persistência local | Grade mostra conteúdo bruto, não valores calculados; sem copiar/preencher ou migração da web |
| Tabela | Uma ou duas funções | Apresentação e navegação simplificadas |
| Equação | Polinômios de grau 2 a 4 e sistemas 2×2 a 4×4 | Fluxo de coeficientes e resultados simplificado |
| Desigualdade | Quadrática, quatro comparadores | Outros graus e fluxo físico pendentes |
| Proporção | Cálculo de incógnita | Interface simplificada |

CALC/SOLVE aceitam x, A e B. Integrais, derivadas, somatórios e Pol/Rec usam os motores existentes. DMS, fatoração e ENG abrem telas próprias; SHIFT 7 e SHIFT 8 acessam o catálogo de constantes e conversões do projeto web. Resultados numéricos de modos avançados podem ser levados ao cálculo principal por Ans. SETUP oferece DEG/RAD/GRAD e formatos NORM, FIX e SCI; não inclui todas as opções do aparelho. Nos campos de modos avançados, esquerda/direita movem o cursor e cima/baixo mudam de campo; estatística acrescenta linhas ao avançar. ON limpa estado e dados persistidos da calculadora nativa, conforme personalização solicitada.

OPTN no cálculo principal oferece Δ% = (final − inicial) / inicial × 100; inicial zero retorna erro. Desfazer, menus e funções secundárias restantes, editor natural completo e equivalência de precisão/formatação seguem pendentes. O menu usa rótulos em vez dos ícones originais. A execução em simulador não valida fidelidade visual, toque, desempenho, acessibilidade ou assinatura e instalação em iPhone físico.
