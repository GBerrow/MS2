# Chess Game - Interactive Web-Based Chess Experience

![Chess Game Preview](assets/images/am-i-responsive.png)

## Introduction

Welcome to the Chess Game project! This sophisticated web application delivers a feature-rich chess experience, combining classical chess rules with modern web technologies. Built using HTML5, CSS3, and JavaScript, this game offers:

- Single-player mode against an AI powered by Stockfish
- Accurate chess movement validation
- Real-time move feedback
- Interactive piece highlighting
- Move sound effects
- Responsive design for all devices

**Live Demo:** [Play Chess Now](https://gberrow.github.io/MS2/)

## Project Overview

This chess implementation stands out with its focus on user experience and technical excellence:

### Key Highlights
- **AI Integration**: Powered by Stockfish chess engine for challenging gameplay
- **Move Validation**: Complete rule enforcement including special moves
- **Audio Feedback**: Custom sound effects for moves and captures
- **Responsive Design**: Seamless play across desktop, tablet, and mobile devices
- **Modern Interface**: Clean, intuitive design with piece highlighting
- **Performance Optimized**: Fast loading and smooth gameplay

### Target Audience
- Chess enthusiasts seeking online practice
- Beginners learning the game
- Players wanting to challenge themselves against AI
- Users looking for a clean, modern chess interface

---

## Contents

- [User Experience (UX)](#user-experience-ux)
- [Design](#design)
  - [Colour Scheme](#colour-scheme)
  - [Typography](#typography)
  - [Wireframes](#wireframes)
  - [layout](#layout)
- [Features](#features)
  - [chess engine](#chess-engine)
  - [Interactive Chessboard](#interactive-chessboard)
  - [Move Validation](#move-validation)
  - [Move Sounds](#move-sounds)
  - [Future Enhancements](#future-enhancements)
- [Technologies Used](#technologies-used)
- [Testing](#testing)
- [Credits](#credits)
  - [Code Contributions](#code-contributions)
  - [Acknowledgments](#acknowledgments)

---

## User Experience (UX)

### User Stories

#### How to play

 Basics of chess:
 - The great game of chess has two opposing sides, light and dark chess pieces, or simply White and Black. The player with the White pieces makes the first move and the player with the Black piece has equal chances. That's where it all begins! You get better at chess by learning and practicing the movements and strategic capabilities of each piece. Chess is revered as a strategy game that demands a high level of intellectual engagement and critical thinking. Each move requires foresight, analysis, and an understanding of the opponent's strategy.

 Link to the in depth game rules - https://en.wikipedia.org/wiki/Rules_of_chess

#### First-Time Visitors
- Want to quickly understand how to start a game
- Need clear visual feedback for possible moves
- Expect intuitive piece movement mechanics
- Look for immediate response from the AI opponent
 
#### Regular Players
- Want quick access to game controls
- Expect consistent piece behavior and rule enforcement
- Need clear indication of game state (check, checkmate)
- Look for responsive gameplay across different devices

#### Advanced Users
- Expect accurate implementation of special moves (en passant, castling)
- Want challenging AI gameplay
- Need reliable move validation
- Look for performance stability during long games

### Design Philosophy

The interface follows chess.com-inspired design principles while maintaining its unique identity:

#### Visual Hierarchy
- Prominent chessboard placement
- Clear piece distinction
- Minimalist surrounding elements
- Strategic use of white space

#### Interactive Elements
- Highlighted legal moves
- sound effects for moves and captures

#### Accessibility Considerations
- High contrast board colors (#f0d9b5, #b58863)
- Clear piece differentiation
- Large enough touch targets for mobile
- Screen reader compatibility

---

## Design

### Colour Scheme

The color palette has been meticulously selected to optimize both aesthetics and functionality:

#### Board Elements
- **Light Squares**: Warm ivory
  - Provides natural warmth
  - Reduces eye strain during extended play
  - Traditional chess aesthetic
- **Dark Squares**: Rich mahogany
  - Creates optimal contrast ratio
  - Maintains professional appearance
  - Complements piece colors

#### Interface Colors
- **Primary Background**: #f0f0f0 (white)
  - Neutral foundation
  - Enhances focus on gameplay
  - Reduces visual noise

#### Typography & Text
- **Primary Text**: #2c3e50 (Deep charcoal)
- **Secondary Text**: #7f8c8d (Slate gray)
- **Status Messages**: #4a4a4a (Dark gray)

### Typography 

A hierarchical type system ensuring readability and style:

#### Primary Font: Roboto

font-family: 'Roboto', sans-serif;

#### Secondary Font: Playfair Display

font-family: 'Playfair Display', serif;

### Wireframes

Basic concept of the website layout:
![Wireframe](assets/images/Wireframes/Chess-wireframe.png)

---

## Features

The following features have been implemented to ensure a fully functional and engaging chess experience:

### Chess Engine Integration
- Stockfish 16.1 integration via Web Workers
- Multi-threaded processing for AI moves
- Configurable engine depth for move calculation
- Real-time position evaluation
### Core Gameplay Features
- **Comprehensive Move Validation**: Real-time validation of all chess moves including:
  - Standard piece movements
  - Capture mechanics
  - Check and pin detection
  - Legal move highlighting
### Advanced Chess Rules
- **Special Moves**:
  - Castling (both kingside and queenside)
  - En Passant captures
  - Pawn promotion with multiple piece options
- **Game State Detection**:
  - Checkmate recognition
  - Stalemate and draw conditions
  - Insufficient material detection
  - Threefold repetition tracking
### Player Experience
- **Visual Feedback**:
  - initial move highlighting
  - Captured pieces display
- **Audio Enhancement**:
  - Piece movement sounds
  - Capture effects
  - Check and checkmate alerts
- **Game Controls**:
  - Game restart option
### Future Enhancements
- Online multiplayer capabilities
- AI opponent with adjustable difficulty
- Opening book integration
- Tournament organization tools
- Personal statistics tracking
- Integration with chess engines
- Social sharing features

---

## Technologies Used

This sophisticated chess implementation combines cutting-edge web technologies and professional development tools to create a high-performance, feature-rich gaming experience. Built with scalability and user experience in mind, the project harnesses the full power of modern web development standards and best practices.

### Core Technologies
- **Stockfish Chess Engine**
  - Version 16.1 Lite implementation
  - Real-time position evaluation capabilities
- **HTML5**
  - Semantic markup
  - Canvas for game rendering
  - Local storage implementation
- **CSS3**
  - Flexbox/Grid layouts
  - Responsive design
  - Custom animations
  - Media queries
- **JavaScript (ES6+)**
  - Object-oriented programming
  - Modern array methods
  - Async/await functionality
  - DOM manipulation
  - Event handling

### Development Tools
- Git for version control
- GitHub for repository hosting
- VS Code as IDE
- Chrome DevTools for debugging
- ESLint for code quality
- Jest for unit testing

### Performance Optimization
- Image compression
- Code minification
- Lazy loading
- Cache management

---

## Testing

Our testing process follows industry best practices with comprehensive coverage across multiple areas. For detailed information about our testing methodology, test cases, and results, please refer to our dedicated testing documentation:

[Testing Documentation](assets/test/testing.md)

Key testing areas include:
- Cross-browser compatibility
- Bugs and fixes
- Performance optimization
- Accessibility testing
- conclusion

### Automated Testing
- **Unit Tests**
  - Move validation logic
  - Chess rule implementation
  - AI response patterns
  - Game state management

- **Integration Tests**
  - Stockfish engine communication
  - User interface interactions
  - Event handling systems
  - Audio system functionality

### Manual Testing Protocols
- **Gameplay Testing**
  - Move validation accuracy
  - Special moves execution
  - Check/checkmate detection
  - Game state persistence

---
## Credits

### Core Development
- **Primary Development**: Fully designed and implemented by myself. 
- **Architecture & Game Logic**: Original implementation with chess rules and AI integration

### External Resources & Tools
- **AI Engine Integration**
  - Stockfish 16.1 Chess Engine (Official GitHub Repository)
  - WebAssembly implementation for browser optimization
  - Move calculation and position evaluation

- **Audio & Visual Assets**
  - SoundSnap: Professional game sound effects library
  - Custom-selected move and capture sounds
  - Unsplash: High-quality background imagery
  - Flaticon: Game favicon and UI elements

- **Development Tools**
  - ChatGPT: Code review and documentation assistance
  - Am I Responsive: Cross-device visualization testing
  - Chrome DevTools: Performance optimization

### Technical Acknowledgments
- **Stockfish Team**: For their outstanding open-source chess engine
- **Chess Programming Community**: For algorithm insights and optimization techniques

### Special Thanks
- Mentor guidance for architectural decisions and best practices
- Code Institute for comprehensive web development curriculum and support
- Chess.com for interface inspiration and UX patterns
