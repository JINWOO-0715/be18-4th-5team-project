// Jenkinsfile (Windows 환경용)

pipeline {

    agent any

    environment {
        // 사용자 환경 변수를 입력하세요.
        DOCKER_REGISTRY = 'docker.io'
        REPO_NAME = '4th-app'
        GIT_OPS_REPO = 'https://github.com/JINWOO-0715/be18-4th-5team-project-manifests.git'
        GIT_OPS_BRANCH = 'main'
        DOCKER_CRED_ID = 'docker-hub-credential'
        GIT_CRED_ID = 'git-push-credential' 
        MANIFEST_PATH = 'Deploy/deployment.yaml' // ArgoCD가 바라보는 매니페스트 파일 경로

        // 자동 생성 변수
        IMAGE_TAG = "${env.BUILD_NUMBER}" 
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${REPO_NAME}-backend:${IMAGE_TAG}"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${REPO_NAME}-frontend:${IMAGE_TAG}"
    }

    stages {
        // 1. 소스코드 체크아웃
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        // 2. 백엔드 빌드 (Windows 명령어 사용)
        stage('Build Backend') {
            steps {
                dir('backend') {
                    // 💡 2. 백엔드 빌드 명령어로 변경하세요. (예: Maven, Gradle, Node 등)
                    bat 'mvn clean package' 
                }
            }
        }

        // 3. 프론트엔드 빌드
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    // 💡 3. 프론트엔드 빌드 명령어로 변경하세요. (npm, yarn 등)
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }

        // 4. 도커 이미지 빌드 및 푸시
        stage('Build & Push Images') {
            steps {
                script {
                    // Docker 로그인 (윈도우 환경에 맞게 withCredentials 사용)
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        // 윈도우에서는 docker login 명령어만 사용해도 됩니다.
                        bat "docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                    }

                    // 백엔드 이미지 빌드/푸시
                    bat "docker build -t ${BACKEND_IMAGE} ./backend"
                    bat "docker push ${BACKEND_IMAGE}"

                    // 프론트엔드 이미지 빌드/푸시
                    bat "docker build -t ${FRONTEND_IMAGE} ./frontend"
                    bat "docker push ${FRONTEND_IMAGE}"
                }
            }
        }

        // 5. GitOps 저장소 업데이트 (새로운 이미지 태그 반영)
        stage('Update GitOps Manifest') {
            steps {
                script {
                    // GitOps 레포지토리 클론
                    bat "git clone ${GIT_OPS_REPO} gitops-clone"
                    dir('gitops-clone') {
                        // Git 인증 정보 설정
                        withCredentials([string(credentialsId: env.GIT_CRED_ID, variable: 'GIT_AUTH_TOKEN')]) { 
                            def GIT_PUSH_URL = "https://${GIT_AUTH_TOKEN}@${env.GIT_OPS_REPO.replace('https://', '')}"
                            bat "git clone ${env.GIT_OPS_REPO} gitops-clone"
                            dir('gitops-clone') {
                            // 2. Kustomize를 사용하여 이미지 태그 패치 (Kustomize가 설치되어 있어야 함!)
                            bat "kustomize edit set image backend-image=${env.BACKEND_IMAGE}"
                            bat "kustomize edit set image frontend-image=${env.FRONTEND_IMAGE}"
                            
                            // 3. 변경 사항 커밋 및 푸시
                            bat 'git config user.email "jenkins@ci.com"'
                            bat 'git config user.name "Jenkins CI"'
                            bat 'git add .'
                            bat "git commit -m \"[CI] Update images to build ${env.IMAGE_TAG}\""
                            
                            // 4. HTTPS 토큰 인증을 사용하는 푸시
                            bat "git push ${GIT_PUSH_URL}"
                        }
                    }
                }
            }
        }
        }
    }
}
