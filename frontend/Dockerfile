FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# 빌드 결과물이 /app/build 또는 /app/dist 에 생성된다고 가정하고 경로 수정 필요
COPY --from=build /app/build /usr/share/nginx/html 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
