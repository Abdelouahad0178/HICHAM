// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB056AnQrA8FNDNMzjtno5W3-Bh9EqMb1Y",
  authDomain: "gestionhichamo.firebaseapp.com",
  projectId: "gestionhichamo",
  storageBucket: "gestionhichamo.firebasestorage.app",
  messagingSenderId: "957376167296",
  appId: "1:957376167296:web:32aac03d0de9bc60cc9565",
  measurementId: "G-DQS80K79RQ"
};

// Initialisation Firebase
let db, auth;
try {
    const firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebaseApp.auth();
    db = firebaseApp.firestore();
    
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    console.log('Firebase initialisé avec succès');
} catch (error) {
    console.error('Erreur d\'initialisation Firebase:', error);
    alert('Erreur de connexion à la base de données. Veuillez réessayer.');
}

// Références aux collections Firestore
const usersRef = db?.collection('users');
const fundingsRef = db?.collection('fundings');
const expensesRef = db?.collection('expenses');
const salesRef = db?.collection('sales');

// Éléments DOM
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    appScreen: document.getElementById('appScreen'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    forgotPasswordForm: document.getElementById('forgotPasswordForm'),
    fundingForm: document.getElementById('fundingForm'),
    expenseForm: document.getElementById('expenseForm'),
    saleForm: document.getElementById('saleForm'),
    userDisplayName: document.getElementById('userDisplayName'),
    userRole: document.getElementById('userRole'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerName: document.getElementById('registerName'),
    registerRole: document.getElementById('registerRole'),
    forgotPasswordEmail: document.getElementById('forgotPasswordEmail'),
    showRegisterForm: document.getElementById('showRegisterForm'),
    showLoginForm: document.getElementById('showLoginForm'),
    showLoginFormFromForgot: document.getElementById('showLoginFormFromForgot'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    fundingModal: document.getElementById('fundingModal'),
    expenseModal: document.getElementById('expenseModal'),
    saleModal: document.getElementById('saleModal'),
    addFundingBtn: document.getElementById('addFundingBtn'),
    addExpenseBtn: document.getElementById('addExpenseBtn'),
    addSaleBtn: document.getElementById('addSaleBtn'),
    currentBalance: document.getElementById('currentBalance'),
    totalFunding: document.getElementById('totalFunding'),
    totalExpenses: document.getElementById('totalExpenses'),
    totalSales: document.getElementById('totalSales'),
    totalUnitsSold: document.getElementById('totalUnitsSold'),
    fundingsTable: document.getElementById('fundingsTable'),
    expensesTable: document.getElementById('expensesTable'),
    salesTable: document.getElementById('salesTable'),
    recentActivitiesTable: document.getElementById('recentActivitiesTable'),
    reportPeriod: document.getElementById('reportPeriod'),
    customDateRange: document.getElementById('customDateRange'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    menuItems: document.querySelectorAll('.menu-item'),
    tabContents: document.querySelectorAll('.tab-content'),
    currentTabTitle: document.getElementById('currentTabTitle')
};

// Variables globales
let currentUser = null;
let userData = null;
const charts = {
    cashFlow: null,
    expenses: null,
    report: null
};

// Écouteur d'état d'authentification
auth?.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData(user.uid);
        showAppScreen();
        loadInitialData();
    } else {
        showLoginScreen();
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    try {
        const doc = await usersRef.doc(userId).get();
        if (doc.exists) {
            userData = doc.data();
            updateUserUI();
        } else {
            await createUserProfile(currentUser);
        }
    } catch (error) {
        console.error('Erreur de chargement des données utilisateur:', error);
        userData = {
            name: currentUser.displayName || 'Utilisateur',
            role: 'manager'
        };
        updateUserUI();
    }
}

// Création du profil utilisateur
async function createUserProfile(user) {
    try {
        const userProfile = {
            name: user.displayName || 'Utilisateur',
            email: user.email,
            role: 'manager',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await usersRef.doc(user.uid).set(userProfile);
        userData = userProfile;
        updateUserUI();
    } catch (error) {
        console.error('Erreur de création du profil:', error);
    }
}

// Mise à jour de l'interface utilisateur
function updateUserUI() {
    if (!userData) return;
    
    elements.userDisplayName.textContent = userData.name;
    elements.userRole.textContent = userData.role === 'manager' ? 'Gérant' : 'Directeur';
    elements.userRole.className = `badge ${userData.role === 'manager' ? 'badge-primary' : 'badge-warning'}`;
}

// Affichage des écrans
function showAppScreen() {
    elements.loginScreen.style.display = 'none';
    elements.appScreen.style.display = 'flex';
}

function showLoginScreen() {
    elements.appScreen.style.display = 'none';
    elements.loginScreen.style.display = 'flex';
    elements.loginForm.style.display = 'block';
    elements.registerForm.style.display = 'none';
    elements.forgotPasswordForm.style.display = 'none';
}

// Navigation entre formulaires d'authentification
elements.showRegisterForm?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.style.display = 'none';
    elements.registerForm.style.display = 'block';
});

elements.showLoginForm?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.registerForm.style.display = 'none';
    elements.loginForm.style.display = 'block';
});

