task_definition_version=$1

aws ecs describe-task-definition --task-definition rest-service-dev-task:${task_definition_version} > task-definition:${task_definition_version}.json