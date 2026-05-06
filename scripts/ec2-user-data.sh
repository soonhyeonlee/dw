#!/bin/bash
set -e
dnf update -y
dnf install -y docker git

# Docker Compose v2 plugin for Amazon Linux 2023
mkdir -p /usr/libexec/docker/cli-plugins
DOCKER_COMPOSE_VERSION=v2.29.7
curl -fsSL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-aarch64" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

systemctl enable --now docker
usermod -aG docker ec2-user

mkdir -p /opt/doublewin
chown ec2-user:ec2-user /opt/doublewin

# Mark ready for health check
touch /var/log/doublewin-bootstrap-done
