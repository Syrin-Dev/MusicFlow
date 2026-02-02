# StreamFlow Deployment Plan (Google Cloud Run)

This plan outlines the steps to deploy the StreamFlow Next.js application to Google Cloud Run, ensuring scalability and secure API key management.

## 1. Environment Preparation
- **Project Setup**: Ensure a Google Cloud Project is active.
- **Container Registry**: Enable Google Artifact Registry for storing the Docker image.

## 2. Dockerization
- Create a `Dockerfile` in the project root:
  ```dockerfile
  FROM node:18-alpine AS base
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  CMD ["npm", "start"]
  ```

## 3. Environment Variables
- **API Key Security**: DO NOT commit `.env.local`.
- **Cloud Run Config**: Set `YOUTUBE_API_KEY` as a secret in Google Secret Manager.
- **Injection**: Mount the secret as an environment variable in the Cloud Run service revision.

## 4. Build and Deploy
- **Build Image**:
  ```bash
  gcloud builds submit --tag gcr.io/PROJECT_ID/streamflow-app
  ```
- **Deploy Service**:
  ```bash
  gcloud run deploy streamflow-service \
    --image gcr.io/PROJECT_ID/streamflow-app \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars YOUTUBE_API_KEY=sm://projects/PROJECT_ID/secrets/youtube_key/versions/1
  ```

## 5. Domain & Quota
- **Custom Domain**: Map a custom domain via Cloud Run "Integrations".
- **Quota Monitoring**: Set up alerts in Google Cloud Console to monitor YouTube Data API usage specifically for quota limits (10,000 units/day).
