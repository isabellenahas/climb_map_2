# Climb Map — Versão Simples

Aplicação estática para GitHub Pages, baseada em:

**Categoria → Trilha → Competência → Nível → conteúdos de referência**

## Funcionalidades

- Catálogo de competências com pesquisa e filtros.
- Autoavaliação de competências em escala de 1 a 5.
- Planejamento por nível de competência.
- Cards manuais para cursos, certificações e outros objetivos.
- Kanban com Stand by, Em Aberto, Em Andamento e Concluído.
- Trilhas com progresso calculado.
- Meu Mapa com indicadores e heatmap.
- Evolução com indicadores, histórico e calendário anual.
- Importação direta do arquivo `ClimbMap_Base_Simplificada.xlsx`.
- Armazenamento local no navegador.
- Tema claro e escuro.
- Exportação de backup JSON.

## Como publicar usando apenas o GitHub online

1. Crie um repositório novo no GitHub.
2. Extraia este ZIP no computador.
3. No repositório, clique em **Add file → Upload files**.
4. Arraste **todo o conteúdo de dentro da pasta**, mantendo:
   - `index.html`
   - `assets`
   - `data`
   - `docs`
5. Confirme em **Commit changes**.
6. Abra **Settings → Pages**.
7. Em **Build and deployment**, escolha **Deploy from a branch**.
8. Selecione a branch `main`, pasta `/(root)` e clique em **Save**.
9. Aguarde o GitHub publicar o endereço do portal.

## Como usar seu Excel

No portal, clique em **Importar Excel** e selecione o arquivo preenchido.

A importação lê exatamente as abas:

- `01_Categorias`
- `02_Trilhas`
- `03_Catalogo`

A importação feita pelo botão vale apenas para o navegador atual. Para publicar o catálogo para todos os usuários, o arquivo `data/catalogo.json` deverá ser atualizado. O portal já inclui dados demonstrativos até que a base oficial esteja pronta.

## Persistência

Esta versão não usa servidor nem banco de dados externo. Perfil, autoavaliações e planejamento ficam no `localStorage` de cada navegador.

Isso é adequado para a primeira versão individual. Para múltiplos usuários com sincronização entre dispositivos, será necessária uma camada de autenticação e banco de dados em uma fase posterior.
