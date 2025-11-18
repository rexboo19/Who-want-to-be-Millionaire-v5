// Math Millionaire Game Logic
class MathMillionaireGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.gameActive = false;
        // Lifelines are now tracked per class
        // Structure: { className: { '50-50': true/false, 'phone': true/false, 'audience': true/false } }
        this.classLifelines = {};
        
        // Initialize sound effects
        this.soundManager = new SoundManager();
        
        // Prize ladder amounts (in ascending order)
        this.prizeLadder = [
            100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000,
            64000, 125000, 250000, 500000, 1000000
        ];
        
        // Game session ID for audience connection
        this.sessionId = null;
        
        // Chart instance for class scores
        this.classScoreChart = null;
        
        // Class assignment tracking
        this.classes = []; // List of available classes
        this.questionClassAssignments = {}; // Track which class is assigned to each question
        
        // Load questions from localStorage or use defaults
        this.questions = this.loadQuestions();
        
        this.initializeGame();
    }
    
    // Initialize game (async to load classes from Firebase)
    async initializeGame() {
        await this.loadClasses(); // Load available classes from Firebase/localStorage
        this.bindEvents();
        this.updatePrizeLadder();
        this.showStartScreen();
    }
    
    // Load questions from localStorage or use defaults
    loadQuestions() {
        const stored = localStorage.getItem('mathMillionaireQuestions');
        if (stored) {
            return JSON.parse(stored);
        } else {
            // Return default questions if none are stored
            return [
                {
                    question: "What is 15 + 27?",
                    options: ["42", "41", "43", "40"],
                    correct: 0,
                    topic: "Arithmetic"
                },
                {
                    question: "What is 8 × 7?",
                    options: ["54", "56", "58", "60"],
                    correct: 1,
                    topic: "Arithmetic"
                },
                {
                    question: "What is 144 ÷ 12?",
                    options: ["10", "11", "12", "13"],
                    correct: 2,
                    topic: "Arithmetic"
                },
                {
                    question: "What is 5² + 3²?",
                    options: ["32", "34", "36", "38"],
                    correct: 1,
                    topic: "Algebra"
                },
                {
                    question: "What is √64?",
                    options: ["6", "7", "8", "9"],
                    correct: 2,
                    topic: "Algebra"
                },
                {
                    question: "What is 2³ × 3²?",
                    options: ["70", "72", "74", "76"],
                    correct: 1,
                    topic: "Algebra"
                },
                {
                    question: "What is 15% of 200?",
                    options: ["25", "30", "35", "40"],
                    correct: 1,
                    topic: "Percentages"
                },
                {
                    question: "What is the area of a circle with radius 7? (π ≈ 3.14)",
                    options: ["147.86", "153.86", "159.86", "165.86"],
                    correct: 1,
                    topic: "Geometry"
                },
                {
                    question: "What is 3x + 5 = 20, find x?",
                    options: ["3", "4", "5", "6"],
                    correct: 2,
                    topic: "Algebra"
                },
                {
                    question: "What is the derivative of x²?",
                    options: ["x", "2x", "x²", "2x²"],
                    correct: 1,
                    topic: "Calculus"
                },
                {
                    question: "What is ∫(2x + 3)dx?",
                    options: ["x² + 3x + C", "2x² + 3x + C", "x² + 6x + C", "2x² + 6x + C"],
                    correct: 0,
                    topic: "Calculus"
                },
                {
                    question: "What is the limit of (x² - 4)/(x - 2) as x approaches 2?",
                    options: ["2", "3", "4", "5"],
                    correct: 2,
                    topic: "Calculus"
                },
                {
                    question: "What is the determinant of [[2,3],[4,5]]?",
                    options: ["-2", "-1", "1", "2"],
                    correct: 0,
                    topic: "Linear Algebra"
                },
                {
                    question: "What is the sum of the first 10 natural numbers?",
                    options: ["50", "55", "60", "65"],
                    correct: 1,
                    topic: "Sequences"
                },
                {
                    question: "What is the probability of rolling a 6 on a fair die?",
                    options: ["1/3", "1/4", "1/5", "1/6"],
                    correct: 3,
                    topic: "Probability"
                }
            ];
        }
    }
    
    // Load classes from Firebase or localStorage
    async loadClasses() {
        // Try to load from Firebase first, fallback to localStorage
        if (window.dataStore) {
            const stored = await window.dataStore.get('mathMillionaireClasses');
            if (stored && Array.isArray(stored)) {
                this.classes = stored.sort(); // Sort alphabetically for consistent round-robin
                this.populateClassSelector();
            } else {
                // Try localStorage as fallback
                const localStored = localStorage.getItem('mathMillionaireClasses');
                if (localStored) {
                    this.classes = JSON.parse(localStored).sort();
                    this.populateClassSelector();
                } else {
                    this.classes = [];
                    this.populateClassSelector();
                }
            }
        } else {
            // Fallback to localStorage only
            const stored = localStorage.getItem('mathMillionaireClasses');
            if (stored) {
                this.classes = JSON.parse(stored).sort(); // Sort alphabetically for consistent round-robin
                this.populateClassSelector();
            } else {
                this.classes = [];
                this.populateClassSelector();
            }
        }
    }
    
    // Populate class selector dropdown
    populateClassSelector() {
        const selector = document.getElementById('class-selector');
        if (!selector) return;
        
        // Clear existing options
        selector.innerHTML = '';
        
        // Add classes to dropdown
        this.classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            selector.appendChild(option);
        });
    }
    
    // Get assigned class for current question (with auto-assignment)
    getAssignedClass(questionIndex) {
        // Check if manually assigned
        if (this.questionClassAssignments[questionIndex]) {
            return this.questionClassAssignments[questionIndex];
        }
        
        // Auto-assign using round-robin if classes are available
        if (this.classes.length > 0) {
            // Calculate which class index to use based on question number (0-indexed)
            const classIndex = questionIndex % this.classes.length;
            const assignedClass = this.classes[classIndex];
            // Store the auto-assignment
            this.questionClassAssignments[questionIndex] = assignedClass;
            return assignedClass;
        }
        
        return null;
    }
    
    // Bind event listeners
    bindEvents() {
        // Start game button
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        // Next question button
        document.getElementById('next-question').addEventListener('click', () => {
            this.nextQuestion();
        });
        
        // Quit game button
        document.getElementById('quit-game').addEventListener('click', () => {
            this.quitGame();
        });
        
        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option') && this.gameActive) {
                const option = e.target.closest('.option');
                this.selectOption(option);
            }
        });
        
        // Lifeline buttons
        document.getElementById('fifty-fifty').addEventListener('click', () => {
            this.useLifeline('50-50');
        });
        
        document.getElementById('phone-friend').addEventListener('click', () => {
            this.useLifeline('phone');
        });
        
        document.getElementById('ask-audience').addEventListener('click', () => {
            this.useLifeline('audience');
        });
        
        // Statistics button (can be clicked anytime, multiple times)
        document.getElementById('show-statistics').addEventListener('click', () => {
            this.showStatistics();
        });
        
        // Class selector change handler
        const classSelector = document.getElementById('class-selector');
        if (classSelector) {
            classSelector.addEventListener('change', (e) => {
                this.handleClassSelection(e.target.value);
            });
        }
    }
    
    // Handle manual class selection
    handleClassSelection(selectedClass) {
        if (this.gameActive && this.currentQuestion >= 0 && selectedClass) {
            // Manual assignment - override auto-assignment
            this.questionClassAssignments[this.currentQuestion] = selectedClass;
            this.updateAssignedClassDisplay(selectedClass);
            // Update lifelines for the newly selected class
            this.updateLifelinesForClass(selectedClass);
            // Store assignment in session
            if (this.sessionId) {
                localStorage.setItem(`gameSession_${this.sessionId}_questionClass_${this.currentQuestion}`, selectedClass);
            }
        }
    }
    
    // Update auto-assign index based on existing assignments
    updateAutoAssignIndex() {
        // Auto-assignment is now based on question index, so no need to track index separately
        // This function is kept for compatibility but the logic is in getAssignedClass
    }
    
    // Update the assigned class display
    updateAssignedClassDisplay(assignedClass) {
        const display = document.getElementById('assigned-class-display');
        const classSpan = document.getElementById('current-assigned-class');
        
        if (assignedClass) {
            classSpan.textContent = assignedClass;
            display.style.display = 'block';
        } else {
            classSpan.textContent = 'Not assigned';
            display.style.display = 'block';
        }
    }
    
    // Show start screen
    showStartScreen() {
        document.getElementById('start-game').style.display = 'inline-block';
        document.getElementById('next-question').style.display = 'none';
        document.getElementById('quit-game').style.display = 'none';
        this.resetLifelines();
    }
    
    // Start the game
    startGame() {
        this.gameActive = true;
        this.currentQuestion = 0;
        this.score = 0;
        this.resetLifelines();
        this.updatePrizeLadder();
        
        // Reset class assignments
        this.questionClassAssignments = {};
        
        // Generate unique session ID for this game
        this.sessionId = this.generateSessionId();
        
        // Store session ID using dataStore (Firebase or localStorage)
        this.initializeSession();
        
        // Generate and show QR code
        this.generateQRCode();
        
        // Load first question
        this.loadQuestion();
        
        // Initialize lifelines for the first question's assigned class
        const firstAssignedClass = this.getAssignedClass(0);
        if (firstAssignedClass) {
            this.updateLifelinesForClass(firstAssignedClass);
        }
        
        // Play game start sound
        this.soundManager.play('gameStart');
        
        document.getElementById('start-game').style.display = 'none';
        document.getElementById('quit-game').style.display = 'inline-block';
    }
    
    // Generate unique session ID
    generateSessionId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Initialize session in dataStore (Firebase or localStorage)
    async initializeSession() {
        if (!window.dataStore) {
            console.warn('dataStore not available, using localStorage fallback');
            localStorage.setItem('currentGameSession', this.sessionId);
            localStorage.setItem(`gameSession_${this.sessionId}_active`, 'true');
            localStorage.setItem(`gameSession_${this.sessionId}_question`, '0');
            
            const scoresKey = `gameSession_${this.sessionId}_classScores`;
            if (!localStorage.getItem(scoresKey)) {
                const initialScores = {};
                this.classes.forEach(className => {
                    initialScores[className] = 0;
                });
                localStorage.setItem(scoresKey, JSON.stringify(initialScores));
            }
            return;
        }
        
        // Use dataStore (Firebase or localStorage)
        await window.dataStore.set('currentGameSession', this.sessionId);
        await window.dataStore.set(`gameSession_${this.sessionId}_active`, 'true');
        await window.dataStore.set(`gameSession_${this.sessionId}_question`, '0');
        
        // Initialize class scores for this session
        const scoresKey = `gameSession_${this.sessionId}_classScores`;
        const existingScores = await window.dataStore.get(scoresKey);
        if (!existingScores) {
            const initialScores = {};
            this.classes.forEach(className => {
                initialScores[className] = 0;
            });
            await window.dataStore.set(scoresKey, initialScores);
        }
    }
    
    // Generate QR code for audience to join
    generateQRCode() {
        // Get current page URL and construct audience URL
        // This works for both local development and GitHub Pages
        const origin = window.location.origin;
        let path = window.location.pathname;
        
        // Remove filename if present (e.g., index.html)
        if (path.endsWith('index.html')) {
            path = path.replace('index.html', '');
        }
        
        // Ensure path ends with /
        if (!path.endsWith('/')) {
            path += '/';
        }
        
        // Construct audience URL
        const audienceUrl = origin + path + 'audience.html?session=' + this.sessionId;
        
        // Clear previous QR code if exists
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        
        // Generate QR code using QRCode.js library
        // Wait a bit for library to load if needed
        setTimeout(() => {
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: audienceUrl,
                    width: 256,
                    height: 256,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // Fallback: show URL if QRCode library not loaded
                this.generateQRCodeFallback(qrContainer, audienceUrl);
            }
        }, 100);
        
        // Set URL in input field
        document.getElementById('game-url').value = audienceUrl;
        
        // Show QR code modal
        const qrModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
        qrModal.show();
        
        // Add copy URL functionality
        document.getElementById('copy-url-btn').onclick = () => {
            const urlInput = document.getElementById('game-url');
            urlInput.select();
            urlInput.setSelectionRange(0, 99999); // For mobile devices
            
            // Use modern Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(audienceUrl).then(() => {
                    this.showCopyFeedback();
                });
            } else {
                // Fallback for older browsers
                document.execCommand('copy');
                this.showCopyFeedback();
            }
        };
    }
    
    // Show copy feedback
    showCopyFeedback() {
        const btn = document.getElementById('copy-url-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-light');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-light');
        }, 2000);
    }
    
    // Fallback QR code generation (simple text-based)
    generateQRCodeFallback(container, url) {
        container.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 10px;">
                <p style="color: #000; margin-bottom: 10px; font-weight: bold;">Scan with your phone camera or visit:</p>
                <p style="color: #0066cc; word-break: break-all; font-size: 0.9rem;">${url}</p>
            </div>
        `;
    }
    
    // Load current question
    loadQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame(true);
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        
        // Get assigned class for this question (auto-assign if not manually set)
        const assignedClass = this.getAssignedClass(this.currentQuestion);
        
        // Update class selector to always show the assigned class
        const classSelector = document.getElementById('class-selector');
        if (classSelector && assignedClass) {
            classSelector.value = assignedClass;
        }
        
        // Update assigned class display
        this.updateAssignedClassDisplay(assignedClass);
        
        // Update lifelines based on assigned class
        this.updateLifelinesForClass(assignedClass);
        
        // Update session data for audience page using dataStore
        if (this.sessionId) {
            this.updateSessionData(question, assignedClass);
        }
        
        // Update question number
        document.getElementById('current-question').textContent = `Question ${this.currentQuestion + 1}`;
        
        // Update question text
        document.getElementById('question-text').innerHTML = this.renderMath(question.question);
        
        // Handle question image
        const imageContainer = document.getElementById('question-image-container');
        const questionImage = document.getElementById('question-image');
        
        if (question.image) {
            questionImage.src = question.image;
            imageContainer.style.display = 'block';
        } else {
            imageContainer.style.display = 'none';
        }
        
        // Update options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.setAttribute('data-option', String.fromCharCode(65 + index));
            optionElement.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${this.renderMath(option)}</span>
            `;
            optionsContainer.appendChild(optionElement);
        });
        
        // Update prize ladder
        this.updatePrizeLadder();
    }
    
    // Select an option
    selectOption(optionElement) {
        if (!this.gameActive) return;
        
        // Remove previous selections
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Mark selected option
        optionElement.classList.add('selected');
        
        // Get the selected option index
        const optionIndex = Array.from(optionElement.parentNode.children).indexOf(optionElement);
        const question = this.questions[this.currentQuestion];
        
        // Check if answer is correct
        setTimeout(() => {
            this.checkAnswer(optionIndex, question);
        }, 1000);
    }
    
    // Check if answer is correct
    checkAnswer(selectedIndex, question) {
        const options = document.querySelectorAll('.option');
        const isCorrect = selectedIndex === question.correct;
        
        // Mark correct answer
        options[question.correct].classList.add('correct');
        
        if (!isCorrect) {
            // Mark incorrect answer
            options[selectedIndex].classList.add('incorrect');
        }
        
        // Get assigned class for this question
        const assignedClass = this.getAssignedClass(this.currentQuestion);
        
        if (isCorrect) {
            // Play correct answer sound
            this.soundManager.play('correct');
            
            // Award 100000 points to the assigned class for correct answer
            if (assignedClass && this.sessionId) {
                this.awardClassPoints(assignedClass, 100000).catch(err => {
                    console.error('Error awarding class points:', err);
                });
            }
            
            this.score = this.prizeLadder[this.currentQuestion];
        } else {
            // Play incorrect answer sound
            this.soundManager.play('incorrect');
            // No points awarded for wrong answer, but game continues
        }
        
        // Always move to next question (no game over)
        this.currentQuestion++;
        
        setTimeout(() => {
            if (this.currentQuestion < this.questions.length) {
                this.loadQuestion();
            } else {
                // All questions completed
                this.endGame(true);
            }
        }, 2000);
    }
    
    // Award points to a class
    async awardClassPoints(className, points) {
        if (!this.sessionId) return;
        
        // Get current class scores from session using dataStore
        const scoresKey = `gameSession_${this.sessionId}_classScores`;
        let classScores = {};
        
        if (window.dataStore) {
            const storedScores = await window.dataStore.get(scoresKey);
            classScores = storedScores || {};
        } else {
            // Fallback to localStorage
            const storedScores = localStorage.getItem(scoresKey);
            if (storedScores) {
                classScores = JSON.parse(storedScores);
            }
        }
        
        // Initialize if not exists
        if (!classScores[className]) {
            classScores[className] = 0;
        }
        
        // Add points
        classScores[className] += points;
        
        // Save back using dataStore
        if (window.dataStore) {
            await window.dataStore.set(scoresKey, classScores);
        } else {
            localStorage.setItem(scoresKey, JSON.stringify(classScores));
        }
    }
    
    // Update session data for audience page
    async updateSessionData(question, assignedClass) {
        if (!this.sessionId) return;
        
        const questionData = {
            question: question.question,
            options: question.options,
            questionNumber: this.currentQuestion + 1,
            correct: question.correct,
            assignedClass: assignedClass
        };
        
        if (window.dataStore) {
            await window.dataStore.set(`gameSession_${this.sessionId}_question`, this.currentQuestion.toString());
            await window.dataStore.set(`gameSession_${this.sessionId}_questionData`, questionData);
            await window.dataStore.set(`gameSession_${this.sessionId}_questionData_${this.currentQuestion}`, questionData);
            if (assignedClass) {
                await window.dataStore.set(`gameSession_${this.sessionId}_questionClass_${this.currentQuestion}`, assignedClass);
            }
            await window.dataStore.remove(`gameSession_${this.sessionId}_votes_${this.currentQuestion}`);
        } else {
            // Fallback to localStorage
            localStorage.setItem(`gameSession_${this.sessionId}_question`, this.currentQuestion.toString());
            localStorage.setItem(`gameSession_${this.sessionId}_questionData`, JSON.stringify(questionData));
            localStorage.setItem(`gameSession_${this.sessionId}_questionData_${this.currentQuestion}`, JSON.stringify(questionData));
            if (assignedClass) {
                localStorage.setItem(`gameSession_${this.sessionId}_questionClass_${this.currentQuestion}`, assignedClass);
            }
            localStorage.removeItem(`gameSession_${this.sessionId}_votes_${this.currentQuestion}`);
        }
    }
    
    // Use a lifeline
    useLifeline(lifelineType) {
        if (!this.gameActive) return;
        
        // Get assigned class for current question
        const assignedClass = this.getAssignedClass(this.currentQuestion);
        if (!assignedClass) {
            // No class assigned, can't use lifelines
            return;
        }
        
        // Check if this class has already used this lifeline
        if (!this.isLifelineAvailable(assignedClass, lifelineType)) {
            return;
        }
        
        // Play lifeline sound
        this.soundManager.play('lifeline');
        
        // Mark lifeline as used for this class
        this.markLifelineUsed(assignedClass, lifelineType);
        
        // Update button appearance
        document.getElementById(lifelineType === '50-50' ? 'fifty-fifty' : 
                           lifelineType === 'phone' ? 'phone-friend' : 'ask-audience')
            .classList.add('used');
        
        switch (lifelineType) {
            case '50-50':
                this.useFiftyFifty();
                break;
            case 'phone':
                this.usePhoneFriend();
                break;
            case 'audience':
                this.useAskAudience();
                break;
        }
    }
    
    // Check if a lifeline is available for a specific class
    isLifelineAvailable(className, lifelineType) {
        if (!className) return false;
        
        // Load lifeline status for this class from localStorage
        const lifelinesKey = `gameSession_${this.sessionId}_classLifelines_${className}`;
        const stored = localStorage.getItem(lifelinesKey);
        
        if (stored) {
            const classLifelines = JSON.parse(stored);
            return classLifelines[lifelineType] !== false; // Available if not explicitly false
        }
        
        // If not stored, it's available (first time for this class)
        return true;
    }
    
    // Mark a lifeline as used for a specific class
    markLifelineUsed(className, lifelineType) {
        if (!className || !this.sessionId) return;
        
        // Load current lifeline status for this class
        const lifelinesKey = `gameSession_${this.sessionId}_classLifelines_${className}`;
        const stored = localStorage.getItem(lifelinesKey);
        let classLifelines = stored ? JSON.parse(stored) : {
            '50-50': true,
            'phone': true,
            'audience': true
        };
        
        // Mark this lifeline as used
        classLifelines[lifelineType] = false;
        
        // Save back to localStorage
        localStorage.setItem(lifelinesKey, JSON.stringify(classLifelines));
        
        // Also update in-memory cache
        if (!this.classLifelines[className]) {
            this.classLifelines[className] = {};
        }
        this.classLifelines[className][lifelineType] = false;
    }
    
    // Update lifeline buttons based on assigned class
    updateLifelinesForClass(className) {
        if (!className) {
            // No class assigned, disable all lifelines
            document.querySelectorAll('.lifeline-btn').forEach(btn => {
                btn.classList.add('used');
                btn.disabled = true;
            });
            return;
        }
        
        // Enable/disable lifelines based on this class's usage
        const lifelineTypes = ['50-50', 'phone', 'audience'];
        const buttonIds = {
            '50-50': 'fifty-fifty',
            'phone': 'phone-friend',
            'audience': 'ask-audience'
        };
        
        lifelineTypes.forEach(lifelineType => {
            const buttonId = buttonIds[lifelineType];
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            const isAvailable = this.isLifelineAvailable(className, lifelineType);
            
            if (isAvailable) {
                button.classList.remove('used');
                button.disabled = false;
            } else {
                button.classList.add('used');
                button.disabled = true;
            }
        });
    }
    
    // 50:50 lifeline - remove two wrong answers
    useFiftyFifty() {
        const question = this.questions[this.currentQuestion];
        const options = document.querySelectorAll('.option');
        const wrongOptions = [];
        
        // Find wrong options
        options.forEach((option, index) => {
            if (index !== question.correct) {
                wrongOptions.push(index);
            }
        });
        
        // Remove two random wrong options
        const toRemove = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
        toRemove.forEach(index => {
            options[index].style.display = 'none';
        });
        
        this.showLifelineModal('50:50', 'Two wrong answers have been removed!');
    }
    
    // Phone a friend lifeline
    usePhoneFriend() {
        const question = this.questions[this.currentQuestion];
        const correctAnswer = question.options[question.correct];
        const friendResponse = `"I'm pretty confident the answer is ${correctAnswer}. I'd say about 85% sure!"`;
        
        this.showLifelineModal('Phone a Friend', `
            <div class="text-center">
                <i class="fas fa-phone fa-3x mb-3" style="color: #FFD700;"></i>
                <p><strong>Your friend says:</strong></p>
                <p class="fst-italic">${friendResponse}</p>
            </div>
        `);
    }
    
    // Ask the audience lifeline
    useAskAudience() {
        const question = this.questions[this.currentQuestion];
        const correctIndex = question.correct;
        
        // Try to get real audience votes from localStorage
        let results = [0, 0, 0, 0];
        const votesKey = `gameSession_${this.sessionId}_votes_${this.currentQuestion}`;
        const audienceVotes = localStorage.getItem(votesKey);
        
        if (audienceVotes && this.sessionId) {
            // Use real audience votes
            const votes = JSON.parse(audienceVotes);
            const totalVotes = votes.reduce((sum, count) => sum + count, 0);
            
            if (totalVotes > 0) {
                // Calculate percentages from real votes
                results = votes.map(count => Math.round((count / totalVotes) * 100));
                
                // Ensure total is 100%
                const total = results.reduce((sum, val) => sum + val, 0);
                if (total !== 100) {
                    const diff = 100 - total;
                    results[correctIndex] += diff; // Add difference to correct answer
                }
            } else {
                // No votes yet, use simulated results
                results = this.generateSimulatedAudienceResults(correctIndex);
            }
        } else {
            // No session or no votes, use simulated results
            results = this.generateSimulatedAudienceResults(correctIndex);
        }
        
        let audienceHTML = '<div class="text-center"><h6>Audience Poll Results:</h6>';
        if (audienceVotes && this.sessionId) {
            const votes = JSON.parse(audienceVotes);
            const totalVotes = votes.reduce((sum, count) => sum + count, 0);
            audienceHTML += `<p class="text-muted mb-3"><small>${totalVotes} audience member${totalVotes !== 1 ? 's' : ''} voted</small></p>`;
        }
        question.options.forEach((option, index) => {
            audienceHTML += `
                <div class="mb-2">
                    <div class="d-flex justify-content-between">
                        <span>${String.fromCharCode(65 + index)}: ${option}</span>
                        <span>${results[index]}%</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-warning" style="width: ${results[index]}%"></div>
                    </div>
                </div>
            `;
        });
        audienceHTML += '</div>';
        
        this.showLifelineModal('Ask the Audience', audienceHTML);
    }
    
    // Generate simulated audience results (fallback)
    generateSimulatedAudienceResults(correctIndex) {
        const results = [0, 0, 0, 0];
        results[correctIndex] = Math.floor(Math.random() * 20) + 60; // 60-80% for correct answer
        
        // Distribute remaining percentage among other options
        let remaining = 100 - results[correctIndex];
        for (let i = 0; i < 4; i++) {
            if (i !== correctIndex) {
                const percentage = Math.floor(Math.random() * remaining);
                results[i] = percentage;
                remaining -= percentage;
            }
        }
        
        // Ensure total is 100%
        if (remaining > 0) {
            results[correctIndex] += remaining;
        }
        
        return results;
    }
    
    // Show lifeline modal
    showLifelineModal(title, content) {
        const titleElement = document.getElementById('lifeline-title');
        titleElement.textContent = title;
        titleElement.style.fontSize = '1.5rem';
        titleElement.style.fontWeight = 'bold';
        document.getElementById('lifeline-content').innerHTML = content;
        const modal = new bootstrap.Modal(document.getElementById('lifelineModal'));
        modal.show();
    }
    
    // Show statistics (similar to Ask the Audience, but can be clicked anytime)
    async showStatistics() {
        // Check if there's an active game session
        const currentSession = localStorage.getItem('currentGameSession');
        let questionIndex = -1;
        let question = null;
        
        if (currentSession && this.gameActive) {
            // If game is active, show stats for current question
            questionIndex = this.currentQuestion;
            question = this.questions[questionIndex];
        } else if (currentSession) {
            // If session exists but game not active, try to get the last question
            const lastQuestionIndex = localStorage.getItem(`gameSession_${currentSession}_question`);
            if (lastQuestionIndex !== null) {
                questionIndex = parseInt(lastQuestionIndex);
                const questionData = localStorage.getItem(`gameSession_${currentSession}_questionData`);
                if (questionData) {
                    const data = JSON.parse(questionData);
                    question = {
                        question: data.question,
                        options: data.options,
                        correct: null // We don't know the correct answer from stored data
                    };
                }
            }
        }
        
        // Calculate and show class scores
        const classScores = await this.calculateClassScores(currentSession);
        
        // If we have a question, show statistics for it
        if (question && questionIndex >= 0) {
            this.showQuestionStatistics(question, questionIndex, currentSession, classScores);
        } else {
            // No active question, but show class scores if available
            if (Object.keys(classScores).length > 0) {
                let statsHTML = '<div class="text-center"><h6>Class Scores</h6>';
                statsHTML += this.renderClassScores(classScores);
                statsHTML += '</div>';
                this.showLifelineModal('Statistics', statsHTML);
            } else {
                // No active question, show message
                this.showLifelineModal('Statistics', `
                    <div class="text-center">
                        <i class="fas fa-chart-bar fa-3x mb-3" style="color: #FFD700;"></i>
                        <p><strong>No active question found.</strong></p>
                        <p class="text-muted">Start a game to see audience voting statistics for questions.</p>
                    </div>
                `);
            }
        }
    }
    
    // Calculate scores for all classes based on prize ladder
    async calculateClassScores(sessionId) {
        if (!sessionId) return {};
        
        const classScores = {};
        let classes = [];
        
        // Try to load classes from Firebase first, fallback to localStorage
        if (window.dataStore) {
            const stored = await window.dataStore.get('mathMillionaireClasses');
            if (stored && Array.isArray(stored)) {
                classes = stored;
            } else {
                const localStored = localStorage.getItem('mathMillionaireClasses');
                if (localStored) {
                    classes = JSON.parse(localStored);
                } else {
                    return {};
                }
            }
        } else {
            const allClasses = localStorage.getItem('mathMillionaireClasses');
            if (!allClasses) return {};
            classes = JSON.parse(allClasses);
        }
        
        // First, get scores from host's correct answers
        const scoresKey = `gameSession_${sessionId}_classScores`;
        const storedScores = localStorage.getItem(scoresKey);
        if (storedScores) {
            const hostScores = JSON.parse(storedScores);
            classes.forEach(className => {
                classScores[className] = {
                    totalScore: hostScores[className] || 0,
                    correctAnswers: 0,
                    totalQuestions: 0
                };
            });
        } else {
            // Initialize scores for all classes
            classes.forEach(className => {
                classScores[className] = {
                    totalScore: 0,
                    correctAnswers: 0,
                    totalQuestions: 0
                };
            });
        }
        
        // Check all questions (up to 15)
        for (let qIndex = 0; qIndex < 15; qIndex++) {
            // Calculate prize for this question (original scoring method)
            const prizeAmount = this.prizeLadder[qIndex] || 0;
            
            // Get class votes for this question
            const classVotesKey = `gameSession_${sessionId}_classVotes_${qIndex}`;
            const classVotesData = localStorage.getItem(classVotesKey);
            
            if (!classVotesData) continue;
            
            const classVotes = JSON.parse(classVotesData);
            
            // Get the correct answer for this question from stored data
            let correctAnswerIndex = null;
            
            // First try to get from stored question data
            const storedQuestionData = localStorage.getItem(`gameSession_${sessionId}_questionData_${qIndex}`);
            if (storedQuestionData) {
                const data = JSON.parse(storedQuestionData);
                correctAnswerIndex = data.correct;
            } else if (qIndex < this.questions.length) {
                // Fallback to current questions array
                correctAnswerIndex = this.questions[qIndex].correct;
            } else {
                // Skip if we don't have the correct answer
                continue;
            }
            
            // Check each class's votes
            Object.keys(classVotes).forEach(className => {
                if (!classScores[className]) {
                    classScores[className] = {
                        totalScore: 0,
                        correctAnswers: 0,
                        totalQuestions: 0
                    };
                }
                
                const classVoteArray = classVotes[className];
                const totalVotes = classVoteArray.reduce((sum, count) => sum + count, 0);
                
                if (totalVotes > 0) {
                    classScores[className].totalQuestions++;
                    
                    // Count how many members of the class voted for the correct answer
                    const correctVotes = classVoteArray[correctAnswerIndex] || 0;
                    
                    // Award points for each correct answer: correctVotes × prizeAmount (original scoring)
                    if (correctVotes > 0) {
                        classScores[className].totalScore += (correctVotes * prizeAmount);
                        classScores[className].correctAnswers += correctVotes;
                    }
                }
            });
        }
        
        return classScores;
    }
    
    // Render class scores in a leaderboard format with bar chart
    renderClassScores(classScores) {
        if (Object.keys(classScores).length === 0) {
            return '<p class="text-muted">No class scores available yet.</p>';
        }
        
        // Sort classes by score (descending)
        const sortedClasses = Object.keys(classScores).sort((a, b) => {
            return classScores[b].totalScore - classScores[a].totalScore;
        });
        
        // Generate unique ID for chart canvas
        const chartId = 'classScoresChart_' + Date.now();
        
        let html = '<div class="mb-4">';
        html += '<h5 class="mb-3 fw-bold">Class Scores Bar Chart</h5>';
        html += `<div style="height: 500px; width: 100%;"><canvas id="${chartId}"></canvas></div>`;
        html += '</div>';
        
        html += '<hr class="my-4">';
        html += '<h5 class="mb-3 fw-bold">Class Scores Leaderboard</h5>';
        html += '<div class="table-responsive"><table class="table table-striped table-hover" style="font-size: 1.1rem;">';
        html += '<thead class="table-dark"><tr>';
        html += '<th style="font-size: 1.2rem; font-weight: bold;">Rank</th><th style="font-size: 1.2rem; font-weight: bold;">Class</th><th style="font-size: 1.2rem; font-weight: bold;">Score</th><th style="font-size: 1.2rem; font-weight: bold;">Correct</th>';
        html += '</tr></thead><tbody>';
        
        sortedClasses.forEach((className, index) => {
            const score = classScores[className];
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            
            html += `<tr ${rank <= 3 ? 'class="table-warning"' : ''}>`;
            html += `<td><strong>${medal} ${rank}</strong></td>`;
            html += `<td><strong>${this.escapeHtml(className)}</strong></td>`;
            html += `<td><strong class="text-success">${score.totalScore.toLocaleString()}</strong></td>`;
            html += `<td>${score.correctAnswers}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        // Store chart data for rendering after modal is shown
        setTimeout(() => {
            this.renderBarChart(chartId, sortedClasses, classScores);
        }, 100);
        
        return html;
    }
    
    // Render bar chart for class scores
    renderBarChart(canvasId, sortedClasses, classScores) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.classScoreChart) {
            this.classScoreChart.destroy();
        }
        
        // Prepare data
        const labels = sortedClasses.map(className => this.escapeHtml(className));
        const scores = sortedClasses.map(className => classScores[className].totalScore);
        
        // Generate colors - gold for top 3, blue for others
        const backgroundColors = sortedClasses.map((className, index) => {
            if (index === 0) return 'rgba(255, 215, 0, 0.8)'; // Gold
            if (index === 1) return 'rgba(192, 192, 192, 0.8)'; // Silver
            if (index === 2) return 'rgba(205, 127, 50, 0.8)'; // Bronze
            return 'rgba(13, 110, 253, 0.8)'; // Blue
        });
        
        const borderColors = sortedClasses.map((className, index) => {
            if (index === 0) return 'rgba(255, 215, 0, 1)'; // Gold
            if (index === 1) return 'rgba(192, 192, 192, 1)'; // Silver
            if (index === 2) return 'rgba(205, 127, 50, 1)'; // Bronze
            return 'rgba(13, 110, 253, 1)'; // Blue
        });
        
        // Create chart
        const ctx = canvas.getContext('2d');
        this.classScoreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Class Scores',
                    data: scores,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#FFD700',
                        borderWidth: 2,
                        padding: 12,
                        titleFont: {
                            size: 16,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        callbacks: {
                            label: function(context) {
                                return 'Score: ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Score',
                            color: '#ffffff',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.3)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Class',
                            color: '#ffffff',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.3)'
                        }
                    }
                }
            }
        });
    }
    
    // Show statistics for a specific question
    showQuestionStatistics(question, questionIndex, sessionId, classScores = {}) {
        let results = [0, 0, 0, 0];
        const votesKey = `gameSession_${sessionId}_votes_${questionIndex}`;
        const audienceVotes = localStorage.getItem(votesKey);
        
        // Get class-specific votes if available
        const classVotesKey = `gameSession_${sessionId}_classVotes_${questionIndex}`;
        const classVotesData = localStorage.getItem(classVotesKey);
        let classVotes = {};
        if (classVotesData) {
            classVotes = JSON.parse(classVotesData);
        }
        
        if (audienceVotes && sessionId) {
            // Use real audience votes
            const votes = JSON.parse(audienceVotes);
            const totalVotes = votes.reduce((sum, count) => sum + count, 0);
            
            if (totalVotes > 0) {
                // Calculate percentages from real votes
                results = votes.map(count => Math.round((count / totalVotes) * 100));
                
                // Ensure total is 100%
                const total = results.reduce((sum, val) => sum + val, 0);
                if (total !== 100) {
                    const diff = 100 - total;
                    // Distribute difference to the option with most votes
                    const maxIndex = results.indexOf(Math.max(...results));
                    results[maxIndex] += diff;
                }
            } else {
                // No votes yet
                results = [0, 0, 0, 0];
            }
        }
        
        let statsHTML = '<div class="text-center"><h4 class="mb-4 fw-bold">Audience Voting Statistics</h4>';
        
        if (audienceVotes && sessionId) {
            const votes = JSON.parse(audienceVotes);
            const totalVotes = votes.reduce((sum, count) => sum + count, 0);
            statsHTML += `<p class="mb-4" style="font-size: 1.2rem;"><strong>${totalVotes} audience member${totalVotes !== 1 ? 's' : ''} voted</strong></p>`;
            
            // Show class breakdown if available
            if (Object.keys(classVotes).length > 0) {
                statsHTML += '<div class="mb-4"><h5 class="mb-3">Votes by Class:</h5>';
                Object.keys(classVotes).forEach(className => {
                    const classVoteArray = classVotes[className];
                    const classTotal = classVoteArray.reduce((sum, count) => sum + count, 0);
                    if (classTotal > 0) {
                        statsHTML += `<div class="mb-2" style="font-size: 1.1rem;">
                            <strong>${this.escapeHtml(className)}:</strong> ${classTotal} vote${classTotal !== 1 ? 's' : ''}
                        </div>`;
                    }
                });
                statsHTML += '</div>';
            }
        } else {
            statsHTML += `<p class="text-muted mb-4" style="font-size: 1.1rem;">No votes recorded yet.</p>`;
        }
        
        // Show voting results
        question.options.forEach((option, index) => {
            const voteCount = audienceVotes ? JSON.parse(audienceVotes)[index] : 0;
            statsHTML += `
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-2" style="font-size: 1.1rem;">
                        <span><strong>${String.fromCharCode(65 + index)}:</strong> ${this.renderMath(option)}</span>
                        <span><strong style="font-size: 1.2rem;">${results[index]}%</strong> <span style="font-size: 1rem;">(${voteCount} vote${voteCount !== 1 ? 's' : ''})</span></span>
                    </div>
                    <div class="progress" style="height: 30px;">
                        <div class="progress-bar ${results[index] > 0 ? 'bg-warning' : 'bg-secondary'}" 
                             style="width: ${results[index]}%; font-size: 1rem; font-weight: bold; line-height: 30px;" 
                             role="progressbar">
                            ${results[index]}%
                        </div>
                    </div>
                </div>
            `;
        });
        statsHTML += '</div>';
        
        // Add class scores section
        if (Object.keys(classScores).length > 0) {
            statsHTML += '<hr class="my-4">';
            statsHTML += '<h6 class="mb-3">Class Scores (Based on Prize Ladder)</h6>';
            statsHTML += this.renderClassScores(classScores);
        }
        
        this.showLifelineModal('Statistics', statsHTML);
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Update prize ladder
    updatePrizeLadder() {
        const ladderItems = document.querySelectorAll('.ladder-item');
        ladderItems.forEach((item, index) => {
            item.classList.remove('current', 'passed');
            if (index === this.currentQuestion) {
                item.classList.add('current');
            } else if (index < this.currentQuestion) {
                item.classList.add('passed');
            }
        });
    }
    
    // Next question
    nextQuestion() {
        this.loadQuestion();
        document.getElementById('next-question').style.display = 'none';
    }
    
    // End game
    endGame(won) {
        this.gameActive = false;
        
        // Play appropriate sound
        if (won) {
            this.soundManager.play('applause');
        } else {
            this.soundManager.play('gameOver');
        }
        
        const modal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        const messageElement = document.getElementById('game-over-message');
        const scoreElement = document.getElementById('final-score');
        
        if (won) {
            messageElement.textContent = 'Congratulations! You are a Math Millionaire!';
            scoreElement.textContent = `Final Score: ${this.score.toLocaleString()}`;
        } else {
            messageElement.textContent = 'Game Over! Better luck next time!';
            scoreElement.textContent = `You won: ${this.score.toLocaleString()}`;
        }
        
        modal.show();
        
        document.getElementById('quit-game').style.display = 'none';
    }
    
    // Quit game
    quitGame() {
        if (confirm('Are you sure you want to quit? You will lose your current progress.')) {
            this.endGame(false);
        }
    }
    
    // Reset game
    resetGame() {
        this.currentQuestion = 0;
        this.score = 0;
        this.gameActive = false;
        this.sessionId = null;
        this.questionClassAssignments = {};
        this.resetLifelines();
        this.updatePrizeLadder();
        this.showStartScreen();
        
        // Clear session data
        if (this.sessionId) {
            localStorage.removeItem(`gameSession_${this.sessionId}_active`);
            localStorage.removeItem('currentGameSession');
        }
        
        // Reset class selector and display
        const classSelector = document.getElementById('class-selector');
        if (classSelector) {
            classSelector.value = '';
        }
        const assignedDisplay = document.getElementById('assigned-class-display');
        if (assignedDisplay) {
            assignedDisplay.style.display = 'none';
        }
        
        // Reset options display
        document.querySelectorAll('.option').forEach(option => {
            option.style.display = 'block';
            option.classList.remove('selected', 'correct', 'incorrect');
        });
    }
    
    // Reset lifelines
    resetLifelines() {
        // Reset in-memory cache
        this.classLifelines = {};
        
        // Clear all class lifelines from localStorage for this session
        if (this.sessionId) {
            // Get all classes
            const allClasses = localStorage.getItem('mathMillionaireClasses');
            if (allClasses) {
                const classes = JSON.parse(allClasses);
                classes.forEach(className => {
                    const lifelinesKey = `gameSession_${this.sessionId}_classLifelines_${className}`;
                    localStorage.removeItem(lifelinesKey);
                });
            }
        }
        
        // Reset button appearance (will be updated when question loads)
        document.querySelectorAll('.lifeline-btn').forEach(btn => {
            btn.classList.remove('used');
            btn.disabled = false;
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathMillionaireGame();
});

// Sound Manager for game audio effects
class SoundManager {
    constructor() {
        this.sounds = {
            correct: new Audio('sounds/Correct.mp3'),
            incorrect: new Audio('sounds/incorrect.mp3'),
            lifeline: new Audio('sounds/lifeline.mp3'),
            applause: new Audio('sounds/applause.mp3'),
            gameStart: new Audio('sounds/gameStart.mp3'),
            gameOver: new Audio('sounds/gameOver.mp3')
        };
        
        // Set volume levels
        this.sounds.correct.volume = 0.7;
        this.sounds.incorrect.volume = 0.7;
        this.sounds.lifeline.volume = 0.6;
        this.sounds.applause.volume = 0.8;
        this.sounds.gameStart.volume = 0.6;
        this.sounds.gameOver.volume = 0.7;
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            // Reset audio to beginning
            this.sounds[soundName].currentTime = 0;
            
            // Play the sound
            this.sounds[soundName].play().catch(e => {
                console.log('Sound not available:', soundName, e);
                // Fallback: try to play without error handling
                try {
                    this.sounds[soundName].play();
                } catch (fallbackError) {
                    console.log('Audio playback failed:', fallbackError);
                }
            });
        }
    }
    
    // Stop all sounds
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
    
    // Set master volume
    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }
}

// Add renderMath method to MathMillionaireGame class
MathMillionaireGame.prototype.renderMath = function(text) {
    if (!text) return '';
    
    // Convert common math symbols to LaTeX
    let processedText = text
        // Square root
        .replace(/√(\w+)/g, '\\sqrt{$1}')
        .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
        // Powers
        .replace(/(\w+)\^(\w+)/g, '$1^{$2}')
        .replace(/(\w+)\^(\d+)/g, '$1^{$2}')
        // Fractions
        .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
        // Greek letters
        .replace(/π/g, '\\pi')
        .replace(/α/g, '\\alpha')
        .replace(/β/g, '\\beta')
        .replace(/γ/g, '\\gamma')
        .replace(/δ/g, '\\delta')
        .replace(/θ/g, '\\theta')
        .replace(/λ/g, '\\lambda')
        .replace(/μ/g, '\\mu')
        .replace(/σ/g, '\\sigma')
        .replace(/φ/g, '\\phi')
        .replace(/ω/g, '\\omega')
        // Math operators
        .replace(/±/g, '\\pm')
        .replace(/≠/g, '\\neq')
        .replace(/≤/g, '\\leq')
        .replace(/≥/g, '\\geq')
        .replace(/∞/g, '\\infty')
        .replace(/∑/g, '\\sum')
        .replace(/∫/g, '\\int')
        .replace(/∂/g, '\\partial')
        // Subscripts
        .replace(/(\w+)_(\w+)/g, '$1_{$2}')
        .replace(/(\w+)_(\d+)/g, '$1_{$2}');
    
    // Wrap in math delimiters if it contains LaTeX
    if (processedText.includes('\\')) {
        return `$${processedText}$`;
    }
    
    return text;
};
