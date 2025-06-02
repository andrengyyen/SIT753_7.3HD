pipeline {
    agent any
    environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN') // Binds the SONAR_TOKEN credential to an environment variable
        DOCKER_TOKEN = credentials('DOCKER_TOKEN')
        def version = "v${env.BUILD_NUMBER}"
    }
    tools {
        nodejs 'NodeJS' // Match the name from Global Tool Configuration
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/andrengyyen/SIT753_7.3HD.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                sh 'npm rebuild sqlite3 bcrypt --build-from-source'
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -t shopping-website:${version} .'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm test || true'
            }
        }
        stage('SonarCloud Code Quality Analysis') {
            steps {
                sh '''
                    # Download and extract SonarScanner CLI
                    curl -o sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.1.0.4889.zip
                    unzip -o sonar-scanner.zip
                    rm -rf sonar-scanner || true
                    mv sonar-scanner-7.1.0.4889 sonar-scanner
                    ./sonar-scanner/bin/sonar-scanner \
                        -Dsonar.projectKey=andrengyyen_SIT753_7.3HD \
                        -Dsonar.organization=andrengyyen \
                        -Dsonar.host.url=https://sonarcloud.io \
                        -Dsonar.login=$SONAR_TOKEN
                '''
            }
        }
        stage('Snyk Security Scan') {
            steps {
                echo 'Running Snyk Dependency Scan...'
                snykSecurity(
                    snykInstallation: 'Snyk',
                    snykTokenId: 'SNYK_TOKEN',
                    organisation: 'andrengyyen',
                    projectName: 'andrengyyen_SIT753_7.3HD',
                    severity: 'low',
                    additionalArguments: '--json --severity-threshold=low --file=package.json'
                )
            }
        }
        stage('Deploy') {
            steps {
                script {
                    // Use docker-compose to deploy
                    sh 'docker-compose -f docker-compose.yaml down || true'
                    sh 'docker-compose -f docker-compose.yaml up -d'
                }
            }
        }
        stage('Release') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'DOCKER_TOKEN', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        sh 'docker tag shopping-website:${version} $DOCKER_USER/shopping-website:${version}'
                        sh 'docker push $DOCKER_USER/shopping-website:${version}'
                        sh 'export BUILD_VERSION=${version} && docker-compose -f docker-compose.yml down && docker-compose -f docker-compose.yml up -d'
                    }
                }
            }
        }
    }
}
