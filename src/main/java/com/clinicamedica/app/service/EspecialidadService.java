package com.clinicamedica.app.service;

import com.clinicamedica.app.entity.Especialidad;
import com.clinicamedica.app.repository.EspecialidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EspecialidadService {

    private final EspecialidadRepository especialidadRepository;

    @Transactional(readOnly = true)
    public List<Especialidad> listar() {
        return especialidadRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Especialidad obtener(Long id) {
        return especialidadRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Especialidad no encontrada con id " + id));
    }

    @Transactional
    public Especialidad crear(Especialidad especialidad) {
        if (especialidadRepository.existsByNombre(especialidad.getNombre())) {
            throw new IllegalArgumentException("Ya existe una especialidad con el nombre: " + especialidad.getNombre());
        }
        return especialidadRepository.save(especialidad);
    }

    @Transactional
    public Especialidad actualizar(Long id, Especialidad datos) {
        Especialidad especialidad = obtener(id);

        if (!especialidad.getNombre().equalsIgnoreCase(datos.getNombre())
                && especialidadRepository.existsByNombre(datos.getNombre())) {
            throw new IllegalArgumentException("Ya existe una especialidad con el nombre: " + datos.getNombre());
        }

        especialidad.setNombre(datos.getNombre());
        especialidad.setDescripcion(datos.getDescripcion());
        return especialidadRepository.save(especialidad);
    }

    @Transactional
    public void eliminar(Long id) {
        Especialidad especialidad = obtener(id);
        especialidadRepository.delete(especialidad);
    }
}

