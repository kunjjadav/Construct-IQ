import io
import uuid
from decimal import Decimal
from PIL import Image, ImageOps
from PIL.ExifTags import TAGS, GPSTAGS
from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone
from .models import Photo

THUMBNAIL_SIZE = (300, 300)
THUMBNAIL_QUALITY = 85


def _get_exif_data(image):
    exif_data = {}
    info = image.getexif()
    if info:
        for tag, value in info.items():
            decoded = TAGS.get(tag, tag)
            exif_data[decoded] = value
            if decoded == "GPSInfo":
                gps_data = {}
                for t in value:
                    sub_decoded = GPSTAGS.get(t, t)
                    gps_data[sub_decoded] = value[t]
                exif_data[decoded] = gps_data
    return exif_data


def _convert_to_degrees(value):
    d, m, s = value
    return d + (m / 60.0) + (s / 3600.0)


def _get_lat_lon(exif_data):
    if "GPSInfo" in exif_data:
        gps_info = exif_data["GPSInfo"]
        gps_latitude = gps_info.get("GPSLatitude")
        gps_latitude_ref = gps_info.get("GPSLatitudeRef")
        gps_longitude = gps_info.get("GPSLongitude")
        gps_longitude_ref = gps_info.get("GPSLongitudeRef")

        if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
            lat = _convert_to_degrees(gps_latitude)
            if gps_latitude_ref != "N":
                lat = -lat
            lon = _convert_to_degrees(gps_longitude)
            if gps_longitude_ref != "E":
                lon = -lon
            return lat, lon
    return None, None


@shared_task
def process_photo_upload(photo_id):
    try:
        photo = Photo.objects.get(id=photo_id)
    except Photo.DoesNotExist:
        return f"Photo {photo_id} missing."

    if not photo.s3_key:
        return f"Photo {photo_id} has no valid s3_key."

    try:
        raw_file = default_storage.open(photo.s3_key, "rb")
        img = Image.open(raw_file)

        exif_data = _get_exif_data(img)
        lat, lon = _get_lat_lon(exif_data)

        if lat is not None and lon is not None:
            photo.lat = Decimal(str(round(lat, 6)))
            photo.lon = Decimal(str(round(lon, 6)))

        img = ImageOps.exif_transpose(img) or img

        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")

        img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=THUMBNAIL_QUALITY, optimize=True)
        buffer.seek(0)

        thumb_key = f"projects/{photo.project_id}/photos/thumbs/{uuid.uuid4().hex}.jpg"
        saved_thumb_path = default_storage.save(thumb_key, ContentFile(buffer.read()))

        photo.thumbnail_key = saved_thumb_path
        photo.save(update_fields=["thumbnail_key", "lat", "lon"])

        raw_file.close()
        return f"Successfully processed photo {photo_id}. GPS: {lat},{lon}"

    except Exception as e:
        return f"Error processing photo {photo_id}: {str(e)}"


@shared_task
def send_weekly_log_reminders():
    from projects.models import Project, ProjectMember
    from notifications.services import create_notification
    from datetime import timedelta

    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())

    active_projects = Project.objects.filter(status="ACTIVE")
    reminders_sent = 0

    for project in active_projects:
        officers = ProjectMember.objects.filter(
            project=project, role="SITE_OFFICER"
        ).select_related("user")

        from .models import WeeklyLog

        logged_officers = WeeklyLog.objects.filter(
            project=project, week_start_date=week_start
        ).values_list("site_officer_id", flat=True)

        for officer_member in officers:
            if officer_member.user.id not in logged_officers:
                create_notification(
                    recipient=officer_member.user,
                    notification_type="GENERAL_UPDATE",
                    message=f"Reminder: Initialize your weekly log for project {project.name}.",
                    action_url=f"/projects/{project.id}/logs/new",
                )
                reminders_sent += 1

    return f"Sent {reminders_sent} weekly log reminders."


@shared_task
def generate_weekly_log_pdf(log_id):
    import io
    import uuid
    import logging
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    from .models import WeeklyLog
    from documents.models import Document
    from notifications.services import notify_and_email

    logger = logging.getLogger(__name__)

    try:
        weekly_log = WeeklyLog.objects.select_related("project", "site_officer").get(
            id=log_id
        )
    except WeeklyLog.DoesNotExist:
        logger.error(f"WeeklyLog {log_id} missing.")
        return f"WeeklyLog {log_id} missing."

    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "CustomTitle", parent=styles["Title"], fontSize=18, spaceAfter=12
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            spaceAfter=6,
            textColor=colors.HexColor("#1a365d"),
        )

        elements = []

        elements.append(
            Paragraph(f"Weekly Site Report: {weekly_log.project.name}", title_style)
        )
        elements.append(Spacer(1, 12))

        meta_data = [
            ["Week Start Date:", weekly_log.week_start_date.strftime("%Y-%m-%d")],
            ["Site Officer:", weekly_log.site_officer.email],
            ["Weather Overview:", weekly_log.weather or "Not Recorded"],
            ["Total Headcount:", f"{weekly_log.crew_count} personnel"],
            ["Budget Used:", f"${weekly_log.budget_used}"],
        ]

        meta_table = Table(meta_data, colWidths=[1.8 * inch, 4.2 * inch])
        meta_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 11),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f4f8")),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 24))

        elements.append(Paragraph("Weekly Recap", heading_style))
        elements.append(Spacer(1, 6))
        notes_text = (
            weekly_log.notes.replace("\n", "<br/>")
            if weekly_log.notes
            else "No notes provided."
        )
        elements.append(Paragraph(notes_text, styles["Normal"]))
        elements.append(Spacer(1, 24))

        photos = weekly_log.attached_photos.all()
        if photos.exists():
            elements.append(Paragraph("Attached Field Photos", heading_style))
            elements.append(Spacer(1, 6))
            photo_text = f"This report includes {photos.count()} field photos. Visit the portal to view full-resolution captures."
            elements.append(Paragraph(photo_text, styles["Italic"]))

        doc.build(elements)
        buffer.seek(0)

        pdf_key = f"projects/{weekly_log.project.id}/weekly-logs/WeeklyLog_{weekly_log.week_start_date.strftime('%Y-%m-%d')}_{uuid.uuid4().hex[:8]}.pdf"
        saved_pdf_path = default_storage.save(pdf_key, ContentFile(buffer.read()))

        doc_record = Document.objects.create(
            project=weekly_log.project,
            uploaded_by=weekly_log.site_officer,
            title=f"Weekly Site Report - {weekly_log.week_start_date.strftime('%Y-%m-%d')}",
            file_type="PDF",
            s3_key=saved_pdf_path,
            is_current=True,
        )

        notify_and_email(
            recipient=weekly_log.site_officer,
            notification_type="SYSTEM_ALERT",
            message=f"The PDF for the {weekly_log.week_start_date} Weekly Report is ready.",
            action_url=f"/projects/{weekly_log.project.id}/documents/{doc_record.id}",
        )

        return f"Successfully generated PDF for WeeklyLog {log_id}."

    except Exception as e:
        logger.error(f"Failed to generate PDF for WeeklyLog {log_id}: {str(e)}")
        return f"Error building PDF: {str(e)}"
