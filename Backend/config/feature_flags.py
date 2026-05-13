import environ
import logging

logger = logging.getLogger(__name__)

env = environ.Env()

FEATURE_FLAGS = {}


def is_feature_enabled(flag_name: str) -> bool:
    return FEATURE_FLAGS.get(flag_name, {}).get("enabled", False)


def is_shadow_mode(flag_name: str) -> bool:
    return FEATURE_FLAGS.get(flag_name, {}).get("shadow_mode", False)


def log_shadow_discrepancy(feature: str, context: dict, expected: any, actual: any):
    logger.warning(
        f"SHADOW MODE DISCREPANCY [{feature}]: {context}",
        extra={
            "feature": feature,
            "context": context,
            "legacy_expected": expected,
            "new_actual": actual,
        },
    )
