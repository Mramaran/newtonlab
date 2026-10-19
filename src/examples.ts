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
    id: 'atwood',
    title: 'Two blocks over a pulley',
    text: 'Two blocks of 3 kg and 5 kg are tied to the ends of a light string that passes over a smooth, frictionless pulley. Find the acceleration of the blocks.',
    spec: { type: 'pulley', setup: 'atwood', m1: 3, m2: 5, mu: 0, distance: 1, g: 9.8, unknown: 'acceleration' },
    textbook: { value: 2.45, unit: 'm/s²' },
  },
  {
    id: 'table-pulley',
    title: 'Block on a rough table',
    text: 'A 4 kg block rests on a rough horizontal table (coefficient of kinetic friction 0.2). A light string over a pulley at the edge of the table joins it to a freely hanging 2 kg block. Find the tension in the string. Take g = 10 m/s².',
    spec: { type: 'pulley', setup: 'table', m1: 4, m2: 2, mu: 0.2, distance: 1, g: 10, unknown: 'tension' },
    textbook: { value: 16, unit: 'N' },
  },
  {
    id: 'trolleys',
    title: 'Trolleys that stick together',
    text: 'A 2 kg trolley moving at 3 m/s collides with a 1 kg trolley at rest, and they stick together. How much kinetic energy is lost in the collision?',
    spec: { type: 'collision', m1: 2, u1: 3, m2: 1, u2: 0, e: 0, unknown: 'keLoss' },
    textbook: { value: 3, unit: 'J' },
  },
  {
    id: 'elastic-balls',
    title: 'Head-on elastic collision',
    text: 'A 2 kg ball moving at 5 m/s hits a 3 kg ball coming towards it at 2 m/s in a perfectly elastic head-on collision. Find the velocity of the 3 kg ball after the collision.',
    spec: { type: 'collision', m1: 2, u1: 5, m2: 3, u2: -2, e: 1, unknown: 'v2' },
    textbook: { value: 3.6, unit: 'm/s' },
  },
  {
    id: 'spring-block',
    title: 'Block on a spring',
    text: 'A 0.5 kg block attached to a spring of force constant 50 N/m is pulled 10 cm from its equilibrium position and released. Find its maximum speed.',
    spec: { type: 'spring', m: 0.5, k: 50, A: 0.1, unknown: 'maxSpeed' },
    textbook: { value: 1, unit: 'm/s' },
  },
  {
    id: 'pendulum',
    title: 'Pendulum (not supported)',
    text: 'A simple pendulum is 2 m long. Find its time period.',
    spec: { type: 'unsupported', reason: 'Pendulums are not supported yet. NewtonLab handles projectiles, slopes, pulleys, collisions and springs.' },
  },
]
