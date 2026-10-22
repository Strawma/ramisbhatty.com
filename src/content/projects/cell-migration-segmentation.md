---
title: Comparing segmentation methods for cell migration
summary: 'A modular microscopy framework and desktop demonstrator comparing Otsu thresholding with U-Net, evaluated on complete held-out video clips.'
moduleCode: COMP3200
period: '2025/26'
technologies:
  - Python
  - PyTorch
  - OpenCV
  - NumPy
  - SciPy
  - PyQt5
status: draft
featured: true
order: 20
---

## The question

Does a constrained image-analysis problem need a neural network? My third-year individual project
investigated this through microscopy footage of single breast cancer cells squeezing through
microfluidic channels. The background stays mostly fixed, which should help classical methods,
but the cell can deform into thin, irregular shapes that are difficult to separate from the walls.

I compared an Otsu thresholding pipeline with a U-Net, built the framework used to run the
comparison, and developed a desktop application for inspecting masks and exporting cell
measurements. The work was supervised by Prof. Dimitra Georgiadou. Dr. Rosalia Moreddu, the
project's original supervisor, supplied the microscopy footage from existing experiments.

## Building the comparison

I curated 2,274 image–mask pairs across five clips. A SAM3-assisted annotation tool proposed masks,
followed by cleanup and manual review in napari. This reduced the manual annotation work, but
did not make every reference mask unambiguous: phase-contrast halos, contact with channel walls,
and thin cell extensions could obscure the boundary.

The two segmentation methods use different preprocessing because they need different information:

- **Otsu thresholding** estimates and subtracts a static background, enhances contrast, and cleans
  the thresholded mask with closing, hole filling, and opening. It then keeps the largest connected
  component, relying on the single-cell setting.
- **U-Net** uses lighter preprocessing to retain image detail, followed by a PyTorch
  encoder–decoder network with skip connections. Training combines Dice and binary cross-entropy
  loss, paired image–mask augmentation, dropout, and validation-based early stopping.

For the network, I resized frames while preserving their aspect ratio and padded them to a square,
then reversed that operation for the output. Stretching a cell to fit a square input would change
the very shape the system was meant to measure.

## One interface for experiments and the application

Each method implements a common segmentation interface. A `SegmentationPipeline` facade handles
the method's preprocessing, background estimation, and model loading, so callers do not need to
rebuild that wiring. The same framework supports the experiment scripts and the GUI.

This abbreviated usage example shows how a loaded clip becomes masks and measurements. `frames`
and `frame_rate` come from the input clip:

```python
from src.segmentation import SegmentationPipeline

pipeline = SegmentationPipeline.create("threshold")
masks = pipeline.segment_clip(frames)
measurements = pipeline.extract_kinematics(masks, frame_rate=frame_rate)
pipeline.save_kinematics_csv(measurements, "kinematics.csv")
```

The U-Net uses the same operations after construction with `"unet"` and a path to trained
weights. Adding a method requires an implementation of the shared interface and an entry in the
method registry.

The PyQt5 demonstrator loads a video or folder of frames, runs either method, and shows raw,
preprocessed, and segmented views side by side. A frame scrubber and metrics strip make it
possible to inspect individual results. Processing runs in a worker thread to keep the interface
responsive; export writes predicted masks and a CSV of position, shape, and movement measurements.

## Evaluating on unseen clips

Neighbouring video frames are very similar. Randomly splitting them into training and test sets
could make a model look successful while mainly testing footage it has effectively already seen.
I used leave-one-clip-out cross-validation instead: each complete clip becomes the test set once.
For each U-Net fold, three other clips provide training data and one provides validation data for
checkpoint selection. The held-out test clip is used for evaluation.

I measured both Dice overlap and 95th-percentile Hausdorff distance (HD95), a boundary-distance
measure. Overlap alone can hide errors in thin cell extensions. The following are the mean
results reported in the final dissertation's Table 5.1:

| Test data and metric   | Threshold | U-Net |
| ---------------------- | --------: | ----: |
| All clips: Dice ↑      |     0.806 | 0.876 |
| All clips: HD95 (px) ↓ |      93.9 |  61.3 |
| Clip 02: Dice ↑        |     0.519 | 0.866 |
| Clip 02: HD95 (px) ↓   |     372.4 |  39.8 |
| Clip 05: Dice ↑        |     0.914 | 0.784 |
| Clip 05: HD95 (px) ↓   |      16.9 |  22.2 |

U-Net performed better overall, but the ordering changed on clip 05, which came from different
microscope conditions. Thresholding benefited from its cleaner background, while the held-out
clip exposed a change in imaging appearance that the network had not learned from its training
clips. This is evidence for keeping a classical baseline in this setting, rather than a general
claim that thresholding handles every microscope change better.

## Looking at failures

The methods failed in different ways. Thresholding could retain channel-wall debris and select
the wrong foreground region. U-Net could produce uncertain boundaries or disconnected false
regions. On clip 03, its higher mean Dice accompanied a worse mean HD95, illustrating why one
summary score was insufficient.

The desktop viewer and comparison figures helped connect these numerical results to individual
frames. They also made the downstream consequences clearer: an outline error changes perimeter,
circularity, and solidity as well as the segmentation score.

## Limits and lessons

Five clips are a small basis for generalisation. The 2,274 frames are temporally correlated,
rather than 2,274 independent biological experiments. Frame-level statistical tests therefore
need that qualification, and the per-clip results are more useful than a very small headline
p-value. The reference annotations also contain uncertainty, and the study compares only one
classical pipeline and one U-Net implementation.

The most useful result was identifying when the methods exchanged places. A stronger overall
average did not remove the need to examine unfamiliar imaging conditions or difficult individual
frames. The project also taught me to make assumptions about image shape, bit depth, and
foreground geometry explicit before those assumptions became silent processing errors.

I prioritised segmentation, evaluation, and per-frame kinematics over adding a separate identity
tracker. More varied footage, independent annotation checks, and additional segmentation
baselines would be the next steps. The application is a research demonstrator; the project did
not establish clinical usefulness or validate its measurements for medical decisions.
