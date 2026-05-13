from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from users.models import User
from projects.models import Project, ProjectMember, Milestone


class Command(BaseCommand):
    help = "Seeds the database with test data for local development."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting database seed..."))

        with transaction.atomic():
            admin_user, _ = User.objects.get_or_create(
                email="admin@constructiq.local",
                defaults={"role": "ADMIN", "is_staff": True, "is_superuser": True},
            )

            agent_user, _ = User.objects.get_or_create(
                email="agent@constructiq.local", defaults={"role": "AGENT"}
            )

            client_user, _ = User.objects.get_or_create(
                email="client@constructiq.local", defaults={"role": "CLIENT"}
            )

            officer_user, _ = User.objects.get_or_create(
                email="officer@constructiq.local", defaults={"role": "SITE_OFFICER"}
            )

            self.stdout.write(self.style.SUCCESS("Users created/verified."))

            project, created = Project.objects.get_or_create(
                name="Grand Hotel Renovation",
                defaults={
                    "address": "123 Ocean Drive, Miami FL",
                    "status": "ACTIVE",
                    "budget_total": "1500000.00",
                    "created_by": agent_user,
                },
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Project '{project.name}' created.")
                )

            ProjectMember.objects.get_or_create(
                project=project, user=agent_user, defaults={"role": "AGENT"}
            )
            ProjectMember.objects.get_or_create(
                project=project, user=client_user, defaults={"role": "CLIENT"}
            )
            ProjectMember.objects.get_or_create(
                project=project, user=officer_user, defaults={"role": "SITE_OFFICER"}
            )
            self.stdout.write(self.style.SUCCESS("Role-based members assigned."))

            Milestone.objects.get_or_create(
                project=project,
                name="Foundation Pour",
                defaults={
                    "due_date": timezone.now().date() + timedelta(days=14),
                    "payment_amount": "250000.00",
                    "status": "PENDING_APPROVAL",
                },
            )
            self.stdout.write(self.style.SUCCESS("Milestone generated."))

        self.stdout.write(
            self.style.SUCCESS(
                "Database seed COMPLETE! Try logging in as agent@constructiq.local"
            )
        )
