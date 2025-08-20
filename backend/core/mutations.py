import graphene
from graphql import GraphQLError
from .models import Organization, Project, Task, TaskComment
from .queries import OrganizationType, ProjectType, TaskType, TaskCommentType

class CreateOrganization(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        slug = graphene.String(required=True)
        contact_email = graphene.String(required=True)

    organization = graphene.Field(OrganizationType)

    @classmethod
    def mutate(cls, root, info, name, slug, contact_email):
        if Organization.objects.filter(slug=slug).exists():
            raise GraphQLError("Organization with this slug already exists.")
        
        org = Organization.objects.create(
            name=name,
            slug=slug,
            contact_email=contact_email
        )
        return CreateOrganization(organization=org)


class CreateProject(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String(required=True)
        due_date = graphene.types.datetime.Date()

    project = graphene.Field(ProjectType)

    @classmethod
    def mutate(cls, root, info, organization_slug, name, description, status, due_date=None):
        try:
            org = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            raise GraphQLError("Organization not found.")
        
        project = Project.objects.create(
            organization=org,
            name=name,
            description=description,
            status=status,
            due_date=due_date
        )
        return CreateProject(project=project)

class CreateTask(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        project_slug = graphene.String(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String(required=True)
        assignee_email = graphene.String()
        due_date = graphene.types.datetime.DateTime()

    task = graphene.Field(TaskType)

    @classmethod
    def mutate(cls, root, info, organization_slug, project_slug, title, description, status, assignee_email=None, due_date=None):
        try:
            project = Project.objects.get(
                slug=project_slug,
                organization__slug=organization_slug
            )
        except Project.DoesNotExist:
            raise GraphQLError("Project not found for this organization.")
        
        task = Task.objects.create(
            project=project,
            title=title,
            description=description,
            status=status,
            assignee_email=assignee_email,
            due_date=due_date
        )
        return CreateTask(task=task)

class UpdateTask(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        project_slug = graphene.String(required=True)
        task_id = graphene.Int(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.types.datetime.DateTime()

    task = graphene.Field(TaskType)

    @classmethod
    def mutate(cls, root, info, organization_slug, project_slug, task_id, title=None, description=None, status=None, assignee_email=None, due_date=None):
        try:
            task = Task.objects.get(
                id=task_id,
                project__slug=project_slug,
                project__organization__slug=organization_slug
            )
        except Task.DoesNotExist:
            raise GraphQLError("Task not found in this project/organization.")

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if status is not None:
            task.status = status
        if assignee_email is not None:
            task.assignee_email = assignee_email
        if due_date is not None:
            task.due_date = due_date

        task.save()
        return UpdateTask(task=task)

class CreateTaskComment(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        project_slug = graphene.String(required=True)
        task_id = graphene.Int(required=True)
        content = graphene.String(required=True)
        author_email = graphene.String(required=True)

    comment = graphene.Field(TaskCommentType)

    @classmethod
    def mutate(cls, root, info, organization_slug, project_slug, task_id, content, author_email):
        try:
            task = Task.objects.get(
                id=task_id,
                project__slug=project_slug,
                project__organization__slug=organization_slug
            )
        except Task.DoesNotExist:
            raise GraphQLError("Task not found in this project/organization.")
        
        comment = TaskComment.objects.create(
            task=task,
            content=content,
            author_email=author_email
        )
        return CreateTaskComment(comment=comment)

class Mutation(graphene.ObjectType):
    create_organization = CreateOrganization.Field()
    create_project = CreateProject.Field()
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    create_task_comment = CreateTaskComment.Field()