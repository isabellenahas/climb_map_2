# Climb Map — Versão Simples V2

Aplicação estática para GitHub Pages.

## Base incorporada

- Categorias: 5
- Trilhas: 23
- Competências: 37
- Linhas de competência por nível: 64

A base oficial foi gerada a partir de `ClimbMap_Preenchido.xlsx`.

## Principais recursos

- Meu Mapa com cards e gráficos alinhados.
- Catálogo com filtros horizontais por busca, categoria, trilha, nível e autoavaliação.
- Escala textual de autoavaliação:
  - Não avaliada
  - Não conheço
  - Já ouvi falar
  - Experimentei
  - Autônomo
  - Ensino
- Planejamento com filtros horizontais.
- Cards manuais classificados como Curso, Certificação, Conteúdo ou Outro.
- Trilhas compactas e expansíveis.
- Inclusão de competência ou trilha inteira no planejamento.
- Autoavaliação diretamente dentro das trilhas.
- Nova página Heatmap com competência + nível em pequenos cards.
- Evolução e calendário anual.
- Importação direta de uma nova versão do Excel.
- Armazenamento local no navegador.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Crie um repositório novo ou substitua os arquivos do repositório atual.
3. Envie o conteúdo interno da pasta para a raiz do repositório.
4. Em `Settings → Pages`, escolha:
   - `Deploy from a branch`
   - branch `main`
   - pasta `/(root)`
5. Salve e aguarde a publicação.

## Observação importante

Os dados pessoais ficam no navegador. O catálogo oficial está publicado em `data/catalogo.json`.


## Novidades da V3

- Backup completo por download e restauração total por upload.
- Cards clicáveis em Meu Mapa, Heatmap e Evolução.
- Cores leves por categoria no Catálogo.
- Heatmap em matriz: competências nas linhas e níveis nas colunas.
- Escala personalizada de cores.


## Novidades da V4
- Filtro exato por competência no Catálogo.
- Navegação corrigida a partir de Meu Mapa, Heatmap e Evolução.
- Visualização detalhada de competências dentro de Trilhas.
- Configurações centralizam tema, importação, download e restauração.
- Evolução por categoria e níveis concluídos.
- Heatmap com níveis oficiais nas colunas e títulos/descrições dos níveis nas células.


## Novidades da V5

- Favoritos por competência, com estrelas no Catálogo e em Trilhas.
- Meu Mapa passa a exibir apenas Competências Favoritadas.
- Botões compactos de limpeza de filtros com ícone de lixeira.
- Em Trilhas, cada nível possui seu próprio botão para inclusão no Planejamento.
- Heatmap com coluna Total contendo a nota de autoavaliação da competência.
- Cards de categoria em Evolução calculados pela média das autoavaliações, em escala de 0 a 4.


## Novidades da V6

- Filtros reimplementados com atualização automática da página.
- Botões Limpar removidos.
- Navegação por qualquer card de competência abre o Catálogo mostrando somente a competência selecionada.
- Heatmap sem coluna Total e com Categoria antes de Competência.
- Indicadores de média de autoavaliação por categoria adicionados ao Heatmap.
- Evolução recebeu calendário mensal de cursos planejados e concluídos.
- Campo Status do planejamento recebeu destaque visual.
