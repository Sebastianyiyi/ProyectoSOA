package com.clinicamedica.app.service;

import com.clinicamedica.app.dto.MedicoDto;
import com.clinicamedica.app.entity.Especialidad;
import com.clinicamedica.app.entity.Medico;
import com.clinicamedica.app.entity.Paciente;
import com.clinicamedica.app.entity.Rol;
import com.clinicamedica.app.entity.Usuario;
import com.clinicamedica.app.repository.CitaRepository;
import com.clinicamedica.app.repository.EspecialidadRepository;
import com.clinicamedica.app.repository.MedicoRepository;
import com.clinicamedica.app.repository.RolRepository;
import com.clinicamedica.app.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MedicoService {

    private final MedicoRepository medicoRepository;
    private final EspecialidadRepository especialidadRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CitaRepository citaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<MedicoDto> listar(Long especialidadId) {
        List<Medico> medicos = (especialidadId != null)
                ? medicoRepository.findByEspecialidadId(especialidadId)
                : medicoRepository.findAll();
        return medicos.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MedicoDto obtener(Long id) {
        return toDto(buscar(id));
    }

    @Transactional(readOnly = true)
    public Medico buscar(Long id) {
        return medicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Medico no encontrado con id " + id));
    }

    @Transactional(readOnly = true)
    public MedicoDto obtenerMiPerfil() {
        Usuario usuario = authService.obtenerUsuarioActual();
        Medico medico = medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NoSuchElementException("No se encontro ficha medica vinculada a tu usuario"));
        return toDto(medico);
    }

    @Transactional(readOnly = true)
    public List<Paciente> obtenerMisPacientes() {
        Usuario usuario = authService.obtenerUsuarioActual();
        Medico medico = medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NoSuchElementException("No se encontro ficha medica vinculada a tu usuario"));
        return citaRepository.findDistinctPacientesByMedicoId(medico.getId());
    }

    @Transactional
    public MedicoDto crear(MedicoDto dto) {
        if (medicoRepository.existsByCedula(dto.getCedula())) {
            throw new IllegalArgumentException("Ya existe un medico con la cedula: " + dto.getCedula());
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + dto.getEmail());
        }

        Especialidad especialidad = especialidadRepository.findById(dto.getEspecialidadId())
                .orElseThrow(() -> new NoSuchElementException("Especialidad no encontrada con id: " + dto.getEspecialidadId()));

        Rol rolMedico = rolRepository.findByNombre("ROLE_MEDICO")
                .orElseThrow(() -> new IllegalStateException("El rol ROLE_MEDICO no esta configurado en la base de datos"));

        String rawPassword = (dto.getPassword() != null && !dto.getPassword().isBlank())
                ? dto.getPassword()
                : "Medico123*";

        Usuario usuario = Usuario.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .roles(new HashSet<>(Set.of(rolMedico)))
                .build();
        usuario = usuarioRepository.save(usuario);

        Medico medico = Medico.builder()
                .usuario(usuario)
                .especialidad(especialidad)
                .cedula(dto.getCedula())
                .nombre(dto.getNombre())
                .apellido(dto.getApellido())
                .telefono(dto.getTelefono())
                .build();

        return toDto(medicoRepository.save(medico));
    }

    @Transactional
    public MedicoDto actualizar(Long id, MedicoDto dto) {
        Medico medico = buscar(id);

        if (!medico.getCedula().equals(dto.getCedula())
                && medicoRepository.existsByCedula(dto.getCedula())) {
            throw new IllegalArgumentException("Ya existe un medico con la cedula: " + dto.getCedula());
        }

        Especialidad especialidad = especialidadRepository.findById(dto.getEspecialidadId())
                .orElseThrow(() -> new NoSuchElementException("Especialidad no encontrada con id: " + dto.getEspecialidadId()));

        medico.setCedula(dto.getCedula());
        medico.setNombre(dto.getNombre());
        medico.setApellido(dto.getApellido());
        medico.setTelefono(dto.getTelefono());
        medico.setEspecialidad(especialidad);

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            Usuario usuario = medico.getUsuario();
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
            usuarioRepository.save(usuario);
        }

        return toDto(medicoRepository.save(medico));
    }

    @Transactional
    public void eliminar(Long id) {
        Medico medico = buscar(id);
        Usuario usuario = medico.getUsuario();
        medicoRepository.delete(medico);
        if (usuario != null) {
            usuarioRepository.delete(usuario);
        }
    }

    public MedicoDto toDto(Medico medico) {
        return MedicoDto.builder()
                .id(medico.getId())
                .usuarioId(medico.getUsuario() != null ? medico.getUsuario().getId() : null)
                .email(medico.getUsuario() != null ? medico.getUsuario().getEmail() : null)
                .cedula(medico.getCedula())
                .nombre(medico.getNombre())
                .apellido(medico.getApellido())
                .telefono(medico.getTelefono())
                .especialidadId(medico.getEspecialidad().getId())
                .especialidadNombre(medico.getEspecialidad().getNombre())
                .build();
    }
}