elements.forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.style.display = 'none';
    elements.forgotPasswordForm.style.display = 'block';
});

elements.showLoginFormFromForgot?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.forgotPasswordForm.style.display = 'none';
    elements.loginForm.style.display = 'block';
});

// Gestion de l'authentification
elements.loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        handleAuthError(error);
    }
});

elements.registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    const name = elements.registerName.value.trim();
    const role = elements.registerRole.value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        
        await usersRef.doc(userCredential.user.uid).set({
            name,
            email,
            role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Inscription réussie! Vous êtes maintenant connecté.');
        elements.registerForm.reset();
    } catch (error) {
        handleAuthError(error);
    }
});

elements.forgotPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = elements.forgotPasswordEmail.value.trim();
    
    try {
        await auth.sendPasswordResetEmail(email);
        alert('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.');
        elements.forgotPasswordForm.reset();
        elements.forgotPasswordForm.style.display = 'none';
        elements.loginForm.style.display = 'block';
    } catch (error) {
        handleAuthError(error);
    }
});

// Gestion des erreurs d'authentification
function handleAuthError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
        'auth/user-not-found': 'Aucun utilisateur trouvé avec cet email.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.'
    };
    
    alert(errorMessages[error.code] || 'Erreur d\'authentification: ' + error.message);
}

// Gestion des modales
function openModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fermer les modales avec le bouton close ou cancel
document.querySelectorAll('.modal .close, .modal .cancelBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
        modal.querySelector('form')?.reset();
    });
});

// Fermer la modale en cliquant à l'extérieur
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
        e.target.querySelector('form')?.reset();
    }
});

// Fonctions pour remplir les formulaires avec des données existantes
function fillFundingForm(funding) {
    document.getElementById('fundingAmount').value = funding.amount;
    document.getElementById('fundingDate').value = funding.date?.split('T')[0] || new Date().toISOString().split('T')[0];
    document.getElementById('fundingDescription').value = funding.description || '';
}

function fillExpenseForm(expense) {
    document.getElementById('expenseDate').value = expense.date?.split('T')[0] || new Date().toISOString().split('T')[0];
    document.getElementById('expenseDescription').value = expense.description || '';
    document.getElementById('expenseCategoryModal').value = expense.category || 'materiel';
    document.getElementById('expenseVendorModal').value = expense.vendor || '';
    document.getElementById('expenseAmount').value = expense.amount || '';
    document.getElementById('expenseStatus').value = expense.status || 'pending';
}

function fillSaleForm(sale) {
    document.getElementById('saleDate').value = sale.date?.split('T')[0] || new Date().toISOString().split('T')[0];
    document.getElementById('unitNumberModal').value = sale.unitNumber || '';
    document.getElementById('clientNameModal').value = sale.clientName || '';
    document.getElementById('clientContact').value = sale.clientContact || '';
    document.getElementById('totalPriceModal').value = sale.totalPrice || '';
    document.getElementById('advanceAmount').value = sale.advanceAmount || '';
    document.getElementById('saleStatus').value = sale.status || 'reserved';
    document.getElementById('saleNotes').value = sale.notes || '';
}

