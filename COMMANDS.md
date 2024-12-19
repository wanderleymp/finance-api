# Project Commands and Workflow

## Git Workflow

### Branch Management
1. Cleanup Remote Branches
```bash
# Removed remote branches:
# - origin/1.1.0
# - origin/2.0.0
# - origin/develop-1.0.0.0
# - origin/feature/sales
# - origin/release/1.0.1
```

2. Main and Develop Synchronization
```bash
# Force update main remote
git checkout main
git push origin main -f

# Force update develop remote
git checkout develop
git push origin develop -f
```

3. Feature Branch Creation
```bash
# Create new feature branch for Boleto N8N integration
git checkout develop
git checkout -b feature/boleto-n8n
```

### Deployment Workflow
- Main: Production Ready Code
- Develop: Active Development
- Feature Branches: Specific Feature Development

## Merge Workflows

### Merging Feature Branch to Develop
```bash
# Switch to develop branch
git checkout develop

# Merge feature branch into develop
git merge feature/boleto-n8n

# Push updated develop to remote
git push origin develop
```

### Merging Develop to Main (Release)
```bash
# Switch to main branch
git checkout main

# Merge develop into main
git merge develop

# Create a version tag
git tag -a v1.1.0 -m "Release version 1.1.0"

# Push main and tags to remote
git push origin main
git push origin --tags
```

### Resolving Merge Conflicts
```bash
# If merge conflicts occur
git mergetool
# or manually edit conflicting files
git add .
git commit
```

## Docker Workflow

### Docker Installation
#### Install Docker on Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Set up Docker repository
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

# Install Docker CE
sudo apt-get update
sudo apt-get install -y docker-ce

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional, allows running docker without sudo)
sudo usermod -aG docker $USER
```

#### Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make the binary executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

#### Verify Docker Installation
```bash
# Check Docker version
docker --version

# Test Docker is working
docker run hello-world
```

### Building Docker Image from Develop Branch
```bash
# Ensure you are on develop branch
git checkout develop

# Build Docker image
docker build -t finance-api:develop .

# Optional: Tag for registry
docker tag finance-api:develop wanderleymp/finance-api:develop

# Optional: Push to Docker Hub
docker push wanderleymp/finance-api:develop
```

### Running Docker Container
```bash
# Run the develop image
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e JWT_SECRET=your_secret \
  finance-api:develop
```

### Docker Compose for Development
```yaml
version: '3.8'
services:
  api:
    image: finance-api:develop
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/finance
      - JWT_SECRET=your_secret
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=finance
      - POSTGRES_PASSWORD=your_password
```

## Docker Update and Image Deployment

### Update Docker Engine
```bash
# Update package index
sudo apt-get update

# Uninstall old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

### Build and Deploy Develop Image

#### Prepare Dockerfile
```bash
# Ensure Dockerfile exists in project root
# Example Dockerfile content:
# FROM node:14
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["npm", "start"]
```

#### Build Docker Image
```bash
# Ensure you're in the project root
cd /root/finance-api

# Build the image
docker build -t finance-api:develop .
```

#### Push to Docker Hub (Optional)
```bash
# Login to Docker Hub
docker login

# Tag the image
docker tag finance-api:develop wanderleymp/finance-api:develop

# Push to Docker Hub
docker push wanderleymp/finance-api:develop
```

#### Deploy Locally
```bash
# Stop existing container (if any)
docker stop finance-api-develop || true
docker rm finance-api-develop || true

# Run new container
docker run -d \
  --name finance-api-develop \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e JWT_SECRET=your_secret \
  finance-api:develop
```

#### Docker Compose Deployment
```bash
# Create docker-compose.yml
version: '3.8'
services:
  api:
    image: finance-api:develop
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/finance
      - JWT_SECRET=your_secret
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=finance
      - POSTGRES_PASSWORD=your_password

# Deploy with Docker Compose
docker-compose up -d
```

### Cleanup Old Images
```bash
# Remove dangling images
docker image prune

# Remove all unused images
docker image prune -a

# Remove specific image
docker rmi finance-api:develop
```

## Next Steps
- Implement Boleto N8N Integration
- Regular commits to feature/boleto-n8n
- Merge to develop when feature is complete
