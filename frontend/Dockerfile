FROM node:alpine3.22 as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
FROM nginx:stable-alpine3.21
COPY --from=builder /app/dist /usr/share/nginx/html
ENV TZ=Asia/Seoul
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