// Gestion des financements
elements.addFundingBtn?.addEventListener('click', () => {
    openModal(elements.fundingModal);
    elements.fundingForm.reset();
    document.getElementById('fundingDate').valueAsDate = new Date();
});

elements.fundingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fundingId = elements.fundingForm.dataset.editId;
    const fundingData = {
        amount: parseFloat(document.getElementById('fundingAmount').value),
        date: document.getElementById('fundingDate').value,
        description: document.getElementById('fundingDescription').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (fundingId) {
            await fundingsRef.doc(fundingId).update(fundingData);
            alert('Financement modifié avec succès.');
        } else {
            await fundingsRef.add({
                ...fundingData,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Financement ajouté avec succès.');
        }
        
        elements.fundingForm.reset();
        delete elements.fundingForm.dataset.editId;
        closeModal(elements.fundingModal);
        loadInitialData();
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de ${fundingId ? 'la modification' : 'l\'ajout'} du financement.`);
    }
});

async function loadFundings() {
    try {
        const snapshot = await fundingsRef
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
            
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur de chargement des financements:', error);
        return [];
    }
}

// Gestion des dépenses
elements.addExpenseBtn?.addEventListener('click', () => {
    openModal(elements.expenseModal);
    elements.expenseForm.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    delete elements.expenseForm.dataset.editId;
});

elements.expenseForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const expenseId = elements.expenseForm.dataset.editId;
    const expenseData = {
        date: document.getElementById('expenseDate').value,
        description: document.getElementById('expenseDescription').value,
        category: document.getElementById('expenseCategoryModal').value,
        vendor: document.getElementById('expenseVendorModal').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        status: document.getElementById('expenseStatus').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (expenseId) {
            await expensesRef.doc(expenseId).update(expenseData);
            alert('Dépense modifiée avec succès.');
        } else {
            await expensesRef.add({
                ...expenseData,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Dépense ajoutée avec succès.');
        }
        
        elements.expenseForm.reset();
        delete elements.expenseForm.dataset.editId;
        closeModal(elements.expenseModal);
        loadInitialData();
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de ${expenseId ? 'la modification' : 'l\'ajout'} de la dépense.`);
    }
});

async function loadExpenses() {
    try {
        const snapshot = await expensesRef
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
            
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur de chargement des dépenses:', error);
        return [];
    }
}

// Gestion des ventes
elements.addSaleBtn?.addEventListener('click', () => {
    openModal(elements.saleModal);
    elements.saleForm.reset();
    document.getElementById('saleDate').valueAsDate = new Date();
    delete elements.saleForm.dataset.editId;
});

