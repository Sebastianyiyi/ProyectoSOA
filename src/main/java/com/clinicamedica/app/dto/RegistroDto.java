package com.clinicamedica.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroDto {

    @Email(message = "El email no es valido")
    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotBlank(message = "La password es obligatoria")
    @Size(min = 6, message = "La password debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "La cedula es obligatoria")
    private String cedula;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;

    private String telefono;
    private String direccion;
    private LocalDate fechaNacimiento;
}

