# Front-end · Listagem de coleção

Interface estática (HTML + CSS + JavaScript puro, sem build e sem dependências) que consome o
endpoint `GET /api/collections/{id}` do Flashcard Service e lista a coleção com seus decks e
flashcards.

## Como executar

### Opção 1 — servido pelo próprio Spring Boot (recomendado)

Na raiz do projeto:

```bash
./mvnw spring-boot:run
```

Depois acesse **http://localhost:8080/**. A configuração em `src/main/resources/application.properties`
serve a pasta `frontend/` como conteúdo estático.

### Opção 2 — servidor estático separado

Com o backend rodando em `http://localhost:8080`, sirva a pasta `frontend/`:

```bash
python -m http.server 5500 --directory frontend
```

Acesse **http://localhost:5500/**. O CORS para `/api/**` já está habilitado em
`src/main/java/com/mindlessducks/coreflashcard/config/WebConfig.java`.

### Opção 3 — abrir o arquivo diretamente

Abra `frontend/index.html` no navegador. Nesse caso o front-end usa automaticamente
`http://localhost:8080` como base da API.

## Configurar o endereço da API

A base da API é resolvida automaticamente:

| Cenário                                        | Base utilizada              |
| ---------------------------------------------- | --------------------------- |
| Servido pelo Spring na porta 8080              | mesma origem                |
| Servido por um dev server local (ex.: 5500)    | `http://localhost:8080`     |
| Aberto via `file://`                           | `http://localhost:8080`     |
| Outro ambiente                                 | mesma origem                |

Para sobrescrever, edite a meta tag em `frontend/index.html`:

```html
<meta name="api-base-url" content="https://api.exemplo.com" />
```

## Obter um ID de coleção para testar

O banco H2 é em memória: os dados são criados em tempo de execução e perdidos quando a API
reinicia. Use o Swagger (**http://localhost:8080/swagger-ui/index.html**) ou os endpoints abaixo:

```bash
# 1. Cria a coleção e retorna o collectionId
curl -X POST http://localhost:8080/api/collection \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"Biologia"}'

# 2. Cria um deck na coleção (use o collectionId retornado acima)
curl -X POST http://localhost:8080/api/deck \
  -H "Content-Type: application/json" \
  -d '{"collectionId":"<COLLECTION_ID>","deckName":"Citologia"}'

# 3. Cria um flashcard no deck (use o deckId retornado acima)
curl -X POST http://localhost:8080/api/card \
  -H "Content-Type: application/json" \
  -d '{"deckId":"<DECK_ID>","cardFront":"O que é mitocôndria?","cardBack":"Organela responsável pela respiração celular."}'
```

Cole o `collectionId` no campo da página e clique em **Carregar coleção**. O ID também pode ser
informado pela URL: `http://localhost:8080/?id=<COLLECTION_ID>`.

## Recursos da interface

- Consulta a coleção por UUID, com validação do identificador e suporte a colar a URL completa do endpoint.
- Resumo da coleção (nome, ID, usuário, datas de criação/atualização, total de decks e flashcards).
- Listagem de decks expansíveis com os flashcards de cada deck.
- Busca local por nome de deck, pergunta ou resposta (ignora acentos e maiúsculas).
- Botões para mostrar/ocultar respostas individualmente ou em lote.
- Filtro de decks, recolher/expandir todos e recarregar a coleção.
- Estados de carregamento (skeleton), vazio, sem resultados e erros amigáveis (ID inválido, API
  indisponível, timeout, 404/500 etc.), com detalhes técnicos.
- Layout responsivo, tema claro/escuro automático e navegação por teclado.

## Estrutura

```
frontend/
├── index.html        # estrutura da página
├── css/styles.css    # estilos, temas e responsividade
├── js/api.js         # cliente HTTP e resolução da URL da API
├── js/app.js         # estado, renderização e interações
└── README.md
```
