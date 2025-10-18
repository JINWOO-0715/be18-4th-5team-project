pipeline {
    agent {
        kubernetes {
            yaml '''
            apiVersion: v1
            kind: Pod
            metadata:
              name: jenkins-agent
            spec:
              containers:
              - name: docker
                image: docker:28.5.1-cli-alpine3.22
                command: [ "cat" ]
                tty: true
                volumeMounts:
                  - mountPath: /var/run/docker.sock
                    name: docker-socket
              volumes:
              - name: docker-socket
                hostPath:
                  path: /var/run/docker.sock
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
                    dir('backend') {
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
                            docker build -f Dockerfile -t ${BACKEND_IMAGE}:${tag} .
                            docker push ${BACKEND_IMAGE}:${tag}
                            """
                        }
                    }
                }
            }
        }

        stage('Docker Build & Push - Frontend') {
            steps {
                container('docker') {
                    dir('frontend') {
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
                            docker build -t ${FRONTEND_IMAGE}:${tag} .
                            docker push ${FRONTEND_IMAGE}:${tag}
                            """
                        }
                    }
                }
            }
        }

        stage('Trigger ArgoCD Manifest Repo') {
            steps {
                script {
                    def tag = "v${env.BUILD_NUMBER}"

                    // ArgoCD 매니페스트 프로젝트에 이미지 태그 업데이트 등 수행하도록 트리거
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
