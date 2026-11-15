package com.clinicamedica.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseDto {

    private boolean exito;
    private String mensaje;
    private String token;
    private String rol;
    private Object datos;
}

