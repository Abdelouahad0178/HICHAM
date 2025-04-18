// Firebase Configuration (Update with your Firebase project credentials from the Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyBX5Ijm-qeW4piO1bLrnVOj5KAb8tZrehU",
    authDomain: "gestionhichami.firebaseapp.com",
    projectId: "gestionhichami",
    storageBucket: "gestionhichami.firebasestorage.app",
    messagingSenderId: "124682777633",
    appId: "1:124682777633:web:91b45c69c26af0002a5f60",
    measurementId: "G-J8FCDY2SFC"
};

// Initialize Firebase
let db, auth;
try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please check script tags and network connectivity.');
    }
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase Initialization Error:', error.message);
    alert('Erreur: Firebase non initialisé. Vérifiez les identifiants dans firebaseConfig et assurez-vous que les scripts Firebase sont chargés. Fonctionnement en mode démo.');
}

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const transactionForm = document.getElementById('transactionForm');
const expenseForm = document.getElementById('expenseForm');
const saleForm = document.getElementById('saleForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerName = document.getElementById('registerName');
const registerRole = document.getElementById('registerRole');
const forgotPasswordEmail = document.getElementById('forgotPasswordEmail');
const showRegisterForm = document.getElementById('showRegisterForm');
const showLoginForm = document.getElementById('showLoginForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const showLoginFormFromForgot = document.getElementById('showLoginFormFromForgot');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplayName = document.getElementById('userDisplayName');
const userRole = document.getElementById('userRole');
const menuItems = document.querySelectorAll('.menu-item');
const tabContents = document.querySelectorAll('.tab-content');
const transactionModal = document.getElementById('transactionModal');
const expenseModal = document.getElementById('expenseModal');
const saleModal = document.getElementById('saleModal');
const closeButtons = document.querySelectorAll('.close');
const cancelButtons = document.querySelectorAll('.cancelBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const addSaleBtn = document.getElementById('addSaleBtn');
const transactionType = document.getElementById('transactionType');
const expenseFields = document.getElementById('expenseFields');
const saleFields = document.getElementById('saleFields');
const currentBalance = document.getElementById('currentBalance');
const totalFunding = document.getElementById('totalFunding');
const totalExpenses = document.getElementById('totalExpenses');
const totalSales = document.getElementById('totalSales');
const totalUnitsSold = document.getElementById('totalUnitsSold');
const recentActivitiesTable = document.getElementById('recentActivitiesTable');
const reportPeriod = document.getElementById('reportPeriod');
const customDateRange = document.getElementById('customDateRange');
const generateReportBtn = document.getElementById('generateReportBtn');

// Global Variables
let currentUser = null;
let userInfo = null;
let cashFlowChartInstance = null;
let expensesChartInstance = null;
let reportChartInstance = null;
let isLoggingIn = false;
let isLoggingOut = false;
let lastDataHash = '';
let lastAuthUser = null;

// Persistent Debounce Storage
const getLastDashboardLoad = () => parseInt(sessionStorage.getItem('lastDashboardLoad') || '0');
const setLastDashboardLoad = (time) => sessionStorage.setItem('lastDashboardLoad', time);
const hasLoadedDashboard = () => sessionStorage.getItem('hasLoadedDashboard') === 'true';
const setHasLoadedDashboard = (value) => sessionStorage.setItem('hasLoadedDashboard', value);

// In-memory Data Arrays
const transactions = [];
const expenses = [];
const sales = [];
const mockUsers = [
    { email: 'hicham@example.com', name: 'Hicham', role: 'manager', password: 'password' },
    { email: 'abdelouahad@example.com', name: 'Abdelouahad', role: 'director', password: 'password' }
];

// Log mock users for debugging
console.log('Available mock users:', mockUsers.map(u => u.email));

// Validation Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateFormField(field, errorMessage) {
    if (!field.value.trim()) {
        alert(errorMessage);
        field.focus();
        return false;
    }
    return true;
}

function validatePositiveNumber(field, errorMessage) {
    const value = parseFloat(field.value);
    if (isNaN(value) || value <= 0) {
        alert(errorMessage);
        field.focus();
        return false;
    }
    return true;
}

// Authentication State Change
if (auth) {
    auth.onAuthStateChanged((user) => {
        const timestamp = new Date().toISOString();
        if (user) {
            const isSameUser = lastAuthUser && lastAuthUser.email === user.email;
            console.log(`Auth state changed at ${timestamp}: User logged in: ${user.email}${isSameUser ? ' (persisted session)' : ''}`);
            if (isSameUser) {
                console.warn('Redundant auth state change for same user:', user.email);
                if (hasLoadedDashboard()) {
                    console.log('Skipping dashboard load: already loaded in this session');
                    return;
                }
            }
            lastAuthUser = user;
            currentUser = user;
            loginScreen.style.display = 'none';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            forgotPasswordForm.style.display = 'none';
            appScreen.style.display = 'flex';
            loadUserInfo();
            if (!isLoggingOut) {
                loadDashboardData('auth');
                loadTransactions();
                loadExpenses();
                loadSales();
                generateCharts();
            }
        } else {
            console.log(`Auth state changed at ${timestamp}: No user logged in`);
            lastAuthUser = null;
            currentUser = null;
            loginScreen.style.display = 'flex';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            forgotPasswordForm.style.display = 'none';
            appScreen.style.display = 'none';
            setHasLoadedDashboard(false);
        }
    });
} else {
    console.warn('Firebase Authentication not initialized. Using mock authentication.');
}

// Form Toggle Events
if (showRegisterForm) {
    showRegisterForm.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        forgotPasswordForm.style.display = 'none';
    });
}

