// Jenkinsfile (Kubernetes Agent 환경 - 리눅스/컨테이너 기반)

pipeline {
    // 💡 Agent 설정: 빌드에 필요한 툴이 포함된 컨테이너를 가진 Pod를 동적으로 생성합니다.
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  name: jenkins-build-agent-pod
spec:
  containers:
  - name: maven
    image: maven:3.9.5-eclipse-temurin-17
    command: ["cat"]
    tty: true
    workingDir: /home/jenkins/agent/workspace/${JOB_NAME}
  - name: node
    image: node:20-alpine
    command: ["cat"]
    tty: true
    workingDir: /home/jenkins/agent/workspace/${JOB_NAME}
  - name: docker
    image: docker:27.0.7-cli-alpine3.20 
    command: ["cat"]
    tty: true
    volumeMounts:
    - mountPath: "/var/run/docker.sock"
      name: docker-socket
  volumes:
  - name: docker-socket
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }

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
        // 1. 소스코드 체크아웃 (기본 컨테이너에서 수행)
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        // 2. 백엔드 빌드 (Maven 컨테이너 사용)
        stage('Build Backend') {
            steps {
                container('maven') { // 💡 Maven이 설치된 컨테이너 사용
                    dir('backend') {
                        sh 'mvn clean package' // sh 명령어 사용
                    }
                }
            }
        }

        // 3. 프론트엔드 빌드 (Node 컨테이너 사용)
        stage('Build Frontend') {
            steps {
                container('node') { // 💡 Node가 설치된 컨테이너 사용
                    dir('frontend') {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
            }
        }

        // 4. 도커 이미지 빌드 및 푸시 (Docker 컨테이너 사용)
        stage('Build & Push Images') {
            steps {
                container('docker') { // 💡 Docker CLI가 설치된 컨테이너 사용
                    script {
                        // Docker 로그인
                        withCredentials([usernamePassword(credentialsId: env.DOCKER_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
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
        }

        // 5. GitOps 저장소 업데이트 (Git/Kustomize 명령 실행)
        stage('Update GitOps Manifest') {
            steps {
                container('docker') { // 💡 Git 및 Kustomize 실행 환경으로 'docker' 컨테이너 사용
                    script {
                        withCredentials([string(credentialsId: env.GIT_CRED_ID, variable: 'GIT_AUTH_TOKEN')]) { 
                            
                            def GIT_PUSH_URL = "https://${GIT_AUTH_TOKEN}@${env.GIT_REPO_HOST}"
                            
                            // GitOps 레포지토리 클론
                            sh "git clone ${env.GIT_OPS_REPO} gitops-clone"

                            dir('gitops-clone') {
                                sh 'git config user.email "jenkins@ci.com"'
                                sh 'git config user.name "Jenkins CI"'

                                // Kustomize를 사용하여 이미지 태그 패치 (컨테이너 내에 Kustomize가 설치되어 있어야 함!)
                                // Docker 이미지(alpine 기반)에는 기본적으로 kustomize가 없으므로, 
                                // 이 단계가 실패하면 kustomize를 설치하는 명령을 추가하거나, kustomize가 포함된 이미지를 사용해야 합니다.
                                sh "kustomize edit set image backend-image=${env.BACKEND_IMAGE}"
                                sh "kustomize edit set image frontend-image=${env.FRONTEND_IMAGE}"
                                
                                // 변경 사항 커밋 및 푸시
                                sh 'git add .'
                                sh "git commit -m \"[CI] Update images to build ${env.IMAGE_TAG}\""
                                sh "git push ${GIT_PUSH_URL}"
                            }
                        }
                    }
                }
            }
        }
    }
}
