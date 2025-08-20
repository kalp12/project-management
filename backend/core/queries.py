import graphene
from graphql import GraphQLError
from graphene_django import DjangoObjectType
from .models import Organization, Project, Task, TaskComment

class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = "__all__"

class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_tasks = graphene.Int()
    completion_rate = graphene.Float()
    
    class Meta:
        model = Project
        fields = "__all__"
        
    def resolve_task_count(self, info):
        return self.tasks.count()
    
    def resolve_completed_tasks(self, info):
        return self.tasks.filter(status='DONE').count()
    
    def resolve_completion_rate(self, info):
        total = self.tasks.count()
        completed = self.tasks.filter(status="DONE").count()
        return (completed / total) * 100 if total > 0 else 0
    
class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = "__all__"

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = "__all__"


class Query(graphene.ObjectType):
    organization = graphene.Field(OrganizationType, slug=graphene.String(required=True))
    project = graphene.Field(ProjectType, organization_slug=graphene.String(required=True), project_slug=graphene.String(required=True))
    task = graphene.Field(TaskType, organization_slug=graphene.String(required=True), project_slug=graphene.String(required=True), task_id=graphene.Int(required=True))
    comments = graphene.List(
        TaskCommentType,
        organization_slug=graphene.String(required=True),
        project_slug=graphene.String(required=True),
        task_id=graphene.Int(required=True)
        )

    def resolve_organization(root, info, slug):
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            raise GraphQLError("Organization not found.")

    def resolve_project(root, info, organization_slug, project_slug):
        try:
            return Project.objects.get(slug=project_slug, organization__slug=organization_slug)
        except Project.DoesNotExist:
            raise GraphQLError("Project not found.")

    def resolve_task(root, info, organization_slug, project_slug, task_id):
        try:
            return Task.objects.get(
                id=task_id,
                project__slug=project_slug,
                project__organization__slug=organization_slug
            )
        except Task.DoesNotExist:
            raise GraphQLError("Task not found.")

    
    def resolve_comments(root, info, organization_slug, project_slug, task_id):
        return TaskComment.objects.filter(
            task__id=task_id,
            task__project__slug=project_slug,
            task__project__organization__slug=organization_slug
        )