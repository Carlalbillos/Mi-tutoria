FROM node:20-alpine

WORKDIR /app

# Copiamos primero el package.json para aprovechar el caché de capas
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto definido en la app
EXPOSE 3000

# Iniciamos la aplicación
CMD ["npm", "start"]
