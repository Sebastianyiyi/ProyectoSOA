package com.clinicamedica.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginDto {

    @Email(message = "El email no es valido")
    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotBlank(message = "La password es obligatoria")
    private String password;
}

