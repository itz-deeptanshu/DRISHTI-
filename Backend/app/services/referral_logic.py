ALLOWED_TRANSITIONS = {
    "screened": "referred",
    "referred": "confirmed",
    "confirmed": "completed",
    "completed": None,  # no further transitions allowed
}


def get_next_allowed_status(current_status: str) -> str | None:
    return ALLOWED_TRANSITIONS.get(current_status)


def is_valid_transition(current_status: str, requested_status: str) -> bool:
    return get_next_allowed_status(current_status) == requested_status