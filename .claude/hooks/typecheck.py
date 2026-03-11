#!/usr/bin/env python3
"""
Hook: Roda TypeScript check apos editar arquivos .ts/.tsx.
"""

import sys
import json
import subprocess
import os

data = json.load(sys.stdin)

# Pega o arquivo que foi editado
file_path = data.get("file_path", "")

# So roda para arquivos TypeScript
if not (file_path.endswith(".ts") or file_path.endswith(".tsx")):
    sys.exit(0)

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("[TypeScript] Verificando " + os.path.basename(file_path) + "...")

result = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    cwd=project_root,
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print("", file=sys.stderr)
    print("[AVISO] Erros de TypeScript encontrados:", file=sys.stderr)
    print(result.stdout, file=sys.stderr)
    print(result.stderr, file=sys.stderr)
else:
    print("[OK] TypeScript sem erros de tipos.")

sys.exit(0)