if (showLoginForm) {
    showLoginForm.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        forgotPasswordForm.style.display = 'none';
    });
}

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        forgotPasswordForm.style.display = 'block';
    });
}

if (showLoginFormFromForgot) {
    showLoginFormFromForgot.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        forgotPasswordForm.style.display = 'none';
    });
}

// Login Form Submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (isLoggingIn) {
            console.log('Login attempt ignored: previous login still in progress');
            return;
        }

        if (!validateFormField(loginEmail, 'Veuillez entrer un email.') ||
            !isValidEmail(loginEmail.value.trim()) ||
            !validateFormField(loginPassword, 'Veuillez entrer un mot de passe.')) {
            return;
        }

        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        const loginButton = loginForm.querySelector('button[type="submit"]');

        isLoggingIn = true;
        loginButton.disabled = true;
        loginButton.textContent = 'Connexion en cours...';

        console.log('Attempting login with email:', email);

        if (auth && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    console.log('Firebase login successful for email:', email);
                    loginForm.reset();
                })
                .catch((error) => {
                    console.error('Login Error:', error.code, error.message, 'Email:', email);
                    const user = mockUsers.find(u => u.email === email && u.password === password);
                    if (user) {
                        console.log('Mock authentication successful for email:', email);
                        mockAuthentication(user.email, user.name, user.role);
                        loginForm.reset();
                    } else {
                        console.warn('Login failed for email:', email, 'No matching mock user found');
                        alert('Erreur de connexion: ' + translateAuthError(error.code));
                    }
                })
                .finally(() => {
                    isLoggingIn = false;
                    loginButton.disabled = false;
                    loginButton.textContent = 'Connexion';
                });
        } else {
            console.log('Firebase not configured, attempting mock authentication for email:', email);
            const user = mockUsers.find(u => u.email === email && u.password === password);
            if (user) {
                console.log('Mock authentication successful for email:', email);
                mockAuthentication(user.email, user.name, user.role);
                loginForm.reset();
            } else {
                console.warn('Mock login failed for email:', email, 'No matching mock user found');
                alert('Erreur de connexion: Identifiants incorrects ou Firebase non initialisé correctement. Vérifiez firebaseConfig.');
            }
            isLoggingIn = false;
            loginButton.disabled = false;
            loginButton.textContent = 'Connexion';
        }
    });
}

// Registration Form Submission
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateFormField(registerEmail, 'Veuillez entrer un email.') ||
            !isValidEmail(registerEmail.value.trim()) ||
            !validateFormField(registerPassword, 'Veuillez entrer un mot de passe.') ||
            registerPassword.value.length < 6 ||
            !validateFormField(registerName, 'Veuillez entrer un nom.') ||
            !validateFormField(registerRole, 'Veuillez sélectionner un rôle.')) {
            if (registerPassword.value.length < 6) {
                alert('Le mot de passe doit contenir au moins 6 caractères.');
                registerPassword.focus();
            }
            return;
        }

        const email = registerEmail.value.trim();
        const password = registerPassword.value;
        const name = registerName.value.trim();
        const role = registerRole.value;

        if (auth && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return user.updateProfile({ displayName: name }).then(() => {
                        return db.collection('users').doc(user.uid).set({
                            name: name,
                            role: role,
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                })
                .then(() => {
                    alert('Inscription réussie! Vous êtes maintenant connecté.');
                    registerForm.reset();
                })
                .catch((error) => {
                    console.error('Registration Error:', error.code, error.message);
                    if (mockUsers.find(u => u.email === email)) {
                        alert('Erreur: Cet email est déjà utilisé.');
                    } else {
                        mockUsers.push({ email, name, role, password });
                        mockAuthentication(email, name, role);
                        alert('Inscription réussie (mode démo)!');
                        registerForm.reset();
                    }
                });
        } else {
            if (mockUsers.find(u => u.email === email)) {
                alert('Erreur: Cet email est déjà utilisé.');
            } else {
                mockUsers.push({ email, name, role, password });
                mockAuthentication(email, name, role);
                alert('Inscription réussie (mode démo)!');
                registerForm.reset();
            }
        }
    });
}

