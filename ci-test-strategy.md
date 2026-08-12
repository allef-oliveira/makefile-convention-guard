# Estratégia de testes e pipelines para Makefile Convention Guard

## Objetivo

Definir uma estratégia de CI com custo controlado para a extensão **Makefile Convention Guard**, separando testes rápidos de testes reais executados em ambiente VSCode.

A ideia principal é evitar que todos os merges executem testes pesados com download/execução do VSCode, deixando esse tipo de validação para momentos mais relevantes, como merges para `main` ou preparação de release.

---

## Contexto

A extensão é escrita em TypeScript e executada pelo VSCode a partir do arquivo compilado em `dist`.

Fluxo básico:

```bash
npm install
npm run check
npm run compile
npm run test
```

O problema é que testes baseados em `@vscode/test-electron` ou `@vscode/test-cli` baixam e executam uma instância real do VSCode.

Exemplo de log:

```text
Validated version: 1.128.0
Downloading VS Code: 84.75/287.45MB
```

Esse comportamento é esperado, mas aumenta o custo do runner.

---

## Estratégia recomendada

Separar os testes em dois grupos:

| Tipo de teste | Comando | Custo | Quando executar |
|---|---|---:|---|
| Testes unitários | `npm run test:unit` | Baixo | MR para `develop` |
| Testes reais com VSCode | `npm run test:extension` | Alto | MR para `main` |
| Validação TypeScript | `npm run check` | Baixo | Sempre |
| Build | `npm run compile` | Baixo | Sempre |
| Package `.vsix` | `npm run package` | Médio | `main` ou release |

---

## Scripts sugeridos no `package.json`

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "check": "tsc --noEmit -p ./",
    "test:unit": "npm run compile && mocha \"dist/test/unit/**/*.test.js\"",
    "test:extension": "npm run compile && vscode-test",
    "test": "npm run test:unit",
    "test:all": "npm run test:unit && npm run test:extension",
    "package": "vsce package",
    "vscode:prepublish": "npm run compile"
  }
}
```

### Observação

O comando `test` fica apontando apenas para os testes rápidos:

```bash
npm run test
```

Para executar a validação completa:

```bash
npm run test:all
```

---

## Organização sugerida dos testes

```text
src/
├── test/
│   ├── unit/
│   │   ├── lineUtils.test.ts
│   │   ├── parser.test.ts
│   │   └── whitespaceRules.test.ts
│   └── extension/
│       ├── activation.test.ts
│       └── diagnostics.test.ts
```

Após a compilação:

```text
dist/
├── test/
│   ├── unit/
│   └── extension/
```

---

## Quando usar cada tipo de teste

### Testes unitários

Devem validar funções que não dependem diretamente da API real do VSCode.

Exemplos:

```ts
splitLines()
hasFinalNewline()
findTrailingWhitespaceStart()
isMakeTargetLine()
isRecipeCommandLine()
```

Esses testes são baratos, rápidos e ideais para rodar em todo MR para `develop`.

### Testes reais com VSCode

Devem validar comportamento que depende da API real do VSCode.

Exemplos:

```ts
vscode.workspace.openTextDocument(...)
vscode.languages.createDiagnosticCollection(...)
activationEvents
diagnostics integrados
commands
tree view
```

Esses testes são mais caros porque executam uma instância real do VSCode. Por isso, devem ficar para MR com destino à `main` ou pipelines de release.

---

## Fluxo de branches

```text
develop
  └── recebe desenvolvimento contínuo

main
  └── recebe apenas versões estáveis
```

Fluxo recomendado:

```text
feature/test/refactor branch
  -> merge request para develop
     -> roda check + compile + unit tests

develop
  -> merge request para main
     -> roda check + compile + unit tests + extension tests + package
```

---

## GitLab CI: identificar branch de destino do MR

No GitLab, para pipelines de Merge Request, a variável mais útil é:

```bash
$CI_MERGE_REQUEST_TARGET_BRANCH_NAME
```

Ela indica para qual branch o MR está apontando.

Também é possível usar:

```bash
$CI_COMMIT_BRANCH
```

Mas essa variável representa a branch do commit atual. Para decidir comportamento com base no destino do MR, prefira:

```bash
$CI_MERGE_REQUEST_TARGET_BRANCH_NAME
```

---

## Exemplo de `.gitlab-ci.yml`

```yaml
stages:
  - validate
  - test
  - package

