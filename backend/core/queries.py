import graphene
from graphene_django import DjangoObjectType
from graphql import GraphQLError
from core.models import Organization, Project, Task, TaskComment
from django.contrib.auth import get_user_model

User = get_user_model()


# === TYPES ===
class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email")
        
class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "email", "organization")

   
    organization = graphene.Field(OrganizationType)

    def resolve_organization(self, info):
        return getattr(self, "organization", None)

class TaskType(DjangoObjectType):
    comments = graphene.List(lambda: TaskCommentType) 
    
    class Meta:
        model = Task
        fields = ("id", "title", "status", "description", "project", "assignee_email", "due_date")
        
    def resolve_comments(self, info):
        return TaskComment.objects.filter(task=self)

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author_email", "timestamp", "task")


class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completion_rate = graphene.Float()
    tasks = graphene.List(TaskType)
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "description",  "status", "due_date")

    def resolve_task_count(self, info):
        return self.tasks.count()

    def resolve_completion_rate(self, info):
        total = self.tasks.count()
        done = self.tasks.filter(status="DONE").count()
        return (done / total) * 100 if total > 0 else 0
    
    def resolve_tasks(self, info):
        return Task.objects.filter(project=self)
    
# === QUERY ROOT ===
class Query(graphene.ObjectType):
    # new
    me = graphene.Field(UserType)

    # organization
    organization = graphene.Field(OrganizationType, slug=graphene.String(required=True))

    # single project
    project = graphene.Field(
        ProjectType,
        organization_slug=graphene.String(required=True),
        project_slug=graphene.String(required=True),
    )
    # list projects
    projects = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True),
    )

    # single task
    task = graphene.Field(
        TaskType,
        organization_slug=graphene.String(required=True),
        project_slug=graphene.String(required=True),
        task_id=graphene.Int(required=True),
    )
    # list tasks
    tasks = graphene.List(
        TaskType,
        organization_slug=graphene.String(required=True),
        project_slug=graphene.String(required=True),
    )

    # comments
    comments = graphene.List(
        TaskCommentType,
        organization_slug=graphene.String(required=True),
        project_slug=graphene.String(required=True),
        task_id=graphene.Int(required=True),
    )
    
    # resolvers
    def resolve_me(root, info):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError("Not logged in")
        return user

    def resolve_organization(root, info, slug):
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            raise GraphQLError("Organization not found.")

    def resolve_project(root, info, organization_slug, project_slug):
        try:
            return Project.objects.get(
                slug=project_slug, organization__slug=organization_slug
            )
        except Project.DoesNotExist:
            raise GraphQLError("Project not found.")

    def resolve_projects(root, info, organization_slug):
        return Project.objects.filter(organization__slug=organization_slug)

    def resolve_task(root, info, organization_slug, project_slug, task_id):
        try:
            return Task.objects.get(
                id=task_id,
                project__slug=project_slug,
                project__organization__slug=organization_slug,
            )
        except Task.DoesNotExist:
            raise GraphQLError("Task not found.")

    def resolve_tasks(root, info, organization_slug, project_slug):
        return Task.objects.filter(
            project__organization__slug=organization_slug,
            project__slug=project_slug
        )

    def resolve_comments(root, info, organization_slug, project_slug, task_id):
        return TaskComment.objects.filter(
            task__id=task_id,
            task__project__slug=project_slug,
            task__project__organization__slug=organization_slug,
        )