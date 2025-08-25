# import os
# import django

# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  
# django.setup()

# from django.utils.text import slugify
# from core.models import Project

# for project in Project.objects.all():
#     if not project.slug:
#         project.slug = slugify(project.name) or f"project-{project.id}"
#         project.save()
from core.models import Organization
from django.utils.text import slugify

for org in Organization.objects.filter(slug__isnull=True):
    org.slug = slugify(org.name)
    org.save()
for org in Organization.objects.filter(slug=""):
    org.slug = slugify(org.name)
    org.save()  