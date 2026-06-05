#!/bin/bash
# GreenTrace ID — Arranque completo (backend + frontend + puertos públicos)
# Uso: ./start.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/greentrace-id/backend"
FRONTEND="$ROOT/greentrace-id/frontend"

echo "🧹 Liberando puertos 3001 y 5173..."
lsof -ti:3001,5173,5174 | xargs -r kill -9 2>/dev/null || true
sleep 1

echo "🌱 Arrancando backend (puerto 3001)..."
cd "$BACKEND"
nohup npm run dev > /tmp/greentrace-backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID backend: $BACKEND_PID"

# Esperar a que el backend esté listo
echo "   Esperando conexión a la base de datos..."
for i in $(seq 1 15); do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend listo."
    break
  fi
  sleep 1
done

echo ""
echo "🌐 Arrancando frontend (puerto 5173)..."
cd "$FRONTEND"
nohup npm run dev > /tmp/greentrace-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID frontend: $FRONTEND_PID"
sleep 3

echo ""
echo "🔓 Haciendo puertos públicos en Codespaces..."
CODESPACE_NAME=$(gh codespace list --json name -q '.[0].name' 2>/dev/null || echo "")
if [ -n "$CODESPACE_NAME" ]; then
  gh codespace ports visibility 3001:public 5173:public --codespace "$CODESPACE_NAME" 2>/dev/null && echo "   ✅ Puertos públicos."
else
  echo "   ⚠️  No se pudo obtener el nombre del Codespace. Haz públicos los puertos manualmente en la pestaña PORTS."
fi

echo ""
echo "=============================================="
echo "  ✅ GreenTrace ID corriendo"
echo "----------------------------------------------"
CODESPACE_BASE=$(gh codespace list --json name -q '.[0].name' 2>/dev/null | sed 's/\(.*\)/\1/' || echo "")
if [ -n "$CODESPACE_BASE" ]; then
  echo "  Frontend: https://${CODESPACE_BASE}-5173.app.github.dev"
  echo "  Backend:  https://${CODESPACE_BASE}-3001.app.github.dev"
else
  echo "  Frontend: http://localhost:5173"
  echo "  Backend:  http://localhost:3001"
fi
echo "=============================================="
echo ""
echo "  Logs en tiempo real:"
echo "    Backend:  tail -f /tmp/greentrace-backend.log"
echo "    Frontend: tail -f /tmp/greentrace-frontend.log"
echo ""
echo "  Para detener todo:"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo ""
