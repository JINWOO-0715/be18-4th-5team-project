// Jenkinsfile (Linux/Shell 환경용으로 수정됨)

pipeline {

    agent any // 현재 Jenkins가 실행되는 기본 노드(Linux 기반)를 사용합니다.

    environment {
        // 사용자 환경 변수 (기존과 동일)
        DOCKER_REGISTRY = 'docker.io'
        REPO_NAME = '4th-app'
        GIT_OPS_REPO = 'https://github.com/JINWOO-0715/be18-4th-5team-project-manifests.git'
        GIT_OPS_BRANCH = 'main'
        DOCKER_CRED_ID = 'docker-hub-credential'
        GIT_CRED_ID = 'git-push-credential' 
        MANIFEST_PATH = 'Deploy/deployment.yaml' 

        // 자동 생성 변수
        IMAGE_TAG = "${env.BUILD_NUMBER}" 
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${REPO_NAME}-backend:${IMAGE_TAG}"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${REPO_NAME}-frontend:${IMAGE_TAG}"

        // Git 푸시 URL의 호스트 부분만 추출
        GIT_REPO_HOST = "${GIT_OPS_REPO.replace('https://', '')}"
    }

    stages {
        // 1. 소스코드 체크아웃
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        // 2. 백엔드 빌드 (sh 명령어 사용)
        stage('Build Backend') {
            steps {
                dir('backend') {
                    // Windows bat -> Linux sh 로 변경
                    sh 'mvn clean package' 
                }
            }
        }

        // 3. 프론트엔드 빌드 (sh 명령어 사용)
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    // Windows bat -> Linux sh 로 변경
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        // 4. 도커 이미지 빌드 및 푸시 (sh 명령어 사용)
        stage('Build & Push Images') {
            steps {
                script {
                    // Docker 로그인 (Linux sh 환경에 맞게 withCredentials와 echo 사용)
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        // 비밀번호를 stdin으로 전달
                        sh "echo ${DOCKER_PASS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin"
                    }

                    // 백엔드 이미지 빌드/푸시
                    sh "docker build -t ${BACKEND_IMAGE} ./backend"
                    sh "docker push ${BACKEND_IMAGE}"

                    // 프론트엔드 이미지 빌드/푸시
                    sh "docker build -t ${FRONTEND_IMAGE} ./frontend"
                    sh "docker push ${FRONTEND_IMAGE}"
                }
            }
        }

        // 5. GitOps 저장소 업데이트 (새로운 이미지 태그 반영)
        stage('Update GitOps Manifest') {
            steps {
                script {
                    // Git 인증 정보 설정
                    withCredentials([string(credentialsId: env.GIT_CRED_ID, variable: 'GIT_AUTH_TOKEN')]) { 
                        
                        // HTTPS 푸시 URL 정의
                        def GIT_PUSH_URL = "https://${GIT_AUTH_TOKEN}@${env.GIT_REPO_HOST}"
                        
                        // GitOps 레포지토리 클론 (gitops-clone 디렉토리 생성)
                        // 'git clone ${GIT_OPS_REPO} gitops-clone'
                        sh "git clone ${env.GIT_OPS_REPO} gitops-clone"

                        dir('gitops-clone') {
                            // 💡 Git 인증 정보 설정 (클론과 푸시 모두 필요)
                            sh 'git config user.email "jenkins@ci.com"'
                            sh 'git config user.name "Jenkins CI"'

                            // Kustomize를 사용하여 이미지 태그 패치 (Kustomize가 설치되어 있어야 함!)
                            // sh로 변경
                            sh "kustomize edit set image backend-image=${env.BACKEND_IMAGE}"
                            sh "kustomize edit set image frontend-image=${env.FRONTEND_IMAGE}"
                            
                            // 변경 사항 커밋 및 푸시
                            sh 'git add .'
                            sh "git commit -m \"[CI] Update images to build ${env.IMAGE_TAG}\""
                            
                            // HTTPS 토큰 인증을 사용하는 푸시
                            // sh로 변경 및 PAT 변수 사용
                            sh "git push ${GIT_PUSH_URL}"
                        }
                    }
                }
            }
        }
    }
}
