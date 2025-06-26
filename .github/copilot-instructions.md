# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a React TypeScript project that creates videos from user-uploaded images synchronized with music beats. The application includes:

- **Audio Analysis**: Uses Web Audio API for beat detection and frequency analysis
- **Image Processing**: Canvas-based image manipulation and transitions
- **Video Generation**: Real-time video rendering with synchronized animations
- **UI/UX**: Modern interface with drag-and-drop functionality

## Key Technologies
- React 18 with TypeScript
- Vite for build tooling
- Web Audio API for audio processing
- Canvas API for video rendering
- CSS3 animations for transitions

## Code Style Guidelines
- Use functional components with hooks
- Implement TypeScript interfaces for all data structures
- Use proper error handling for media operations
- Follow React best practices for state management
- Use modern ES6+ syntax

## Specific Instructions
- When working with audio, always handle browser compatibility issues
- Implement proper cleanup for audio contexts and canvas elements
- Use requestAnimationFrame for smooth animations
- Handle file upload validation and error states
- Ensure responsive design for different screen sizes
