#!/bin/sh
# Script para ejecutar seed en producción

echo "🌱 Ejecutando seed de base de datos..."

# Verificar si el archivo seed compilado existe
if [ ! -f "dist/seed.js" ]; then
  echo "❌ Error: dist/seed.js no encontrado"
  echo "El build de TypeScript puede no haber incluido seed.ts"
  exit 1
fi

# Ejecutar seed
node dist/seed.js

if [ $? -eq 0 ]; then
  echo "✅ Seed ejecutado exitosamente"
else
  echo "❌ Error al ejecutar seed"
  exit 1
fi
