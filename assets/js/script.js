document.addEventListener('DOMContentLoaded', function() {
    // Grade to points mapping
    const gradePoints = {
        'O': 10,
        'E': 9,
        'A': 8,
        'B': 7,
        'C': 6,
        'D': 5,
        'F': 2,
        'I': 2
    };

    // Achievement definitions (removed AI advisor achievement)
    const achievements = [
        {
            id: 'first_semester',
            name: 'First Steps',
            description: 'Complete your first semester calculation',
            icon: 'fa-play',
            condition: () => academicData.semesters.length >= 1
        },
        {
            id: 'cgpa_8',
            name: 'High Achiever',
            description: 'Reach a CGPA of 8.0 or higher',
            icon: 'fa-star',
            condition: () => academicData.currentCGPA >= 8.0
        },
        {
            id: 'cgpa_9',
            name: 'Excellence',
            description: 'Reach a CGPA of 9.0 or higher',
            icon: 'fa-trophy',
            condition: () => academicData.currentCGPA >= 9.0
        },
        {
            id: 'perfect_semester',
            name: 'Perfect Semester',
            description: 'Achieve a perfect 10 SGPA in any semester',
            icon: 'fa-crown',
            condition: () => academicData.semesters.some(s => s.sgpa === 10)
        },
        {
            id: 'consistent',
            name: 'Consistent Performer',
            description: 'Maintain CGPA above 7.5 for 3 consecutive semesters',
            icon: 'fa-chart-line',
            condition: () => {
                if (academicData.semesters.length < 3) return false;
                const lastThree = academicData.semesters.slice(-3);
                return lastThree.every(s => s.sgpa >= 7.5);
            }
        },
        {
            id: 'goal_setter',
            name: 'Goal Setter',
            description: 'Set and achieve your first academic goal',
            icon: 'fa-bullseye',
            condition: () => academicData.goals.some(g => g.completed)
        },
        {
            id: 'data_exporter',
            name: 'Data Analyst',
            description: 'Export your academic data',
            icon: 'fa-download',
            condition: () => academicData.exportedData
        },
        {
            id: 'prediction_master',
            name: 'Future Planner',
            description: 'Use the prediction tool 5 times',
            icon: 'fa-crystal-ball',
            condition: () => academicData.predictionCount >= 5
        },
        {
            id: 'all_calculators',
            name: 'Calculator Master',
            description: 'Use all calculator types at least once',
            icon: 'fa-calculator',
            condition: () => {
                return academicData.usedCalculators &&
                       academicData.usedCalculators.sgpa &&
                       academicData.usedCalculators.ygpa &&
                       academicData.usedCalculators.cgpa &&
                       academicData.usedCalculators.dgpa;
            }
        }
    ];

    // Local Storage Management
    const storage = {
        save: function(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },
        load: function(key) {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        },
        remove: function(key) {
            localStorage.removeItem(key);
        },
        clear: function() {
            localStorage.clear();
        }
    };

    // Initialize data (removed AI advisor messages)
    let academicData = storage.load('academicData') || {
        semesters: [],
        goals: [],
        currentCGPA: 0,
        totalCredits: 0,
        targetCGPA: 8.0,
        achievements: [],
        predictionCount: 0,
        exportedData: false,
        usedCalculators: {
            sgpa: false,
            ygpa: false,
            cgpa: false,
            dgpa: false
        },
        theme: 'light',
        warningAcknowledged: false
    };

    // Warning Modal Management
    function initializeWarningModal() {
        const warningModal = document.getElementById('warning-modal');
        const acknowledgeCheckbox = document.getElementById('acknowledge-checkbox');
        const acceptButton = document.getElementById('accept-warning');
        
        // Check if user has already acknowledged the warning
        if (academicData.warningAcknowledged) {
            warningModal.style.display = 'none';
            return;
        }
        
        // Show warning modal
        warningModal.style.display = 'flex';
        
        // Handle checkbox change
        acknowledgeCheckbox.addEventListener('change', function() {
            acceptButton.disabled = !this.checked;
        });
        
        // Handle accept button click
        acceptButton.addEventListener('click', function() {
            if (acknowledgeCheckbox.checked) {
                academicData.warningAcknowledged = true;
                storage.save('academicData', academicData);
                warningModal.style.display = 'none';
                showNotification('Thank you for acknowledging. You can now use the calculator.', 'success');
            }
        });
        
        // Prevent closing modal without acknowledgment
        warningModal.addEventListener('click', function(e) {
            if (e.target === warningModal) {
                showNotification('Please acknowledge the warning before continuing.', 'warning');
            }
        });
    }

    // Initialize warning modal first
    initializeWarningModal();

    // Initialize theme
    if (academicData.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        academicData.theme = newTheme;
        storage.save('academicData', academicData);
        
        this.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Add animation
        this.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            this.style.transform = '';
        }, 300);
    });

    // Notification system
    function showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' :
                     type === 'warning' ? 'fa-exclamation-triangle' :
                     'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }

    // Achievement system
    function checkAchievements() {
        achievements.forEach(achievement => {
            // Skip if already unlocked
            if (academicData.achievements.includes(achievement.id)) return;
            
            // Check if condition is met
            if (achievement.condition()) {
                unlockAchievement(achievement);
            }
        });
    }

    function unlockAchievement(achievement) {
        // Add to unlocked achievements
        academicData.achievements.push(achievement.id);
        storage.save('academicData', academicData);
        
        // Show achievement modal
        showAchievementModal(achievement);
        
        // Show notification
        showNotification(`Achievement Unlocked: ${achievement.name}!`, 'success');
        
        // Update achievements display
        if (document.getElementById('achievements-grid')) {
            displayAchievements();
        }
    }

    function showAchievementModal(achievement) {
        const modal = document.getElementById('achievement-modal');
        document.getElementById('achievement-title').textContent = achievement.name;
        document.getElementById('achievement-description').textContent = achievement.description;
        
        // Set icon based on achievement
        const iconElement = modal.querySelector('.achievement-icon i');
        iconElement.className = `fas ${achievement.icon}`;
        
        modal.style.display = 'block';
        
        // Add confetti effect
        createConfetti();
    }

    function createConfetti() {
        // Simple confetti effect using CSS
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.opacity = Math.random() + 0.5;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.transition = `top ${Math.random() * 3 + 2}s linear`;
            confetti.style.zIndex = '9999';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = '100%';
            }, 100);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('achievement-modal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('achievement-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const calculatorTabs = document.querySelectorAll('.calculator-tab');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            calculatorTabs.forEach(tab => tab.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Initialize tab-specific content
            initializeTab(tabId);
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    mobileMenuToggle.addEventListener('click', function() {
        navLinksContainer.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-bars');
        this.querySelector('i').classList.toggle('fa-times');
    });

    // Tab navigation within calculators
    const tabBtns = document.querySelectorAll('.tab-btn');
    const calculatorContents = document.querySelectorAll('.calculator-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const calculator = this.getAttribute('data-calculator');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            calculatorContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${calculator}-calculator`).classList.add('active');
            
            // Track calculator usage
            if (!academicData.usedCalculators[calculator]) {
                academicData.usedCalculators[calculator] = true;
                storage.save('academicData', academicData);
                checkAchievements();
            }
        });
    });

    // Initialize tab content
    function initializeTab(tabId) {
        switch(tabId) {
            case 'analytics':
                initializeAnalytics();
                break;
            case 'prediction':
                initializePrediction();
                break;
            case 'goals':
                initializeGoals();
                break;
            case 'insights':
                initializeInsights();
                break;
            case 'achievements':
                displayAchievements();
                break;
        }
    }

    // Update quick stats
    function updateQuickStats() {
        document.getElementById('current-cgpa').textContent = academicData.currentCGPA.toFixed(2) || '--';
        document.getElementById('total-credits').textContent = academicData.totalCredits || '--';
        document.getElementById('target-cgpa').textContent = academicData.targetCGPA.toFixed(2) || '--';
        document.getElementById('achievement-count').textContent = academicData.achievements.length;
        
        // Calculate goal progress
        if (academicData.currentCGPA && academicData.targetCGPA) {
            const progress = (academicData.currentCGPA / academicData.targetCGPA) * 100;
            document.getElementById('goal-progress').textContent = `${Math.min(progress, 100).toFixed(1)}%`;
        }
    }

    // SGPA Calculator
    const subjectsContainer = document.getElementById('sgpa-subjects');
    const addSubjectBtn = document.getElementById('add-subject');
    const calculateSgpaBtn = document.getElementById('calculate-sgpa');
    const saveSgpaBtn = document.getElementById('save-sgpa');
    const sgpaResult = document.getElementById('sgpa-result');

    // Initialize with 3 subjects
    for (let i = 0; i < 3; i++) {
        addSubjectRow();
    }

    function addSubjectRow() {
        const subjectRow = document.createElement('div');
        subjectRow.className = 'subject-row';
        
        const subjectNumber = subjectsContainer.children.length + 1;
        
        subjectRow.innerHTML = `
            <div class="form-group">
                <label for="subject-credits-${subjectNumber}">Subject Credits</label>
                <input type="number" id="subject-credits-${subjectNumber}" class="subject-credits" min="1" max="10" step="1" placeholder="e.g., 4" required>
            </div>
            <div class="form-group">
                <label for="subject-grade-${subjectNumber}">Letter Grade</label>
                <select id="subject-grade-${subjectNumber}" class="subject-grade" required>
                    <option value="">Select Grade</option>
                    <option value="O">O (Outstanding)</option>
                    <option value="E">E (Excellent)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Fair)</option>
                    <option value="D">D (Below Average)</option>
                    <option value="F">F (Failed)</option>
                    <option value="I">I (Incomplete)</option>
                </select>
            </div>
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        subjectsContainer.appendChild(subjectRow);
        
        // Add event listener to remove button
        subjectRow.querySelector('.remove-btn').addEventListener('click', function() {
            if (subjectsContainer.children.length > 1) {
                subjectRow.remove();
                updateSubjectLabels();
            }
        });
    }

    function updateSubjectLabels() {
        const subjectRows = subjectsContainer.querySelectorAll('.subject-row');
        subjectRows.forEach((row, index) => {
            const subjectNumber = index + 1;
            row.querySelector('label[for^="subject-credits"]').setAttribute('for', `subject-credits-${subjectNumber}`);
            row.querySelector('.subject-credits').id = `subject-credits-${subjectNumber}`;
            row.querySelector('label[for^="subject-grade"]').setAttribute('for', `subject-grade-${subjectNumber}`);
            row.querySelector('.subject-grade').id = `subject-grade-${subjectNumber}`;
        });
    }

    addSubjectBtn.addEventListener('click', addSubjectRow);

    calculateSgpaBtn.addEventListener('click', function() {
        const subjectRows = subjectsContainer.querySelectorAll('.subject-row');
        let totalCredits = 0;
        let creditIndex = 0;
        let calculations = [];
        
        let isValid = true;
        
        subjectRows.forEach((row, index) => {
            const credits = parseFloat(row.querySelector('.subject-credits').value);
            const grade = row.querySelector('.subject-grade').value;
            
            if (isNaN(credits) || !grade) {
                isValid = false;
                return;
            }
            
            const points = gradePoints[grade];
            const subjectCreditIndex = credits * points;
            
            totalCredits += credits;
            creditIndex += subjectCreditIndex;
            
            calculations.push({
                subject: `Subject ${index + 1}`,
                credits: credits,
                grade: grade,
                points: points,
                creditIndex: subjectCreditIndex
            });
        });
        
        if (!isValid || totalCredits === 0) {
            showNotification('Please fill in all subject fields with valid values.', 'error');
            return;
        }
        
        const sgpa = creditIndex / totalCredits;
        
        // Generate calculation steps
        let stepsHTML = '<div class="calculation-steps"><h3>Calculation Breakdown:</h3>';
        
        calculations.forEach(calc => {
            stepsHTML += `
                <div class="step">
                    ${calc.subject}: ${calc.credits} Credits × ${calc.points} Points (${calc.grade}) = ${calc.creditIndex} Points
                </div>
            `;
        });
        
        stepsHTML += `
            <div class="step">
                <strong>Total Credit Index</strong> = ${calculations.map(c => c.creditIndex).join(' + ')} = ${creditIndex}
            </div>
            <div class="step">
                <strong>Total Credits</strong> = ${calculations.map(c => c.credits).join(' + ')} = ${totalCredits}
            </div>
            <div class="step">
                <div class="step-formula">
                    SGPA = Total Credit Index / Total Credits = ${creditIndex} / ${totalCredits} = ${sgpa.toFixed(2)}
                </div>
            </div>
        </div>`;
        
        sgpaResult.innerHTML = `
            <div class="result-score">Your SGPA: ${sgpa.toFixed(2)}</div>
            ${stepsHTML}
        `;
        
        sgpaResult.classList.remove('hidden');
        
        // Add animation
        sgpaResult.style.animation = 'slideIn 0.5s ease-out';
        
        // Check for perfect semester achievement
        if (sgpa === 10) {
            setTimeout(() => {
                showNotification('Perfect Semester! You achieved a 10 SGPA!', 'success');
            }, 1000);
        }
    });

    saveSgpaBtn.addEventListener('click', function() {
        const subjectRows = subjectsContainer.querySelectorAll('.subject-row');
        let semesterData = {
            id: Date.now(),
            date: new Date().toISOString(),
            subjects: [],
            totalCredits: 0,
            creditIndex: 0,
            sgpa: 0
        };
        
        let isValid = true;
        
        subjectRows.forEach((row, index) => {
            const credits = parseFloat(row.querySelector('.subject-credits').value);
            const grade = row.querySelector('.subject-grade').value;
            
            if (isNaN(credits) || !grade) {
                isValid = false;
                return;
            }
            
            const points = gradePoints[grade];
            const subjectCreditIndex = credits * points;
            
            semesterData.subjects.push({
                name: `Subject ${index + 1}`,
                credits: credits,
                grade: grade,
                points: points,
                creditIndex: subjectCreditIndex
            });
            
            semesterData.totalCredits += credits;
            semesterData.creditIndex += subjectCreditIndex;
        });
        
        if (!isValid || semesterData.totalCredits === 0) {
            showNotification('Please fill in all subject fields with valid values before saving.', 'error');
            return;
        }
        
        semesterData.sgpa = semesterData.creditIndex / semesterData.totalCredits;
        
        academicData.semesters.push(semesterData);
        updateAcademicData();
        
        showNotification('Semester data saved successfully!', 'success');
        checkAchievements();
    });

    // YGPA Calculator
    const calculateYgpaBtn = document.getElementById('calculate-ygpa');
    const ygpaResult = document.getElementById('ygpa-result');

    calculateYgpaBtn.addEventListener('click', function() {
        const oddCreditIndex = parseFloat(document.getElementById('odd-credit-index').value);
        const oddTotalCredits = parseFloat(document.getElementById('odd-total-credits').value);
        const evenCreditIndex = parseFloat(document.getElementById('even-credit-index').value);
        const evenTotalCredits = parseFloat(document.getElementById('even-total-credits').value);
        
        if (isNaN(oddCreditIndex) || isNaN(oddTotalCredits) || 
            isNaN(evenCreditIndex) || isNaN(evenTotalCredits) ||
            oddTotalCredits === 0 || evenTotalCredits === 0) {
            showNotification('Please fill in all fields with valid values.', 'error');
            return;
        }
        
        const totalCreditIndex = oddCreditIndex + evenCreditIndex;
        const totalCredits = oddTotalCredits + evenTotalCredits;
        const ygpa = totalCreditIndex / totalCredits;
        
        ygpaResult.innerHTML = `
            <div class="result-score">Your YGPA: ${ygpa.toFixed(2)}</div>
            <div class="calculation-steps">
                <h3>Calculation Breakdown:</h3>
                <div class="step">
                    <strong>Total Credit Index</strong> = Odd Semester Credit Index + Even Semester Credit Index = ${oddCreditIndex} + ${evenCreditIndex} = ${totalCreditIndex}
                </div>
                <div class="step">
                    <strong>Total Credits</strong> = Odd Semester Credits + Even Semester Credits = ${oddTotalCredits} + ${evenTotalCredits} = ${totalCredits}
                </div>
                <div class="step">
                    <div class="step-formula">
                        YGPA = Total Credit Index / Total Credits = ${totalCreditIndex} / ${totalCredits} = ${ygpa.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
        
        ygpaResult.classList.remove('hidden');
        ygpaResult.style.animation = 'slideIn 0.5s ease-out';
    });

    // CGPA Calculator
    const semestersContainer = document.getElementById('cgpa-semesters');
    const addSemesterBtn = document.getElementById('add-semester');
    const calculateCgpaBtn = document.getElementById('calculate-cgpa');
    const cgpaResult = document.getElementById('cgpa-result');

    // Initialize with 2 semesters
    for (let i = 0; i < 2; i++) {
        addSemesterRow();
    }

    function addSemesterRow() {
        const semesterRow = document.createElement('div');
        semesterRow.className = 'semester-row';
        
        const semesterNumber = semestersContainer.children.length + 1;
        
        semesterRow.innerHTML = `
            <div class="form-group">
                <label for="semester-credit-index-${semesterNumber}">Semester Credit Index</label>
                <input type="number" id="semester-credit-index-${semesterNumber}" class="semester-credit-index" step="0.01" placeholder="e.g., 87" required>
            </div>
            <div class="form-group">
                <label for="semester-total-credits-${semesterNumber}">Total Semester Credits</label>
                <input type="number" id="semester-total-credits-${semesterNumber}" class="semester-total-credits" step="0.01" placeholder="e.g., 10" required>
            </div>
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        semestersContainer.appendChild(semesterRow);
        
        // Add event listener to remove button
        semesterRow.querySelector('.remove-btn').addEventListener('click', function() {
            if (semestersContainer.children.length > 1) {
                semesterRow.remove();
                updateSemesterLabels();
            }
        });
    }

    function updateSemesterLabels() {
        const semesterRows = semestersContainer.querySelectorAll('.semester-row');
        semesterRows.forEach((row, index) => {
            const semesterNumber = index + 1;
            row.querySelector('label[for^="semester-credit-index"]').setAttribute('for', `semester-credit-index-${semesterNumber}`);
            row.querySelector('.semester-credit-index').id = `semester-credit-index-${semesterNumber}`;
            row.querySelector('label[for^="semester-total-credits"]').setAttribute('for', `semester-total-credits-${semesterNumber}`);
            row.querySelector('.semester-total-credits').id = `semester-total-credits-${semesterNumber}`;
        });
    }

    addSemesterBtn.addEventListener('click', addSemesterRow);

    calculateCgpaBtn.addEventListener('click', function() {
        const semesterRows = semestersContainer.querySelectorAll('.semester-row');
        let totalCreditIndex = 0;
        let totalCredits = 0;
        let calculations = [];
        
        let isValid = true;
        
        semesterRows.forEach((row, index) => {
            const creditIndex = parseFloat(row.querySelector('.semester-credit-index').value);
            const credits = parseFloat(row.querySelector('.semester-total-credits').value);
            
            if (isNaN(creditIndex) || isNaN(credits)) {
                isValid = false;
                return;
            }
            
            totalCreditIndex += creditIndex;
            totalCredits += credits;
            
            calculations.push({
                semester: `Semester ${index + 1}`,
                creditIndex: creditIndex,
                credits: credits
            });
        });
        
        if (!isValid || totalCredits === 0) {
            showNotification('Please fill in all semester fields with valid values.', 'error');
            return;
        }
        
        const cgpa = totalCreditIndex / totalCredits;
        
        // Generate calculation steps
        let stepsHTML = '<div class="calculation-steps"><h3>Calculation Breakdown:</h3>';
        
        calculations.forEach(calc => {
            stepsHTML += `
                <div class="step">
                    ${calc.semester}: Credit Index = ${calc.creditIndex}, Credits = ${calc.credits}
                </div>
            `;
        });
        
        stepsHTML += `
            <div class="step">
                <strong>Total Credit Index</strong> = ${calculations.map(c => c.creditIndex).join(' + ')} = ${totalCreditIndex}
            </div>
            <div class="step">
                <strong>Total Credits</strong> = ${calculations.map(c => c.credits).join(' + ')} = ${totalCredits}
            </div>
            <div class="step">
                <div class="step-formula">
                    CGPA = Total Credit Index / Total Credits = ${totalCreditIndex} / ${totalCredits} = ${cgpa.toFixed(2)}
                </div>
            </div>
        </div>`;
        
        cgpaResult.innerHTML = `
            <div class="result-score">Your CGPA: ${cgpa.toFixed(2)}</div>
            ${stepsHTML}
        `;
        
        cgpaResult.classList.remove('hidden');
        cgpaResult.style.animation = 'slideIn 0.5s ease-out';
    });

    // DGPA Calculator
    const courseTypeSelect = document.getElementById('course-type');
    const dgpaInputsContainer = document.getElementById('dgpa-inputs');
    const calculateDgpaBtn = document.getElementById('calculate-dgpa');
    const dgpaResult = document.getElementById('dgpa-result');

    function updateDgpaInputs() {
        const courseType = courseTypeSelect.value;
        let inputsHTML = '';
        
        switch(courseType) {
            case '4-year':
                inputsHTML = `
                    <div class="form-group">
                        <label for="ygpa1">YGPA 1</label>
                        <input type="number" id="ygpa1" step="0.01" placeholder="e.g., 8.5" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa2">YGPA 2</label>
                        <input type="number" id="ygpa2" step="0.01" placeholder="e.g., 8.7" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa3">YGPA 3</label>
                        <input type="number" id="ygpa3" step="0.01" placeholder="e.g., 8.9" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa4">YGPA 4</label>
                        <input type="number" id="ygpa4" step="0.01" placeholder="e.g., 9.1" required>
                    </div>
                `;
                break;
            case '3-year-lateral':
                inputsHTML = `
                    <div class="form-group">
                        <label for="ygpa2">YGPA 2</label>
                        <input type="number" id="ygpa2" step="0.01" placeholder="e.g., 8.7" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa3">YGPA 3</label>
                        <input type="number" id="ygpa3" step="0.01" placeholder="e.g., 8.9" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa4">YGPA 4</label>
                        <input type="number" id="ygpa4" step="0.01" placeholder="e.g., 9.1" required>
                    </div>
                `;
                break;
            case '3-year':
                inputsHTML = `
                    <div class="form-group">
                        <label for="ygpa1">YGPA 1</label>
                        <input type="number" id="ygpa1" step="0.01" placeholder="e.g., 8.5" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa2">YGPA 2</label>
                        <input type="number" id="ygpa2" step="0.01" placeholder="e.g., 8.7" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa3">YGPA 3</label>
                        <input type="number" id="ygpa3" step="0.01" placeholder="e.g., 8.9" required>
                    </div>
                `;
                break;
            case '2-year':
                inputsHTML = `
                    <div class="form-group">
                        <label for="ygpa1">YGPA 1</label>
                        <input type="number" id="ygpa1" step="0.01" placeholder="e.g., 8.5" required>
                    </div>
                    <div class="form-group">
                        <label for="ygpa2">YGPA 2</label>
                        <input type="number" id="ygpa2" step="0.01" placeholder="e.g., 8.7" required>
                    </div>
                `;
                break;
            case '1-year':
                inputsHTML = `
                    <div class="form-group">
                        <label for="ygpa1">YGPA 1</label>
                        <input type="number" id="ygpa1" step="0.01" placeholder="e.g., 8.5" required>
                    </div>
                `;
                break;
        }
        
        dgpaInputsContainer.innerHTML = inputsHTML;
    }

    courseTypeSelect.addEventListener('change', updateDgpaInputs);

    // Initialize with default course type
    updateDgpaInputs();

    calculateDgpaBtn.addEventListener('click', function() {
        const courseType = courseTypeSelect.value;
        let dgpa = 0;
        let formula = '';
        let stepsHTML = '<div class="calculation-steps"><h3>Calculation Breakdown:</h3>';
        
        switch(courseType) {
            case '4-year':
                const ygpa1 = parseFloat(document.getElementById('ygpa1').value);
                const ygpa2 = parseFloat(document.getElementById('ygpa2').value);
                const ygpa3 = parseFloat(document.getElementById('ygpa3').value);
                const ygpa4 = parseFloat(document.getElementById('ygpa4').value);
                
                if (isNaN(ygpa1) || isNaN(ygpa2) || isNaN(ygpa3) || isNaN(ygpa4)) {
                    showNotification('Please fill in all YGPA fields with valid values.', 'error');
                    return;
                }
                
                dgpa = (ygpa1 + ygpa2 + 1.5 * ygpa3 + 1.5 * ygpa4) / 5;
                formula = `DGPA = (YGPA1 + YGPA2 + 1.5 × YGPA3 + 1.5 × YGPA4) / 5`;
                
                stepsHTML += `
                    <div class="step">
                        <strong>Formula:</strong> ${formula}
                    </div>
                    <div class="step">
                        <strong>Values:</strong> YGPA1 = ${ygpa1}, YGPA2 = ${ygpa2}, YGPA3 = ${ygpa3}, YGPA4 = ${ygpa4}
                    </div>
                    <div class="step">
                        <strong>Calculation:</strong> DGPA = (${ygpa1} + ${ygpa2} + 1.5 × ${ygpa3} + 1.5 × ${ygpa4}) / 5
                    </div>
                    <div class="step">
                        <strong>Intermediate:</strong> DGPA = (${ygpa1} + ${ygpa2} + ${(1.5 * ygpa3).toFixed(2)} + ${(1.5 * ygpa4).toFixed(2)}) / 5
                    </div>
                    <div class="step">
                        <strong>Result:</strong> DGPA = ${dgpa.toFixed(2)}
                    </div>
                `;
                break;
                
            case '3-year-lateral':
                const ygpa2_lateral = parseFloat(document.getElementById('ygpa2').value);
                const ygpa3_lateral = parseFloat(document.getElementById('ygpa3').value);
                const ygpa4_lateral = parseFloat(document.getElementById('ygpa4').value);
                
                if (isNaN(ygpa2_lateral) || isNaN(ygpa3_lateral) || isNaN(ygpa4_lateral)) {
                    showNotification('Please fill in all YGPA fields with valid values.', 'error');
                    return;
                }
                
                dgpa = (ygpa2_lateral + 1.5 * ygpa3_lateral + 1.5 * ygpa4_lateral) / 4;
                formula = `DGPA = (YGPA2 + 1.5 × YGPA3 + 1.5 × YGPA4) / 4`;
                
                stepsHTML += `
                    <div class="step">
                        <strong>Formula:</strong> ${formula}
                    </div>
                    <div class="step">
                        <strong>Values:</strong> YGPA2 = ${ygpa2_lateral}, YGPA3 = ${ygpa3_lateral}, YGPA4 = ${ygpa4_lateral}
                    </div>
                    <div class="step">
                        <strong>Calculation:</strong> DGPA = (${ygpa2_lateral} + 1.5 × ${ygpa3_lateral} + 1.5 × ${ygpa4_lateral}) / 4
                    </div>
                    <div class="step">
                        <strong>Intermediate:</strong> DGPA = (${ygpa2_lateral} + ${(1.5 * ygpa3_lateral).toFixed(2)} + ${(1.5 * ygpa4_lateral).toFixed(2)}) / 4
                    </div>
                    <div class="step">
                        <strong>Result:</strong> DGPA = ${dgpa.toFixed(2)}
                    </div>
                `;
                break;
                
            case '3-year':
                const ygpa1_3 = parseFloat(document.getElementById('ygpa1').value);
                const ygpa2_3 = parseFloat(document.getElementById('ygpa2').value);
                const ygpa3_3 = parseFloat(document.getElementById('ygpa3').value);
                
                if (isNaN(ygpa1_3) || isNaN(ygpa2_3) || isNaN(ygpa3_3)) {
                    showNotification('Please fill in all YGPA fields with valid values.', 'error');
                    return;
                }
                
                dgpa = (ygpa1_3 + ygpa2_3 + ygpa3_3) / 3;
                formula = `DGPA = (YGPA1 + YGPA2 + YGPA3) / 3`;
                
                stepsHTML += `
                    <div class="step">
                        <strong>Formula:</strong> ${formula}
                    </div>
                    <div class="step">
                        <strong>Values:</strong> YGPA1 = ${ygpa1_3}, YGPA2 = ${ygpa2_3}, YGPA3 = ${ygpa3_3}
                    </div>
                    <div class="step">
                        <strong>Calculation:</strong> DGPA = (${ygpa1_3} + ${ygpa2_3} + ${ygpa3_3}) / 3
                    </div>
                    <div class="step">
                        <strong>Result:</strong> DGPA = ${dgpa.toFixed(2)}
                    </div>
                `;
                break;
                
            case '2-year':
                const ygpa1_2 = parseFloat(document.getElementById('ygpa1').value);
                const ygpa2_2 = parseFloat(document.getElementById('ygpa2').value);
                
                if (isNaN(ygpa1_2) || isNaN(ygpa2_2)) {
                    showNotification('Please fill in all YGPA fields with valid values.', 'error');
                    return;
                }
                
                dgpa = (ygpa1_2 + ygpa2_2) / 2;
                formula = `DGPA = (YGPA1 + YGPA2) / 2`;
                
                stepsHTML += `
                    <div class="step">
                        <strong>Formula:</strong> ${formula}
                    </div>
                    <div class="step">
                        <strong>Values:</strong> YGPA1 = ${ygpa1_2}, YGPA2 = ${ygpa2_2}
                    </div>
                    <div class="step">
                        <strong>Calculation:</strong> DGPA = (${ygpa1_2} + ${ygpa2_2}) / 2
                    </div>
                    <div class="step">
                        <strong>Result:</strong> DGPA = ${dgpa.toFixed(2)}
                    </div>
                `;
                break;
                
            case '1-year':
                const ygpa1_1 = parseFloat(document.getElementById('ygpa1').value);
                
                if (isNaN(ygpa1_1)) {
                    showNotification('Please fill in the YGPA field with a valid value.', 'error');
                    return;
                }
                
                dgpa = ygpa1_1;
                formula = `DGPA = YGPA1`;
                
                stepsHTML += `
                    <div class="step">
                        <strong>Formula:</strong> ${formula}
                    </div>
                    <div class="step">
                        <strong>Value:</strong> YGPA1 = ${ygpa1_1}
                    </div>
                    <div class="step">
                        <strong>Result:</strong> DGPA = ${dgpa.toFixed(2)}
                    </div>
                `;
                break;
        }
        
        stepsHTML += '</div>';
        
        dgpaResult.innerHTML = `
            <div class="result-score">Your DGPA: ${dgpa.toFixed(2)}</div>
            ${stepsHTML}
        `;
        
        dgpaResult.classList.remove('hidden');
        dgpaResult.style.animation = 'slideIn 0.5s ease-out';
    });

    // Backlog Calculator
    const backlogSubjectsContainer = document.getElementById('backlog-subjects');
    const addBacklogBtn = document.getElementById('add-backlog');
    const calculateBacklogBtn = document.getElementById('calculate-backlog');
    const backlogResult = document.getElementById('backlog-result');

    // Initialize with one backlog subject
    addBacklogSubject();

    function addBacklogSubject() {
        const backlogRow = document.createElement('div');
        backlogRow.className = 'backlog-row';
        
        const subjectNumber = backlogSubjectsContainer.querySelectorAll('.backlog-row').length + 1;
        
        backlogRow.innerHTML = `
            <div class="form-group">
                <label for="backlog-credits-${subjectNumber}">Subject Credits</label>
                <input type="number" id="backlog-credits-${subjectNumber}" class="backlog-credits" min="1" max="10" step="1" placeholder="e.g., 4" required>
            </div>
            <div class="form-group">
                <label for="backlog-new-grade-${subjectNumber}">New Grade</label>
                <select id="backlog-new-grade-${subjectNumber}" class="backlog-new-grade" required>
                    <option value="">Select Grade</option>
                    <option value="O">O (Outstanding)</option>
                    <option value="E">E (Excellent)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Fair)</option>
                    <option value="D">D (Below Average)</option>
                </select>
            </div>
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        backlogSubjectsContainer.appendChild(backlogRow);
        
        backlogRow.querySelector('.remove-btn').addEventListener('click', function() {
            backlogRow.remove();
        });
    }

    addBacklogBtn.addEventListener('click', addBacklogSubject);

    calculateBacklogBtn.addEventListener('click', function() {
        const currentCGPA = parseFloat(document.getElementById('current-cgpa-input').value);
        const totalCreditsCompleted = parseFloat(document.getElementById('total-credits-completed').value);
        
        if (isNaN(currentCGPA) || isNaN(totalCreditsCompleted)) {
            showNotification('Please fill in current CGPA and total credits.', 'error');
            return;
        }
        
        const backlogRows = backlogSubjectsContainer.querySelectorAll('.backlog-row');
        let newCreditIndex = currentCGPA * totalCreditsCompleted;
        let newTotalCredits = totalCreditsCompleted;
        let calculations = [];
        
        backlogRows.forEach((row, index) => {
            const credits = parseFloat(row.querySelector('.backlog-credits').value);
            const newGrade = row.querySelector('.backlog-new-grade').value;
            
            if (isNaN(credits) || !newGrade) {
                return;
            }
            
            const newPoints = gradePoints[newGrade];
            const newSubjectCreditIndex = credits * newPoints;
            
            // Assuming previous grade was F (2 points)
            const oldPoints = 2;
            const oldSubjectCreditIndex = credits * oldPoints;
            
            newCreditIndex = newCreditIndex - oldSubjectCreditIndex + newSubjectCreditIndex;
            
            calculations.push({
                subject: `Backlog Subject ${index + 1}`,
                credits: credits,
                oldGrade: 'F',
                oldPoints: oldPoints,
                newGrade: newGrade,
                newPoints: newPoints,
                improvement: newSubjectCreditIndex - oldSubjectCreditIndex
            });
        });
        
        const newCGPA = newCreditIndex / newTotalCredits;
        const improvement = newCGPA - currentCGPA;
        
        let stepsHTML = '<div class="calculation-steps"><h3>Calculation Breakdown:</h3>';
        
        calculations.forEach(calc => {
            stepsHTML += `
                <div class="step">
                    ${calc.subject}: ${calc.credits} Credits × (${calc.newPoints} - ${calc.oldPoints}) Points = ${calc.improvement} Points Improvement
                </div>
            `;
        });
        
        stepsHTML += `
            <div class="step">
                <strong>Old Total Credit Index</strong> = ${currentCGPA} × ${totalCreditsCompleted} = ${(currentCGPA * totalCreditsCompleted).toFixed(2)}
            </div>
            <div class="step">
                <strong>New Total Credit Index</strong> = ${(currentCGPA * totalCreditsCompleted).toFixed(2)} + ${calculations.reduce((sum, c) => sum + c.improvement, 0).toFixed(2)} = ${newCreditIndex.toFixed(2)}
            </div>
            <div class="step">
                <strong>New CGPA</strong> = ${newCreditIndex.toFixed(2)} / ${newTotalCredits} = ${newCGPA.toFixed(2)}
            </div>
            <div class="step">
                <strong>Improvement</strong> = ${newCGPA.toFixed(2)} - ${currentCGPA.toFixed(2)} = ${improvement.toFixed(2)}
            </div>
        </div>`;
        
        backlogResult.innerHTML = `
            <div class="result-score">New CGPA: ${newCGPA.toFixed(2)}</div>
            <div class="result-score">Improvement: +${improvement.toFixed(2)}</div>
            ${stepsHTML}
        `;
        
        backlogResult.classList.remove('hidden');
        backlogResult.style.animation = 'slideIn 0.5s ease-out';
    });

    // What-If Simulator
    const scenarioSubjectsContainer = document.getElementById('scenario-subjects');
    const addScenarioBtn = document.getElementById('add-scenario');
    const runSimulationBtn = document.getElementById('run-simulation');
    const whatifResult = document.getElementById('whatif-result');

    // Initialize with 3 scenario subjects
    for (let i = 0; i < 3; i++) {
        addScenarioSubject();
    }

    function addScenarioSubject() {
        const scenarioRow = document.createElement('div');
        scenarioRow.className = 'scenario-row';
        
        const subjectNumber = scenarioSubjectsContainer.querySelectorAll('.scenario-row').length + 1;
        
        scenarioRow.innerHTML = `
            <div class="form-group">
                <label for="scenario-credits-${subjectNumber}">Subject Credits</label>
                <input type="number" id="scenario-credits-${subjectNumber}" class="scenario-credits" min="1" max="10" step="1" placeholder="e.g., 4" required>
            </div>
            <div class="form-group">
                <label for="scenario-grade-${subjectNumber}">Expected Grade</label>
                <select id="scenario-grade-${subjectNumber}" class="scenario-grade" required>
                    <option value="">Select Grade</option>
                    <option value="O">O (Outstanding)</option>
                    <option value="E">E (Excellent)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Fair)</option>
                    <option value="D">D (Below Average)</option>
                    <option value="F">F (Failed)</option>
                </select>
            </div>
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        scenarioSubjectsContainer.appendChild(scenarioRow);
        
        scenarioRow.querySelector('.remove-btn').addEventListener('click', function() {
            if (scenarioSubjectsContainer.querySelectorAll('.scenario-row').length > 1) {
                scenarioRow.remove();
            }
        });
    }

    addScenarioBtn.addEventListener('click', addScenarioSubject);

    runSimulationBtn.addEventListener('click', function() {
        const currentSemester = parseInt(document.getElementById('current-semester').value);
        
        if (isNaN(currentSemester)) {
            showNotification('Please enter current semester.', 'error');
            return;
        }
        
        const scenarioRows = scenarioSubjectsContainer.querySelectorAll('.scenario-row');
        let scenarios = [];
        
        // Generate multiple scenarios with different grade combinations
        const gradeCombinations = [
            ['O', 'O', 'O'], // Best case
            ['E', 'E', 'E'], // Excellent
            ['A', 'A', 'A'], // Average
            ['B', 'B', 'B'], // Below average
            ['C', 'C', 'C']  // Minimum pass
        ];
        
        gradeCombinations.forEach((grades, index) => {
            let totalCredits = 0;
            let creditIndex = 0;
            
            scenarioRows.forEach((row, i) => {
                const credits = parseFloat(row.querySelector('.scenario-credits').value) || 4;
                const grade = grades[i] || 'A';
                const points = gradePoints[grade];
                
                totalCredits += credits;
                creditIndex += credits * points;
            });
            
            const projectedSGPA = creditIndex / totalCredits;
            
            // Estimate CGPA based on current performance
            const currentCGPA = academicData.currentCGPA || 7.0;
            const estimatedCGPA = ((currentCGPA * (currentSemester - 1)) + projectedSGPA) / currentSemester;
            
            scenarios.push({
                name: `Scenario ${index + 1}`,
                grades: grades.join(', '),
                sgpa: projectedSGPA,
                estimatedCGPA: estimatedCGPA
            });
        });
        
        let resultsHTML = '<div class="calculation-steps"><h3>Simulation Results:</h3>';
        
        scenarios.forEach(scenario => {
            resultsHTML += `
                <div class="step">
                    <strong>${scenario.name}</strong> (Grades: ${scenario.grades})
                    <br>Projected SGPA: ${scenario.sgpa.toFixed(2)}
                    <br>Estimated CGPA: ${scenario.estimatedCGPA.toFixed(2)}
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        
        whatifResult.innerHTML = `
            <div class="result-score">What-If Analysis Results</div>
            ${resultsHTML}
        `;
        
        whatifResult.classList.remove('hidden');
        whatifResult.style.animation = 'slideIn 0.5s ease-out';
    });

    // Analytics
    function initializeAnalytics() {
        const ctx1 = document.getElementById('semester-trend-chart');
        const ctx2 = document.getElementById('subject-performance-chart');
        const ctx3 = document.getElementById('grade-distribution-chart');
        
        if (ctx1 && academicData.semesters.length > 0) {
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: academicData.semesters.map((s, i) => `Sem ${i + 1}`),
                    datasets: [{
                        label: 'SGPA Trend',
                        data: academicData.semesters.map(s => s.sgpa),
                        borderColor: '#2575fc',
                        backgroundColor: 'rgba(37, 117, 252, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Semester Performance Trend'
                        }
                    }
                }
            });
        }
        
        if (ctx2 && academicData.semesters.length > 0) {
            // Aggregate subject performance
            const subjectPerformance = {};
            academicData.semesters.forEach(semester => {
                semester.subjects.forEach(subject => {
                    if (!subjectPerformance[subject.name]) {
                        subjectPerformance[subject.name] = [];
                    }
                    subjectPerformance[subject.name].push(subject.points);
                });
            });
            
            const avgPerformance = Object.keys(subjectPerformance).map(subject => ({
                subject: subject,
                avgPoints: subjectPerformance[subject].reduce((a, b) => a + b, 0) / subjectPerformance[subject].length
            }));
            
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: avgPerformance.map(s => s.subject),
                    datasets: [{
                        label: 'Average Grade Points',
                        data: avgPerformance.map(s => s.avgPoints),
                        backgroundColor: '#6a11cb'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Subject-wise Performance'
                        }
                    }
                }
            });
        }
        
        if (ctx3 && academicData.semesters.length > 0) {
            // Grade distribution
            const gradeDistribution = { O: 0, E: 0, A: 0, B: 0, C: 0, D: 0, F: 0, I: 0 };
            
            academicData.semesters.forEach(semester => {
                semester.subjects.forEach(subject => {
                    gradeDistribution[subject.grade]++;
                });
            });
            
            new Chart(ctx3, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(gradeDistribution),
                    datasets: [{
                        data: Object.values(gradeDistribution),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                            '#FF6384',
                            '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Grade Distribution'
                        }
                    }
                }
            });
        }
        
        // Export functionality
        document.getElementById('export-analytics').addEventListener('click', exportAnalytics);
        document.getElementById('export-excel').addEventListener('click', exportToExcel);
        document.getElementById('export-csv').addEventListener('click', exportToCSV);
        document.getElementById('generate-transcript').addEventListener('click', generateTranscript);
    }

    function exportAnalytics() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('MAKAUT Grade Analytics Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Current CGPA: ${academicData.currentCGPA.toFixed(2)}`, 20, 40);
        doc.text(`Total Credits: ${academicData.totalCredits}`, 20, 50);
        
        // Add semester details
        let yPosition = 70;
        academicData.semesters.forEach((semester, index) => {
            doc.text(`Semester ${index + 1}: SGPA ${semester.sgpa.toFixed(2)}`, 20, yPosition);
            yPosition += 10;
        });
        
        doc.save('grade-analytics.pdf');
        showNotification('Analytics report exported successfully!', 'success');
    }

    function exportToExcel() {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        
        // Create a worksheet for semester data
        const semesterData = academicData.semesters.map((semester, index) => ({
            'Semester': index + 1,
            'SGPA': semester.sgpa.toFixed(2),
            'Total Credits': semester.totalCredits,
            'Credit Index': semester.creditIndex.toFixed(2),
            'Date': new Date(semester.date).toLocaleDateString()
        }));
        
        const semesterWS = XLSX.utils.json_to_sheet(semesterData);
        XLSX.utils.book_append_sheet(workbook, semesterWS, 'Semesters');
        
        // Create a worksheet for subject data
        const subjectData = [];
        academicData.semesters.forEach((semester, semIndex) => {
            semester.subjects.forEach(subject => {
                subjectData.push({
                    'Semester': semIndex + 1,
                    'Subject': subject.name,
                    'Credits': subject.credits,
                    'Grade': subject.grade,
                    'Points': subject.points,
                    'Credit Points': subject.creditIndex
                });
            });
        });
        
        const subjectWS = XLSX.utils.json_to_sheet(subjectData);
        XLSX.utils.book_append_sheet(workbook, subjectWS, 'Subjects');
        
        // Create a worksheet for achievements
        const achievementData = academicData.achievements.map(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            return achievement ? {
                'Achievement': achievement.name,
                'Description': achievement.description,
                'Unlocked': 'Yes'
            } : null;
        }).filter(Boolean);
        
        const achievementWS = XLSX.utils.json_to_sheet(achievementData);
        XLSX.utils.book_append_sheet(workbook, achievementWS, 'Achievements');
        
        // Save the workbook
        XLSX.writeFile(workbook, 'makaut-grade-data.xlsx');
        
        // Mark as exported for achievement
        if (!academicData.exportedData) {
            academicData.exportedData = true;
            storage.save('academicData', academicData);
            checkAchievements();
        }
        
        showNotification('Data exported to Excel successfully!', 'success');
    }

    function exportToCSV() {
        // Create CSV content for semester data
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        csvContent += "Semester,SGPA,Total Credits,Credit Index,Date\n";
        
        // Add semester data
        academicData.semesters.forEach((semester, index) => {
            csvContent += `${index + 1},${semester.sgpa.toFixed(2)},${semester.totalCredits},${semester.creditIndex.toFixed(2)},${new Date(semester.date).toLocaleDateString()}\n`;
        });
        
        // Create a download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "makaut-grade-data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Data exported to CSV successfully!', 'success');
    }

    function generateTranscript() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(20);
        doc.text('MAKAUT University', 105, 20, { align: 'center' });
        doc.text('Academic Transcript', 105, 30, { align: 'center' });
        
        // Add student info (placeholder)
        doc.setFontSize(12);
        doc.text('Name: [Student Name]', 20, 50);
        doc.text('Roll Number: [Roll Number]', 20, 60);
        doc.text('Course: [Course Name]', 20, 70);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 80);
        
        // Add semester table
        let yPosition = 100;
        doc.setFontSize(14);
        doc.text('Semester Results', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text('Semester', 20, yPosition);
        doc.text('SGPA', 60, yPosition);
        doc.text('Credits', 90, yPosition);
        doc.text('Credit Index', 120, yPosition);
        doc.text('Date', 160, yPosition);
        yPosition += 7;
        
        // Add line
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;
        
        // Add semester data
        academicData.semesters.forEach((semester, index) => {
            doc.text(`${index + 1}`, 20, yPosition);
            doc.text(semester.sgpa.toFixed(2), 60, yPosition);
            doc.text(semester.totalCredits.toString(), 90, yPosition);
            doc.text(semester.creditIndex.toFixed(2), 120, yPosition);
            doc.text(new Date(semester.date).toLocaleDateString(), 160, yPosition);
            yPosition += 7;
        });
        
        // Add line
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
        
        // Add summary
        doc.setFontSize(12);
        doc.text(`Total Credits: ${academicData.totalCredits}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Current CGPA: ${academicData.currentCGPA.toFixed(2)}`, 20, yPosition);
        yPosition += 20;
        
        // Add achievements
        doc.text('Achievements:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        academicData.achievements.forEach(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
                doc.text(`• ${achievement.name}: ${achievement.description}`, 30, yPosition);
                yPosition += 7;
            }
        });
        
        // Save the PDF
        doc.save('academic-transcript.pdf');
        showNotification('Academic transcript generated successfully!', 'success');
    }

    // Prediction Tool
    function initializePrediction() {
        document.getElementById('predict-grades').addEventListener('click', predictGrades);
        generateStudyPriorities();
    }

    function predictGrades() {
        const targetCGPA = parseFloat(document.getElementById('target-cgpa-input').value);
        const remainingSemesters = parseInt(document.getElementById('remaining-semesters').value);
        const creditsPerSemester = parseFloat(document.getElementById('credits-per-semester').value);
        
        if (isNaN(targetCGPA) || isNaN(remainingSemesters) || isNaN(creditsPerSemester)) {
            showNotification('Please fill in all fields with valid values.', 'error');
            return;
        }
        
        const currentCGPA = academicData.currentCGPA || 0;
        const completedSemesters = academicData.semesters.length;
        const totalCompletedCredits = academicData.totalCredits || 0;
        
        const totalRequiredCredits = totalCompletedCredits + (remainingSemesters * creditsPerSemester);
        const requiredTotalCreditIndex = targetCGPA * totalRequiredCredits;
        const currentTotalCreditIndex = currentCGPA * totalCompletedCredits;
        const requiredFutureCreditIndex = requiredTotalCreditIndex - currentTotalCreditIndex;
        const requiredAverageSGPA = requiredFutureCreditIndex / (remainingSemesters * creditsPerSemester);
        
        // Convert to grade
        let requiredGrade = 'F';
        if (requiredAverageSGPA >= 9.5) requiredGrade = 'O';
        else if (requiredAverageSGPA >= 8.5) requiredGrade = 'E';
        else if (requiredAverageSGPA >= 7.5) requiredGrade = 'A';
        else if (requiredAverageSGPA >= 6.5) requiredGrade = 'B';
        else if (requiredAverageSGPA >= 5.5) requiredGrade = 'C';
        else if (requiredAverageSGPA >= 4.5) requiredGrade = 'D';
        
        document.getElementById('prediction-result').innerHTML = `
            <div class="result-score">Required Average SGPA: ${requiredAverageSGPA.toFixed(2)}</div>
            <div class="result-score">Required Grade: ${requiredGrade}</div>
            <div class="calculation-steps">
                <h3>Prediction Details:</h3>
                <div class="step">
                    <strong>Current Status:</strong> CGPA ${currentCGPA.toFixed(2)} with ${totalCompletedCredits} credits
                </div>
                <div class="step">
                    <strong>Target:</strong> CGPA ${targetCGPA.toFixed(2)} with ${totalRequiredCredits} total credits
                </div>
                <div class="step">
                    <strong>Required Performance:</strong> Average SGPA of ${requiredAverageSGPA.toFixed(2)} over ${remainingSemesters} semesters
                </div>
                <div class="step">
                    <strong>Recommendation:</strong> Aim for grade ${requiredGrade} or higher in all upcoming subjects
                </div>
            </div>
        `;
        
        document.getElementById('prediction-result').classList.remove('hidden');
        document.getElementById('prediction-result').style.animation = 'slideIn 0.5s ease-out';
        
        // Track prediction count for achievement
        academicData.predictionCount = (academicData.predictionCount || 0) + 1;
        storage.save('academicData', academicData);
        checkAchievements();
    }

    function generateStudyPriorities() {
        const priorityList = document.getElementById('priority-list');
        
        // Analyze current performance to generate priorities
        const priorities = [];
        
        if (academicData.semesters.length > 0) {
            const lastSemester = academicData.semesters[academicData.semesters.length - 1];
            
            // Find subjects with lowest grades
            const sortedSubjects = lastSemester.subjects.sort((a, b) => a.points - b.points);
            
            sortedSubjects.slice(0, 3).forEach((subject, index) => {
                priorities.push({
                    priority: index + 1,
                    subject: subject.name,
                    reason: `Lowest grade (${subject.grade}) in last semester`,
                    action: 'Focus on understanding core concepts'
                });
            });
            
            // Add general priorities
            priorities.push({
                priority: priorities.length + 1,
                subject: 'High Credit Subjects',
                reason: 'Higher impact on overall CGPA',
                action: 'Allocate more study time to high credit courses'
            });
            
            priorities.push({
                priority: priorities.length + 1,
                subject: 'Consistent Performance',
                reason: 'Maintain steady improvement',
                action: 'Regular revision and practice'
            });
        } else {
            priorities.push({
                priority: 1,
                subject: 'All Subjects',
                reason: 'No previous data available',
                action: 'Start strong and maintain consistency'
            });
        }
        
        let prioritiesHTML = '';
        priorities.forEach(priority => {
            prioritiesHTML += `
                <div class="priority-item">
                    <div class="priority-number">${priority.priority}</div>
                    <div class="priority-content">
                        <h4>${priority.subject}</h4>
                        <p><strong>Reason:</strong> ${priority.reason}</p>
                        <p><strong>Action:</strong> ${priority.action}</p>
                    </div>
                </div>
            `;
        });
        
        priorityList.innerHTML = prioritiesHTML;
    }

    // Goals Tracker
    function initializeGoals() {
        displayGoals();
        checkScholarshipEligibility();
        
        document.getElementById('add-goal').addEventListener('click', addGoal);
        
        // Set up event delegation for goal removal
        document.getElementById('goals-list').addEventListener('click', function(e) {
            if (e.target.closest('.remove-goal-btn')) {
                const button = e.target.closest('.remove-goal-btn');
                const goalId = parseInt(button.getAttribute('data-goal-id'));
                removeGoal(goalId);
            }
        });
    }

    function addGoal() {
        const goalType = document.getElementById('goal-type').value;
        const goalValue = parseFloat(document.getElementById('goal-value').value);
        const goalDeadline = document.getElementById('goal-deadline').value;
        
        if (isNaN(goalValue) || !goalDeadline) {
            showNotification('Please fill in all goal fields.', 'error');
            return;
        }
        
        const goal = {
            id: Date.now(),
            type: goalType,
            value: goalValue,
            deadline: goalDeadline,
            created: new Date().toISOString(),
            progress: 0,
            completed: false
        };
        
        academicData.goals.push(goal);
        updateAcademicData();
        displayGoals();
        
        // Clear form
        document.getElementById('goal-value').value = '';
        document.getElementById('goal-deadline').value = '';
        
        showNotification('Goal added successfully!', 'success');
    }

    function displayGoals() {
        const goalsList = document.getElementById('goals-list');
        
        if (academicData.goals.length === 0) {
            goalsList.innerHTML = '<p>No goals set yet. Add your first goal above!</p>';
            return;
        }
        
        let goalsHTML = '';
        academicData.goals.forEach(goal => {
            const progress = calculateGoalProgress(goal);
            const deadline = new Date(goal.deadline);
            const today = new Date();
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            
            goalsHTML += `
                <div class="goal-item">
                    <div>
                        <h4>${goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal: ${goal.value}</h4>
                        <p>Deadline: ${deadline.toLocaleDateString()} (${daysLeft} days left)</p>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <p>Progress: ${progress.toFixed(1)}%</p>
                    </div>
                    <button class="btn btn-danger remove-goal-btn" data-goal-id="${goal.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        goalsList.innerHTML = goalsHTML;
    }

    function calculateGoalProgress(goal) {
        const currentCGPA = academicData.currentCGPA || 0;
        
        switch(goal.type) {
            case 'cgpa':
                return Math.min((currentCGPA / goal.value) * 100, 100);
            default:
                return 0;
        }
    }

    function removeGoal(goalId) {
        academicData.goals = academicData.goals.filter(g => g.id !== goalId);
        updateAcademicData();
        displayGoals();
        showNotification('Goal removed successfully!', 'info');
    }

    function checkScholarshipEligibility() {
        const scholarshipList = document.getElementById('scholarship-list');
        const currentCGPA = academicData.currentCGPA || 0;
        
        const scholarships = [
            { name: 'Merit Scholarship', minCGPA: 9.0, description: 'For outstanding academic performance' },
            { name: 'Excellence Award', minCGPA: 8.5, description: 'For excellent academic performance' },
            { name: 'Achievement Grant', minCGPA: 8.0, description: 'For good academic performance' },
            { name: 'Performance Scholarship', minCGPA: 7.5, description: 'For consistent performance' }
        ];
        
        let scholarshipsHTML = '';
        scholarships.forEach(scholarship => {
            const isEligible = currentCGPA >= scholarship.minCGPA;
            scholarshipsHTML += `
                <div class="scholarship-item">
                    <h4>${scholarship.name}</h4>
                    <p>${scholarship.description}</p>
                    <p>Required CGPA: ${scholarship.minCGPA}</p>
                    <span class="scholarship-status ${isEligible ? 'scholarship-eligible' : 'scholarship-not-eligible'}">
                        ${isEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                </div>
            `;
        });
        
        scholarshipList.innerHTML = scholarshipsHTML;
    }

    // Performance Insights
    function initializeInsights() {
        generateInsights();
        generateRecommendations();
    }

    function generateInsights() {
        const insightsContent = document.getElementById('insights-content');
        
        const insights = [];
        
        if (academicData.semesters.length > 0) {
            // Performance trend analysis
            const recentSemesters = academicData.semesters.slice(-3);
            const avgRecentSGPA = recentSemesters.reduce((sum, s) => sum + s.sgpa, 0) / recentSemesters.length;
            const overallAvgSGPA = academicData.semesters.reduce((sum, s) => sum + s.sgpa, 0) / academicData.semesters.length;
            
            if (avgRecentSGPA > overallAvgSGPA) {
                insights.push({
                    type: 'positive',
                    title: 'Improving Performance',
                    description: `Your recent performance (${avgRecentSGPA.toFixed(2)}) is better than your average (${overallAvgSGPA.toFixed(2)}). Keep up the good work!`
                });
            } else if (avgRecentSGPA < overallAvgSGPA) {
                insights.push({
                    type: 'warning',
                    title: 'Declining Performance',
                    description: `Your recent performance (${avgRecentSGPA.toFixed(2)}) is below your average (${overallAvgSGPA.toFixed(2)}). Consider reviewing your study methods.`
                });
            }
            
            // Grade consistency
            const lastSemester = academicData.semesters[academicData.semesters.length - 1];
            const gradeVariance = calculateGradeVariance(lastSemester.subjects);
            
            if (gradeVariance < 2) {
                insights.push({
                    type: 'positive',
                    title: 'Consistent Performance',
                    description: 'You maintain consistent grades across subjects. This shows balanced understanding.'
                });
            } else if (gradeVariance > 4) {
                insights.push({
                    type: 'warning',
                    title: 'Inconsistent Performance',
                    description: 'There\'s significant variation in your subject grades. Focus on weaker areas.'
                });
            }
        } else {
            insights.push({
                type: 'info',
                title: 'Start Your Journey',
                description: 'Begin by adding your semester data to receive personalized insights.'
            });
        }
        
        let insightsHTML = '';
        insights.forEach(insight => {
            const iconClass = insight.type === 'positive' ? 'fa-check-circle' : 
                             insight.type === 'warning' ? 'fa-exclamation-triangle' : 
                             'fa-info-circle';
            const colorClass = insight.type === 'positive' ? 'text-success' : 
                              insight.type === 'warning' ? 'text-warning' : 
                              'text-info';
            
            insightsHTML += `
                <div class="insight-item">
                    <i class="fas ${iconClass} ${colorClass}"></i>
                    <div>
                        <h4>${insight.title}</h4>
                        <p>${insight.description}</p>
                    </div>
                </div>
            `;
        });
        
        insightsContent.innerHTML = insightsHTML;
    }

    function calculateGradeVariance(subjects) {
        const grades = subjects.map(s => s.points);
        const mean = grades.reduce((a, b) => a + b, 0) / grades.length;
        const variance = grades.reduce((sum, grade) => sum + Math.pow(grade - mean, 2), 0) / grades.length;
        return Math.sqrt(variance);
    }

    function generateRecommendations() {
        const recommendationsList = document.getElementById('recommendations-list');
        
        const recommendations = [];
        
        if (academicData.currentCGPA < 6) {
            recommendations.push({
                icon: 'fa-book',
                text: 'Focus on fundamental concepts. Consider joining study groups.'
            });
        } else if (academicData.currentCGPA < 8) {
            recommendations.push({
                icon: 'fa-chart-line',
                text: 'You\'re doing well! Aim for consistency and try to improve in weaker subjects.'
            });
        } else {
            recommendations.push({
                icon: 'fa-trophy',
                text: 'Excellent performance! Consider mentoring peers and taking on challenging projects.'
            });
        }
        
        recommendations.push({
            icon: 'fa-calendar',
            text: 'Maintain a regular study schedule and revise topics weekly.'
        });
        
        recommendations.push({
            icon: 'fa-users',
            text: 'Participate in class discussions and clarify doubts immediately.'
        });
        
        let recommendationsHTML = '';
        recommendations.forEach(rec => {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas ${rec.icon}"></i>
                    <p>${rec.text}</p>
                </div>
            `;
        });
        
        recommendationsList.innerHTML = recommendationsHTML;
    }

    // Achievements
    function displayAchievements() {
        const achievementsGrid = document.getElementById('achievements-grid');
        
        let achievementsHTML = '';
        achievements.forEach(achievement => {
            const isUnlocked = academicData.achievements.includes(achievement.id);
            
            achievementsHTML += `
                <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">
                        <i class="fas ${achievement.icon}"></i>
                    </div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    ${isUnlocked ? '<div class="achievement-progress"><div class="achievement-progress-fill" style="width: 100%"></div></div>' : ''}
                </div>
            `;
        });
        
        achievementsGrid.innerHTML = achievementsHTML;
        
        // Update achievement count
        document.getElementById('achievement-count').textContent = academicData.achievements.length;
    }

    // Update academic data
    function updateAcademicData() {
        // Calculate current CGPA and total credits
        if (academicData.semesters.length > 0) {
            let totalCreditIndex = 0;
            let totalCredits = 0;
            
            academicData.semesters.forEach(semester => {
                totalCreditIndex += semester.creditIndex;
                totalCredits += semester.totalCredits;
            });
            
            academicData.currentCGPA = totalCreditIndex / totalCredits;
            academicData.totalCredits = totalCredits;
        }
        
        storage.save('academicData', academicData);
        updateQuickStats();
        checkAchievements();
    }

    // Floating Action Button
    const fabMain = document.getElementById('fab-main');
    const fabOptions = document.getElementById('fab-options');

    fabMain.addEventListener('click', function() {
        fabOptions.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-plus');
        this.querySelector('i').classList.toggle('fa-times');
    });

    document.querySelectorAll('.fab-option').forEach(option => {
        option.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleFabAction(action);
            fabOptions.classList.remove('active');
            fabMain.querySelector('i').classList.add('fa-plus');
            fabMain.querySelector('i').classList.remove('fa-times');
        });
    });

    function handleFabAction(action) {
        switch(action) {
            case 'quick-calc':
                document.querySelector('[data-tab="sgpa"]').click();
                document.querySelector('[data-calculator="sgpa"]').click();
                break;
            case 'add-grade':
                document.querySelector('[data-tab="sgpa"]').click();
                document.querySelector('[data-calculator="sgpa"]').click();
                document.getElementById('add-subject').click();
                break;
            case 'view-stats':
                document.querySelector('[data-tab="analytics"]').click();
                break;
        }
    }

    // PWA Install Banner
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const dismissInstall = document.getElementById('dismiss-install');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBanner.classList.add('hidden');
        }
    });

    dismissInstall.addEventListener('click', () => {
        installBanner.classList.add('hidden');
    });

    // Data Export/Import - Completely Fixed Version
    function initializeDataManagement() {
        console.log('Initializing data management...');
        
        // Fix: Position file input off-screen instead of hiding it
        const importInput = document.getElementById('data-import-input');
        if (importInput) {
            importInput.style.position = 'absolute';
            importInput.style.left = '-9999px';
            importInput.style.width = '1px';
            importInput.style.height = '1px';
            importInput.style.opacity = '0';
        } else {
            console.error('Import input not found');
        }
        
        // Export Data
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Export button clicked');
                
                try {
                    // Create a copy of the data to avoid reference issues
                    const exportData = JSON.parse(JSON.stringify(academicData));
                    
                    // Add export timestamp
                    exportData.exportTimestamp = new Date().toISOString();
                    exportData.version = '1.0';
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    
                    const exportFileDefaultName = `makaut-grades-backup-${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.style.display = 'none';
                    
                    document.body.appendChild(linkElement);
                    linkElement.click();
                    
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(linkElement);
                    }, 100);
                    
                    showNotification('Data exported successfully!', 'success');
                    
                    // Mark as exported for achievement
                    if (!academicData.exportedData) {
                        academicData.exportedData = true;
                        storage.save('academicData', academicData);
                        checkAchievements();
                    }
                    
                } catch (error) {
                    console.error('Export error:', error);
                    showNotification('Error exporting data. Please try again.', 'error');
                }
            });
        } else {
            console.error('Export button not found');
        }

        // Import Data
        const importBtn = document.getElementById('import-data');
        
        if (importBtn && importInput) {
            importBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Import button clicked');
                importInput.click();
            });
            
            importInput.addEventListener('change', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const file = e.target.files[0];
                if (!file) return;
                
                console.log('File selected:', file.name);
                
                // Show loading notification
                showNotification('Importing data...', 'info');
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        console.log('Data parsed successfully');
                        
                        // Validate imported data structure
                        if (!importedData || typeof importedData !== 'object') {
                            throw new Error('Invalid data format');
                        }
                        
                        // Show confirmation dialog
                        const confirmed = confirm(`Import data from ${file.name}?\n\nThis will replace your current data.\n\nCurrent data will be backed up automatically.`);
                        
                        if (confirmed) {
                            // Backup current data before replacing
                            const backupData = JSON.parse(JSON.stringify(academicData));
                            localStorage.setItem('makaut_backup_' + Date.now(), JSON.stringify(backupData));
                            
                            // Merge with existing data, preserving some defaults
                            academicData = {
                                semesters: importedData.semesters || [],
                                goals: importedData.goals || [],
                                currentCGPA: importedData.currentCGPA || 0,
                                totalCredits: importedData.totalCredits || 0,
                                targetCGPA: importedData.targetCGPA || 8.0,
                                achievements: importedData.achievements || [],
                                predictionCount: importedData.predictionCount || 0,
                                exportedData: importedData.exportedData || false,
                                usedCalculators: importedData.usedCalculators || {
                                    sgpa: false,
                                    ygpa: false,
                                    cgpa: false,
                                    dgpa: false
                                },
                                theme: importedData.theme || 'light'
                            };
                            
                            storage.save('academicData', academicData);
                            updateAcademicData();
                            
                            showNotification('Data imported successfully! Reloading page...', 'success');
                            
                            // Reload page after a short delay to ensure data is saved
                            setTimeout(() => {
                                location.reload();
                            }, 1000);
                        } else {
                            showNotification('Import cancelled.', 'info');
                        }
                        
                    } catch (error) {
                        console.error('Import error:', error);
                        showNotification('Error importing data. Please check the file format.', 'error');
                    }
                };
                
                reader.onerror = function() {
                    console.error('File reading error');
                    showNotification('Error reading file. Please try again.', 'error');
                };
                
                reader.readAsText(file);
                
                // Clear the input value to allow importing the same file again
                this.value = '';
            });
        } else {
            console.error('Import button or input not found');
        }

        // Clear Data
        const clearBtn = document.getElementById('clear-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Clear button clicked');
                
                // Create a custom confirmation dialog
                const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL your data including:\n\n• All semester records\n• Goals and achievements\n• Settings and preferences\n\nThis action CANNOT be undone. Are you absolutely sure?');
                
                if (confirmed) {
                    // Double confirmation
                    const doubleConfirmed = confirm('This is your FINAL warning!\n\nAll data will be lost forever.\n\nClick OK to proceed or Cancel to keep your data.');
                    
                    if (doubleConfirmed) {
                        try {
                            // Create final backup
                            const finalBackup = JSON.parse(JSON.stringify(academicData));
                            localStorage.setItem('makaut_final_backup_' + Date.now(), JSON.stringify(finalBackup));
                            
                            // Clear local storage
                            storage.clear();
                            
                            // Reset academicData to default values
                            academicData = {
                                semesters: [],
                                goals: [],
                                currentCGPA: 0,
                                totalCredits: 0,
                                targetCGPA: 8.0,
                                achievements: [],
                                predictionCount: 0,
                                exportedData: false,
                                usedCalculators: {
                                    sgpa: false,
                                    ygpa: false,
                                    cgpa: false,
                                    dgpa: false
                                },
                                theme: 'light'
                            };
                            
                            showNotification('All data cleared successfully! Reloading page...', 'info');
                            
                            // Reload page after a short delay
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        } catch (error) {
                            console.error('Clear data error:', error);
                            showNotification('Error clearing data. Please try again.', 'error');
                        }
                    } else {
                        showNotification('Data clearing cancelled. Your data is safe!', 'success');
                    }
                } else {
                    showNotification('Data clearing cancelled. Your data is safe!', 'info');
                }
            });
        } else {
            console.error('Clear button not found');
        }
    }

    // Initialize data management when DOM is ready
    initializeDataManagement();

    // Initialize
    updateQuickStats();
    updateAcademicData();
    checkAchievements();
});