elements.saleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saleId = elements.saleForm.dataset.editId;
    const saleData = {
        date: document.getElementById('saleDate').value,
        unitNumber: document.getElementById('unitNumberModal').value,
        clientName: document.getElementById('clientNameModal').value,
        clientContact: document.getElementById('clientContact').value,
        totalPrice: parseFloat(document.getElementById('totalPriceModal').value),
        advanceAmount: parseFloat(document.getElementById('advanceAmount').value),
        status: document.getElementById('saleStatus').value,
        notes: document.getElementById('saleNotes').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (saleId) {
            await salesRef.doc(saleId).update(saleData);
            alert('Vente modifiée avec succès.');
        } else {
            await salesRef.add({
                ...saleData,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Vente ajoutée avec succès.');
        }
        
        elements.saleForm.reset();
        delete elements.saleForm.dataset.editId;
        closeModal(elements.saleModal);
        loadInitialData();
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de ${saleId ? 'la modification' : 'l\'ajout'} de la vente.`);
    }
});

async function loadSales() {
    try {
        const snapshot = await salesRef
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
            
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur de chargement des ventes:', error);
        return [];
    }
}

// Chargement initial des données
async function loadInitialData() {
    try {
        const [fundings, expenses, sales] = await Promise.all([
            loadFundings(),
            loadExpenses(),
            loadSales()
        ]);
        
        updateDashboard(fundings, expenses, sales);
        renderFundingsTable(fundings);
        renderExpensesTable(expenses);
        renderSalesTable(sales);
        renderRecentActivities(fundings, expenses, sales);
        generateCharts(fundings, expenses, sales);
    } catch (error) {
        console.error('Erreur de chargement des données:', error);
    }
}

// Mise à jour du tableau de bord
function updateDashboard(fundings, expenses, sales) {
    const fundingTotal = fundings.reduce((sum, f) => sum + (f.amount || 0), 0);
        
    const expenseTotal = expenses
        .filter(e => e.status !== 'canceled')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
        
    const salesTotal = sales
        .filter(s => s.status === 'sold')
        .reduce((sum, s) => sum + (s.advanceAmount || 0), 0);
        
    const unitsSold = sales.filter(s => s.status === 'sold').length;
    
    elements.currentBalance.textContent = formatCurrency(fundingTotal + salesTotal - expenseTotal);
    elements.totalFunding.textContent = formatCurrency(fundingTotal);
    elements.totalExpenses.textContent = formatCurrency(expenseTotal);
    elements.totalSales.textContent = formatCurrency(salesTotal);
    elements.totalUnitsSold.textContent = unitsSold;
}

// Rendu des tableaux
function renderFundingsTable(fundings) {
    elements.fundingsTable.innerHTML = '';
    fundings.forEach(f => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(f.date)}</td>
            <td>${f.description || '-'}</td>
            <td>${formatCurrency(f.amount)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary edit-funding" data-id="${f.id}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-sm btn-danger delete-funding" data-id="${f.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        `;
        elements.fundingsTable.appendChild(row);
    });

    // Écouteurs pour les boutons de modification
    document.querySelectorAll('.edit-funding').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            try {
                const doc = await fundingsRef.doc(id).get();
                if (doc.exists) {
                    fillFundingForm(doc.data());
                    elements.fundingForm.dataset.editId = id;
                    openModal(elements.fundingModal);
                }
            } catch (error) {
                console.error('Erreur de chargement:', error);
                alert('Erreur lors du chargement du financement.');
            }
        });
    });

    // Écouteurs pour les boutons de suppression
    document.querySelectorAll('.delete-funding').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Voulez-vous vraiment supprimer ce financement ?')) {
                try {
                    await fundingsRef.doc(id).delete();
                    loadInitialData();
                } catch (error) {
                    console.error('Erreur de suppression:', error);
                    alert('Erreur lors de la suppression du financement.');
                }
            }
        });
    });
}

