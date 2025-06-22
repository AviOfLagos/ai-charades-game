WORKSPACE RULES:

1. TECHNOLOGY STACK:
   - Framework: React with Vite
   - Language: TypeScript
   - UI Library: Tailwind CSS for styling
   - State Management: React Context API or zustand for simplicity
   - Backend (if needed): Node.js with Express
   - Data Storage: Local storage for MVP, with option to extend to Firebase

2. GAME-SPECIFIC REQUIREMENTS:
   - Mobile-first approach for game interface
   - Support for processing text files as context input
   - NLP capabilities through integration with a suitable library
   - Flexible difficulty settings (easy, medium, hard)
   - Card-based UI for displaying charades items
   - Turn-based gameplay functionality
   - Timer implementation for rounds
   - Score tracking system
   - Multi-player support within same device (initially)

3. TEXT PROCESSING:
   - Implement text analysis to extract relevant terms/phrases based on context
   - Create algorithms for categorizing items by difficulty
   - Include filters for inappropriate content
   - Generate varied types of charade items (people, actions, relationships, trends)

4. DATA HANDLING:
   - Store game session data locally
   - Implement data persistence between sessions
   - Create backup/restore functionality for game data
   - Handle text processing efficiently for larger context files

5. USER EXPERIENCE:
   - Implement clear turn indicators
   - Design intuitive card selection mechanism
   - Create visual feedback for correct/incorrect guesses
   - Include options to customize game settings
   - Develop simple onboarding flow for first-time users

6. TESTING REQUIREMENTS:
   - Unit tests for core game logic
   - Integration tests for text processing functionality
   - Manual testing scenarios for gameplay mechanics
   - Compatibility testing for different devices/browsers