from inference import predict

# Use any real fundus image you have locally — from your APTOS data, or any sample image
result = predict("path/to/a/test/image.png")

print("Severity grade:", result["severity_grade"])
print("Confidence:", result["confidence_score"])
print("Is uncertain:", result["is_uncertain"])
print("Heatmap saved at:", result["heatmap_path"])