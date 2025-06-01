# Use the official Jenkins LTS image as base
FROM jenkins/jenkins:lts

# Switch to root user to install packages
USER root

# Install build tools for sqlite3 and bcrypt
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Switch back to Jenkins user
USER jenkins