// Password Reset Form Submission
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateFormField(forgotPasswordEmail, 'Veuillez entrer un email.') ||
            !isValidEmail(forgotPasswordEmail.value.trim())) {
            return;
        }

        const email = forgotPasswordEmail.value.trim();

        if (auth && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('Un email de réinitialisation du mot de passe a été envoyé.');
                    forgotPasswordForm.reset();
                })
                .catch((error) => {
                    console.error('Password Reset Error:', error.code, error.message);
                    if (mockUsers.find(u => u.email === email)) {
                        alert('Un email de réinitialisation a été "envoyé" (mode démo).');
                        forgotPasswordForm.reset();
                    } else {
                        alert('Erreur: Cet email n\'est pas enregistré.');
                    }
                });
        } else {
            if (mockUsers.find(u => u.email === email)) {
                alert('Un email de réinitialisation a été "envoyé" (mode démo).');
                forgotPasswordForm.reset();
            } else {
                alert('Erreur: Cet email n\'est pas enregistré.');
            }
        }
    });
}

// Translate Firebase Auth Errors
function translateAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'Cet email est déjà utilisé.';
        case 'auth/invalid-email':
            return 'Adresse email invalide.';
        case 'auth/weak-password':
            return 'Le mot de passe est trop faible (minimum 6 caractères).';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials':
            return 'Email ou mot de passe incorrect. Vérifiez la casse et le domaine (@example.com pour le mode démo).';
        case 'auth/too-many-requests':
            return 'Trop de tentatives. Veuillez réessayer plus tard.';
        case 'auth/invalid-api-key':
            return 'Clé API Firebase invalide. Vérifiez firebaseConfig.';
        default:
            return `Une erreur s'est produite: ${errorCode}. Vérifiez la console pour plus de détails.`;
    }
}

// Mock Authentication
function mockAuthentication(email, name, role) {
    currentUser = {
        email: email,
        displayName: name,
        uid: 'mock_' + email
    };
    userInfo = { role: role };
    userDisplayName.textContent = name;
    userRole.textContent = role === 'manager' ? 'Gérant' : 'Directeur';
    userRole.className = role === 'manager' ? 'badge badge-primary' : 'badge badge-warning';
    loginScreen.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    appScreen.style.display = 'flex';
    loadDashboardData('mock-auth');
    loadTransactions();
    loadExpenses();
    loadSales();
    generateCharts();
}

// Logout Function
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        isLoggingOut = true;
        if (cashFlowChartInstance) {
            cashFlowChartInstance.destroy();
            cashFlowChartInstance = null;
            console.log('Destroyed existing cashFlowChart');
        }
        if (expensesChartInstance) {
            expensesChartInstance.destroy();
            expensesChartInstance = null;
            console.log('Destroyed existing expensesChart');
        }
        if (reportChartInstance) {
            reportChartInstance.destroy();
            reportChartInstance = null;
            console.log('Destroyed existing reportChart');
        }

        if (auth) {
            auth.signOut().catch((error) => {
                console.error('Logout Error:', error);
            }).finally(() => {
                isLoggingOut = false;
            });
        } else {
            currentUser = null;
            userInfo = null;
            loginScreen.style.display = 'flex';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            forgotPasswordForm.style.display = 'none';
            appScreen.style.display = 'none';
            isLoggingOut = false;
        }
    });
}

// Load User Info
function loadUserInfo() {
    if (!db || !currentUser) {
        userInfo = { role: currentUser.role || 'manager', name: currentUser.displayName || 'Utilisateur' };
        userDisplayName.textContent = userInfo.name;
        userRole.textContent = userInfo.role === 'manager' ? 'Gérant' : 'Directeur';
        userRole.className = userInfo.role === 'manager' ? 'badge badge-primary' : 'badge badge-warning';
        return;
    }

    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists) {
                userInfo = doc.data();
                userDisplayName.textContent = currentUser.displayName || userInfo.name;
                userRole.textContent = userInfo.role === 'manager' ? 'Gérant' : 'Directeur';
                userRole.className = userInfo.role === 'manager' ? 'badge badge-primary' : 'badge badge-warning';
            } else {
                userInfo = { role: 'manager', name: currentUser.displayName || 'Utilisateur' };
                userDisplayName.textContent = userInfo.name;
                userRole.textContent = 'Gérant';
                userRole.className = 'badge badge-primary';
            }
        })
        .catch((error) => {
            console.error('Error loading user info:', error);
            userInfo = { role: 'manager', name: currentUser.displayName || 'Utilisateur' };
            userDisplayName.textContent = userInfo.name;
            userRole.textContent = 'Gérant';
            userRole.className = 'badge badge-primary';
        });
}

// Tab Navigation
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(mi => mi.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        item.classList.add('active');
        const tabId = item.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Modal Events
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        transactionModal.style.display = 'none';
        expenseModal.style.display = 'none';
        saleModal.style.display = 'none';
    });
});

cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
        transactionModal.style.display = 'none';
        expenseModal.style.display = 'none';
        saleModal.style.display = 'none';
    });
});

// Open Modals
if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => {
        transactionModal.style.display = 'flex';
        document.getElementById('transactionDate').valueAsDate = new Date();
        transactionForm.reset();
        expenseFields.style.display = 'none';
        saleFields.style.display = 'none';
    });
}

if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
        expenseModal.style.display = 'flex';
        document.getElementById('expenseDate').valueAsDate = new Date();
        expenseForm.reset();
    });
}

