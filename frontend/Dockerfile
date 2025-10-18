# 🧱 1단계: 빌드 스테이지 (Node.js + Vue CLI)
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build             # ✅ Vue 프로젝트는 dist/ 폴더 생성됨

# 🚀 2단계: 정적 파일 서빙 (nginx)
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# ✅ (선택) nginx 설정 수정 필요시 여기에 복사
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
