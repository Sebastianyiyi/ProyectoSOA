// Componentes visuales propios: navegacion, menus, modales y formulario de contacto.
(function () {
    const header = document.getElementById('siteHeader');
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    function closeDropdowns(except) {
        document.querySelectorAll('.nav-dropdown.is-open').forEach((dropdown) => {
            if (dropdown === except) return;
            dropdown.classList.remove('is-open');
            const toggle = dropdown.querySelector('[data-dropdown-toggle]');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    }

    function closeNavigation() {
        if (!header || !mainNav || !navToggle) return;
        header.classList.remove('nav-open');
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
        closeDropdowns();
    }

    window.closeNavigation = closeNavigation;

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('is-open');
            header.classList.toggle('nav-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
            if (!isOpen) closeDropdowns();
        });
    }

    document.querySelectorAll('[data-dropdown-toggle]').forEach((toggle) => {
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = toggle.closest('.nav-dropdown');
            if (!dropdown) return;
            const isOpen = dropdown.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            closeDropdowns(dropdown);
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-dropdown')) closeDropdowns();
    });

    let lastFocusedElement = null;

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        lastFocusedElement = document.activeElement;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        const focusable = modal.querySelector('input, select, textarea, button, [href]');
        if (focusable) focusable.focus({ preventScroll: true });
    }

    function closeModal(modalOrId) {
        const modal = typeof modalOrId === 'string'
            ? document.getElementById(modalOrId)
            : modalOrId;
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal.is-open')) {
            document.body.classList.remove('modal-open');
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus({ preventScroll: true });
        }
    }

    window.openModal = openModal;
    window.closeModal = closeModal;

    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target.matches('[data-modal-close]')) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const openModalElement = document.querySelector('.modal.is-open');
        if (openModalElement) {
            closeModal(openModalElement);
            return;
        }
        closeDropdowns();
        if (mainNav && mainNav.classList.contains('is-open')) closeNavigation();
    });

    const contactForm = document.getElementById('form-contacto');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nombre = document.getElementById('contacto-nombre').value.trim();
            const email = document.getElementById('contacto-email').value.trim();
            const telefono = document.getElementById('contacto-telefono').value.trim();
            const asunto = document.getElementById('contacto-asunto').value.trim();
            const mensaje = document.getElementById('contacto-mensaje').value.trim();

            const cuerpo = [
                `Nombre: ${nombre}`,
                `Correo: ${email}`,
                telefono ? `Teléfono: ${telefono}` : '',
                '',
                mensaje
            ].filter(Boolean).join('\n');

            const enlace = `mailto:contacto@clinicaecuador.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
            window.location.href = enlace;

            if (typeof showAlert === 'function') {
                showAlert('Se abrirá tu cliente de correo para completar el envío.', 'info');
            }
        });
    }
})();
