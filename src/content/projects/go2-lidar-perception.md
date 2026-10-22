---
title: LiDAR perception for assistive robot dogs
summary: 'Detecting and tracking moving objects with a Unitree Go2, with onboard ROS 2 processing and repeatable simulation tests.'
period: 'Jul - Sept 2026'
technologies:
  - Python
  - ROS 2 Humble
  - Docker
  - NumPy
  - SciPy
  - scikit-learn
  - MuJoCo
status: published
featured: true
order: 10
---

## The problem

A static map cannot tell a robot where a person or bicycle will be next. For a robot dog to help
someone navigate, it needs to recognise changes around it and follow moving hazards over time.
The lab's longer-term idea is for several robots to share those observations, giving different
viewpoints on objects that one robot might not see.

This project focused on LiDAR perception as one part of that idea. I developed it during my
[summer research internship](/work/experience/research-internship) in the University of
Southampton's Soorati Lab, supervised by Dr Mohammad Soorati. It builds on Kei Kheng Tan's earlier
LiDAR export and perception work.

## From scans to tracks

The Livox Mid-360 measures distances to surfaces around the robot, producing a three-dimensional
point cloud. FastLIO uses the LiDAR and inertial measurements to register successive scans in a
common coordinate frame. My online pipeline consumes those registered scans through ROS 2 and:

1. Accumulates scans into frames and finds points that differ from the earlier frame.
2. Groups nearby changed points with DBSCAN to form possible objects.
3. Matches detections to existing tracks using Hungarian assignment.
4. Estimates position and velocity with a Kalman filter, retaining tracks through short gaps and
   requiring repeated observations before confirming a new track.

I also added checks for implausible detections and viewpoint changes. When the robot moves, a
newly visible wall can look like a moving object even after the scans have been aligned. Knowing
where the sensor moved helps reject some of these false detections, but does not solve the whole
problem.

The processing runs on the onboard Jetson. A separate response policy turns nearby, current
tracks into stop requests and handles stale inputs. The robot-command adapter defaults to a dry
run, allowing the decision path to be tested without sending motion commands.

## Testing beyond a demonstration

I used recorded ROS data to reproduce detections and compare pipeline changes. I also built a
MuJoCo testbed that generates the Mid-360's scan pattern in scripted scenes with exact object
trajectories. It exports the same point-cloud and pose formats as the recorded-data workflow, so
both exercise the maintained perception code.

The simulation separates stationary and moving sensors, empty scenes, and walking objects.
Additional scenes check that filtering out a sloped floor does not also remove a low obstacle.
This made false detections, missed observations, and detection delays measurable rather than
relying on whether a visualisation looked convincing.

## Results and limits

On 6 August 2026, the complete ROS 2 Humble stack ran on a stationary Go2 with its physical
Mid-360 while a person walked past. LiDAR and registered clouds ran at about 10 Hz, with
perception updates at about 1 Hz and no service restarts during the test. The response path
remained in dry-run mode. This was evidence of onboard operation, rather than a measurement of
accuracy on a walking robot.

The documented 9 September simulation baseline passed three of the four main scenarios and
both additional guards. The moving-sensor walker case still failed its latency and coverage
limits: detection took 3.9 seconds, with observations in only 3 of 7 moving frames. More scan
points increased processing cost without resolving that failure. Those results helped identify
changing viewpoints and sparse observations as continuing research problems.

The simulation uses perfect registration. It does not reproduce all the noise, timing, and
motion of a physical robot, so its scores cannot establish real-world guidance performance.
Perception on a walking Go2 and enabled physical stop commands remained unvalidated.

## Sharing viewpoints

I implemented fusion of compact object tracks and an authenticated network prototype rather than
requiring robots to exchange full point clouds. The software transforms observations into a
shared frame and associates reports using position, velocity, and agreement over time. It also
retains objects seen by only one robot.

Live two-robot validation remained open. Clock alignment, relative robot position, interrupted
links, and ambiguous identities all affect whether shared observations can be trusted. The
prototype's shared tracks are informational and do not drive the stop-response path.

## What I learned

Better tracking cannot recover an object the detector never observes. The simulation helped
separate identity continuity from detection coverage, and showed why increasing point density
alone was insufficient. It also made negative results useful: experiments could be repeated and
compared without quietly weakening the acceptance limits.

The next steps are more reliable perception under changing viewpoints, bounded moving-robot
trials, and live shared-awareness tests. Useful guidance behaviour would also need to be designed
and evaluated with people who have visual impairments.

## Project materials

- [Final research poster: Can LiDAR help a robot dog spot what moves? (PDF, 2.8 MB)](/documents/go2-lidar-poster.pdf)
- [Read the poster as a web page](/work/go2-lidar-perception/poster)
- [Source code and setup guides](https://github.com/SooratiLab/go2)
- [Dated validation status and remaining work](https://github.com/SooratiLab/go2/blob/main/docs/project-status.md)
- [Internship overview](/work/experience/research-internship)
