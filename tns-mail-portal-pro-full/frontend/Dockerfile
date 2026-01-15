
# build stage
FROM node:20-alpine as build
WORKDIR /app

# 1) Install ALL deps (including dev) so vite/tailwind are available to build
COPY package*.json ./
RUN npm install

# 2) Build the React app
COPY . .
RUN npm run build

# run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
