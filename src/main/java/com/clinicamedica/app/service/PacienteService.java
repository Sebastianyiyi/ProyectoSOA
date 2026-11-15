package com.clinicamedica.app.service;

import com.clinicamedica.app.entity.Paciente;
import com.clinicamedica.app.entity.Usuario;
import com.clinicamedica.app.repository.PacienteRepository;
import com.clinicamedica.app.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<Paciente> listar() {
        return pacienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Paciente obtener(Long id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Paciente no encontrado con id " + id));
    }

    @Transactional(readOnly = true)
    public Paciente obtenerMiPerfil() {
        Usuario usuario = authService.obtenerUsuarioActual();
        return pacienteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NoSuchElementException("No se encontro ficha de paciente vinculada a tu usuario"));
    }

    @Transactional
    public Paciente crear(Paciente paciente) {
        if (pacienteRepository.existsByCedula(paciente.getCedula())) {
            throw new IllegalArgumentException("Ya existe un paciente con la cedula: " + paciente.getCedula());
        }
        asignarUsuario(paciente, null);
        return pacienteRepository.save(paciente);
    }

    @Transactional
    public Paciente actualizar(Long id, Paciente datos) {
        Paciente paciente = obtener(id);

        if (!paciente.getCedula().equals(datos.getCedula())
                && pacienteRepository.existsByCedula(datos.getCedula())) {
            throw new IllegalArgumentException("Ya existe un paciente con la cedula: " + datos.getCedula());
        }

        asignarUsuario(datos, id);
        paciente.setCedula(datos.getCedula());
        paciente.setNombre(datos.getNombre());
        paciente.setApellido(datos.getApellido());
        paciente.setTelefono(datos.getTelefono());
        paciente.setDireccion(datos.getDireccion());
        paciente.setFechaNacimiento(datos.getFechaNacimiento());
        if (datos.getUsuario() != null) {
            paciente.setUsuario(datos.getUsuario());
        }

        return pacienteRepository.save(paciente);
    }

    @Transactional
    public void eliminar(Long id) {
        Paciente paciente = obtener(id);
        pacienteRepository.delete(paciente);
    }

    private void asignarUsuario(Paciente paciente, Long pacienteIdActual) {
        if (paciente.getUsuario() == null || paciente.getUsuario().getId() == null) {
            paciente.setUsuario(null);
            return;
        }

        Long usuarioId = paciente.getUsuario().getId();
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado con id " + usuarioId));

        pacienteRepository.findByUsuarioId(usuarioId)
                .filter(actual -> !actual.getId().equals(pacienteIdActual))
                .ifPresent(actual -> {
                    throw new IllegalArgumentException("El usuario ya esta vinculado a otro paciente");
                });

        paciente.setUsuario(usuario);
    }
}

