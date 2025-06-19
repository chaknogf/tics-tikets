#!/bin/bash

echo "🚀 Iniciando despliegue de la app 'Solicitudes'..."

# Ruta al proyecto Angular (según nombre del repo)
PROYECTO_DIR="/home/matrix/Programas/tics-tikets"
DIST_DIR="$PROYECTO_DIR/dist/solicitudes"
DESTINO="/var/www/solicitudes"
BASE_HREF="/solicitudes/"

# 1. Ir al directorio del proyecto
cd "$PROYECTO_DIR" || { echo "❌ No se pudo acceder al proyecto"; exit 1; }

# 2. Ejecutar build con base-href personalizado
echo "🏗️ Ejecutando build con base-href=$BASE_HREF..."
ng build --base-href="$BASE_HREF" --configuration=production || { echo "❌ Error durante el build"; exit 1; }

# 3. Verificar que el dist existe
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ No se encontró el directorio de salida: $DIST_DIR"
    exit 1
fi

# 4. Crear destino si no existe
echo "📁 Creando destino en $DESTINO si no existe..."
sudo mkdir -p "$DESTINO"

# 5. Limpiar destino anterior
echo "🧹 Limpiando archivos antiguos en $DESTINO"
sudo rm -rf "$DESTINO"/*

# 6. Copiar archivos al destino
echo "📂 Copiando archivos compilados a $DESTINO"
sudo cp -r "$DIST_DIR"/* "$DESTINO"/

# 7. Asignar permisos (nginx como propietario)
echo "🔐 Ajustando permisos para nginx"
sudo chown -R nginx:nginx "$DESTINO"
sudo chmod -R 755 "$DESTINO"

# 8. Verificar configuración de Nginx
echo "🔁 Verificando configuración de Nginx..."
sudo nginx -t || { echo "❌ Error en la configuración de Nginx"; exit 1; }

# 9. Recargar Nginx
echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

# 10. Final
echo "✅ Despliegue completado correctamente. Visite:"
echo "🌐 https://hgtecpan.duckdns.org/solicitudes/"
