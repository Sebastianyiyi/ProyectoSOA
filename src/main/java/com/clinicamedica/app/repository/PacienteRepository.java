package com.clinicamedica.app.repository;

import com.clinicamedica.app.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByCedula(String cedula);

    Optional<Paciente> findByUsuarioId(Long usuarioId);

    boolean existsByCedula(String cedula);
}

