---
name: liquid-glass-design
description: Advanced Apple-tier "Liquid Glass" UI/UX styling. Focuses on physically accurate refraction, specular highlights, and micro-interactions. Use for high-end web styling.
---

# 💧 Liquid Glass Design System

This system defines the "Liquid Glass" aesthetic—physically accurate, high-gloss, and volumetrically deep styling inspired by Apple VisionOS and macOS Aqua.

## 1. Material & Lighting (CSS)
- **Deep Refraction**: Use `backdrop-filter` with extreme blur (50px+) and over-saturation (200%).
- **Specular Highlight**: Use a curved, semi-transparent white gradient on the top half (e.g., via `::before`) to simulate hard light reflection on a wet, rounded 3D surface.
- **Caustics & Volume**: Layer multiple `box-shadow` properties (inner and outer) to simulate light refraction and realistic ambient depth.
- **Interactive Glare**: Inside the glass, implement a soft radial-gradient spotlight that tracks the mouse cursor (X/Y) using CSS variables and `mix-blend-mode: overlay`.

## 2. Animations & Micro-interactions
- **Spring Physics**: Use Apple-style bouncy spring curves: `transition: all 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)`.
- **Sliding Active States**: Background "pills" behind active items must dynamically recalculate width and slide with spring easing.
- **Tactile Feedback**: Use `transform: scale(0.92)` on `:active` clicks.

## 3. Environment
- **Mesh Gradients**: Glass requires color to refract. Use floating, heavily blurred color blobs as backgrounds.
- **Theme Logic**: Seamlessly transition mesh colors, glass opacity, and shadow intensity between Light and Dark modes using CSS variables.

---

## Critical Rules
- **Material over Flatness**: Avoid flat "glassmorphism." Focus on the "wet, poured resin" look.
- **Performance**: Prioritize 60fps animations.
- **Apple Standard**: Every interaction should feel "magic" and physically grounded.
