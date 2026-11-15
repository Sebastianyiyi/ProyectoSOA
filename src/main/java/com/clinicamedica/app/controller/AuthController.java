package com.clinicamedica.app.controller;

import com.clinicamedica.app.dto.LoginDto;
import com.clinicamedica.app.dto.RegistroDto;
import com.clinicamedica.app.dto.ResponseDto;
import com.clinicamedica.app.entity.Usuario;
import com.clinicamedica.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@Valid @RequestBody LoginDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping({"/register", "/registro"})
    public ResponseEntity<ResponseDto> registrar(@Valid @RequestBody RegistroDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(dto));
    }

    @GetMapping("/perfil")
    public ResponseEntity<ResponseDto> perfil() {
        Usuario usuario = authService.obtenerUsuarioActual();
        Map<String, Object> data = new HashMap<>();
        data.put("id", usuario.getId());
        data.put("email", usuario.getEmail());
        data.put("activo", usuario.getActivo());
        data.put("roles", usuario.getRoles().stream().map(r -> r.getNombre()).toList());

        return ResponseEntity.ok(ResponseDto.builder()
                .exito(true)
                .mensaje("Perfil obtenido exitosamente")
                .datos(data)
                .build());
    }
}