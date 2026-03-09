# Lista de Mercado — Contexto do Projeto

## O que é este projeto
App mobile de lista de compras construído com React Native + Expo. Projeto de aprendizado do Claude Code por Luis Diniz, PM em Platform Engineering.

**Objetivo principal:** Aprender Claude Code usando o desenvolvimento do app como veículo de aprendizado.

## Stack técnica
- **Framework:** React Native 0.83 com Expo 55
- **Linguagem:** TypeScript
- **Teste no dispositivo:** Expo Go (Android)
- **Controle de versão:** Git + GitHub (`laugustodiniz/lista-de-mercado-app`)

## Comandos essenciais
```bash
# Rodar o app (gera QR code para Expo Go)
cd "C:\Users\laugu\OneDrive\Documentos\lista-de-mercado-app"
npm start

# Instalar nova dependência
npm install <pacote>

# Ver status do git
git status

# Criar PR no GitHub
gh pr create
```

## Estrutura de arquivos
```
App.tsx              # Componente raiz
components/          # Componentes reutilizáveis
hooks/               # Lógica de estado (hooks customizados)
constants/           # Tipos TypeScript e constantes
assets/              # Imagens e ícones
```

## Funcionalidades planejadas
- [x] Projeto inicializado
- [ ] Tela principal com lista de itens
- [ ] Adicionar item
- [ ] Marcar item como comprado
- [ ] Deletar item
- [ ] Persistência local com AsyncStorage

## Convenções de código
- Componentes: PascalCase (ex: `ItemCard.tsx`)
- Hooks: camelCase com prefixo `use` (ex: `useShoppingList.ts`)
- Commits: formato conventional commits (`feat:`, `fix:`, `chore:`)
- Sempre TypeScript — sem `any`

## Contexto do usuário
Luis é PM em Platform Engineering. Prefere:
- Explicações em português
- Quando modificar código, explicar o "por quê" além do "o quê"
- Destacar conceitos do Claude Code ao longo do desenvolvimento
- Respostas concisas, sem enrolação

## GitHub workflow
```
master → branch de feature → PR → merge
```
Sempre criar branch antes de desenvolver uma nova feature.
