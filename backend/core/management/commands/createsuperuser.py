from django.contrib.auth.management.commands.createsuperuser import Command as BaseCreateSuperuserCommand
from core.models import Organization

class Command(BaseCreateSuperuserCommand):
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--organization",
            help="Specifies the organization for the superuser.",
        )

    def get_field_names(self, UserModel):
        fields = super().get_field_names(UserModel)
        if "organization" not in fields:
            fields.append("organization")
        return fields

    def handle(self, *args, **options):
        organization_name = options.get("organization")
        if not organization_name or isinstance(organization_name, Organization):
            organization_name = input("Organization name: ")

        organization, _ = Organization.objects.get_or_create(name=organization_name)
        options["organization"] = organization

        super().handle(*args, **options)

    def get_user_data(self, fields, options):
        """
        Ensure organization is included in user_data passed to create_superuser.
        """
        user_data = super().get_user_data(fields, options)
        if "organization" in options and options["organization"]:
            user_data["organization"] = options["organization"]
        return user_data