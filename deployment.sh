#!/bin/bash

# deploy.sh - Complete deployment script
set -e

echo "🚀 Starting microservices deployment..."

# Create namespace
echo "📦 Creating namespace..."
kubectl create namespace gaitor-app --dry-run=client -o yaml | kubectl apply -f -

# Deploy PostgreSQL Database
echo "🗄️ Deploying database..."
kubectl create deployment database-deployment \
  --image=postgres:15-alpine \
  --port=5432 \
  -n gaitor-app \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl set env deployment/database-deployment \
  POSTGRES_DB=appdb \
  POSTGRES_USER=appuser \
  POSTGRES_PASSWORD=apppassword123 \
  -n gaitor-app

kubectl expose deployment database-deployment \
  --name=database-service \
  --port=5432 \
  --target-port=5432 \
  --type=ClusterIP \
  -n gaitor-app \
  --dry-run=client -o yaml | kubectl apply -f -

# Create ConfigMap
echo "⚙️ Creating database config..."
kubectl create configmap database-config \
  --from-literal=database-host="database-service" \
  --from-literal=database-port="5432" \
  --from-literal=database-name="appdb" \
  --from-literal=database-user="appuser" \
  --from-literal=database-password="apppassword123" \
  --from-literal=database-connection-string="postgresql://appuser:apppassword123@database-service:5432/appdb" \
  -n gaitor-app \
  --dry-run=client -o yaml | kubectl apply -f -

## Deploy Controller
#echo "🎮 Deploying controller..."
#kubectl create deployment controller-deployment \
#  --image=controller:latest \
#  --port=3001 \
#  -n microservices-app \
#  --dry-run=client -o yaml | kubectl apply -f -
#
#kubectl set env deployment/controller-deployment \
#  --from=configmap/database-config \
#  -n microservices-app
#
#kubectl expose deployment controller-deployment \
#  --name=controller-service \
#  --port=3001 \
#  --target-port=3001 \
#  --type=ClusterIP \
#  -n microservices-app \
#  --dry-run=client -o yaml | kubectl apply -f -
#
## Deploy UI
#echo "🖥️ Deploying UI..."
#kubectl create deployment ui-deployment \
#  --image=ui:latest \
#  --port=80 \
#  -n microservices-app \
#  --dry-run=client -o yaml | kubectl apply -f -
#
#kubectl set env deployment/ui-deployment \
#  REACT_APP_API_URL="http://controller-service:3001" \
#  -n microservices-app
#
#kubectl expose deployment ui-deployment \
#  --name=ui-service \
#  --port=80 \
#  --target-port=80 \
#  --type=LoadBalancer \
#  -n microservices-app \
#  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Database Deployment complete!"
echo ""
echo "📊 Checking status..."
kubectl get pods -n gaitor-app
kubectl get services -n gaitor-app
echo ""
echo "🌐 Access your app:"
echo "Run: minikube service ui-service -n microservices-app"