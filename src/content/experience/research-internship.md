---
organisation: University of Southampton | Soorati Lab
role: Summer Research Intern
period: 'Jul - Sept 2026'
summary: 'Developed LiDAR perception, simulation, and supporting tools for Unitree Go2 robot dogs in an assistive robotics research project.'
status: published
featured: true
order: 10
---

## The internship

I worked in the Soorati Lab at the University of Southampton, supervised by Dr Mohammad Soorati.
The wider research idea is to explore how connected robot dogs could support people with visual
impairments by sharing their views of nearby hazards. My main focus was the perception software:
using LiDAR to distinguish moving objects from the static surroundings and follow them over time.

The work continued an earlier internship by Kei Kheng Tan, whose LiDAR export and initial
perception pipeline provided the starting point.

## My contribution

- **Live perception and tracking.** I developed a ROS 2 Humble pipeline that runs on the robot's
  onboard Jetson, extending the earlier frame-difference and clustering approach with motion
  estimation, object matching, and handling for short gaps in detections.
- **Repeatable evaluation.** I built a MuJoCo testbed with simulated Mid-360 scans and known object
  trajectories, alongside recorded-data export and comparison tools. This made it possible to
  investigate failures when access to the physical robots was limited.
- **Shared awareness.** I implemented track-level fusion and an authenticated exchange prototype
  so robots could share compact object observations. Live operation across two robots remained
  unvalidated at the end of the work.
- **Supporting infrastructure.** I developed Jetson inspection and Ansible provisioning tools,
  documented recovery and upgrade procedures, and built a separate control boundary with tested
  stop arbitration and dry-run behaviour. I also integrated a Gazebo environment for broader ROS
  testing.
- **Handover.** I consolidated the work into a documented lab repository with component checks,
  setup guides, experiment results, and a record of remaining limitations.

## What ran on the robot

The LiDAR, scan registration, tracking, and dry-run response pipeline ran onboard a stationary Go2
while a person walked past it. Recorded-data replay and simulation provided further ways to test
the algorithms. This established that the stack could run on the target hardware; it did not
establish reliable perception on a walking robot or a completed guidance system.

Physical stop commands and simultaneous two-robot sharing remained separate validation tasks.
The [LiDAR project write-up](/work/go2-lidar-perception) explains the pipeline, results, and open
problems in more detail.

My final poster, _Can LiDAR help a robot dog spot what moves?_, gives a visual introduction to
the research. [View the poster (PDF, 2.8 MB)](/documents/go2-lidar-poster.pdf) or
[read the text version](/work/go2-lidar-perception/poster).

## What I took from it

The most useful lesson was separating a working software path from evidence that it solves the
research problem. A container can build, a robot can publish tracks, and a simulation can pass
several scenarios while a difficult moving-sensor case still fails. Keeping those results visible
made the next experiments clearer and the handover more useful.

The project also brought together algorithm work and the less visible engineering around it:
sensor networking, reproducible environments, configuration, testing, and documentation.

[Source code and lab documentation](https://github.com/SooratiLab/go2).
