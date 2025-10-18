pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  name: jenkins-agent
spec:
  volumes:
    - name: docker-socket
      hostPath:
        path: /var/run/docker.sock
    - name: workspace-volume
      emptyDir: {}   # ✅ jnlp와 docker 컨테이너가 workspace 공유
  containers:
    - name: docker
      image: docker:28.5.1-cli-alpine3.22
      command: ["cat"]
      tty: true
      volumeMounts:
        - name: docker-socket
          mountPath: /var/run/docker.sock
        - name: workspace-volume
          mountPath: /home/jenkins/agent   # ✅ 공유된 워크스페이스
    - name: jnlp
      image: jenkins/inbound-agent:3341.v0766d82b_dec0-1
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent   # ✅ 동일하게 공유
'''
        }
    }

    environment {
        BACKEND_IMAGE = 'pjw1480/4th-backend-app'
        FRONTEND_IMAGE = 'pjw1480/4th-frontend-app'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credential'
    }

    stages {
        stage('Docker Build & Push - Backend') {
            steps {
                container('docker') {
                    script {
                        def tag = "v${env.BUILD_NUMBER}"

                        withCredentials([usernamePassword(
                            credentialsId: DOCKER_CREDENTIALS_ID,
                            usernameVariable: 'DOCKER_USERNAME',
                            passwordVariable: 'DOCKER_PASSWORD'
                        )]) {
                            sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                        }

                        sh """
                        docker build -f backend/Dockerfile -t ${BACKEND_IMAGE}:${tag} backend/
                        docker push ${BACKEND_IMAGE}:${tag}
                        """
                    }
                }
            }
        }

        stage('Docker Build & Push - Frontend') {
            steps {
                container('docker') {
                    script {
                        def tag = "v${env.BUILD_NUMBER}"

                        withCredentials([usernamePassword(
                            credentialsId: DOCKER_CREDENTIALS_ID,
                            usernameVariable: 'DOCKER_USERNAME',
                            passwordVariable: 'DOCKER_PASSWORD'
                        )]) {
                            sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                        }

                        sh """
                        docker build -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${tag} frontend/
                        docker push ${FRONTEND_IMAGE}:${tag}
                        """
                    }
                }
            }
        }

        stage('Trigger ArgoCD Manifest Repo') {
            steps {
                script {
                    def tag = "v${env.BUILD_NUMBER}"
                    build job: 'be18-4th-5team-project-manifests',
                        parameters: [
                            string(name: 'BACKEND_IMAGE_TAG', value: tag),
                            string(name: 'FRONTEND_IMAGE_TAG', value: tag)
                        ],
                        wait: true
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline completed with result: ${currentBuild.currentResult}"
        }
    }
}