if (addSaleBtn) {
    addSaleBtn.addEventListener('click', () => {
        saleModal.style.display = 'flex';
        document.getElementById('saleDate').valueAsDate = new Date();
        saleForm.reset();
    });
}

// Transaction Type Change
if (transactionType) {
    transactionType.addEventListener('change', () => {
        if (transactionType.value === 'expense') {
            expenseFields.style.display = 'block';
            saleFields.style.display = 'none';
        } else if (transactionType.value === 'sale') {
            expenseFields.style.display = 'none';
            saleFields.style.display = 'block';
        } else {
            expenseFields.style.display = 'none';
            saleFields.style.display = 'none';
        }
    });
}

// Report Period Change
if (reportPeriod) {
    reportPeriod.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
        }
    });
}

// Generate Report (Placeholder)
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', () => {
        const period = reportPeriod.value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (period === 'custom' && (!startDate || !endDate)) {
            alert('Veuillez sélectionner les dates de début et de fin pour la période personnalisée.');
            return;
        }

        alert(`Génération du rapport pour ${period}${period === 'custom' ? ` de ${startDate} à ${endDate}` : ''}... (fonctionnalité à implémenter)`);
    });
}

// Transaction Form Submission
if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = transactionType.value;
        const amount = document.getElementById('transactionAmount');
        const date = document.getElementById('transactionDate');
        const description = document.getElementById('transactionDescription');

        if (!validateFormField(transactionType, 'Veuillez sélectionner un type de transaction.') ||
            !validatePositiveNumber(amount, 'Veuillez entrer un montant positif.') ||
            !validateFormField(date, 'Veuillez sélectionner une date.') ||
            !validateFormField(description, 'Veuillez entrer une description.')) {
            return;
        }

        const transaction = {
            type,
            amount: parseFloat(amount.value),
            date: date.value,
            description: description.value.trim()
        };

        if (type === 'expense') {
            const category = document.getElementById('expenseCategory');
            const vendor = document.getElementById('expenseVendor');
            if (!validateFormField(category, 'Veuillez sélectionner une catégorie.') ||
                !validateFormField(vendor, 'Veuillez spécifier le fournisseur.')) {
                return;
            }
            transaction.category = category.value;
            transaction.vendor = vendor.value.trim();
            expenses.push({ ...transaction, status: 'completed' });
        } else if (type === 'sale') {
            const unitNumber = document.getElementById('unitNumber');
            const clientName = document.getElementById('clientName');
            const totalPrice = document.getElementById('totalPrice');
            if (!validateFormField(unitNumber, 'Veuillez entrer le numéro d\'unité.') ||
                !validateFormField(clientName, 'Veuillez entrer le nom du client.') ||
                !validatePositiveNumber(totalPrice, 'Veuillez entrer un prix total positif.')) {
                return;
            }
            if (parseFloat(amount.value) > parseFloat(totalPrice.value)) {
                alert('L\'avance ne peut pas dépasser le prix total.');
                amount.focus();
                return;
            }
            transaction.unitNumber = unitNumber.value.trim();
            transaction.clientName = clientName.value.trim();
            transaction.totalPrice = parseFloat(totalPrice.value);
            sales.push({
                date: date.value,
                unitNumber: transaction.unitNumber,
                clientName: transaction.clientName,
                clientContact: '',
                totalPrice: transaction.totalPrice,
                advanceAmount: transaction.amount,
                status: 'advance',
                notes: `Avance de ${formatCurrency(transaction.amount)}`
            });
        }

        transactions.push(transaction);
        console.log('Added new transaction:', transaction);
        transactionModal.style.display = 'none';
        transactionForm.reset();
        expenseFields.style.display = 'none';
        saleFields.style.display = 'none';
        loadDashboardData('transaction-form');
        loadTransactions();
        loadExpenses();
        loadSales();
        generateCharts();
    });
}

// Expense Form Submission
if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('expenseDate');
        const description = document.getElementById('expenseDescription');
        const category = document.getElementById('expenseCategoryModal');
        const vendor = document.getElementById('expenseVendorModal');
        const amount = document.getElementById('expenseAmount');
        const status = document.getElementById('expenseStatus');

        if (!validateFormField(date, 'Veuillez sélectionner une date.') ||
            !validateFormField(description, 'Veuillez entrer une description.') ||
            !validateFormField(category, 'Veuillez sélectionner une catégorie.') ||
            !validateFormField(vendor, 'Veuillez spécifier le fournisseur.') ||
            !validatePositiveNumber(amount, 'Veuillez entrer un montant positif.') ||
            !validateFormField(status, 'Veuillez sélectionner un statut.')) {
            return;
        }

        const expense = {
            date: date.value,
            description: description.value.trim(),
            category: category.value,
            vendor: vendor.value.trim(),
            amount: parseFloat(amount.value),
            status: status.value
        };

        expenses.push(expense);
        transactions.push({
            type: 'expense',
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            category: expense.category,
            vendor: expense.vendor
        });

        console.log('Added new expense:', expense);
        expenseModal.style.display = 'none';
        expenseForm.reset();
        loadDashboardData('expense-form');
        loadTransactions();
        loadExpenses();
        generateCharts();
    });
}

