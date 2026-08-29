from app.inference import predict


def run_inference(image_path: str, result_id: str) -> dict:
    """
    Thin wrapper around the real model's predict() function.
    screenings.py and sync.py call run_inference(image_path, result_id) —
    this wrapper adapts that call to his predict(image_path) function.
    """
    return predict(image_path)