function renderExpensesTable(expenses) {
    elements.expensesTable.innerHTML = '';
    expenses.forEach(e => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(e.date)}</td>
            <td>${e.description || '-'}</td>
            <td>${e.category || '-'}</td>
            <td>${e.vendor || '-'}</td>
            <td>${formatCurrency(e.amount)}</td>
            <td><span class="status status-${e.status}">${getStatusText(e.status)}</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-primary edit-expense" data-id="${e.id}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-sm btn-danger delete-expense" data-id="${e.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        `;
        elements.expensesTable.appendChild(row);
    });

    // Écouteurs pour les boutons de modification
    document.querySelectorAll('.edit-expense').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            try {
                const doc = await expensesRef.doc(id).get();
                if (doc.exists) {
                    fillExpenseForm(doc.data());
                    elements.expenseForm.dataset.editId = id;
                    openModal(elements.expenseModal);
                }
            } catch (error) {
                console.error('Erreur de chargement:', error);
                alert('Erreur lors du chargement de la dépense.');
            }
        });
    });

    // Écouteurs pour les boutons de suppression
    document.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
                try {
                    await expensesRef.doc(id).delete();
                    loadInitialData();
                } catch (error) {
                    console.error('Erreur de suppression:', error);
                    alert('Erreur lors de la suppression de la dépense.');
                }
            }
        });
    });
}

function renderSalesTable(sales) {
    elements.salesTable.innerHTML = '';
    sales.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(s.date)}</td>
            <td>${s.unitNumber || '-'}</td>
            <td>${s.clientName || '-'}</td>
            <td>${formatCurrency(s.totalPrice)}</td>
            <td>${formatCurrency(s.advanceAmount)}</td>
            <td>${formatCurrency((s.totalPrice || 0) - (s.advanceAmount || 0))}</td>
            <td><span class="status status-${s.status}">${getStatusText(s.status)}</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-primary edit-sale" data-id="${s.id}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-sm btn-danger delete-sale" data-id="${s.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        `;
        elements.salesTable.appendChild(row);
    });

    // Écouteurs pour les boutons de modification
    document.querySelectorAll('.edit-sale').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            try {
                const doc = await salesRef.doc(id).get();
                if (doc.exists) {
                    fillSaleForm(doc.data());
                    elements.saleForm.dataset.editId = id;
                    openModal(elements.saleModal);
                }
            } catch (error) {
                console.error('Erreur de chargement:', error);
                alert('Erreur lors du chargement de la vente.');
            }
        });
    });

    // Écouteurs pour les boutons de suppression
    document.querySelectorAll('.delete-sale').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Voulez-vous vraiment supprimer cette vente ?')) {
                try {
                    await salesRef.doc(id).delete();
                    loadInitialData();
                } catch (error) {
                    console.error('Erreur de suppression:', error);
                    alert('Erreur lors de la suppression de la vente.');
                }
            }
        });
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'paid': 'Payé',
        'canceled': 'Annulé',
        'reserved': 'Réservé',
        'sold': 'Vendu',
        'completed': 'Terminé'
    };
    return statusMap[status] || status;
}

