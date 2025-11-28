// script.js - TransCoope
document.addEventListener('DOMContentLoaded', function() {
    // Estado de la aplicación
    const appState = {
        currentUser: null,
        userGenres: [],
        isLoggedIn: false,
        currentSection: 'transcripcion',
        posts: [],
        projects: [],
        rankings: {
            weekly: [],
            monthly: [],
            alltime: []
        }
    };

    // Elementos DOM principales
    const elements = {
        loginScreen: document.getElementById('login-screen'),
        registerScreen: document.getElementById('register-screen'),
        appScreen: document.getElementById('app-screen'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showRegister: document.getElementById('show-register'),
        showLogin: document.getElementById('show-login'),
        logoutBtn: document.getElementById('logout-btn'),
        navLinks: document.querySelectorAll('.nav-link'),
        contentSections: document.querySelectorAll('.content-section'),
        userName: document.getElementById('user-name')
    };

    // Inicialización
    init();

    function init() {
        setupEventListeners();
        loadSampleData();
        checkLoginStatus();
    }

    function setupEventListeners() {
        // Navegación entre pantallas de login/registro
        elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('register');
        });

        elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('login');
        });

        // Formularios de login y registro
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.registerForm.addEventListener('submit', handleRegister);
        elements.logoutBtn.addEventListener('click', handleLogout);

        // Navegación entre secciones
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                showSection(section);
            });
        });

        // Transcripción de audio
        setupTranscriptionListeners();
        
        // Comunidad
        setupCommunityListeners();
        
        // Proyectos
        setupProjectsListeners();
        
        // Ranking
        setupRankingListeners();
    }

    // Gestión de pantallas
    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        if (screenName === 'login') {
            elements.loginScreen.classList.add('active');
        } else if (screenName === 'register') {
            elements.registerScreen.classList.add('active');
        } else if (screenName === 'app') {
            elements.appScreen.classList.add('active');
        }
    }

    function showSection(sectionName) {
        // Actualizar navegación
        elements.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });

        // Mostrar sección
        elements.contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionName) {
                section.classList.add('active');
            }
        });

        appState.currentSection = sectionName;
        
        // Cargar datos específicos de la sección
        if (sectionName === 'comunidad') {
            loadCommunityPosts();
        } else if (sectionName === 'proyectos') {
            loadProjects();
        } else if (sectionName === 'ranking') {
            loadRankings();
        } else if (sectionName === 'recomendaciones') {
            loadRecommendations();
        }
    }

    // Sistema de autenticación
    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simulación de login (en una app real esto se haría con un backend)
        if (username && password) {
            const userData = JSON.parse(localStorage.getItem(`user_${username}`));
            
            if (userData && userData.password === password) {
                appState.currentUser = {
                    username: username,
                    email: userData.email,
                    genres: userData.genres
                };
                appState.isLoggedIn = true;
                appState.userGenres = userData.genres;
                
                localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
                
                showScreen('app');
                updateUIForUser();
                showSection('transcripcion');
                
                showNotification('¡Bienvenido de nuevo!', 'success');
            } else {
                showNotification('Usuario o contraseña incorrectos', 'error');
            }
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const genreCheckboxes = document.querySelectorAll('input[name="genre"]:checked');
        
        const selectedGenres = Array.from(genreCheckboxes).map(cb => cb.value);

        if (username && email && password && selectedGenres.length > 0) {
            // Guardar usuario en localStorage
            const userData = {
                username: username,
                email: email,
                password: password,
                genres: selectedGenres,
                joinDate: new Date().toISOString()
            };
            
            localStorage.setItem(`user_${username}`, JSON.stringify(userData));
            
            // Iniciar sesión automáticamente
            appState.currentUser = {
                username: username,
                email: email,
                genres: selectedGenres
            };
            appState.isLoggedIn = true;
            appState.userGenres = selectedGenres;
            
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            
            showScreen('app');
            updateUIForUser();
            showSection('transcripcion');
            
            showNotification('¡Cuenta creada exitosamente!', 'success');
        } else {
            showNotification('Por favor completa todos los campos y selecciona al menos un género', 'error');
        }
    }

    function handleLogout() {
        appState.currentUser = null;
        appState.isLoggedIn = false;
        appState.userGenres = [];
        
        localStorage.removeItem('currentUser');
        
        showScreen('login');
        showNotification('Sesión cerrada correctamente', 'info');
    }

    function checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            appState.currentUser = userData;
            appState.isLoggedIn = true;
            appState.userGenres = userData.genres;
            
            showScreen('app');
            updateUIForUser();
            showSection('transcripcion');
        }
    }

    function updateUIForUser() {
        if (appState.currentUser) {
            elements.userName.textContent = appState.currentUser.username;
            updateRecommendationsSection();
        }
    }

    // Sistema de transcripción
    function setupTranscriptionListeners() {
        const processUrlBtn = document.getElementById('process-url');
        const audioFileInput = document.getElementById('audio-file');
        const downloadPdfBtn = document.getElementById('download-pdf');

        processUrlBtn.addEventListener('click', processUrl);
        audioFileInput.addEventListener('change', processFile);
        downloadPdfBtn.addEventListener('click', downloadPdf);
    }

    function processUrl() {
        const url = document.getElementById('song-url').value.trim();
        
        if (!url) {
            showNotification('Por favor ingresa un enlace válido', 'error');
            return;
        }

        // Validar formato de URL
        if (!isValidUrl(url)) {
            showNotification('Por favor ingresa un enlace válido de YouTube, Spotify o similar', 'error');
            return;
        }

        simulateTranscription();
    }

    function processFile(e) {
        const file = e.target.files[0];
        
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('audio/')) {
            showNotification('Por favor selecciona un archivo de audio válido', 'error');
            return;
        }

        // Validar tamaño (50MB máximo)
        if (file.size > 50 * 1024 * 1024) {
            showNotification('El archivo es demasiado grande (máximo 50MB)', 'error');
            return;
        }

        simulateTranscription();
    }

    function simulateTranscription() {
        const processingSection = document.getElementById('processing-section');
        const resultsSection = document.getElementById('results-section');
        
        // Mostrar animación de procesamiento
        processingSection.classList.add('active');
        resultsSection.style.display = 'none';

        // Simular procesamiento con IA
        setTimeout(() => {
            processingSection.classList.remove('active');
            resultsSection.style.display = 'block';
            
            // Generar partituras de ejemplo
            generateSampleSheetMusic();
            
            showNotification('¡Transcripción completada! La IA ha detectado 4 instrumentos', 'success');
        }, 3000);
    }

    function generateSampleSheetMusic() {
        const instruments = [
            { name: 'Guitarra', icon: 'fas fa-guitar', active: true },
            { name: 'Bajo', icon: 'fas fa-guitar', active: true },
            { name: 'Batería', icon: 'fas fa-drum', active: true },
            { name: 'Piano', icon: 'fas fa-piano', active: false }
        ];

        const tabsContainer = document.querySelector('.instruments-tabs');
        const sheetContainer = document.querySelector('.sheet-music-container');

        // Generar pestañas de instrumentos
        tabsContainer.innerHTML = '';
        instruments.forEach((instrument, index) => {
            if (instrument.active) {
                const tab = document.createElement('button');
                tab.className = `instrument-tab ${index === 0 ? 'active' : ''}`;
                tab.innerHTML = `<i class="${instrument.icon}"></i> ${instrument.name}`;
                tab.addEventListener('click', () => switchInstrumentTab(index));
                tabsContainer.appendChild(tab);
            }
        });

        // Generar partitura de ejemplo
        sheetContainer.innerHTML = `
            <div class="sheet-music">
                <div class="sheet-header">
                    <h4>Canción Ejemplo - Partitura Generada por IA</h4>
                    <div class="sheet-meta">
                        <span>Tempo: 120 BPM</span>
                        <span>Compás: 4/4</span>
                        <span>Clave: Sol</span>
                    </div>
                </div>
                <div class="staff">
                    <div class="clef">𝄞</div>
                    <div class="notes">
                        <div class="note">♩</div>
                        <div class="note">♪</div>
                        <div class="note">♫</div>
                        <div class="note">𝅘𝅥</div>
                    </div>
                </div>
                <div class="sheet-footer">
                    <p>Partitura generada automáticamente por TransCoope AI</p>
                </div>
            </div>
        `;
    }

    function switchInstrumentTab(index) {
        document.querySelectorAll('.instrument-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.instrument-tab')[index].classList.add('active');
        
        // En una implementación real, aquí se cambiaría la partitura mostrada
        showNotification(`Mostrando partitura para ${getInstrumentName(index)}`, 'info');
    }

    function getInstrumentName(index) {
        const names = ['Guitarra', 'Bajo', 'Batería', 'Piano'];
        return names[index] || 'Instrumento';
    }

    function downloadPdf() {
        showNotification('Descargando partitura en formato PDF...', 'info');
        
        // Simular descarga
        setTimeout(() => {
            showNotification('¡PDF descargado correctamente!', 'success');
        }, 1500);
    }

    // Sistema de comunidad
    function setupCommunityListeners() {
        const newPostBtn = document.getElementById('new-post-btn');
        const newPostModal = document.getElementById('new-post-modal');
        const closeModalBtns = document.querySelectorAll('.close-modal');
        const newPostForm = document.getElementById('new-post-form');

        newPostBtn.addEventListener('click', () => {
            newPostModal.style.display = 'block';
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                newPostModal.style.display = 'none';
            });
        });

        newPostForm.addEventListener('submit', handleNewPost);

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === newPostModal) {
                newPostModal.style.display = 'none';
            }
        });
    }

    function handleNewPost(e) {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;

        // Filtro de contenido ofensivo
        if (containsOffensiveLanguage(content)) {
            showNotification('Tu mensaje contiene lenguaje inapropiado y no puede ser publicado', 'error');
            return;
        }

        // Crear nuevo post
        const newPost = {
            id: Date.now(),
            title: title,
            category: category,
            content: content,
            author: appState.currentUser.username,
            date: new Date().toISOString(),
            likes: 0,
            comments: 0
        };

        // Guardar en estado local
        appState.posts.unshift(newPost);
        
        // Guardar en localStorage
        savePostsToStorage();
        
        // Cerrar modal y resetear formulario
        document.getElementById('new-post-modal').style.display = 'none';
        e.target.reset();
        
        // Recargar posts
        loadCommunityPosts();
        
        showNotification('¡Mensaje publicado exitosamente!', 'success');
    }

    function containsOffensiveLanguage(text) {
        const offensiveWords = [
            'idiota', 'estúpido', 'imbécil', 'tonto', 'retrasado', 'mongólico',
            'puta', 'prostituta', 'zorra', 'perra', 'cabrón', 'gilipollas',
            'maricón', 'joto', 'puto', 'marica', 'negro', 'indio', 'chino',
            'matar', 'asesinar', 'violar', 'golpear', 'pegar', 'muerte'
        ];
        
        const lowerText = text.toLowerCase();
        return offensiveWords.some(word => lowerText.includes(word));
    }

    function loadCommunityPosts() {
        const postsContainer = document.querySelector('.posts-container');
        
        // Cargar posts del localStorage
        loadPostsFromStorage();
        
        if (appState.posts.length === 0) {
            // Mostrar posts de ejemplo si no hay posts
            postsContainer.innerHTML = `
                <div class="post-card">
                    <div class="post-header">
                        <div class="post-author">
                            <div class="avatar">M</div>
                            <div class="author-info">
                                <span class="author-name">María García</span>
                                <span class="post-date">Hace 2 horas</span>
                            </div>
                        </div>
                        <div class="post-category">
                            <span class="category-tag">Guitarra</span>
                        </div>
                    </div>
                    <div class="post-content">
                        <h3>¿Alguien tiene consejos para mejorar el fingerpicking?</h3>
                        <p>Estoy aprendiendo fingerpicking y me cuesta mantener un patrón constante con la mano derecha. ¿Algún ejercicio que recomienden para mejorar la independencia de los dedos?</p>
                    </div>
                    <div class="post-footer">
                        <div class="post-actions">
                            <button class="action-btn"><i class="far fa-thumbs-up"></i> 12</button>
                            <button class="action-btn"><i class="far fa-comment"></i> 5</button>
                            <button class="action-btn"><i class="far fa-bookmark"></i></button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Mostrar posts reales
            postsContainer.innerHTML = appState.posts.map(post => `
                <div class="post-card">
                    <div class="post-header">
                        <div class="post-author">
                            <div class="avatar">${post.author.charAt(0)}</div>
                            <div class="author-info">
                                <span class="author-name">${post.author}</span>
                                <span class="post-date">${formatDate(post.date)}</span>
                            </div>
                        </div>
                        <div class="post-category">
                            <span class="category-tag">${post.category}</span>
                        </div>
                    </div>
                    <div class="post-content">
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                    </div>
                    <div class="post-footer">
                        <div class="post-actions">
                            <button class="action-btn"><i class="far fa-thumbs-up"></i> ${post.likes}</button>
                            <button class="action-btn"><i class="far fa-comment"></i> ${post.comments}</button>
                            <button class="action-btn"><i class="far fa-bookmark"></i></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Sistema de proyectos
    function setupProjectsListeners() {
        const uploadProjectBtn = document.getElementById('upload-project-btn');
        const uploadProjectModal = document.getElementById('upload-project-modal');
        const uploadProjectForm = document.getElementById('upload-project-form');
        const closeModalBtns = document.querySelectorAll('.close-modal');
        const genreFilter = document.getElementById('genre-filter');

        uploadProjectBtn.addEventListener('click', () => {
            uploadProjectModal.style.display = 'block';
        });

        uploadProjectForm.addEventListener('submit', handleProjectUpload);

        genreFilter.addEventListener('change', loadProjects);

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === uploadProjectModal) {
                uploadProjectModal.style.display = 'none';
            }
        });
    }

    function handleProjectUpload(e) {
        e.preventDefault();
        
        const title = document.getElementById('project-title').value;
        const description = document.getElementById('project-description').value;
        const genre = document.getElementById('project-genre').value;
        const file = document.getElementById('project-file').files[0];

        if (!file) {
            showNotification('Por favor selecciona un archivo de audio', 'error');
            return;
        }

        const newProject = {
            id: Date.now(),
            title: title,
            description: description,
            genre: genre,
            author: appState.currentUser.username,
            date: new Date().toISOString(),
            rating: 0,
            ratingsCount: 0
        };

        appState.projects.unshift(newProject);
        saveProjectsToStorage();
        
        document.getElementById('upload-project-modal').style.display = 'none';
        e.target.reset();
        
        loadProjects();
        showNotification('¡Proyecto subido exitosamente!', 'success');
    }

    function loadProjects() {
        const genreFilter = document.getElementById('genre-filter').value;
        const projectsGrid = document.querySelector('.projects-grid');
        
        loadProjectsFromStorage();
        
        let projectsToShow = appState.projects;
        
        if (genreFilter) {
            projectsToShow = projectsToShow.filter(project => project.genre === genreFilter);
        }

        if (projectsToShow.length === 0) {
            projectsGrid.innerHTML = `
                <div class="project-card">
                    <div class="project-image">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="project-info">
                        <h3>Amanecer en Re</h3>
                        <p class="project-author">Por: Ana Martínez</p>
                        <p class="project-description">Composición acústica para guitarra y violín inspirada en los amaneceres de montaña.</p>
                        <div class="project-meta">
                            <span class="project-genre">Acústico</span>
                            <div class="project-rating">
                                <i class="fas fa-star"></i>
                                <span>4.7</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            projectsGrid.innerHTML = projectsToShow.map(project => `
                <div class="project-card">
                    <div class="project-image">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="project-info">
                        <h3>${project.title}</h3>
                        <p class="project-author">Por: ${project.author}</p>
                        <p class="project-description">${project.description}</p>
                        <div class="project-meta">
                            <span class="project-genre">${project.genre}</span>
                            <div class="project-rating">
                                <i class="fas fa-star"></i>
                                <span>${project.rating || 'Nuevo'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Sistema de ranking
    function setupRankingListeners() {
        const rankingTabs = document.querySelectorAll('.ranking-tab');
        
        rankingTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const rankingType = tab.getAttribute('data-ranking');
                
                rankingTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                loadRankings(rankingType);
            });
        });
    }

    function loadRankings(type = 'weekly') {
        const rankingList = document.querySelector('.ranking-list');
        
        // Datos de ejemplo para el ranking
        const sampleRankings = [
            { position: 1, title: 'Bohemian Rhapsody', artist: 'Queen', searches: 1245, rating: 4.8 },
            { position: 2, title: 'Hotel California', artist: 'Eagles', searches: 987, rating: 4.7 },
            { position: 3, title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', searches: 856, rating: 4.6 },
            { position: 4, title: 'Stairway to Heaven', artist: 'Led Zeppelin', searches: 743, rating: 4.9 },
            { position: 5, title: 'Smells Like Teen Spirit', artist: 'Nirvana', searches: 689, rating: 4.5 }
        ];

        rankingList.innerHTML = sampleRankings.map(song => `
            <div class="ranking-item">
                <div class="ranking-position">${song.position}</div>
                <div class="ranking-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
                <div class="ranking-stats">
                    <div class="stat">
                        <i class="fas fa-search"></i>
                        <span>${song.searches} búsquedas</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        <span>${song.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Sistema de recomendaciones
    function loadRecommendations() {
        updateRecommendationsSection();
    }

    function updateRecommendationsSection() {
        const genresList = document.querySelector('.genres-list');
        
        // Mostrar géneros del usuario
        if (appState.userGenres && appState.userGenres.length > 0) {
            genresList.innerHTML = appState.userGenres.map(genre => `
                <span class="genre-tag">${genre}</span>
            `).join('');
        } else {
            genresList.innerHTML = '<p>Selecciona tus géneros favoritos en tu perfil</p>';
        }
        
        // Generar recomendaciones basadas en géneros
        generatePersonalizedRecommendations();
    }

    function generatePersonalizedRecommendations() {
        // En una implementación real, esto se conectaría con un sistema de recomendaciones
        // Por ahora, generamos recomendaciones basadas en los géneros del usuario
        
        const userGenres = appState.userGenres || [];
        
        // Recomendaciones de ejemplo basadas en géneros populares
        const recommendations = {
            partituras: [
                { title: 'Stairway to Heaven', description: 'Led Zeppelin - Guitarra principal', rating: 4.9, icon: 'fas fa-guitar' },
                { title: 'Back in Black', description: 'AC/DC - Batería completa', rating: 4.7, icon: 'fas fa-drum' }
            ],
            proyectos: [
                { title: 'Neon Dreams', description: 'Por: SynthWavePro - Electrónica', rating: 4.5, icon: 'fas fa-headphones' },
                { title: 'Acoustic Sessions', description: 'Por: Laura Strings - Acústico', rating: 4.8, icon: 'fas fa-guitar' }
            ],
            discusiones: [
                { title: 'Mejores amplificadores para rock', description: '45 respuestas - Guitarra', views: 320, icon: 'fas fa-comments' },
                { title: 'Técnicas de mezcla para batería', description: '28 respuestas - Producción', views: 215, icon: 'fas fa-comments' }
            ]
        };

        // Actualizar las secciones de recomendaciones
        updateRecommendationSection('partituras', recommendations.partituras);
        updateRecommendationSection('proyectos', recommendations.proyectos);
        updateRecommendationSection('discusiones', recommendations.discusiones);
    }

    function updateRecommendationSection(section, items) {
        const container = document.querySelector(`.recommendation-section:nth-child(${getSectionIndex(section)}) .recommendation-cards`);
        
        container.innerHTML = items.map(item => `
            <div class="recommendation-card">
                <div class="card-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="card-content">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    ${item.rating ? `
                        <div class="card-rating">
                            <i class="fas fa-star"></i>
                            <span>${item.rating}</span>
                        </div>
                    ` : `
                        <div class="card-meta">
                            <i class="far fa-eye"></i>
                            <span>${item.views}</span>
                        </div>
                    `}
                </div>
            </div>
        `).join('');
    }

    function getSectionIndex(section) {
        const sections = { 'partituras': 1, 'proyectos': 2, 'discusiones': 3 };
        return sections[section] || 1;
    }

    // Utilidades
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} minutos`;
        if (diffHours < 24) return `Hace ${diffHours} horas`;
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        
        return date.toLocaleDateString('es-ES');
    }

    function showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);

        // Agregar estilos de animación si no existen
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    function getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        return colors[type] || '#3b82f6';
    }

    // Persistencia de datos
    function savePostsToStorage() {
        localStorage.setItem('transcoope_posts', JSON.stringify(appState.posts));
    }

    function loadPostsFromStorage() {
        const savedPosts = localStorage.getItem('transcoope_posts');
        if (savedPosts) {
            appState.posts = JSON.parse(savedPosts);
        }
    }

    function saveProjectsToStorage() {
        localStorage.setItem('transcoope_projects', JSON.stringify(appState.projects));
    }

    function loadProjectsFromStorage() {
        const savedProjects = localStorage.getItem('transcoope_projects');
        if (savedProjects) {
            appState.projects = JSON.parse(savedProjects);
        }
    }

    function loadSampleData() {
        // Cargar datos de ejemplo si no hay datos guardados
        if (!localStorage.getItem('transcoope_posts')) {
            appState.posts = [];
        }
        
        if (!localStorage.getItem('transcoope_projects')) {
            appState.projects = [];
        }
    }
});