// Sale Form Submission
if (saleForm) {
    saleForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('saleDate');
        const unitNumber = document.getElementById('unitNumberModal');
        const clientName = document.getElementById('clientNameModal');
        const clientContact = document.getElementById('clientContact');
        const totalPrice = document.getElementById('totalPriceModal');
        const advanceAmount = document.getElementById('advanceAmount');
        const status = document.getElementById('saleStatus');
        const notes = document.getElementById('saleNotes');

        if (!validateFormField(date, 'Veuillez sélectionner une date.') ||
            !validateFormField(unitNumber, 'Veuillez entrer le numéro d\'unité.') ||
            !validateFormField(clientName, 'Veuillez entrer le nom du client.') ||
            !validatePositiveNumber(totalPrice, 'Veuillez entrer un prix total positif.') ||
            !validatePositiveNumber(advanceAmount, 'Veuillez entrer un montant d\'avance positif.') ||
            !validateFormField(status, 'Veuillez sélectionner un statut.')) {
            return;
        }

        if (clientContact.value && !isValidEmail(clientContact.value.trim())) {
            alert('Veuillez entrer un email de contact valide ou laisser le champ vide.');
            clientContact.focus();
            return;
        }

        if (parseFloat(advanceAmount.value) > parseFloat(totalPrice.value)) {
            alert('L\'avance ne peut pas dépasser le prix total.');
            advanceAmount.focus();
            return;
        }

        const sale = {
            date: date.value,
            unitNumber: unitNumber.value.trim(),
            clientName: clientName.value.trim(),
            clientContact: clientContact.value.trim(),
            totalPrice: parseFloat(totalPrice.value),
            advanceAmount: parseFloat(advanceAmount.value),
            status: status.value,
            notes: notes.value.trim()
        };

        sales.push(sale);
        transactions.push({
            type: 'sale',
            amount: sale.advanceAmount,
            date: sale.date,
            description: `Avance pour plateau ${sale.unitNumber}`,
            unitNumber: sale.unitNumber,
            clientName: sale.clientName,
            totalPrice: sale.totalPrice
        });

        console.log('Added new sale:', sale);
        saleModal.style.display = 'none';
        saleForm.reset();
        loadDashboardData('sale-form');
        loadTransactions();
        loadSales();
        generateCharts();
    });
}

// Utility Functions
function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) {
        console.warn('Invalid amount in formatCurrency:', amount);
        return '0 MAD';
    }
    return amount.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function hashData(data) {
    return JSON.stringify(data).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0) | 0, 0).toString();
}

// Generate Sample Data
function generateSampleData() {
    console.log('Generating initial sample data');
    transactions.push(
        {
            type: 'funding',
            amount: 500000,
            date: '2023-10-01',
            description: 'Financement initial'
        },
        {
            type: 'expense',
            amount: 150000,
            date: '2023-10-05',
            description: 'Achat de matériaux',
            category: 'materials',
            vendor: 'Ciment Maroc'
        },
        {
            type: 'sale',
            amount: 100000,
            date: '2023-10-10',
            description: 'Avance pour plateau B-204',
            unitNumber: 'B-204',
            clientName: 'Mohammed Alaoui',
            totalPrice: 800000
        }
    );

    expenses.push(
        {
            date: '2023-10-05',
            description: 'Achat de matériaux',
            category: 'materials',
            vendor: 'Ciment Maroc',
            amount: 150000,
            status: 'completed'
        },
        {
            date: '2023-10-07',
            description: 'Salaire des ouvriers',
            category: 'labor',
            vendor: 'Équipe de construction',
            amount: 80000,
            status: 'completed'
        }
    );

    sales.push(
        {
            date: '2023-10-10',
            unitNumber: 'B-204',
            clientName: 'Mohammed Alaoui',
            clientContact: 'mohammed@example.com',
            totalPrice: 800000,
            advanceAmount: 100000,
            status: 'advance',
            notes: 'Avance initiale'
        },
        {
            date: '2023-10-12',
            unitNumber: 'B-305',
            clientName: 'Fatima Zahra',
            clientContact: 'fatima@example.com',
            totalPrice: 900000,
            advanceAmount: 150000,
            status: 'reserved',
            notes: 'Réservation'
        }
    );

    console.log('Generated sample data:', JSON.stringify({ transactions, expenses, sales }, null, 2));
}

