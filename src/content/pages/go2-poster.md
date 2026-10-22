---
path: /WORK/GO2-LIDAR-PERCEPTION/POSTER
title: Can LiDAR help a robot dog spot what moves?
description: "A readable text version of Ramis Bhatty's research internship poster about LiDAR perception and shared awareness for robot dogs."
---

[View the final poster (PDF, 2.8 MB)](/documents/go2-lidar-poster.pdf) ·
[Back to the project](/work/go2-lidar-perception)

This is the text equivalent of the August 2026 poster, including descriptions of its photograph
and diagrams. The [project write-up](/work/go2-lidar-perception) includes later evaluation results.

Working towards connected robot guides for people with visual impairments.

Research internship: turning local perception into shared awareness.

Ramis Bhatty, University of Southampton, Soorati Lab. Supervised by Dr Mohammad
Soorati.

## The bigger idea

The overarching goal is to explore how connected robot dogs could support
people with visual impairments through shared sensing. Multiple dogs provide
redundancy and diverse perspectives: each could watch a different direction
and reveal hazards hidden from another viewpoint.

The focus of this poster is LiDAR perception: using LiDAR to build a live
three-dimensional view and distinguish moving people and objects from the static
world. People, bicycles and other hazards do not stay where a map left them. A
guide needs to identify and track these dynamic hazards so it can assist users
in navigating safely.

The poster centres a photograph of the project robot, a Unitree Go2. Callouts identify
the Livox Mid-360 LiDAR and the long onboard Jetson enclosure beneath the cable
loop. Four rectangular explanations form a grey, blue, orange and green
pinwheel around it.

In a live test, LiDAR and tracking ran onboard as a person walked past the
stationary robot.

## Build a 3-D picture

The LiDAR module measures thousands of distances. Together they form a point
cloud around the robot.

One research question is how much detail is needed to reveal a small or partly
hidden object in sparse LiDAR measurements.

## Find what changed

The software can line up successive scans, find points without a nearby earlier
match, group changed points into objects and estimate their position and speed.
The diagram presents its two observations diagonally from upper left to lower
right to emphasise movement through time.

A moving robot makes this harder. Its changing viewpoint can reveal a wall or
other static surface and make that geometry look new. Occlusion creates another
question: when an object disappears and returns, should it keep the same track?

## Reason on the robot

The onboard computer compensates for the dog's own movement, groups nearby
changed points into possible objects, and estimates their position and direction
through short gaps. This work runs locally rather than relying on a remote
computer.

More scans can reveal detail, but waiting for them slows reactions. Useful next
questions include running longer trials and perceiving reliably while the dog
moves.

## Combine viewpoints

Robots could share compact object tracks, match reports that describe the same
obstacle and keep observations seen by only one robot.

Time alignment, relative robot position, object identity and wireless gaps can
all disagree. A shared view therefore needs to represent uncertainty rather
than treating every report as equally reliable.

## Where could this go next?

- Improve perception by handling occlusion, sparse scans and changing
  viewpoints more reliably.
- Add other cues by exploring cameras, robot state and contextual maps
  alongside LiDAR.
- Share awareness by testing several robots live, including uncertainty and
  interrupted wireless links.
- Design useful warnings and behaviour with people who have visual impairments.

Explore the project at <https://github.com/SooratiLab/go2>.
