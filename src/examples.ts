import type { ProblemSpec } from './physics/spec'

export interface Example {
  id: string
  title: string
  text: string
  /** Pre-parsed so the example works without calling the AI parser. */
  spec: ProblemSpec
  /** Answer printed in the textbook, for the side-by-side check. */
  textbook?: { value: number; unit: string }
}

export const EXAMPLES: Example[] = [
  {
    id: 'football',
    title: 'Football kick',
    text: 'A football is kicked at 20 m/s at an angle of 35° above the ground. How far does it travel before it lands?',
    spec: { type: 'projectile', speed: 20, angleDeg: 35, height: 0, g: 9.8, unknown: 'range' },
    textbook: { value: 38.4, unit: 'm' },
  },
  {
    id: 'cliff',
    title: 'Stone off a cliff',
    text: 'A stone is thrown horizontally at 10 m/s from the top of a 45 m cliff. How long does it take to hit the ground? (Take g = 10 m/s².)',
    spec: { type: 'projectile', speed: 10, angleDeg: 0, height: 45, g: 10, unknown: 'timeOfFlight' },
    textbook: { value: 3, unit: 's' },
  },
  {
    id: 'basketball',
    title: 'Basketball shot',
    text: 'A basketball player shoots the ball at 8 m/s at 50° above the horizontal, releasing it 2 m above the floor. What is the maximum height the ball reaches?',
    spec: { type: 'projectile', speed: 8, angleDeg: 50, height: 2, g: 9.8, unknown: 'maxHeight' },
    textbook: { value: 3.92, unit: 'm' },
  },
  {
    id: 'cannon',
    title: 'Cannon on a tower',
    text: 'A cannon on top of a 20 m tower fires a ball at 25 m/s at 30° above the horizontal. How far from the base of the tower does the ball land?',
    spec: { type: 'projectile', speed: 25, angleDeg: 30, height: 20, g: 9.8, unknown: 'range' },
    textbook: { value: 79.4, unit: 'm' },
  },
  {
    id: 'ramp',
    title: 'Block on a smooth ramp',
    text: 'A 2 kg block is released from rest at the top of a frictionless ramp inclined at 30°. The ramp is 10 m long. What is the speed of the block at the bottom?',
    spec: { type: 'incline', angleDeg: 30, mu: 0, length: 10, mass: 2, initialSpeed: 0, g: 9.8, unknown: 'finalSpeed' },
    textbook: { value: 9.9, unit: 'm/s' },
  },
  {
    id: 'sled',
    title: 'Sled down a snowy hill',
    text: 'A sled starts from rest at the top of a snowy hill that slopes at 25° and is 40 m long. The coefficient of kinetic friction is 0.1. How long does the sled take to reach the bottom?',
    spec: { type: 'incline', angleDeg: 25, mu: 0.1, length: 40, mass: 30, initialSpeed: 0, g: 9.8, unknown: 'timeToBottom' },
    textbook: { value: 4.96, unit: 's' },
  },
  {
    id: 'pulley',
    title: 'Pulley (not supported)',
    text: 'Two masses of 3 kg and 5 kg hang over a frictionless pulley. Find the acceleration of the system.',
    spec: { type: 'unsupported', reason: 'Pulley systems are not supported yet. NewtonLab handles projectiles and slopes.' },
  },
]
