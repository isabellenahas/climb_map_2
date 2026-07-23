# Estrutura técnica simplificada

## Base oficial

O arquivo administrativo possui três abas de dados:

1. `01_Categorias`
2. `02_Trilhas`
3. `03_Catalogo`

Competência, nível e conteúdos orientativos são consolidados na mesma aba.

## Dados individuais

Os dados individuais não ficam nas planilhas. A aplicação armazena localmente:

- nome do perfil;
- autoavaliações;
- cards do planejamento;
- histórico de eventos;
- preferência de tema;
- catálogo importado pelo usuário.

## Regra de trilhas

O percentual da trilha é calculado pela proporção de competências consideradas desenvolvidas. Nesta versão, uma competência é considerada desenvolvida quando:

- possui autoavaliação 4 ou 5; ou
- todos os níveis cadastrados foram concluídos no planejamento.

## Limitações conscientes

- Não existe login centralizado.
- Os dados não sincronizam entre dispositivos.
- Cursos, certificações e livros são apenas referências textuais.
- A importação local do Excel não altera automaticamente o repositório GitHub.
