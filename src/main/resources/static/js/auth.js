// Autenticacion, sesion y navegacion general de Clínica Ecuador.

const API_BASE_URL = (window.location.port === "8081" || window.location.port === "")
    ? ""
    : "http://localhost:8081";

const Auth = {
    getToken() {
        return localStorage.getItem('jwt_token');
    },

    getRol() {
        return localStorage.getItem('user_rol');
    },

    getEmail() {
        return localStorage.getItem('user_email');
    },

    getDatos() {
        try {
            return JSON.parse(localStorage.getItem('user_datos') || '{}');
        } catch (e) {
            return {};
        }
    },

    setSession(token, rol, email, datos) {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_rol', rol);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_datos', JSON.stringify(datos || {}));
    },

    clearSession() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_rol');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_datos');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.clearSession();
            this.updateUI();
            showView('view-login');
            showAlert('Tu sesión ha expirado. Por favor, ingresa nuevamente.', 'warning');
            throw new Error('No autorizado');
        }

        const contentType = response.headers.get("content-type");
        const data = (contentType && contentType.includes("application/json"))
            ? await response.json()
            : null;

        if (!response.ok) {
            const errorMsg = (data && data.mensaje) ? data.mensaje : `Error HTTP ${response.status}`;
            throw new Error(errorMsg);
        }

        return data;
    },

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.exito && data.token) {
            this.setSession(data.token, data.rol, email, data.datos);
            this.updateUI();
            return data;
        }

        throw new Error(data.mensaje || 'Error en el inicio de sesión');
    },

    async registrar(datos) {
        return await this.request('/api/auth/registro', {
            method: 'POST',
            body: JSON.stringify(datos)
        });
    },

    logout() {
        this.clearSession();
        this.updateUI();
        showView('view-home');
        showAlert('Has cerrado sesión exitosamente.', 'info');
    },

    updateUI() {
        const isAuth = this.isAuthenticated();
        const rol = this.getRol();
        const email = this.getEmail();

        document.querySelectorAll('.auth-only').forEach(el => {
            el.style.display = isAuth ? '' : 'none';
        });
        document.querySelectorAll('.guest-only').forEach(el => {
            el.style.display = isAuth ? 'none' : '';
        });

        document.querySelectorAll('.role-admin:not(.nav-role-item):not(.nav-portal-btn)').forEach(el => {
            el.style.display = (isAuth && rol === 'ROLE_ADMIN') ? '' : 'none';
        });
        document.querySelectorAll('.role-medico:not(.nav-role-item):not(.nav-portal-btn)').forEach(el => {
            el.style.display = (isAuth && rol === 'ROLE_MEDICO') ? '' : 'none';
        });
        document.querySelectorAll('.role-paciente:not(.nav-role-item):not(.nav-portal-btn)').forEach(el => {
            el.style.display = (isAuth && rol === 'ROLE_PACIENTE') ? '' : 'none';
        });

        const userInfoSpan = document.getElementById('user-email-display');
        const userRoleBadge = document.getElementById('user-role-badge');
        if (userInfoSpan && userRoleBadge) {
            if (isAuth) {
                userInfoSpan.textContent = email;
                let rolTexto = 'Paciente';
                let badgeClass = 'bg-primary';
                if (rol === 'ROLE_ADMIN') {
                    rolTexto = 'Administrador';
                    badgeClass = 'bg-danger';
                } else if (rol === 'ROLE_MEDICO') {
                    rolTexto = 'Médico';
                    badgeClass = 'bg-success';
                }
                userRoleBadge.textContent = rolTexto;
                userRoleBadge.className = `badge ${badgeClass}`;
            }
        }

        updateNavbar();
    }
};

const ROLE_VIEWS = {
    'ROLE_ADMIN': [
        'view-admin-citas',
        'view-admin-medicos',
        'view-admin-especialidades',
        'view-admin-pacientes'
    ],
    'ROLE_MEDICO': [
        'view-medico-agenda',
        'view-medico-pacientes',
        'view-medico-perfil'
    ],
    'ROLE_PACIENTE': [
        'view-paciente-citas',
        'view-paciente-agendar',
        'view-paciente-perfil'
    ]
};

