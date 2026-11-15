package com.clinicamedica.app.repository;

import com.clinicamedica.app.entity.Cita;
import com.clinicamedica.app.entity.EstadoCita;
import com.clinicamedica.app.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findAllByOrderByFechaHoraDesc();

    List<Cita> findByPacienteIdOrderByFechaHoraDesc(Long pacienteId);

    List<Cita> findByMedicoIdOrderByFechaHoraDesc(Long medicoId);

    List<Cita> findByMedicoIdAndFechaHoraBetweenOrderByFechaHoraAsc(Long medicoId, LocalDateTime inicio, LocalDateTime fin);

    List<Cita> findByMedicoIdAndEstadoOrderByFechaHoraDesc(Long medicoId, EstadoCita estado);

    List<Cita> findByPacienteIdAndEstadoOrderByFechaHoraDesc(Long pacienteId, EstadoCita estado);

    @Query("SELECT DISTINCT c.paciente FROM Cita c WHERE c.medico.id = :medicoId")
    List<Paciente> findDistinctPacientesByMedicoId(@Param("medicoId") Long medicoId);
}

