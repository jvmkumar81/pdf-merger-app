# Backend Docker & deployment notes

This file contains exact commands to build, run, and push the backend Docker image, plus a quick deploy note using AWS Copilot or ECS.

Prerequisites
- AWS CLI configured (`aws configure`)
- Docker installed and running
- (Optional) AWS Copilot CLI installed for simple ECS deploys (`brew install aws/tap/copilot-cli` or see docs)

Local build & run

```bash
# from the `backend/` directory
docker build -t pdf-merger-backend:latest .

# run locally, map container port 8080 -> host 8080
docker run --rm -p 8080:8080 pdf-merger-backend:latest
```

Push image to Amazon ECR (BASH)

Replace `<AWS_REGION>` and `<AWS_ACCOUNT_ID>` with your values.

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
ECR_REPO=pdf-merger-backend

# create repo (no-op if exists)
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION || true

# login docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# tag and push
docker tag pdf-merger-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

Push image to Amazon ECR (PowerShell)

```powershell
$AWS_REGION = 'us-east-1'
$AWS_ACCOUNT_ID = '123456789012'
$ECR_REPO = 'pdf-merger-backend'

# create repo (no-op if exists)
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION | Out-Null

# login docker to ECR
(aws ecr get-login-password --region $AWS_REGION) | docker login --username AWS --password-stdin "$($AWS_ACCOUNT_ID).dkr.ecr.$AWS_REGION.amazonaws.com"

# tag and push
docker tag pdf-merger-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

Quick deploy options

- AWS Copilot (fast):

```bash
# from repo root
copilot init --app pdfmerger --name backend --resource-type "Load Balanced Web Service" --dockerfile backend/Dockerfile
copilot svc deploy --name backend --env production
```

- Manual ECS (console or CloudFormation): create Task Definition referencing the pushed ECR image, use Fargate launch type, attach to an ALB set to health-check `/` or `/health` depending on `app.py`.

Healthcheck & port
- Container listens on port `8080`. Configure your load-balancer target group to use port `8080` and health-check the path your app exposes (e.g. `/` or `/health`).

Notes
- If your `backend/requirements.txt` includes packages that require system libraries (e.g., `psycopg2`), add the appropriate OS packages to the Dockerfile before `pip install`.
- For production builds, consider switching to a multi-stage Dockerfile to reduce image size.