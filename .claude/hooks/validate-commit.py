#!/usr/bin/env python3
"""
Hook: Valida mensagens de commit seguindo Conventional Commits.
Bloqueia commits que nao seguem o padrao: tipo: descricao
Tipos validos: feat, fix, chore, docs, style, refactor, test, ci, build, perf, revert
"""

import sys
import json
import re

raw = sys.stdin.read()
# Debug: logar o que chega no hook
import tempfile, os
log_path = os.path.join(tempfile.gettempdir(), "hook_debug.json")
with open(log_path, "w") as f:
    f.write(raw)

data = json.loads(raw)
# Claude Code envia o comando dentro de tool_input.command
tool_input = data.get("tool_input", {})
cmd = tool_input.get("command", "") or data.get("command", "")

# So verifica comandos git commit
if "git commit" not in cmd:
    sys.exit(0)

# Extrai a mensagem do commit (suporta aspas simples e duplas)
match = re.search(r'-m\s+["\']([^"\']+)["\']', cmd)
if not match:
    sys.exit(0)

msg = match.group(1).split("\n")[0].strip()

# Padrao Conventional Commits
pattern = r'^(feat|fix|chore|docs|style|refactor|test|ci|build|perf|revert)(\(.+\))?: .+'

if not re.match(pattern, msg):
    print("", file=sys.stderr)
    print("[BLOQUEADO] Mensagem nao segue Conventional Commits.", file=sys.stderr)
    print('   Recebido:  "' + msg + '"', file=sys.stderr)
    print("", file=sys.stderr)
    print("   Padrao:    tipo: descricao", file=sys.stderr)
    print("   Exemplos:", file=sys.stderr)
    print("     feat: adicionar busca de itens", file=sys.stderr)
    print("     fix: corrigir persistencia do AsyncStorage", file=sys.stderr)
    print("     chore: atualizar dependencias", file=sys.stderr)
    print("", file=sys.stderr)
    print("   Tipos validos: feat, fix, chore, docs, style, refactor, test", file=sys.stderr)
    sys.exit(2)

print("[OK] Commit validado: " + msg)
sys.exit(0)