function renderRecentActivities(fundings, expenses, sales) {
    const activities = [
        ...fundings.map(f => ({
            date: f.date || f.createdAt?.toDate(),
            description: f.description || 'Financement',
            amount: f.amount,
            type: 'funding'
        })),
        ...expenses.map(e => ({
            date: e.date || e.createdAt?.toDate(),
            description: e.description || `Dépense ${e.category}`,
            amount: e.amount,
            type: 'expense'
        })),
        ...sales.map(s => ({
            date: s.date || s.createdAt?.toDate(),
            description: `Vente: ${s.unitNumber || 'N/A'} à ${s.clientName || 'Anonyme'}`,
            amount: s.advanceAmount,
            type: 'sale'
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    elements.recentActivitiesTable.innerHTML = '';
    activities.forEach(a => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(a.date)}</td>
            <td>${a.description}</td>
            <td>${formatCurrency(a.amount)}</td>
            <td>${a.type}</td>
        `;
        elements.recentActivitiesTable.appendChild(row);
    });
}

// Gestion des graphiques
function generateCharts(fundings, expenses, sales) {
    // Graphique de flux de trésorerie
    if (charts.cashFlow) charts.cashFlow.destroy();
    const cashFlowCtx = document.getElementById('cashFlowChart').getContext('2d');
    
    // Grouper par mois
    const monthlyData = [...fundings, ...expenses, ...sales].reduce((acc, item) => {
        const date = new Date(item.date || item.createdAt?.toDate());
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
            acc[monthYear] = { in: 0, out: 0 };
        }
        
        if ('amount' in item && !('category' in item)) { // Financement
            acc[monthYear].in += item.amount || 0;
        } else if ('advanceAmount' in item) { // Vente
            acc[monthYear].in += item.advanceAmount || 0;
        } else { // Dépense
            acc[monthYear].out += item.amount || 0;
        }
        
        return acc;
    }, {});

    // Trier les mois chronologiquement
    const sortedMonths = Object.keys(monthlyData).sort();
    
    charts.cashFlow = new Chart(cashFlowCtx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => formatMonthYear(month)),
            datasets: [
                {
                    label: 'Entrées',
                    data: sortedMonths.map(month => monthlyData[month].in),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Sorties',
                    data: sortedMonths.map(month => monthlyData[month].out),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Flux de trésorerie mensuel'
                }
            },
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Mois' 
                    } 
                },
                y: { 
                    title: { 
                        display: true, 
                        text: 'Montant (MAD)' 
                    },
                    beginAtZero: true
                }
            }
        }
    });

    // Graphique de répartition des dépenses
    if (charts.expenses) charts.expenses.destroy();
    const expensesCtx = document.getElementById('expensesChart').getContext('2d');
    const expenseCategories = expenses.reduce((acc, e) => {
        const category = e.category || 'Autre';
        acc[category] = (acc[category] || 0) + (e.amount || 0);
        return acc;
    }, {});

    // Préparer les données pour le graphique
    const categories = Object.keys(expenseCategories);
    const amounts = Object.values(expenseCategories);
    
    // Couleurs pour les catégories
    const backgroundColors = [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
        '#6610f2', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'
    ];

    charts.expenses = new Chart(expensesCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: backgroundColors.slice(0, categories.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Répartition des dépenses par catégorie'
                }
            }
        }
    });
}

function formatMonthYear(monthYear) {
    const [year, month] = monthYear.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Gestion des rapports
elements.reportPeriod?.addEventListener('change', (e) => {
    elements.customDateRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
});

elements.generateReportBtn?.addEventListener('click', async () => {
    const period = elements.reportPeriod.value;
    let start, end;

    if (period === 'custom') {
        start = new Date(elements.startDate.value);
        end = new Date(elements.endDate.value);
    } else {
        end = new Date();
        if (period === 'weekly') start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (period === 'monthly') start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        else start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    try {
        const fundings = await loadFundings();
        const expenses = await loadExpenses();
        const sales = await loadSales();

        const filteredFundings = fundings.filter(f => {
            const date = new Date(f.date || f.createdAt?.toDate());
            return date >= start && date <= end;
        });

        const filteredExpenses = expenses.filter(e => {
            const date = new Date(e.date || e.createdAt?.toDate());
            return date >= start && date <= end;
        });

        const filteredSales = sales.filter(s => {
            const date = new Date(s.date || s.createdAt?.toDate());
            return date >= start && date <= end;
        });

        if (charts.report) charts.report.destroy();
        const reportCtx = document.getElementById('reportChart').getContext('2d');
        
        charts.report = new Chart(reportCtx, {
            type: 'bar',
            data: {
                labels: ['Financement', 'Dépenses', 'Ventes'],
                datasets: [{
                    label: 'Montant (MAD)',
                    data: [
                        filteredFundings.reduce((sum, f) => sum + (f.amount || 0), 0),
                        filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                        filteredSales.reduce((sum, s) => sum + (s.advanceAmount || 0), 0)
                    ],
                    backgroundColor: ['#007bff', '#dc3545', '#28a745']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Rapport financier (${period === 'custom' ? 'Période personnalisée' : period})`
                    }
                },
                scales: {
                    y: { 
                        title: { 
                            display: true, 
                            text: 'Montant (MAD)' 
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur de génération de rapport:', error);
        alert('Erreur lors de la génération du rapport.');
    }
});

// Formatage des données
function formatCurrency(amount) {
    return amount?.toLocaleString('fr-MA', { 
        style: 'currency', 
        currency: 'MAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) || '0 MAD';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    } catch (e) {
        console.error('Erreur de formatage de date:', e);
        return 'N/A';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    
    if (auth.currentUser) {
        loadUserData(auth.currentUser.uid);
        showAppScreen();
    }
});

function initEventListeners() {
    // Navigation
    elements.menuItems?.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Déconnexion
    elements.logoutBtn?.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            auth.signOut().catch(error => {
                console.error('Erreur de déconnexion:', error);
            });
        }
    });
}

function switchTab(tabId) {
    elements.tabContents?.forEach(tab => {
        tab.classList.toggle('active', tab.id === tabId);
    });
    
    elements.menuItems?.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    
    // Mettre à jour le titre de l'onglet
    const activeTab = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (activeTab) {
        elements.currentTabTitle.textContent = activeTab.textContent.trim();
    }
}