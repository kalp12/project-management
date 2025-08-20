import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  
django.setup()

from django.utils.text import slugify
from core.models import Project

for project in Project.objects.all():
    if not project.slug:
        project.slug = slugify(project.name) or f"project-{project.id}"
        project.save()
