# 📚 Blockchain-based Adaptive Learning Platform

Welcome to a revolutionary way to make online education portable and personalized! This project uses AI-integrated adaptive learning paths stored on the Stacks blockchain to secure user progress, certifications, and personalized recommendations. Say goodbye to losing your learning history when switching platforms—everything is immutable, verifiable, and seamlessly transferable.

## ✨ Features

🔒 Secure storage of user progress and learning paths on the blockchain  
🤖 AI-driven adaptive paths that evolve based on user performance  
📈 Track progress across multiple courses and platforms  
🏆 Issue verifiable certifications upon completion  
🔄 Seamless transfer of data between compatible education platforms  
✅ Instant verification of achievements by employers or other platforms  
💰 Reward tokens for milestones to incentivize learning  
🚫 Prevent tampering with progress data through immutable records  

## 🛠 How It Works

This project leverages the Stacks blockchain and Clarity smart contracts to create a decentralized education ecosystem. AI algorithms (integrated off-chain) generate and update personalized learning paths, which are then stored on-chain for security and portability. The system involves 8 smart contracts to handle various aspects of user interaction, data management, and verification.

### Key Smart Contracts
Here's an overview of the 8 Clarity smart contracts that power the platform:

1. **UserRegistry.clar**: Registers users with their Stacks address, profile details, and consent for data sharing. Functions include `register-user` and `update-profile`.
   
2. **CourseCatalog.clar**: Manages a catalog of available courses, including metadata like titles, descriptions, and prerequisites. Functions: `add-course`, `get-course-details`.

3. **Enrollment.clar**: Handles user enrollment in courses or learning paths. Tracks active enrollments and prevents duplicates. Functions: `enroll-user`, `check-enrollment`.

4. **AIPathGenerator.clar**: Stores AI-generated adaptive learning paths (e.g., sequence of modules tailored to user skills). Functions: `store-path`, `update-path` (called via oracle for AI updates).

5. **ProgressTracker.clar**: Records user progress in real-time, such as completed modules or quiz scores. Functions: `update-progress`, `get-progress`.

6. **CertificationIssuer.clar**: Issues blockchain-based certifications upon course completion. Functions: `issue-cert`, `verify-cert`.

7. **RewardToken.clar**: A fungible token contract for rewarding users with tokens for milestones (e.g., completing a path). Functions: `mint-reward`, `transfer-token`.

8. **DataVerifier.clar**: Allows third-party platforms or verifiers to check user progress and certifications without revealing full data. Functions: `verify-progress`, `export-data`.

### For Learners
- Sign up via the UserRegistry contract.
- Enroll in courses using Enrollment.clar.
- As you learn, off-chain AI analyzes your performance and updates your path via AIPathGenerator.clar.
- Track and update progress with ProgressTracker.clar.
- Earn rewards from RewardToken.clar and get certified through CertificationIssuer.clar.
Your data is now portable—share verification proofs with new platforms!

### For Educators/Platforms
- Add courses to the CourseCatalog.clar.
- Integrate AI to push adaptive path updates.
- Use DataVerifier.clar to import verified progress from users switching platforms.

### For Verifiers (e.g., Employers)
- Call `verify-cert` or `verify-progress` from the relevant contracts.
- Get instant, tamper-proof confirmation of a user's achievements.

That's it! This solves the real-world problem of fragmented learning data in online education, enabling seamless switches while keeping everything secure and personalized on the blockchain. To get started, deploy these Clarity contracts on Stacks and integrate with an off-chain AI service for path adaptation.