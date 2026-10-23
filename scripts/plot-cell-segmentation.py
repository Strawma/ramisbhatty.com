"""Regenerate the portfolio's original figure from dissertation Table 5.1.

Requires Matplotlib. Run from the repository root with:
    python scripts/plot-cell-segmentation.py
"""

from pathlib import Path
import re

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def main() -> None:
    # These are reported means for complete held-out clips, not independent repeats.
    clips = ["01", "02", "03", "04", "05*"]
    threshold = [0.877, 0.519, 0.842, 0.811, 0.914]
    unet = [0.917, 0.866, 0.901, 0.945, 0.784]
    positions = np.arange(len(clips))

    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "font.size": 12,
        "svg.fonttype": "none",
        "svg.hashsalt": "cell-segmentation-results",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.spines.left": False,
    })
    fig, ax = plt.subplots(figsize=(7.2, 4.7), layout="constrained")
    ax.set_axisbelow(True)
    ax.xaxis.grid(True, color="#e5e5e5")
    for values, offset, color, label, hatch in (
        (threshold, -0.19, "#525252", "Otsu thresholding", "///"),
        (unet, 0.19, "#1d4ed8", "U-Net", None),
    ):
        bars = ax.barh(
            positions + offset, values, height=0.32, color=color,
            label=label, hatch=hatch, edgecolor="white", linewidth=0.4,
        )
        ax.bar_label(bars, labels=[f"{value:.3f}" for value in values], padding=5, fontsize=10)

    ax.set_yticks(positions, clips)
    ax.invert_yaxis()
    ax.tick_params(axis="y", length=0, pad=10)
    ax.set_ylabel("Held-out clip", labelpad=12)
    ax.set_xlim(0, 1.10)
    ax.set_xticks([0, 0.25, 0.5, 0.75, 1], ["0", "0.25", "0.50", "0.75", "1.00"])
    ax.set_xlabel("Mean Dice overlap · higher is better", labelpad=10)
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.01), ncols=2, frameon=False)

    output = Path(__file__).resolve().parents[1] / "static/images/projects/cell-migration/dice-by-clip.svg"
    output.parent.mkdir(parents=True, exist_ok=True)
    # Omit the generation date so identical results produce a stable, reviewable asset.
    fig.savefig(output, metadata={
        "Date": None,
        "Title": "Segmentation overlap by held-out clip",
        "Description": "Mean Dice from dissertation Table 5.1. Clip 05 used a different microscope.",
    })
    # Matplotlib wraps path data with trailing spaces; keep the same geometry on one line.
    svg = re.sub(r'\bd="([^"]*)"', lambda match: f'd="{" ".join(match[1].split())}"', output.read_text())
    output.write_text(svg)
    plt.close(fig)
    print(output)


if __name__ == "__main__":
    main()
