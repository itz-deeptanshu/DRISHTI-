"""
inference.py — real model inference, replacing the fake placeholder.
Loads the model ONCE at import time, not per-call, for speed.
"""

import os
import cv2
import numpy as np
import torch
import timm
from PIL import Image

CLASS_LABELS = {0: "No DR", 1: "Mild DR", 2: "Moderate DR", 3: "Severe DR", 4: "Proliferative DR"}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "best_model.pth")
HEATMAP_DIR = "uploads/gradcam"
os.makedirs(HEATMAP_DIR, exist_ok=True)

CONFIDENCE_THRESHOLD = 0.5  # placeholder — Action 5 below replaces this with a real tuned value

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=5)
_model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
_model = _model.to(device)
_model.eval()


def _crop_to_circle(img, tol=7):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = gray > tol
    if mask.sum() == 0:
        return img
    coords = np.argwhere(mask)
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0) + 1
    return img[y0:y1, x0:x1]


def _apply_clahe(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _preprocess(path, size=224):
    img = cv2.imread(path)
    img = _crop_to_circle(img)
    img = _apply_clahe(img)
    img = cv2.resize(img, (size, size))
    return img


class _GradCAM:
    def __init__(self, model, target_layer):
        self.activations = None
        self.gradients = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, model, input_tensor, target_class):
        output = model(input_tensor)
        model.zero_grad()
        output[0, target_class].backward()
        weights = self.gradients[0].mean(dim=(1, 2))
        activations = self.activations[0]
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32).to(activations.device)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        cam = torch.relu(cam)
        cam = cam / (cam.max() + 1e-8)
        return cam.cpu().numpy()


_gradcam = _GradCAM(_model, _model.conv_head)


def predict(image_path: str) -> dict:
    """
    The function your teammate calls. Matches their exact required return shape.
    """
    filename_stem = os.path.splitext(os.path.basename(image_path))[0]

    img_processed = _preprocess(image_path, size=224)
    img_rgb = cv2.cvtColor(img_processed, cv2.COLOR_BGR2RGB)

    img_norm = img_rgb.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_norm = (img_norm - mean) / std
    input_tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).float().to(device)

    with torch.no_grad():
        outputs = _model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0].cpu().numpy()

    predicted_class = int(np.argmax(probabilities))
    confidence = float(probabilities[predicted_class])
    is_uncertain = confidence < CONFIDENCE_THRESHOLD

    if is_uncertain:
        return {
            "severity_grade": None,
            "confidence_score": round(confidence, 4),
            "is_uncertain": True,
            "heatmap_path": None,
        }

    cam = _gradcam.generate(_model, input_tensor, predicted_class)
    cam_resized = cv2.resize(cam, (224, 224))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    overlay = (0.5 * img_rgb + 0.5 * heatmap).astype(np.uint8)

    heatmap_path = os.path.join(HEATMAP_DIR, f"{filename_stem}_gradcam.png")
    Image.fromarray(overlay).save(heatmap_path)

    return {
        "severity_grade": predicted_class,
        "confidence_score": round(confidence, 4),
        "is_uncertain": False,
        "heatmap_path": heatmap_path.replace("\\", "/"),
    }