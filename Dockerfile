# Etapa 1: build de React
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir la app con 'serve'
FROM node:20 AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist /app
EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"] 