// Debounced Dashboard Load
function loadDashboardData(source = 'unknown') {
    if (isLoggingOut) {
        console.log(`loadDashboardData skipped: logout in progress (source: ${source})`);
        return;
    }

    const now = Date.now();
    const lastLoad = getLastDashboardLoad();
    if (now - lastLoad < 2000) {
        console.log(`loadDashboardData throttled: last call ${now - lastLoad}ms ago (source: ${source})`);
        return;
    }

    if (hasLoadedDashboard() && source === 'auth') {
        console.log(`loadDashboardData skipped: dashboard already loaded in session (source: ${source})`);
        return;
    }

    setLastDashboardLoad(now);
    setHasLoadedDashboard(true);
    console.log(`Loading dashboard data at ${new Date().toISOString()} (source: ${source})`);

    // Generate sample data only on first load when arrays are empty
    if (source === 'auth' && transactions.length === 0 && expenses.length === 0 && sales.length === 0) {
        generateSampleData();
    } else {
        console.log(`Skipping generateSampleData: data already exists (source: ${source})`);
    }

    let fundingTotal = 0;
    let expenseTotal = 0;
    let salesTotal = 0;
    let unitsSold = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'funding' && !isNaN(transaction.amount)) {
            fundingTotal += transaction.amount;
        }
    });

    expenses.forEach(expense => {
        if (expense.status !== 'canceled' && !isNaN(expense.amount)) {
            expenseTotal += expense.amount;
        }
    });

    sales.forEach(sale => {
        if (!isNaN(sale.advanceAmount)) {
            salesTotal += sale.advanceAmount;
        }
        if (sale.status === 'sold') {
            unitsSold++;
        }
    });

    currentBalance.textContent = formatCurrency(fundingTotal + salesTotal - expenseTotal);
    totalFunding.textContent = formatCurrency(fundingTotal);
    totalExpenses.textContent = formatCurrency(expenseTotal);
    totalSales.textContent = formatCurrency(salesTotal);
    totalUnitsSold.textContent = unitsSold;

    loadRecentActivities();
}