function updateNavbar(viewId) {
    const isAuth = Auth.isAuthenticated();
    const rol = Auth.getRol();
    const currentView = viewId || document.querySelector('.section-view.active')?.id || 'view-home';

    const isUserInRoleView = isAuth && !!rol && !!ROLE_VIEWS[rol] && ROLE_VIEWS[rol].includes(currentView);

    // 1. Enlaces públicos (Quiénes Somos, Misión y Visión, etc.)
    document.querySelectorAll('.nav-public-item').forEach(el => {
        el.style.display = isUserInRoleView ? 'none' : '';
    });

    // 2. Botón del rol en inicio ("Panel Admin", "Portal Médico", "Mi Cuenta")
    // Visible en inicio/páginas públicas cuando hay sesión; al hacer clic redirige a la vista por defecto
    document.querySelectorAll('.nav-portal-btn').forEach(el => {
        if (!isAuth || isUserInRoleView) {
            el.style.display = 'none';
        } else {
            if (el.classList.contains('role-admin')) {
                el.style.display = (rol === 'ROLE_ADMIN') ? '' : 'none';
            } else if (el.classList.contains('role-medico')) {
                el.style.display = (rol === 'ROLE_MEDICO') ? '' : 'none';
            } else if (el.classList.contains('role-paciente')) {
                el.style.display = (rol === 'ROLE_PACIENTE') ? '' : 'none';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // 3. Páginas del rol directamente en la navbar
    // Se muestran directamente solo cuando el usuario está dentro de las vistas de su rol
    document.querySelectorAll('.nav-role-item').forEach(el => {
        if (!isAuth || !isUserInRoleView) {
            el.style.display = 'none';
        } else {
            if (el.classList.contains('role-admin')) {
                el.style.display = (rol === 'ROLE_ADMIN') ? '' : 'none';
            } else if (el.classList.contains('role-medico')) {
                el.style.display = (rol === 'ROLE_MEDICO') ? '' : 'none';
            } else if (el.classList.contains('role-paciente')) {
                el.style.display = (rol === 'ROLE_PACIENTE') ? '' : 'none';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // 4. Marcar elemento activo (.is-active)
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.classList.toggle('is-active', link.dataset.view === currentView);
    });
}

function showView(viewId) {
    document.querySelectorAll('.section-view').forEach(view => {
        view.classList.remove('active');
    });

    const target = document.getElementById(viewId);
    if (!target) return;

    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window.closeNavigation === 'function') {
        window.closeNavigation();
    }

    if (!Auth.isAuthenticated()) {
        if (viewId === 'view-paciente-citas' || viewId === 'view-paciente-agendar' ||
            viewId === 'view-paciente-perfil' || viewId === 'view-medico-agenda' ||
            viewId === 'view-medico-pacientes' || viewId === 'view-medico-perfil' ||
            viewId === 'view-admin-citas' || viewId === 'view-admin-medicos' ||
            viewId === 'view-admin-especialidades' || viewId === 'view-admin-pacientes') {
            showAlert('Inicia sesión para acceder a esta sección.', 'warning');
            target.classList.remove('active');
            const loginView = document.getElementById('view-login');
            if (loginView) loginView.classList.add('active');
            updateNavbar('view-login');
            return;
        }
    }

    updateNavbar(viewId);

    if (viewId === 'view-admin-citas') Citas.cargarCitasAdmin();
    if (viewId === 'view-admin-medicos') Citas.cargarMedicosAdmin();
    if (viewId === 'view-admin-especialidades') Citas.cargarEspecialidadesAdmin();
    if (viewId === 'view-admin-pacientes') Citas.cargarPacientesAdmin();
    if (viewId === 'view-medico-agenda') Citas.cargarAgendaMedico();
    if (viewId === 'view-medico-pacientes') Citas.cargarPacientesMedico();
    if (viewId === 'view-medico-perfil') Citas.cargarPerfilMedico();
    if (viewId === 'view-paciente-agendar') Citas.prepararAgendamiento();
    if (viewId === 'view-paciente-citas') Citas.cargarCitasPaciente();
    if (viewId === 'view-paciente-perfil') Citas.cargarPerfilPaciente();
    if (viewId === 'view-public-especialidades') Citas.cargarEspecialidadesPublicas();
    if (viewId === 'view-public-medicos') Citas.cargarMedicosPublicos();
}

function showErrorModal(mensaje) {
    const message = document.getElementById('modal-error-message');
    if (!message || typeof openModal !== 'function') {
        console.error(mensaje);
        return;
    }

    message.textContent = mensaje || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
    const modal = document.getElementById('modalError');
    if (!modal || !modal.classList.contains('is-open')) {
        openModal('modalError');
    }
}

function showConfirmModal(mensaje, onConfirm, titulo = 'Confirmar acción') {
    const titleEl = document.getElementById('modal-confirm-title');
    const msgEl = document.getElementById('modal-confirm-message');
    const btnConfirm = document.getElementById('modal-confirm-btn');

    if (titleEl) titleEl.textContent = titulo;
    if (msgEl) msgEl.textContent = mensaje || '¿Estás seguro de que deseas realizar esta acción?';

    if (btnConfirm) {
        btnConfirm.onclick = async () => {
            if (typeof closeModal === 'function') {
                closeModal('modalConfirmacion');
            }
            if (typeof onConfirm === 'function') {
                await onConfirm();
            }
        };
    }

    if (typeof openModal === 'function') {
        openModal('modalConfirmacion');
    }
}
window.showConfirmModal = showConfirmModal;

function showAlert(mensaje, tipo = 'info') {
    if (tipo === 'danger') {
        showErrorModal(mensaje);
        return;
    }

    const alertBox = document.getElementById('global-alert-container');
    if (!alertBox) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.setAttribute('role', 'alert');

    const text = document.createElement('span');
    text.textContent = mensaje;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'alert-close';
    close.setAttribute('aria-label', 'Cerrar mensaje');
    close.innerHTML = '&times;';
    close.addEventListener('click', () => alert.remove());

    alert.appendChild(text);
    alert.appendChild(close);
    alertBox.innerHTML = '';
    alertBox.appendChild(alert);

    window.setTimeout(() => {
        if (alert.isConnected) alert.remove();
    }, 5200);
}

document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();

    if (Auth.isAuthenticated()) {
        const rol = Auth.getRol();
        if (rol === 'ROLE_ADMIN') showView('view-admin-citas');
        else if (rol === 'ROLE_MEDICO') showView('view-medico-agenda');
        else showView('view-paciente-citas');
    } else {
        showView('view-home');
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const btn = document.getElementById('btn-login-submit');

            try {
                btn.disabled = true;
                btn.innerText = 'Verificando...';
                const res = await Auth.login(email, password);
                showAlert('Bienvenido de nuevo a Clínica Ecuador.', 'success');

                if (res.rol === 'ROLE_ADMIN') showView('view-admin-citas');
                else if (res.rol === 'ROLE_MEDICO') showView('view-medico-agenda');
                else showView('view-paciente-citas');
                formLogin.reset();
            } catch (err) {
                showAlert(err.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Iniciar sesión';
            }
        });
    }

    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datos = {
                email: document.getElementById('reg-email').value.trim(),
                password: document.getElementById('reg-password').value,
                cedula: document.getElementById('reg-cedula').value.trim(),
                nombre: document.getElementById('reg-nombre').value.trim(),
                apellido: document.getElementById('reg-apellido').value.trim(),
                telefono: document.getElementById('reg-telefono').value.trim(),
                direccion: document.getElementById('reg-direccion').value.trim(),
                fechaNacimiento: document.getElementById('reg-fecha-nac').value || null
            };

            const btn = document.getElementById('btn-registro-submit');
            try {
                btn.disabled = true;
                btn.innerText = 'Registrando...';
                const res = await Auth.registrar(datos);
                showAlert(res.mensaje || 'Registro exitoso. Ahora puedes iniciar sesión con tu cuenta.', 'success');
                formRegistro.reset();
                showView('view-login');
            } catch (err) {
                showAlert(err.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Crear cuenta';
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});
