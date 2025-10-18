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
                command:
                - cat
                tty: true
                volumeMounts:
                - mountPath: "/var/run/docker.sock"
                  name: docker-socket
              volumes:
              - name: docker-socket
                hostPath:
                  path: "/var/run/docker.sock"
            '''
        }
    }

    environment {
        FRONTEND_IMAGE_NAME = 'pjw1480/4th-frontend'       
        BACKEND_IMAGE_NAME = 'pjw1480/4th-backend'    
        DOCKER_CREDENTIALS_ID = 'docker-hub-credential	'
    }

    stages {
        stage('Detect Changes') {
            steps {
                script {
                    def changedFiles = sh(script: 'git diff --name-only HEAD~1', returnStdout: true).trim().split("\n")
                    echo "Changed files:\n${changedFiles.join('\n')}"
                    
                    // [수정됨]: 변경 감지 폴더 경로를 4th-frontend/ 와 4th-backend/로 변경
                    env.SHOULD_BUILD_FRONTEND = changedFiles.any { it.startsWith("4th-frontend/") } ? "true" : "false"
                    env.SHOULD_BUILD_BACKEND = changedFiles.any { it.startsWith("4th-backend/") } ? "true" : "false"

                    // [수정됨]: 환경 변수 이름 변경
                    echo "SHOULD_BUILD_FRONTEND : ${SHOULD_BUILD_FRONTEND}"
                    echo "SHOULD_BUILD_BACKEND : ${SHOULD_BUILD_BACKEND}"
                }
            }
        }

        stage('Docker Login') {
            steps {
                container('docker') {
                    sh 'docker logout'

                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                    }
                }
            }
        }

        stage('Frontend Image Build & Push') {
            when { expression { return env.SHOULD_BUILD_FRONTEND == "true" } }
            
            steps {
                container('docker') {
                    dir('4th-frontend') { // [수정됨]: 폴더 경로 변경
                        script {
                            def buildNumber = "${env.BUILD_NUMBER}"
                            withEnv(["DOCKER_IMAGE_VERSION=${buildNumber}"]) {
                                sh 'docker -v'
                                // [수정됨]: FRONTEND_IMAGE_NAME 변수 사용
                                sh 'echo $FRONTEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                                sh 'docker build --no-cache -t $FRONTEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION ./'
                                sh 'docker image inspect $FRONTEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                                sh 'docker push $FRONTEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                            }
                        }
                    }
                }
            }
        }

        stage('Backend Image Build & Push') {
            when { expression { return env.SHOULD_BUILD_BACKEND == "true" } }

            steps {
                container('docker') {
                    dir('4th-backend') { // [수정됨]: 폴더 경로 변경
                        script {
                            def buildNumber = "${env.BUILD_NUMBER}"
                            withEnv(["DOCKER_IMAGE_VERSION=${buildNumber}"]) {
                                sh 'docker -v'
                                // [수정됨]: BACKEND_IMAGE_NAME 변수 사용
                                sh 'echo $BACKEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                                sh 'docker build --no-cache -t $BACKEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION ./'
                                sh 'docker image inspect $BACKEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                                sh 'docker push $BACKEND_IMAGE_NAME:$DOCKER_IMAGE_VERSION'
                            }
                        }
                    }
                }
            }
        }

        stage('Trigger k8s-manifests') {
            steps {
                script {
                    def buildNumber = "${env.BUILD_NUMBER}"
                    // DOCKER_IMAGE_VERSION은 buildNumber와 동일하므로, 아래 withEnv 블록은 사실상 필요 없습니다.
                    // 간결성을 위해 제거하고 바로 build job을 호출하겠습니다.

                    build job: '4th-k8s-manifests', 
                        parameters: [
                            string(name: 'DOCKER_IMAGE_VERSION', value: "${buildNumber}"), // env.BUILD_NUMBER를 직접 사용
                            string(name: 'DID_BUILD_FRONTEND', value: "${env.SHOULD_BUILD_FRONTEND}"), // [수정됨]: 파라미터 이름 변경
                            string(name: 'DID_BUILD_BACKEND', value: "${env.SHOULD_BUILD_BACKEND}")   // [수정됨]: 파라미터 이름 변경
                        ],
                        wait: true
                }
            }
        }
    }
}