// Load Recent Activities
function loadRecentActivities() {
    const allActivities = [];

    transactions.forEach(transaction => {
        if (!isNaN(transaction.amount)) {
            allActivities.push({
                date: transaction.date,
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type
            });
        } else {
            console.warn('Skipping invalid transaction:', transaction);
        }
    });

    expenses.forEach(expense => {
        if (!isNaN(expense.amount)) {
            allActivities.push({
                date: expense.date,
                description: expense.description,
                amount: -expense.amount,
                type: 'expense'
            });
        } else {
            console.warn('Skipping invalid expense:', expense);
        }
    });

    sales.forEach(sale => {
        if (!isNaN(sale.advanceAmount)) {
            allActivities.push({
                date: sale.date,
                description: `Avance pour plateau ${sale.unitNumber} par ${sale.clientName}`,
                amount: sale.advanceAmount,
                type: 'sale'
            });
        } else {
            console.warn('Skipping invalid sale:', sale);
        }
    });

    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivities = allActivities.slice(0, 5);

    recentActivitiesTable.innerHTML = '';

    recentActivities.forEach(activity => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(activity.date);
        row.appendChild(dateCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = activity.description;
        row.appendChild(descriptionCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(activity.amount);
        amountCell.style.color = activity.amount >= 0 ? 'var(--success-color)' : 'var(--accent-color)';
        row.appendChild(amountCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = activity.type === 'funding' ? 'Financement' :
                               activity.type === 'expense' ? 'Dépense' :
                               'Vente';
        row.appendChild(typeCell);

        recentActivitiesTable.appendChild(row);
    });
}

// Load Transactions
function loadTransactions() {
    const transactionsTable = document.getElementById('transactionsTable');
    transactionsTable.innerHTML = '';

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach((transaction, index) => {
        if (isNaN(transaction.amount)) {
            console.warn('Skipping invalid transaction in table:', transaction);
            return;
        }

        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = transaction.description;
        row.appendChild(descriptionCell);

        const fromCell = document.createElement('td');
        fromCell.textContent = transaction.type === 'sale' ? transaction.clientName || '-' : '-';
        row.appendChild(fromCell);

        const toCell = document.createElement('td');
        toCell.textContent = transaction.type === 'expense' ? transaction.vendor || '-' : '-';
        row.appendChild(toCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        row.appendChild(amountCell);

        const typeCell = document.createElement('td');
        const typeSpan = document.createElement('span');
        let typeText = '';
        let typeClass = '';
        switch (transaction.type) {
            case 'funding':
                typeText = 'Financement';
                typeClass = 'status status-completed';
                break;
            case 'expense':
                typeText = 'Dépense';
                typeClass = 'status status-canceled';
                break;
            case 'sale':
                typeText = 'Vente';
                typeClass = 'status status-pending';
                break;
            default:
                typeText = transaction.type;
                typeClass = 'status';
        }
        typeSpan.textContent = typeText;
        typeSpan.className = typeClass;
        typeCell.appendChild(typeSpan);
        row.appendChild(typeCell);

        const actionsCell = document.createElement('td');

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-primary';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.setAttribute('data-id', index);
        viewBtn.addEventListener('click', () => viewTransaction(transaction));
        actionsCell.appendChild(viewBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-success';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.marginLeft = '5px';
        editBtn.setAttribute('data-id', index);
        editBtn.addEventListener('click', () => editTransaction(transaction));
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.setAttribute('data-id', index);
        deleteBtn.addEventListener('click', () => deleteTransaction(index));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);
        transactionsTable.appendChild(row);
    });
}

// Load Expenses
function loadExpenses() {
    const expensesTable = document.getElementById('expensesTable');
    expensesTable.innerHTML = '';

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach((expense, index) => {
        if (isNaN(expense.amount)) {
            console.warn('Skipping invalid expense in table:', expense);
            return;
        }

        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(expense.date);
        row.appendChild(dateCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = expense.description;
        row.appendChild(descriptionCell);

        const categoryCell = document.createElement('td');
        const categoryText = expense.category === 'materials' ? 'Matériaux' :
                             expense.category === 'labor' ? 'Main d\'œuvre' :
                             expense.category === 'equipment' ? 'Équipement' :
                             expense.category === 'services' ? 'Services' :
                             expense.category === 'other' ? 'Autres' : expense.category;
        categoryCell.textContent = categoryText;
        row.appendChild(categoryCell);

        const vendorCell = document.createElement('td');
        vendorCell.textContent = expense.vendor;
        row.appendChild(vendorCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(expense.amount);
        row.appendChild(amountCell);

        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        let statusText = '';
        let statusClass = '';
        switch (expense.status) {
            case 'pending':
                statusText = 'En attente';
                statusClass = 'status status-pending';
                break;
            case 'completed':
                statusText = 'Complété';
                statusClass = 'status status-completed';
                break;
            case 'canceled':
                statusText = 'Annulé';
                statusClass = 'status status-canceled';
                break;
            default:
                statusText = expense.status;
                statusClass = 'status';
        }
        statusSpan.textContent = statusText;
        statusSpan.className = statusClass;
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);

        const actionsCell = document.createElement('td');

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-primary';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.setAttribute('data-id', index);
        viewBtn.addEventListener('click', () => viewExpense(expense));
        actionsCell.appendChild(viewBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-success';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.marginLeft = '5px';
        editBtn.setAttribute('data-id', index);
        editBtn.addEventListener('click', () => editExpense(expense));
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.setAttribute('data-id', index);
        deleteBtn.addEventListener('click', () => deleteExpense(index));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);
        expensesTable.appendChild(row);
    });
}

// Load Sales
function loadSales() {
    const salesTable = document.getElementById('salesTable');
    salesTable.innerHTML = '';

    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSales.forEach((sale, index) => {
        if (isNaN(sale.totalPrice) || isNaN(sale.advanceAmount)) {
            console.warn('Skipping invalid sale in table:', sale);
            return;
        }

        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(sale.date);
        row.appendChild(dateCell);

        const unitCell = document.createElement('td');
        unitCell.textContent = sale.unitNumber;
        row.appendChild(unitCell);

        const clientCell = document.createElement('td');
        clientCell.textContent = sale.clientName;
        row.appendChild(clientCell);

        const totalPriceCell = document.createElement('td');
        totalPriceCell.textContent = formatCurrency(sale.totalPrice);
        row.appendChild(totalPriceCell);

        const advanceCell = document.createElement('td');
        advanceCell.textContent = formatCurrency(sale.advanceAmount);
        row.appendChild(advanceCell);

        const remainingCell = document.createElement('td');
        remainingCell.textContent = formatCurrency(sale.totalPrice - sale.advanceAmount);
        row.appendChild(remainingCell);

        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        let statusText = '';
        let statusClass = '';
        switch (sale.status) {
            case 'reserved':
                statusText = 'Réservé';
                statusClass = 'status status-pending';
                break;
            case 'advance':
                statusText = 'Avancé';
                statusClass = 'status status-pending';
                break;
            case 'sold':
                statusText = 'Vendu';
                statusClass = 'status status-completed';
                break;
            default:
                statusText = sale.status;
                statusClass = 'status';
        }
        statusSpan.textContent = statusText;
        statusSpan.className = statusClass;
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);

        const actionsCell = document.createElement('td');

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-primary';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.setAttribute('data-id', index);
        viewBtn.addEventListener('click', () => viewSale(sale));
        actionsCell.appendChild(viewBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-success';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.marginLeft = '5px';
        editBtn.setAttribute('data-id', index);
        editBtn.addEventListener('click', () => editSale(sale));
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.setAttribute('data-id', index);
        deleteBtn.addEventListener('click', () => deleteSale(index));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);
        salesTable.appendChild(row);
    });
}

// Generate Charts
function generateCharts() {
    const data = { transactions, expenses, sales };
    const currentHash = hashData(data);
    if (lastDataHash === currentHash && cashFlowChartInstance && expensesChartInstance && reportChartInstance) {
        console.log(`generateCharts skipped: data unchanged (hash: ${currentHash})`);
        return;
    }
    lastDataHash = currentHash;

    console.log(`Generating charts at ${new Date().toISOString()}`);
    try {
        if (cashFlowChartInstance || expensesChartInstance || reportChartInstance) {
            console.log('Existing charts detected, destroying before recreation');
            if (cashFlowChartInstance) {
                cashFlowChartInstance.destroy();
                cashFlowChartInstance = null;
                console.log('Destroyed existing cashFlowChart');
            }
            if (expensesChartInstance) {
                expensesChartInstance.destroy();
                expensesChartInstance = null;
                console.log('Destroyed existing expensesChart');
            }
            if (reportChartInstance) {
                reportChartInstance.destroy();
                reportChartInstance = null;
                console.log('Destroyed existing reportChart');
            }
        }

        const cashFlowCtx = document.getElementById('cashFlowChart').getContext('2d');
        const expensesCtx = document.getElementById('expensesChart').getContext('2d');
        const reportCtx = document.getElementById('reportChart').getContext('2d');

        // Prepare data for charts
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const currentMonth = new Date().getMonth();
        const last6Months = months.slice(Math.max(currentMonth - 5, 0), currentMonth + 1);
        const fundingData = new Array(6).fill(0);
        const expenseData = new Array(6).fill(0);
        const salesData = new Array(6).fill(0);

        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthIndex = date.getMonth();
            const monthDiff = currentMonth - monthIndex;
            if (monthDiff >= 0 && monthDiff < 6 && !isNaN(t.amount)) {
                const index = 5 - monthDiff;
                if (t.type === 'funding') fundingData[index] += t.amount;
                if (t.type === 'expense') expenseData[index] += t.amount;
                if (t.type === 'sale') salesData[index] += t.amount;
            }
        });

        const expenseCategories = {};
        expenses.forEach(e => {
            if (e.status !== 'canceled' && !isNaN(e.amount)) {
                expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
            }
        });
        const expenseLabels = Object.keys(expenseCategories);
        const expenseValues = Object.values(expenseCategories);

        const weeklyData = { funding: [0, 0, 0, 0], expenses: [0, 0, 0, 0], sales: [0, 0, 0, 0] };
        const now = new Date();
        transactions.forEach(t => {
            const date = new Date(t.date);
            const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 28 && !isNaN(t.amount)) {
                const weekIndex = Math.floor(daysDiff / 7);
                if (t.type === 'funding') weeklyData.funding[weekIndex] += t.amount;
                if (t.type === 'expense') weeklyData.expenses[weekIndex] += t.amount;
                if (t.type === 'sale') weeklyData.sales[weekIndex] += t.amount;
            }
        });

        cashFlowChartInstance = new Chart(cashFlowCtx, {
            type: 'line',
            data: {
                labels: last6Months,
                datasets: [
                    {
                        label: 'Financement',
                        data: fundingData,
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: 'Dépenses',
                        data: expenseData,
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: 'Ventes',
                        data: salesData,
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Flux de trésorerie des 6 derniers mois' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' MAD';
                            }
                        }
                    }
                }
            }
        });
        console.log('Created new cashFlowChart');

        expensesChartInstance = new Chart(expensesCtx, {
            type: 'doughnut',
            data: {
                labels: expenseLabels.length ? expenseLabels : ['Matériaux', 'Main d\'œuvre', 'Équipement', 'Services', 'Autres'],
                datasets: [{
                    data: expenseValues.length ? expenseValues : [1, 1, 1, 1, 1],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(243, 156, 18, 0.7)',
                        'rgba(231, 76, 60, 0.7)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(155, 89, 182, 1)',
                        'rgba(243, 156, 18, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Répartition des dépenses par catégorie' }
                }
            }
        });
        console.log('Created new expensesChart');

        reportChartInstance = new Chart(reportCtx, {
            type: 'bar',
            data: {
                labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
                datasets: [
                    {
                        label: 'Financements',
                        data: weeklyData.funding,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Dépenses',
                        data: weeklyData.expenses,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ventes',
                        data: weeklyData.sales,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Activités financières par semaine ce mois-ci' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' MAD';
                            }
                        }
                    }
                }
            }
        });
        console.log('Created new reportChart');
    } catch (error) {
        console.error('Error generating charts:', error);
        console.warn('Chart generation failed, continuing without charts.');
    }
}

