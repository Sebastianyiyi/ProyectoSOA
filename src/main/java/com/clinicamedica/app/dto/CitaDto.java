package com.clinicamedica.app.dto;

import com.clinicamedica.app.entity.EstadoCita;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaDto {

    private Long id;

    private Long pacienteId;

    @NotNull(message = "El medico es obligatorio")
    private Long medicoId;

    @NotNull(message = "La fecha y hora es obligatoria")
    private LocalDateTime fechaHora;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    private EstadoCita estado;

    private String observaciones;

    // Campos informativos para presentacion en el cliente
    private String pacienteNombre;
    private String pacienteCedula;
    private String pacienteTelefono;
    private String medicoNombre;
    private Long especialidadId;
    private String especialidadNombre;
}

