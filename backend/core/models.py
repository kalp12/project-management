from django.db import models
from django.contrib.auth.models import AbstractUser
from core.managers import UserManager
from django.utils.text import slugify
# class Organization(models.Model):
#     name = models.CharField(max_length=100)
#     slug = models.SlugField(unique=True)
#     contact_email = models.EmailField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

class Organization(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True, null=True)
    contact_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class User(AbstractUser):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,      # <-- allow null
        blank=True      # <-- allow blank
    )
    objects = UserManager() 
    
class Project(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("ON_HOLD", "On Hold"),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    TASK_STATUS_CHOICES = [
        ("TODO", "To Do"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES, default="TODO")
    assignee_email = models.EmailField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    author_email = models.EmailField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author_email} on {self.task.title}"