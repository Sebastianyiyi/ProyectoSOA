package com.clinicamedica.app.repository;

import com.clinicamedica.app.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicoRepository extends JpaRepository<Medico, Long> {

    Optional<Medico> findByCedula(String cedula);

    Optional<Medico> findByUsuarioId(Long usuarioId);

    List<Medico> findByEspecialidadId(Long especialidadId);

    boolean existsByCedula(String cedula);
}

