package com.clinicamedica.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicoDto {

    private Long id;
    private Long usuarioId;

    @Email(message = "El email no es valido")
    private String email;

    private String password;

    @NotBlank(message = "La cedula es obligatoria")
    private String cedula;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;

    private String telefono;

    @NotNull(message = "La especialidad es obligatoria")
    private Long especialidadId;

    private String especialidadNombre;
}