// View Functions (Placeholder)
function viewTransaction(transaction) {
    alert('Détails de la transaction:\n' + JSON.stringify(transaction, null, 2));
}

function viewExpense(expense) {
    alert('Détails de la dépense:\n' + JSON.stringify(expense, null, 2));
}

function viewSale(sale) {
    alert('Détails de la vente:\n' + JSON.stringify(sale, null, 2));
}

// Edit Functions (Placeholder)
function editTransaction(transaction) {
    alert('Fonctionnalité de modification à implémenter');
}

function editExpense(expense) {
    alert('Fonctionnalité de modification à implémenter');
}

function editSale(sale) {
    alert('Fonctionnalité de modification à implémenter');
}

// Delete Functions
function deleteTransaction(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction?')) {
        const deleted = transactions.splice(index, 1)[0];
        console.log('Deleted transaction:', deleted);
        loadDashboardData('delete-transaction');
        loadTransactions();
    }
}

function deleteExpense(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense?')) {
        const deleted = expenses.splice(index, 1)[0];
        console.log('Deleted expense:', deleted);
        loadDashboardData('delete-expense');
        loadExpenses();
    }
}

function deleteSale(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vente?')) {
        const deleted = sales.splice(index, 1)[0];
        console.log('Deleted sale:', deleted);
        loadDashboardData('delete-sale');
        loadSales();
    }
}