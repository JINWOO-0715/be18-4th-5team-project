# university-vue/Dockerfile
# -------------------- 1단계: 빌드 환경 (패키징) --------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Vue 프로젝트의 빌드 명령어로 수정 (npm run build가 일반적)
RUN npm run build 

# -------------------- 2단계: 최종 실행 환경 (경량 Nginx 서빙) --------------------
FROM nginx:stable-alpine
# Nginx 설정 파일이 있다면 복사 (선택 사항)
# COPY nginx.conf /etc/nginx/nginx.conf

# 1단계에서 빌드된 정적 파일(패키징 결과물)을 Nginx 웹 루트에 복사
# (일반적으로 Vue CLI는 dist 폴더를 생성합니다.)
COPY --from=builder /app/dist /usr/share/nginx/html 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
