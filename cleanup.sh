#!/bin/bash

# Script de limpieza para OrderFlow

echo "🧹 OrderFlow - Limpieza de servicios"
echo "====================================="
echo ""

read -p "⚠️  Esto detendrá todos los contenedores. ¿Continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada."
    exit 1
fi

echo "Deteniendo contenedores..."
docker compose down

read -p "¿Eliminar también los volúmenes de base de datos? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Eliminando volúmenes..."
    docker compose down -v
    echo "✅ Volúmenes eliminados"
fi

echo ""
echo "✅ Limpieza completada"
