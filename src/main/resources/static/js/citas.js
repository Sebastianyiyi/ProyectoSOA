// Gestión de citas, médicos, especialidades y pacientes de Clínica Ecuador.

function mostrarErrorCarga(contenedor, error, mensaje = 'No se pudo cargar la información.') {
    if (contenedor) {
        contenedor.innerHTML = `<p class="text-muted">${mensaje}</p>`;
    }
    if (typeof showErrorModal === 'function') {
        showErrorModal(error && error.message ? error.message : 'Ocurrió un error inesperado.');
    }
}

const Citas = {
    // ==========================================
    // VISTAS PÚBLICAS
    // ==========================================
    async cargarEspecialidadesPublicas() {
        const cont = document.getElementById('public-especialidades-list');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';
        try {
            const list = await Auth.request('/api/especialidades');
            if (!list.length) {
                cont.innerHTML = '<p class="text-muted">No hay especialidades registradas por el momento.</p>';
                return;
            }
            cont.innerHTML = list.map(esp => `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 p-3 shadow-sm border-start border-primary border-4">
                        <h5 class="fw-bold text-primary">${esp.nombre}</h5>
                        <p class="text-secondary small mb-0">${esp.descripcion || 'Atención médica profesional garantizada.'}</p>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async cargarMedicosPublicos() {
        const cont = document.getElementById('public-medicos-list');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';
        try {
            const list = await Auth.request('/api/medicos');
            if (!list.length) {
                cont.innerHTML = '<p class="text-muted">No hay médicos registrados actualmente.</p>';
                return;
            }
            cont.innerHTML = list.map(m => `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 p-3 shadow-sm text-center">
                        <div class="mb-2">
                            <span class="badge bg-primary p-2 fs-6">Dr(a). ${m.nombre} ${m.apellido}</span>
                        </div>
                        <p class="text-success fw-bold mb-1">${m.especialidadNombre || 'Especialista'}</p>
                        <p class="text-muted small mb-0">${m.telefono || 'Sin teléfono'}</p>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    // ==========================================
    // VISTAS DEL PACIENTE
    // ==========================================
    async prepararAgendamiento() {
        const selectEsp = document.getElementById('cita-especialidad');
        const selectMed = document.getElementById('cita-medico');
        if (!selectEsp || !selectMed) return;

        selectEsp.innerHTML = '<option value="">-- Selecciona una Especialidad --</option>';
        selectMed.innerHTML = '<option value="">-- Primero selecciona una especialidad --</option>';
        selectMed.disabled = true;

        try {
            const especialidades = await Auth.request('/api/especialidades');
            especialidades.forEach(esp => {
                const opt = document.createElement('option');
                opt.value = esp.id;
                opt.textContent = esp.nombre;
                selectEsp.appendChild(opt);
            });

            selectEsp.onchange = async () => {
                const espId = selectEsp.value;
                if (!espId) {
                    selectMed.innerHTML = '<option value="">-- Primero selecciona una especialidad --</option>';
                    selectMed.disabled = true;
                    return;
                }

                selectMed.innerHTML = '<option value="">Cargando médicos...</option>';
                selectMed.disabled = true;

                try {
                    const medicos = await Auth.request(`/api/medicos?especialidadId=${espId}`);
                    if (!medicos.length) {
                        selectMed.innerHTML = '<option value="">No hay médicos disponibles para esta especialidad</option>';
                        selectMed.disabled = true;
                        return;
                    }
                    selectMed.innerHTML = '<option value="">-- Selecciona un Médico --</option>';
                    medicos.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.id;
                        opt.textContent = `Dr(a). ${m.nombre} ${m.apellido}`;
                        selectMed.appendChild(opt);
                    });
                    selectMed.disabled = false;
                } catch (e) {
                    selectMed.innerHTML = `<option value="">Error cargando médicos</option>`;
                    showAlert('No se pudieron cargar los médicos. Intenta nuevamente.', 'danger');
                }
            };
        } catch (err) {
            showAlert('No se pudieron cargar las especialidades', 'danger');
        }
    },

    async agendarCita(e) {
        e.preventDefault();
        const medicoId = document.getElementById('cita-medico').value;
        const fechaHora = document.getElementById('cita-fechahora').value;
        const motivo = document.getElementById('cita-motivo').value.trim();

        if (!medicoId || !fechaHora || !motivo) {
            showAlert('Por favor completa todos los campos requeridos.', 'warning');
            return;
        }

        const btn = document.getElementById('btn-agendar-submit');
        try {
            btn.disabled = true;
            btn.innerText = 'Agendando...';

            await Auth.request('/api/citas', {
                method: 'POST',
                body: JSON.stringify({
                    medicoId: parseInt(medicoId),
                    fechaHora: fechaHora,
                    motivo: motivo
                })
            });

            showAlert('¡Tu cita médica ha sido agendada con éxito!', 'success');
            document.getElementById('form-agendar-cita').reset();
            showView('view-paciente-citas');
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Confirmar Cita Médica';
        }
    },

    async cargarCitasPaciente() {
        const cont = document.getElementById('paciente-citas-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        try {
            const citas = await Auth.request('/api/citas');
            if (!citas.length) {
                cont.innerHTML = `
                    <div class="card p-4 text-center">
                        <p class="text-muted mb-3">No tienes citas médicas registradas todavía.</p>
                        <div>
                            <button class="btn btn-primary" onclick="showView('view-paciente-agendar')">
                                Agendar mi primera cita
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Especialidad</th>
                                <th>Médico</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${citas.map(c => {
                                const fecha = new Date(c.fechaHora).toLocaleString();
                                const badgeClass = `badge-status-${c.estado}`;
                                return `
                                    <tr>
                                        <td><strong>${fecha}</strong></td>
                                        <td><span class="badge bg-light text-dark border">${c.especialidadNombre || 'General'}</span></td>
                                        <td>Dr(a). ${c.medicoNombre}</td>
                                        <td>${c.motivo}</td>
                                        <td><span class="status-badge ${badgeClass}">${c.estado}</span></td>
                                        <td>
                                            ${c.estado === 'PENDIENTE' ? `
                                                <button class="btn btn-sm btn-outline-danger" onclick="Citas.cancelarCitaPaciente(${c.id})">
                                                    Cancelar
                                                </button>
                                            ` : `<span class="text-muted small">Sin acciones</span>`}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async cancelarCitaPaciente(id) {
        if (!confirm('¿Estás seguro de cancelar esta cita médica?')) return;
        try {
            await Auth.request(`/api/citas/${id}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado: 'CANCELADA' })
            });
            showAlert('Cita cancelada correctamente.', 'info');
            this.cargarCitasPaciente();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    async cargarPerfilPaciente() {
        const cont = document.getElementById('paciente-perfil-container');
        if (!cont) return;
        try {
            const p = await Auth.request('/api/pacientes/mi-perfil');
            cont.innerHTML = `
                <div class="card p-4">
                    <h5 class="fw-bold text-primary mb-3">Datos Personales del Paciente</h5>
                    <div class="row g-3">
                        <div class="col-md-6"><strong>Cédula:</strong> ${p.cedula}</div>
                        <div class="col-md-6"><strong>Nombre Completo:</strong> ${p.nombre} ${p.apellido}</div>
                        <div class="col-md-6"><strong>Teléfono:</strong> ${p.telefono || 'No registrado'}</div>
                        <div class="col-md-6"><strong>Dirección:</strong> ${p.direccion || 'No registrada'}</div>
                        <div class="col-md-6"><strong>Fecha de Nacimiento:</strong> ${p.fechaNacimiento || 'No registrada'}</div>
                        <div class="col-md-6"><strong>Email de Cuenta:</strong> ${Auth.getEmail()}</div>
                    </div>
                </div>
            `;
        } catch (err) {
            cont.innerHTML = `<div class="alert alert-warning">${err.message}</div>`;
        }
    },

    // ==========================================
    // VISTAS DEL MÉDICO / DOCTOR
    // ==========================================
    async cargarAgendaMedico() {
        const cont = document.getElementById('medico-agenda-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        const fechaFiltro = document.getElementById('filtro-medico-fecha')?.value || '';
        const estadoFiltro = document.getElementById('filtro-medico-estado')?.value || '';

        let query = [];
        if (fechaFiltro) query.push(`fecha=${encodeURIComponent(fechaFiltro)}`);
        if (estadoFiltro) query.push(`estado=${encodeURIComponent(estadoFiltro)}`);
        const queryStr = query.length ? `?${query.join('&')}` : '';

        try {
            const citas = await Auth.request(`/api/citas${queryStr}`);
            if (!citas.length) {
                cont.innerHTML = '<div class="alert alert-info">No se encontraron citas en tu agenda para los filtros seleccionados.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Paciente</th>
                                <th>Cédula</th>
                                <th>Teléfono</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Cambiar Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${citas.map(c => {
                                const fecha = new Date(c.fechaHora).toLocaleString();
                                const badgeClass = `badge-status-${c.estado}`;
                                return `
                                    <tr>
                                        <td><strong>${fecha}</strong></td>
                                        <td>${c.pacienteNombre}</td>
                                        <td>${c.pacienteCedula || '-'}</td>
                                        <td>${c.pacienteTelefono || '-'}</td>
                                        <td>${c.motivo}</td>
                                        <td><span class="status-badge ${badgeClass}">${c.estado}</span></td>
                                        <td>
                                            <div class="btn-group btn-group-sm" role="group">
                                                <button class="btn btn-outline-primary" title="Confirmar" onclick="Citas.cambiarEstadoMedico(${c.id}, 'CONFIRMADA')">
                                                    Confirmar
                                                </button>
                                                <button class="btn btn-outline-success" title="Completar" onclick="Citas.cambiarEstadoMedico(${c.id}, 'COMPLETADA')">
                                                    Completar
                                                </button>
                                                <button class="btn btn-outline-danger" title="Cancelar" onclick="Citas.cambiarEstadoMedico(${c.id}, 'CANCELADA')">
                                                    Cancelar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async cambiarEstadoMedico(id, nuevoEstado) {
        try {
            await Auth.request(`/api/citas/${id}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado: nuevoEstado })
            });
            showAlert(`Cita actualizada a estado: ${nuevoEstado}`, 'success');
            this.cargarAgendaMedico();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    async cargarPacientesMedico() {
        const cont = document.getElementById('medico-pacientes-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        try {
            const pacientes = await Auth.request('/api/medicos/mis-pacientes');
            if (!pacientes.length) {
                cont.innerHTML = '<div class="alert alert-info">Aún no tienes historial de pacientes atendidos.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Cédula</th>
                                <th>Nombre y Apellido</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>F. Nacimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pacientes.map(p => `
                                <tr>
                                    <td><strong>${p.cedula}</strong></td>
                                    <td>${p.nombre} ${p.apellido}</td>
                                    <td>${p.telefono || '-'}</td>
                                    <td>${p.direccion || '-'}</td>
                                    <td>${p.fechaNacimiento || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async cargarPerfilMedico() {
        const cont = document.getElementById('medico-perfil-container');
        if (!cont) return;
        try {
            const m = await Auth.request('/api/medicos/mi-perfil');
            cont.innerHTML = `
                <div class="card p-4">
                    <h5 class="fw-bold text-success mb-3">Ficha del Profesional Médico</h5>
                    <div class="row g-3">
                        <div class="col-md-6"><strong>Cédula:</strong> ${m.cedula}</div>
                        <div class="col-md-6"><strong>Nombre y Apellido:</strong> Dr(a). ${m.nombre} ${m.apellido}</div>
                        <div class="col-md-6"><strong>Especialidad:</strong> <span class="badge bg-primary">${m.especialidadNombre}</span></div>
                        <div class="col-md-6"><strong>Teléfono:</strong> ${m.telefono || 'No registrado'}</div>
                        <div class="col-md-6"><strong>Email de Ingreso:</strong> ${m.email}</div>
                    </div>
                </div>
            `;
        } catch (err) {
            cont.innerHTML = `<div class="alert alert-warning">${err.message}</div>`;
        }
    },

    // ==========================================
    // VISTAS DEL ADMINISTRADOR
    // ==========================================
    async cargarCitasAdmin() {
        const cont = document.getElementById('admin-citas-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        const fechaFiltro = document.getElementById('filtro-admin-fecha')?.value || '';
        const estadoFiltro = document.getElementById('filtro-admin-estado')?.value || '';

        let query = [];
        if (fechaFiltro) query.push(`fecha=${encodeURIComponent(fechaFiltro)}`);
        if (estadoFiltro) query.push(`estado=${encodeURIComponent(estadoFiltro)}`);
        const queryStr = query.length ? `?${query.join('&')}` : '';

        try {
            const citas = await Auth.request(`/api/citas${queryStr}`);
            if (!citas.length) {
                cont.innerHTML = '<div class="alert alert-info">No hay citas registradas en el sistema.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Fecha y Hora</th>
                                <th>Paciente</th>
                                <th>Médico Asignado</th>
                                <th>Especialidad</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Acciones de Supervisión</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${citas.map(c => {
                                const fecha = new Date(c.fechaHora).toLocaleString();
                                const badgeClass = `badge-status-${c.estado}`;
                                return `
                                    <tr>
                                        <td>#${c.id}</td>
                                        <td><strong>${fecha}</strong></td>
                                        <td>${c.pacienteNombre} <br><small class="text-muted">CI: ${c.pacienteCedula || ''}</small></td>
                                        <td>Dr(a). ${c.medicoNombre}</td>
                                        <td><span class="badge bg-light text-dark border">${c.especialidadNombre}</span></td>
                                        <td>${c.motivo}</td>
                                        <td><span class="status-badge ${badgeClass}">${c.estado}</span></td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="Citas.abrirModalReasignar(${c.id}, ${c.medicoId}, '${c.estado}')">
                                                    Reasignar
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="Citas.eliminarCitaAdmin(${c.id})">
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async abrirModalReasignar(citaId, currentMedicoId, currentEstado) {
        document.getElementById('modal-reasignar-cita-id').value = citaId;
        const selectMed = document.getElementById('modal-reasignar-medico');
        const selectEstado = document.getElementById('modal-reasignar-estado');
        selectEstado.value = currentEstado;

        selectMed.innerHTML = '<option value="">Cargando médicos...</option>';
        try {
            const medicos = await Auth.request('/api/medicos');
            selectMed.innerHTML = medicos.map(m => `
                <option value="${m.id}" ${m.id === currentMedicoId ? 'selected' : ''}>
                    Dr(a). ${m.nombre} ${m.apellido} (${m.especialidadNombre})
                </option>
            `).join('');

            openModal('modalReasignarCita');
        } catch (e) {
            showAlert('Error cargando médicos para reasignar', 'danger');
        }
    },

    async guardarReasignacion() {
        const citaId = document.getElementById('modal-reasignar-cita-id').value;
        const medicoId = document.getElementById('modal-reasignar-medico').value;
        const estado = document.getElementById('modal-reasignar-estado').value;

        try {
            await Auth.request(`/api/citas/${citaId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    medicoId: parseInt(medicoId),
                    estado: estado
                })
            });

            closeModal('modalReasignarCita');

            showAlert('Cita reasignada y actualizada exitosamente.', 'success');
            this.cargarCitasAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    async eliminarCitaAdmin(id) {
        if (!confirm(`¿Estás seguro de eliminar permanentemente la cita médica #${id}?`)) return;
        try {
            await Auth.request(`/api/citas/${id}`, { method: 'DELETE' });
            showAlert('Cita eliminada correctamente del sistema.', 'info');
            this.cargarCitasAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    // CRUD DE MÉDICOS (ADMIN)
    async cargarMedicosAdmin() {
        const cont = document.getElementById('admin-medicos-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        try {
            const medicos = await Auth.request('/api/medicos');
            if (!medicos.length) {
                cont.innerHTML = '<div class="alert alert-info">No hay médicos registrados. Agrega uno con el botón superior.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Cédula</th>
                                <th>Nombre y Apellido</th>
                                <th>Especialidad</th>
                                <th>Email Usuario</th>
                                <th>Teléfono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${medicos.map(m => `
                                <tr>
                                    <td><strong>${m.cedula}</strong></td>
                                    <td>Dr(a). ${m.nombre} ${m.apellido}</td>
                                    <td><span class="badge bg-primary">${m.especialidadNombre}</span></td>
                                    <td>${m.email}</td>
                                    <td>${m.telefono || '-'}</td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-danger" onclick="Citas.eliminarMedicoAdmin(${m.id})">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async abrirModalNuevoMedico() {
        const form = document.getElementById('form-nuevo-medico');
        if (form) form.reset();

        const selectEsp = document.getElementById('medico-especialidad-id');
        selectEsp.innerHTML = '<option value="">Cargando especialidades...</option>';
        try {
            const especialidades = await Auth.request('/api/especialidades');
            selectEsp.innerHTML = '<option value="">-- Selecciona Especialidad --</option>' +
                especialidades.map(esp => `<option value="${esp.id}">${esp.nombre}</option>`).join('');

            openModal('modalNuevoMedico');
        } catch (e) {
            showAlert('Error al cargar especialidades', 'danger');
        }
    },

    async guardarNuevoMedico(e) {
        e.preventDefault();
        const data = {
            cedula: document.getElementById('medico-cedula').value.trim(),
            nombre: document.getElementById('medico-nombre').value.trim(),
            apellido: document.getElementById('medico-apellido').value.trim(),
            telefono: document.getElementById('medico-telefono').value.trim(),
            email: document.getElementById('medico-email').value.trim(),
            password: document.getElementById('medico-password').value,
            especialidadId: parseInt(document.getElementById('medico-especialidad-id').value)
        };

        const btn = document.getElementById('btn-guardar-medico');
        try {
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            await Auth.request('/api/medicos', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            closeModal('modalNuevoMedico');

            showAlert('Médico registrado exitosamente.', 'success');
            this.cargarMedicosAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Guardar Médico';
        }
    },

    async eliminarMedicoAdmin(id) {
        if (!confirm('¿Estás seguro de eliminar este médico y su cuenta asociada?')) return;
        try {
            await Auth.request(`/api/medicos/${id}`, { method: 'DELETE' });
            showAlert('Médico eliminado del sistema.', 'info');
            this.cargarMedicosAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    // CRUD DE ESPECIALIDADES (ADMIN)
    async cargarEspecialidadesAdmin() {
        const cont = document.getElementById('admin-especialidades-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        try {
            const list = await Auth.request('/api/especialidades');
            if (!list.length) {
                cont.innerHTML = '<div class="alert alert-info">No hay especialidades médicas registradas.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(esp => `
                                <tr>
                                    <td>#${esp.id}</td>
                                    <td><strong class="text-primary">${esp.nombre}</strong></td>
                                    <td>${esp.descripcion || '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-danger" onclick="Citas.eliminarEspecialidadAdmin(${esp.id})">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    },

    async abrirModalNuevaEspecialidad() {
        const form = document.getElementById('form-nueva-especialidad');
        if (form) form.reset();
        openModal('modalNuevaEspecialidad');
    },

    async guardarNuevaEspecialidad(e) {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('esp-nombre').value.trim(),
            descripcion: document.getElementById('esp-descripcion').value.trim()
        };

        const btn = document.getElementById('btn-guardar-esp');
        try {
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            await Auth.request('/api/especialidades', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            closeModal('modalNuevaEspecialidad');

            showAlert('Especialidad médica agregada con éxito.', 'success');
            this.cargarEspecialidadesAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Guardar Especialidad';
        }
    },

    async eliminarEspecialidadAdmin(id) {
        if (!confirm('¿Estás seguro de eliminar esta especialidad?')) return;
        try {
            await Auth.request(`/api/especialidades/${id}`, { method: 'DELETE' });
            showAlert('Especialidad médica eliminada.', 'info');
            this.cargarEspecialidadesAdmin();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    // PACIENTES (ADMIN)
    async cargarPacientesAdmin() {
        const cont = document.getElementById('admin-pacientes-container');
        if (!cont) return;
        cont.innerHTML = '<div class="loading"><span class="spinner"></span> Cargando...</div>';

        try {
            const list = await Auth.request('/api/pacientes');
            if (!list.length) {
                cont.innerHTML = '<div class="alert alert-info">No hay pacientes registrados en el sistema.</div>';
                return;
            }

            cont.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Cédula</th>
                                <th>Nombre y Apellido</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Fecha Nacimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(p => `
                                <tr>
                                    <td><strong>${p.cedula}</strong></td>
                                    <td>${p.nombre} ${p.apellido}</td>
                                    <td>${p.telefono || '-'}</td>
                                    <td>${p.direccion || '-'}</td>
                                    <td>${p.fechaNacimiento || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            mostrarErrorCarga(cont, err);
        }
    }
};

// Eventos de Formularios
document.addEventListener('DOMContentLoaded', () => {
    // Form agendar cita
    const formAgendar = document.getElementById('form-agendar-cita');
    if (formAgendar) {
        formAgendar.addEventListener('submit', (e) => Citas.agendarCita(e));
    }

    // Form nuevo medico
    const formMedico = document.getElementById('form-nuevo-medico');
    if (formMedico) {
        formMedico.addEventListener('submit', (e) => Citas.guardarNuevoMedico(e));
    }

    // Form nueva especialidad
    const formEsp = document.getElementById('form-nueva-especialidad');
    if (formEsp) {
        formEsp.addEventListener('submit', (e) => Citas.guardarNuevaEspecialidad(e));
    }
});

