# Student Services Frontend

Next.js frontend for the Student Services Spring Boot API. Provides course browsing, student enrollment management, profile editing, and admin functionality.

## Pages

- **/** — Landing page
- **/courses** — Course catalog with search and enroll
- **/courses/[id]** — Course detail view
- **/students** — Student directory (authenticated)
- **/profile** — View/edit profile, manage enrollments (authenticated)
- **/admin/courses** — Admin panel: manage courses, students, and grades (admin only)
- **/login** — Sign in
- **/register** — Create account

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL (server-side rewrites) | `http://localhost:8080` |

## Docker

```bash
docker build --build-arg API_URL=http://your-api-url -t frontend-app .
docker run -p 3000:3000 frontend-app
```

## ECS Deployment

Use the `ecs-deploy-frontend.yaml` GitHub Actions workflow to deploy. It calls the reusable `ecs-build-frontend.yaml` workflow which:

1. Checks out app code and deploy-configs
2. Loads environment properties from `deploy-configs/frontend-app/{env}.properties`
3. Installs Node.js dependencies and builds the Next.js app
4. Builds and pushes the Docker image to ECR
5. Updates the ECS task definition and deploys

### Required deploy-config properties

```properties
aws_region=us-east-1
iam_role=arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
ecr_uri=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend-app
ecs_cluster=your-cluster
ecs_service=your-service
ecs_task_definition=your-task-def
container_name=frontend-app
cpu=256
memory=512
api_url=http://your-backend-alb-url
```
