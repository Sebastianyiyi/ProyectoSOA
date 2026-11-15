package com.clinicamedica.app.service;

import com.clinicamedica.app.dto.CitaDto;
import com.clinicamedica.app.entity.Cita;
import com.clinicamedica.app.entity.EstadoCita;
import com.clinicamedica.app.entity.Medico;
import com.clinicamedica.app.entity.Paciente;
import com.clinicamedica.app.entity.Usuario;
import com.clinicamedica.app.repository.CitaRepository;
import com.clinicamedica.app.repository.MedicoRepository;
import com.clinicamedica.app.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final MedicoRepository medicoRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<CitaDto> listar(String fechaStr, EstadoCita estado, Long filtroMedicoId, Long filtroPacienteId) {
        if (esPaciente()) {
            Paciente paciente = pacienteActual();
            List<Cita> citas = (estado != null)
                    ? citaRepository.findByPacienteIdAndEstadoOrderByFechaHoraDesc(paciente.getId(), estado)
                    : citaRepository.findByPacienteIdOrderByFechaHoraDesc(paciente.getId());
            return citas.stream().map(this::toDto).toList();
        }

        if (esMedico()) {
            Medico medico = medicoActual();
            if (fechaStr != null && !fechaStr.isBlank()) {
                LocalDate fecha = LocalDate.parse(fechaStr);
                LocalDateTime inicio = fecha.atStartOfDay();
                LocalDateTime fin = fecha.atTime(LocalTime.MAX);
                List<Cita> citas = citaRepository.findByMedicoIdAndFechaHoraBetweenOrderByFechaHoraAsc(
                        medico.getId(), inicio, fin);
                if (estado != null) {
                    citas = citas.stream().filter(c -> c.getEstado() == estado).toList();
                }
                return citas.stream().map(this::toDto).toList();
            }

            if (estado != null) {
                return citaRepository.findByMedicoIdAndEstadoOrderByFechaHoraDesc(medico.getId(), estado)
                        .stream().map(this::toDto).toList();
            }

            return citaRepository.findByMedicoIdOrderByFechaHoraDesc(medico.getId())
                    .stream().map(this::toDto).toList();
        }

        // Es ADMIN: acceso global y filtros flexibles
        List<Cita> citas = citaRepository.findAllByOrderByFechaHoraDesc();
        if (filtroMedicoId != null) {
            citas = citas.stream().filter(c -> c.getMedico().getId().equals(filtroMedicoId)).toList();
        }
        if (filtroPacienteId != null) {
            citas = citas.stream().filter(c -> c.getPaciente().getId().equals(filtroPacienteId)).toList();
        }
        if (estado != null) {
            citas = citas.stream().filter(c -> c.getEstado() == estado).toList();
        }
        if (fechaStr != null && !fechaStr.isBlank()) {
            LocalDate fecha = LocalDate.parse(fechaStr);
            citas = citas.stream().filter(c -> c.getFechaHora().toLocalDate().equals(fecha)).toList();
        }

        return citas.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CitaDto obtener(Long id) {
        Cita cita = buscar(id);

        if (esPaciente() && !cita.getPaciente().getId().equals(pacienteActual().getId())) {
            throw new AccessDeniedException("No tienes permiso para consultar esta cita");
        }
        if (esMedico() && !cita.getMedico().getId().equals(medicoActual().getId())) {
            throw new AccessDeniedException("No tienes permiso para consultar citas asignadas a otro doctor");
        }

        return toDto(cita);
    }

    @Transactional
    public CitaDto crear(CitaDto dto) {
        Paciente paciente;
        if (esPaciente()) {
            paciente = pacienteActual();
        } else {
            if (dto.getPacienteId() == null) {
                throw new IllegalArgumentException("El id del paciente es obligatorio para agendar una cita");
            }
            paciente = pacienteRepository.findById(dto.getPacienteId())
                    .orElseThrow(() -> new NoSuchElementException("Paciente no encontrado con id " + dto.getPacienteId()));
        }

        Medico medico = medicoRepository.findById(dto.getMedicoId())
                .orElseThrow(() -> new NoSuchElementException("Medico no encontrado con id " + dto.getMedicoId()));

        Cita cita = Cita.builder()
                .paciente(paciente)
                .medico(medico)
                .fechaHora(dto.getFechaHora())
                .motivo(dto.getMotivo())
                .estado(EstadoCita.PENDIENTE)
                .observaciones(esAdmin() ? dto.getObservaciones() : null)
                .build();

        return toDto(citaRepository.save(cita));
    }

    @Transactional
    public CitaDto cambiarEstado(Long id, EstadoCita nuevoEstado) {
        Cita cita = buscar(id);

        if (esPaciente()) {
            if (!cita.getPaciente().getId().equals(pacienteActual().getId())) {
                throw new AccessDeniedException("No puedes modificar citas de otros pacientes");
            }
            if (nuevoEstado != EstadoCita.CANCELADA) {
                throw new AccessDeniedException("Como paciente solo puedes cancelar tus citas pendientes");
            }
            if (cita.getEstado() != EstadoCita.PENDIENTE) {
                throw new IllegalStateException("Solo puedes cancelar citas que esten en estado PENDIENTE");
            }
            cita.setEstado(EstadoCita.CANCELADA);
            return toDto(citaRepository.save(cita));
        }

        if (esMedico()) {
            if (!cita.getMedico().getId().equals(medicoActual().getId())) {
                throw new AccessDeniedException("Solo puedes modificar citas asignadas a tu agenda");
            }
            // Doctor puede marcar como CONFIRMADA, CANCELADA o COMPLETADA
            cita.setEstado(nuevoEstado);
            return toDto(citaRepository.save(cita));
        }

        // Es ADMIN
        cita.setEstado(nuevoEstado);
        return toDto(citaRepository.save(cita));
    }

    @Transactional
    public CitaDto actualizar(Long id, CitaDto dto) {
        Cita cita = buscar(id);

        if (esPaciente()) {
            // El paciente solo puede cancelar su cita
            if (!cita.getPaciente().getId().equals(pacienteActual().getId())) {
                throw new AccessDeniedException("No puedes modificar citas de otros pacientes");
            }
            if (dto.getEstado() == EstadoCita.CANCELADA && cita.getEstado() == EstadoCita.PENDIENTE) {
                cita.setEstado(EstadoCita.CANCELADA);
                return toDto(citaRepository.save(cita));
            }
            throw new AccessDeniedException("Operacion no permitida para el rol paciente");
        }

        if (esMedico()) {
            if (!cita.getMedico().getId().equals(medicoActual().getId())) {
                throw new AccessDeniedException("Solo puedes modificar citas asignadas a ti");
            }
            if (dto.getEstado() != null) {
                cita.setEstado(dto.getEstado());
            }
            return toDto(citaRepository.save(cita));
        }

        // Es ADMIN: Supervisión global y reasignación completa
        if (dto.getMedicoId() != null) {
            Medico medico = medicoRepository.findById(dto.getMedicoId())
                    .orElseThrow(() -> new NoSuchElementException("Medico no encontrado con id " + dto.getMedicoId()));
            cita.setMedico(medico);
        }
        if (dto.getPacienteId() != null) {
            Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                    .orElseThrow(() -> new NoSuchElementException("Paciente no encontrado con id " + dto.getPacienteId()));
            cita.setPaciente(paciente);
        }
        if (dto.getFechaHora() != null) {
            cita.setFechaHora(dto.getFechaHora());
        }
        if (dto.getMotivo() != null && !dto.getMotivo().isBlank()) {
            cita.setMotivo(dto.getMotivo());
        }
        if (dto.getEstado() != null) {
            cita.setEstado(dto.getEstado());
        }
        if (dto.getObservaciones() != null) {
            cita.setObservaciones(dto.getObservaciones());
        }

        return toDto(citaRepository.save(cita));
    }

    @Transactional
    public void eliminar(Long id) {
        Cita cita = buscar(id);
        citaRepository.delete(cita);
    }

    private Cita buscar(Long id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cita no encontrada con id " + id));
    }

    private boolean tieneRol(String rol) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(rol));
    }

    private boolean esPaciente() {
        return tieneRol("ROLE_PACIENTE");
    }

    private boolean esMedico() {
        return tieneRol("ROLE_MEDICO");
    }

    private boolean esAdmin() {
        return tieneRol("ROLE_ADMIN");
    }

    private Paciente pacienteActual() {
        Usuario usuario = authService.obtenerUsuarioActual();
        return pacienteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NoSuchElementException("El usuario actual no tiene una ficha de paciente asociada"));
    }

    private Medico medicoActual() {
        Usuario usuario = authService.obtenerUsuarioActual();
        return medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NoSuchElementException("El usuario actual no tiene una ficha medica asociada"));
    }

    private CitaDto toDto(Cita cita) {
        Paciente paciente = cita.getPaciente();
        Medico medico = cita.getMedico();

        return CitaDto.builder()
                .id(cita.getId())
                .pacienteId(paciente != null ? paciente.getId() : null)
                .medicoId(medico != null ? medico.getId() : null)
                .fechaHora(cita.getFechaHora())
                .motivo(cita.getMotivo())
                .estado(cita.getEstado())
                .observaciones(cita.getObservaciones())
                .pacienteNombre(paciente != null ? (paciente.getNombre() + " " + paciente.getApellido()) : "")
                .pacienteCedula(paciente != null ? paciente.getCedula() : "")
                .pacienteTelefono(paciente != null ? paciente.getTelefono() : "")
                .medicoNombre(medico != null ? (medico.getNombre() + " " + medico.getApellido()) : "")
                .especialidadId(medico != null && medico.getEspecialidad() != null ? medico.getEspecialidad().getId() : null)
                .especialidadNombre(medico != null && medico.getEspecialidad() != null ? medico.getEspecialidad().getNombre() : "")
                .build();
    }
}

