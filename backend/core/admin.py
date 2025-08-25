from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import User, Organization, Project, Task, TaskComment

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Organization Info", {"fields": ("organization",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Organization Info", {"fields": ("organization",)}),
    )
    

admin.site.register(User, CustomUserAdmin)
admin.site.register(Organization)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(TaskComment)
