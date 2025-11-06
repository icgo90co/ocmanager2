#!/bin/bash

# Script de inicio rápido para OrderFlow
# Este script configura e inicia la aplicación completa

set -e

echo "🚀 OrderFlow - Inicio Rápido"
echo "=============================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker no está instalado. Por favor instala Docker y Docker Compose.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose no está instalado.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Paso 1: Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Paso 2: Iniciando contenedores Docker...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Esperando que los servicios estén listos...${NC}"
sleep 10

echo ""
echo -e "${BLUE}🗄️  Paso 3: Ejecutando migraciones de base de datos...${NC}"
docker compose exec -T api npx prisma migrate deploy

echo ""
echo -e "${BLUE}🌱 Paso 4: Poblando base de datos con datos de ejemplo...${NC}"
docker compose exec -T api npm run seed

echo ""
echo -e "${GREEN}✅ ¡Instalación completada exitosamente!${NC}"
echo ""
echo "=============================="
echo -e "${BLUE}📍 Accede a la aplicación:${NC}"
echo ""
echo -e "  Frontend:     ${GREEN}http://localhost:5173${NC}"
echo -e "  API:          ${GREEN}http://localhost:3001${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo "=============================="
echo -e "${BLUE}🔑 Credenciales de prueba:${NC}"
echo ""
echo -e "  ${GREEN}Administrador:${NC}"
echo -e "    Email:    admin@ocmanager.com"
echo -e "    Password: admin123"
echo ""
echo -e "  ${GREEN}Cliente:${NC}"
echo -e "    Email:    cliente@acme.com"
echo -e "    Password: cliente123"
echo ""
echo "=============================="
echo -e "${BLUE}📚 Comandos útiles:${NC}"
echo ""
echo -e "  Ver logs:           ${YELLOW}docker compose logs -f${NC}"
echo -e "  Detener servicios:  ${YELLOW}docker compose down${NC}"
echo -e "  Reiniciar:          ${YELLOW}docker compose restart${NC}"
echo ""
echo -e "${GREEN}¡Disfruta usando OrderFlow! 🎉${NC}"
