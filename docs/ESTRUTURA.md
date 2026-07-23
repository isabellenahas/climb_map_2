# Modelo V7 com IDs

## Abas

### 01_Categorias
ID_Categoria é a chave primária da categoria.

### 02_Trilhas
ID_Trilha é a chave primária.
ID_Categoria aponta para a categoria.
IDs_Competencias contém vários IDs separados por `|`.

### 03_Catalogo
ID_Catalogo identifica uma linha de nível.
ID_Competencia identifica a competência macro e se repete em todos os níveis da mesma competência.
ID_Categoria_Principal é uma classificação principal e não limita a reutilização da competência em trilhas de outras categorias.

## Muitos-para-muitos

Uma trilha possui várias competências e uma competência pode existir em várias trilhas.
A relação é mantida exclusivamente em `02_Trilhas.IDs_Competencias`.