default:
  image: node:22
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
      - .vscode-test/

before_script:
  - npm ci

check:
  stage: validate
  script:
    - npm run check
    - npm run compile
  rules:
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "develop"'
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"'
    - if: '$CI_COMMIT_BRANCH == "develop"'
    - if: '$CI_COMMIT_BRANCH == "main"'

unit_tests:
  stage: test
  script:
    - npm run test:unit
  rules:
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "develop"'
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"'
    - if: '$CI_COMMIT_BRANCH == "develop"'
    - if: '$CI_COMMIT_BRANCH == "main"'

extension_tests:
  stage: test
  script:
    - apt-get update
    - apt-get install -y xvfb libgtk-3-0 libnss3 libasound2 libxss1 libgbm1
    - xvfb-run -a npm run test:extension
  rules:
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"'
    - if: '$CI_COMMIT_BRANCH == "main"'

package_vsix:
  stage: package
  script:
    - npm run package
  artifacts:
    paths:
      - "*.vsix"
    expire_in: 7 days
  rules:
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

---

## Fluxo esperado do GitLab CI

### MR para `develop`

Executa:

```bash
npm run check
npm run compile
npm run test:unit
```

Não executa:

```bash
npm run test:extension
npm run package
```

Objetivo:

- validar TypeScript;
- validar build;
- validar regras unitárias;
- manter o runner barato.

### MR para `main`

Executa:

```bash
npm run check
npm run compile
npm run test:unit
npm run test:extension
npm run package
```

Objetivo:

- validar TypeScript;
- validar build;
- validar testes unitários;
- validar comportamento real da extensão no VSCode;
- gerar pacote `.vsix`.

---

## Alternativa: script único que decide o teste pela branch

Também é possível criar um script interno para decidir o comando com base na branch de destino.

Exemplo:

```bash
#!/usr/bin/env bash

set -euo pipefail

TARGET_BRANCH="${CI_MERGE_REQUEST_TARGET_BRANCH_NAME:-${CI_COMMIT_BRANCH:-}}"

echo "Target branch: ${TARGET_BRANCH}"

npm run check
npm run compile
npm run test:unit

if [[ "${TARGET_BRANCH}" == "main" ]]; then
  echo "Running VS Code extension tests..."
  npm run test:extension
else
  echo "Skipping VS Code extension tests for target branch: ${TARGET_BRANCH}"
fi
```

Arquivo sugerido:

```text
scripts/ci-test.sh
```

Permissão:

```bash
chmod +x scripts/ci-test.sh
```

Uso no CI:

```yaml
test:
  stage: test
  script:
    - ./scripts/ci-test.sh
```

---

## GitHub Actions: equivalente futuro

Caso o projeto passe a usar GitHub Actions, a branch de destino do Pull Request pode ser identificada com:

```yaml
github.base_ref
```

Exemplo:

```yaml
if: github.base_ref == 'main'
```

Estratégia equivalente:

```yaml
- name: Run unit tests
  run: npm run test:unit

- name: Run VS Code extension tests
  if: github.base_ref == 'main'
  run: xvfb-run -a npm run test:extension
```

---

## Recomendação final

Para reduzir custo geral do runner:

1. Rodar `check`, `compile` e `test:unit` em MRs para `develop`.
2. Rodar `check`, `compile`, `test:unit`, `test:extension` e `package` em MRs para `main`.
3. Manter testes reais com VSCode apenas no fluxo de estabilização/release.
4. Usar cache para `node_modules` e `.vscode-test`.
5. Refatorar regras sempre que possível para permitir testes unitários puros sem depender da API do VSCode.

---

## Próximos passos

- Criar scripts `test:unit`, `test:extension` e `test:all`.
- Separar testes em `src/test/unit` e `src/test/extension`.
- Criar `.gitlab-ci.yml`.
- Avaliar cache da pasta `.vscode-test`.
- Adicionar job de package `.vsix` somente para `main`.
