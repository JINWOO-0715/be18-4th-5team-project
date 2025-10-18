pipeline {
    agent any 

    // 환경 변수 정의
    environment {
        // --- Credential & URL 설정 ---
        DOCKER_CRED = 'docker-hub-credential'      // Docker Registry 인증 정보 ID
        GIT_CRED = 'git-push-credential'           // Git 푸시 인증 정보 ID
        GIT_MANIFESTS_URL = 'https://github.com/JINWOO-0715/be18-4th-5team-project-manifests.git' // ArgoCD Manifests Repo URL

        // --- 버전 및 이미지 설정 ---
        TAG = "build-${env.BUILD_NUMBER}"          // 고유한 이미지 태그 (빌드 번호 사용)
        BACKEND_IMAGE = "my-registry-id/my-backend"
        FRONTEND_IMAGE = "my-registry-id/my-frontend"
    }

    stages {
        stage('1. Checkout Source Code') {
            steps {
                // 애플리케이션 소스 코드 Repository를 Jenkins 워크스페이스로 가져옵니다.
                checkout scm
            }
        }

        stage('2. Prepare Registry Credential Secret') {
            steps {
                // Kaniko가 인증 정보를 읽을 수 있도록 K8s Secret을 생성/업데이트합니다.
                // withCredentials 블록 내부에서만 사용자 이름과 비밀번호를 노출합니다.
                withCredentials([usernamePassword(credentialsId: DOCKER_CRED, passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    // 셸 스크립트 대신 Groovy 변수를 직접 문자열에 주입
                    def encodedAuth = "${USER}:${PASS}".bytes.encodeBase64().toString()

                    sh """
                    # 임시 파일에 Docker config.json 생성
                    echo '{
                    "auths": {
                        "https://index.docker.io/v1/": {
                        "auth": "${encodedAuth}" // 이미 인코딩된 문자열을 삽입
                        }
                    }
                    }' > config.json

                    # Secret 생성/업데이트
                    kubectl create secret generic regcred --from-file=.dockerconfigjson=config.json \
                    --type=kubernetes.io/dockerconfigjson -n default --dry-run=client -o yaml | kubectl apply -f -
                    
                    rm config.json
                    """
                }
            }
        }

        stage('3. Build & Push Backend Image (Kaniko)') {
            steps {
                script {
                    // Kaniko Pod를 생성하여 백엔드 이미지를 빌드하고 푸시합니다.
                    sh """
                    kubectl run kaniko-backend-${TAG} \\
                      --rm -i --restart=Never \\
                      --namespace=default \\
                      --image=gcr.io/kaniko-project/executor:latest \\
                      --serviceaccount=default \\
                      --attach \\
                      --tty \\
                      --volume type=secret,name=regcred,mountPath=/kaniko/.docker \\
                      --volume type=pvc,name=jenkins-pvc,mountPath=/workspace \\
                      --command -- /kaniko/executor \\
                      --context=dir:///workspace/backend \\
                      --destination=${BACKEND_IMAGE}:${TAG} \\
                      --dockerfile=/workspace/backend/Dockerfile
                    """
                    // (Note: 'jenkins-pvc'는 PVC 이름을 환경에 맞게 수정해야 합니다.)
                }
            }
        }
        
        stage('4. Build & Push Frontend Image (Kaniko)') {
            steps {
                script {
                    // Kaniko Pod를 생성하여 프론트엔드 이미지를 빌드하고 푸시합니다.
                    sh """
                    kubectl run kaniko-frontend-${TAG} \\
                      --rm -i --restart=Never \\
                      --namespace=default \\
                      --image=gcr.io/kaniko-project/executor:latest \\
                      --serviceaccount=default \\
                      --attach \\
                      --tty \\
                      --volume type=secret,name=regcred,mountPath=/kaniko/.docker \\
                      --volume type=pvc,name=jenkins-pvc,mountPath=/workspace \\
                      --command -- /kaniko/executor \\
                      --context=dir:///workspace/frontend \\
                      --destination=${FRONTEND_IMAGE}:${TAG} \\
                      --dockerfile=/workspace/frontend/Dockerfile
                    """
                }
            }
        }


        stage('5. Update ArgoCD Manifests & Trigger CD') {
            steps {
                // 1. ArgoCD가 감시하는 Manifests Repository를 임시 디렉토리로 클론
                dir('manifests-repo') {
                    git url: GIT_MANIFESTS_URL, credentialsId: GIT_CRED
                    
                    // K8s YAML 파일 내의 이미지 태그 수정
                    sh "sed -i 's|image: ${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}:${TAG}|g' Deploy/backend-deployment.yaml"
                    sh "sed -i 's|image: ${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}:${TAG}|g' Deploy/frontend-deployment.yaml"
                    
                    // Git 커밋 및 푸시
                    sh 'git config user.email "pjw1480@naver.com"'
                    sh 'git config user.name "pjw1480"'
                    sh "git commit -am 'CI: Update images to ${TAG}'"
                    sh "git push origin main"
                }
            }
        }
    }

}
