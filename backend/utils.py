import base64
import os
import tempfile
import matplotlib.pyplot as plt


def generate_plot(image_array, title):
    plt.figure(figsize=(6, 4))
    plt.imshow(image_array, aspect="auto", origin="lower", cmap="viridis")
    plt.title(title)
    plt.colorbar(format="%+2.0f dB")
    plt.tight_layout()

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        plt.savefig(temp_file.name, format="png")
        temp_file_path = temp_file.name
    plt.close()

    with open(temp_file_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
    os.remove(temp_file_path)
    return encoded_image
