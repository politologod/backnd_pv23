#!/bin/bash

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Terminar cualquier proceso de ngrok existente
echo "Terminando procesos de ngrok anteriores..."
pkill -f ngrok || true

# Exportar variable de entorno para indicar que estamos usando ngrok
echo "Configurando entorno para ngrok..."
export USING_NGROK=true
export NODE_ENV=development

# Reiniciar la aplicación con PM2 si está instalado
if command -v pm2 &> /dev/null; then
  echo "Reiniciando la aplicación con PM2..."
  pm2 restart puravida-backend || pm2 start src/app.js --name "puravida-backend" --env-production "USING_NGROK=true"
else
  # Iniciar la aplicación normalmente en background
  echo "Iniciando la aplicación con Node..."
  USING_NGROK=true node src/app.js &
  APP_PID=$!
  echo "Aplicación iniciada con PID: $APP_PID"
fi

# Esperar un momento para que la aplicación inicie correctamente
echo "Esperando 5 segundos para que la aplicación inicie..."
sleep 5

# Iniciar ngrok con el archivo de configuración
echo "Iniciando ngrok..."
ngrok start -config=ngrok.yml backend

# Al cerrar, limpiar procesos
echo "Cerrando procesos..."
if [ -n "$APP_PID" ]; then
  echo "Terminando aplicación con PID: $APP_PID"
  kill $APP_PID || true
fi
pkill -f ngrok || true

echo "Hecho. El túnel de ngrok ha sido cerrado."

# IMPORTANTE: Recuerda que necesitas actualizar la URL en tu frontend de Vercel
echo "---------------------------------------------"
echo "RECUERDA: Actualiza la URL de la API en Vercel"
echo "Variables de entorno > NEXT_PUBLIC_API_URL"
echo "---------------------------------------------" 