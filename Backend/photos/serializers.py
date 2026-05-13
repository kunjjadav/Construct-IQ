from rest_framework import serializers
from django.core.files.storage import default_storage
from .models import Photo, WeeklyLog


class PhotoSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.ReadOnlyField(source="uploaded_by.email")
    uploaded_by_name = serializers.SerializerMethodField()
    project_name = serializers.ReadOnlyField(source="project.name")
    file = serializers.ImageField(write_only=True, required=True)
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        if not obj.s3_key:
            return None
        try:
            url = default_storage.url(obj.s3_key)
        except Exception:
            return None

        request = self.context.get("request")
        if request and url.startswith("/"):
            return request.build_absolute_uri(url)
        return url

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.email
        return ""

    class Meta:
        model = Photo
        fields = [
            "id",
            "project",
            "project_name",
            "uploaded_by",
            "uploaded_by_email",
            "uploaded_by_name",
            "s3_key",
            "thumbnail_key",
            "image",
            "lat",
            "lon",
            "taken_at",
            "caption",
            "linked_rfi",
            "created_at",
            "file",
        ]

        read_only_fields = [
            "id",
            "s3_key",
            "thumbnail_key",
            "uploaded_by",
            "created_at",
        ]


class WeeklyLogSerializer(serializers.ModelSerializer):
    site_officer_email = serializers.ReadOnlyField(source="site_officer.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    photo_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = WeeklyLog
        fields = [
            "id",
            "project",
            "project_name",
            "site_officer",
            "site_officer_email",
            "week_start_date",
            "weather",
            "crew_count",
            "budget_used",
            "notes",
            "status",
            "pdf_s3_key",
            "created_at",
            "updated_at",
            "photo_ids",
        ]

        read_only_fields = [
            "id",
            "site_officer",
            "status",
            "pdf_s3_key",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        photo_ids = validated_data.pop("photo_ids", [])
        weekly_log = super().create(validated_data)

        if photo_ids:
            valid_photos = Photo.objects.filter(
                id__in=photo_ids, project=weekly_log.project
            )
            weekly_log.attached_photos.set(valid_photos)

        return weekly_log

    def update(self, instance, validated_data):
        photo_ids = validated_data.pop("photo_ids", None)
        instance = super().update(instance, validated_data)

        if photo_ids is not None:
            if photo_ids:
                valid_photos = Photo.objects.filter(
                    id__in=photo_ids, project=instance.project
                )
                instance.attached_photos.set(valid_photos)
            else:
                instance.attached_photos.clear()

        return instance
