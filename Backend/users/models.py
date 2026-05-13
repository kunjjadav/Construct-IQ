from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        AGENT = "AGENT", "Agent"
        SITE_OFFICER = "SITE_OFFICER", "Site Officer"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True, db_index=True)

    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.CLIENT, db_index=True
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        default="",
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
            )
        ],
    )

    magic_token = models.CharField(
        max_length=255, blank=True, default="", db_index=True
    )

    token_expiry = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def clean(self):
        super().clean()
        if self.email:
            self.email = self.email.strip().lower()

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
